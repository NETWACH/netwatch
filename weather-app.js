/*
 * Full-screen Weather App (weather.html)
 * - Same icon set as header
 * - Location: GPS → IP → Atlanta fallback
 * - Unit toggle °F / °C
 * - Back button to previous page
 */

/* ------------ ICON HELPERS ------------ */

function iconFromWeatherCode(code, isDay, cssClass = "weather-anim") {
  const day = !!isDay;
  const ICON_BASE = "icons/"; // icons live in /icons

  const img = (file, alt) =>
    `<img src="${ICON_BASE}${file}" alt="${alt}" class="${cssClass}">`;

  if (code === 0) {
    return img(
      day ? "day.svg" : "night.svg",
      day ? "Clear sky" : "Clear night"
    );
  }
  if (code === 1 || code === 2) {
    return img(
      day ? "cloudy-day-1.svg" : "cloudy-night-1.svg",
      "Partly cloudy"
    );
  }
  if (code === 3) return img("cloudy.svg", "Overcast");
  if (code >= 45 && code <= 48) return img("cloudy.svg", "Fog");
  if (code >= 51 && code <= 57) return img("rainy-1.svg", "Drizzle");
  if (code >= 61 && code <= 67) return img("rainy-4.svg", "Rain");
  if (code >= 71 && code <= 77) return img("snowy-4.svg", "Snow");
  if (code >= 80 && code <= 82) return img("rainy-6.svg", "Rain showers");
  if (code >= 85 && code <= 86) return img("snowy-6.svg", "Snow showers");
  if (code >= 95) return img("thunder.svg", "Thunderstorm");
  return img("weather.svg", "Weather");
}

/* ------------ LOCATION HELPERS ------------ */

function getGeoLocationViaBrowser() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          label: "Local weather",
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: false,
        timeout: 7000,
        maximumAge: 10 * 60 * 1000,
      }
    );
  });
}

async function getLocationViaIP() {
  try {
    const res = await fetch("https://ipwho.is/");
    const data = await res.json();
    if (!data.success) return null;

    const city = data.city || "";
    const region = data.region || "";
    const country = data.country_code || "";

    let label = city;
    if (city && region) label = `${city}, ${region}`;
    else if (!city && region) label = region;
    if (!label && country) label = country;
    if (!label) label = "Local weather";

    return {
      lat: data.latitude,
      lon: data.longitude,
      label,
    };
  } catch (err) {
    console.error("IP location error (app):", err);
    return null;
  }
}

async function resolveLocationApp(fallback) {
  const geo = await getGeoLocationViaBrowser();
  if (geo) return geo;

  const ipLoc = await getLocationViaIP();
  if (ipLoc) return ipLoc;

  return fallback;
}

/* ------------ SKY / BACKGROUND MOOD ------------ */

function setSkyMood(code, isDay) {
  const bg = document.getElementById("wx-app-bg");
  if (!bg) return;

  let mood = "default";

  if (!isDay) {
    mood = "clear-night";
  } else if (code === 0 || code === 1) {
    mood = "clear";
  } else if (code === 2 || code === 3) {
    mood = "overcast";
  } else if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    mood = "rain";
  } else if (code >= 71 && code <= 77) {
    mood = "snow";
  } else if (code >= 95) {
    mood = "rain";
  }

  bg.setAttribute("data-sky", mood);
}

/* ------------ WEATHER FETCH + RENDER ------------ */

async function fetchWeatherApp(lat, lon, unit, labelHint) {
  const tempUnit = unit === "celsius" ? "celsius" : "fahrenheit";

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}` +
    `&longitude=${lon}` +
    `&current_weather=true` +
    `&hourly=temperature_2m,precipitation_probability,weathercode` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
    `&temperature_unit=${tempUnit}` +
    `&timezone=auto`;

  const iconEl = document.getElementById("wx-app-icon");
  const tempEl = document.getElementById("wx-app-temp");
  const placeEl = document.getElementById("wx-app-place");
  const metaEl = document.getElementById("wx-app-meta");
  const hourlyBox = document.getElementById("wx-app-hourly");
  const dailyBox = document.getElementById("wx-app-daily");

  try {
    const r = await fetch(url, { cache: "no-store" });
    const j = await r.json();
    const cw = j.current_weather;

    // ---- HERO ----
    if (cw && iconEl && tempEl && placeEl) {
      iconEl.innerHTML = iconFromWeatherCode(
        cw.weathercode,
        cw.is_day,
        "weather-anim-main"
      );

      tempEl.textContent =
        Math.round(cw.temperature) + (tempUnit === "celsius" ? "°C" : "°F");

      const label = labelHint || "Local weather";
      placeEl.textContent = label;

      if (metaEl) {
        metaEl.textContent =
          `Wind ${Math.round(cw.windspeed)} ` +
          (j.current_weather_units?.windspeed || "km/h");
      }

      setSkyMood(cw.weathercode, cw.is_day);
    }

    // ---- HOURLY ----
    if (j.hourly && j.hourly.time && hourlyBox) {
      const now = Date.now();
      const items = [];
      for (let i = 0; i < j.hourly.time.length; i++) {
        const t = new Date(j.hourly.time[i]).getTime();
        if (t >= now && items.length < 12) {
          items.push({
            time: new Date(t).toLocaleTimeString([], { hour: "numeric" }),
            temp: Math.round(j.hourly.temperature_2m[i]),
            pop: j.hourly.precipitation_probability
              ? j.hourly.precipitation_probability[i]
              : null,
            code: j.hourly.weathercode ? j.hourly.weathercode[i] : null,
          });
        }
      }

      hourlyBox.innerHTML = items
        .map(
          (it) => `
          <div class="wx-hour-chip">
            <div class="wx-hour-time">${it.time}</div>
            <div>${iconFromWeatherCode(it.code, 1)}</div>
            <div class="wx-hour-temp">${it.temp}${
              tempUnit === "celsius" ? "°C" : "°F"
            }</div>
            <div class="wx-hour-pop">${it.pop ?? 0}% precip</div>
          </div>`
        )
        .join("");
    }

    // ---- DAILY ----
    if (j.daily && j.daily.time && dailyBox) {
      const rows = j.daily.time
        .slice(0, 5)
        .map((d, idx) => {
          const hi = Math.round(j.daily.temperature_2m_max[idx]);
          const lo = Math.round(j.daily.temperature_2m_min[idx]);
          const ic = iconFromWeatherCode(j.daily.weathercode[idx], 1);
          const lbl = new Date(d).toLocaleDateString([], { weekday: "short" });

          return `
          <div class="wx-day-row">
            <div class="wx-day-name">${lbl}</div>
            <div>${ic}</div>
            <div class="wx-day-temps">
              <span class="max">${hi}°</span>
              <span class="min">${lo}°</span>
            </div>
          </div>`;
        })
        .join("");

      dailyBox.innerHTML = rows;
    }
  } catch (err) {
    console.error("Weather app error:", err);
    if (placeEl) placeEl.textContent = "Weather unavailable";
  }
}

/* ------------ INIT ------------ */

function initWeatherApp() {
  // Same ultimate fallback: Atlanta
  const fallback = {
    lat: 33.7490,
    lon: -84.3880,
    label: "Atlanta, GA",
  };

  const backBtn = document.getElementById("wx-app-back");
  const uF = document.getElementById("uF");
  const uC = document.getElementById("uC");
  const placeEl = document.getElementById("wx-app-place");

  let unit = "fahrenheit";
  let last = { ...fallback };

  const refresh = () =>
    fetchWeatherApp(last.lat, last.lon, unit, last.label || undefined);

  // Back button: go back if possible, otherwise go to index.html
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "index.html";
      }
    });
  }

  // Unit toggles (app-local)
  if (uF && uC) {
    uF.addEventListener("click", () => {
      unit = "fahrenheit";
      uF.classList.add("active");
      uC.classList.remove("active");
      refresh();
    });

    uC.addEventListener("click", () => {
      unit = "celsius";
      uC.classList.add("active");
      uF.classList.remove("active");
      refresh();
    });
  }

  // Resolve location: GPS → IP → Atlanta
  if (placeEl) placeEl.textContent = "Locating…";
  resolveLocationApp(fallback).then((loc) => {
    last = loc || fallback;
    refresh();
  });

  // Auto-refresh every 10 minutes
  setInterval(refresh, 10 * 60 * 1000);
}

document.addEventListener("DOMContentLoaded", initWeatherApp);

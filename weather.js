/*
 * NetWatch weather.js
 * - Animated SVG icons
 * - Header pill with location + temp
 * - Hover pill  → show dropdown
 * - Click pill  → open weather.html full app
 * - Location: GPS first, then IP-based lookup, then hard-coded fallback
 */

/* ------------ ICON HELPERS ------------ */

function iconFromWeatherCode(code, isDay, cssClass = "weather-anim") {
  const day = !!isDay;
  const ICON_BASE = ""; // icons live in the project root

  const img = (file, alt) =>
    `<img src="${ICON_BASE}${file}" alt="${alt}" class="${cssClass}">`;

  if (code === 0) return img(day ? "day.svg" : "night.svg", day ? "Clear sky" : "Clear night");
  if (code === 1 || code === 2)
    return img(day ? "cloudy-day-1.svg" : "cloudy-night-1.svg", "Partly cloudy");
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

function prettyTimezoneName(tz) {
  if (!tz) return "";
  const parts = tz.split("/");
  return (parts[parts.length - 1] || tz).replace(/_/g, " ");
}

/* ------------ LOCATION RESOLUTION ------------ */

/**
 * Try browser geolocation. Resolves to {lat, lon, label} or null.
 */
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

/**
 * Use IP-based lookup to get location. Resolves to {lat, lon, label} or null.
 * Uses ipwho.is which supports CORS for simple browser use.
 */
async function getLocationViaIP() {
  try {
    const res = await fetch("https://ipwho.is/");
    const data = await res.json();
    if (!data.success) return null;

    const city = data.city || "";
    const region = data.region || "";
    const country = data.country_code || "";
    let label = city;
    if (region && city) label = `${city}, ${region}`;
    else if (!city && region) label = region;
    if (!label && country) label = country;
    if (!label) label = "Local weather";

    return {
      lat: data.latitude,
      lon: data.longitude,
      label,
    };
  } catch (err) {
    console.error("IP location error:", err);
    return null;
  }
}

/**
 * Get the best available location:
 * 1. Browser geolocation
 * 2. IP-based lookup
 * 3. Hard-coded fallback
 */
async function resolveLocation(fallback) {
  // 1. Browser GPS / Wi-Fi / cell
  const geo = await getGeoLocationViaBrowser();
  if (geo) return geo;

  // 2. IP-based
  const ipLoc = await getLocationViaIP();
  if (ipLoc) return ipLoc;

  // 3. Fallback
  return fallback;
}

/* ------------ WEATHER FETCH + RENDER ------------ */

async function fetchWeather(lat, lon, unit, labelHint) {
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

  const wxIcon = document.getElementById("wx-icon");
  const wxTemp = document.getElementById("wx-temp");
  const wxPlace = document.getElementById("wx-place");
  const wxMeta = document.getElementById("wx-meta");
  const boxH = document.getElementById("wx-forecast");
  const boxD = document.getElementById("wx-daily");
  const btn = document.getElementById("weatherBtn");

  try {
    const r = await fetch(url, { cache: "no-store" });
    const j = await r.json();
    const cw = j.current_weather;

    // ---- current conditions ----
    if (cw && wxIcon && wxTemp && wxPlace) {
      wxIcon.innerHTML = iconFromWeatherCode(
        cw.weathercode,
        cw.is_day,
        "weather-anim-main"
      );

      wxTemp.textContent =
        Math.round(cw.temperature) + (tempUnit === "celsius" ? "°C" : "°F");

      let label =
        labelHint ||
        prettyTimezoneName(j.timezone) ||
        j.timezone_abbreviation ||
        "Local weather";

      wxPlace.textContent = label;
      if (btn) btn.title = `Local weather — ${label}`;

      if (wxMeta) {
        wxMeta.textContent =
          `Wind ${Math.round(cw.windspeed)} ` +
          (j.current_weather_units?.windspeed || "km/h");
      }
    }

    // ---- hourly ----
    if (j.hourly && j.hourly.time && boxH) {
      const now = Date.now();
      const items = [];
      for (let i = 0; i < j.hourly.time.length; i++) {
        const t = new Date(j.hourly.time[i]).getTime();
        if (t >= now && items.length < 8) {
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

      boxH.innerHTML = items
        .map(
          (it) => `
          <div class="chip">
            <div class="t">${it.time}</div>
            <div class="v">${it.temp}${
              tempUnit === "celsius" ? "°C" : "°F"
            }</div>
            <div class="t">${it.pop ?? 0}% • ${iconFromWeatherCode(
            it.code,
            1
          )}</div>
          </div>`
        )
        .join("");
    }

    // ---- daily ----
    if (j.daily && j.daily.time && boxD) {
      const rows = j.daily.time
        .slice(0, 3)
        .map((d, idx) => {
          const hi = Math.round(j.daily.temperature_2m_max[idx]);
          const lo = Math.round(j.daily.temperature_2m_min[idx]);
          const ic = iconFromWeatherCode(j.daily.weathercode[idx], 1);
          const lbl = new Date(d).toLocaleDateString([], { weekday: "short" });

          return `
          <div class="row">
            <div>${lbl}</div>
            <div style="font-size:18px">${ic}</div>
            <div>${lo}° / <strong>${hi}°</strong></div>
          </div>`;
        })
        .join("");

      boxD.innerHTML = rows;
    }
  } catch (e) {
    console.error("Weather error:", e);
    if (wxPlace) wxPlace.textContent = "Weather unavailable";
  }
}

/* ------------ INIT / BEHAVIOUR ------------ */

function initWeather() {
  // Hard fallback if everything else fails – now Atlanta, GA
  const fallback = {
    lat: 33.7490,          // Atlanta latitude
    lon: -84.3880,         // Atlanta longitude
    label: "Atlanta, GA",  // what will show in the pill when falling back
  };

  const panel = document.getElementById("weatherPanel");
  const btn = document.getElementById("weatherBtn");
  const uF = document.getElementById("uF");
  const uC = document.getElementById("uC");
  const wxPlace = document.getElementById("wx-place");

  let unit = "fahrenheit";
  let last = { ...fallback };

  const refresh = () =>
    fetchWeather(last.lat, last.lon, unit, last.label || undefined);

  // Hover dropdown + click => full app
  if (btn && panel) {
    let hoverTimer;

    const openPanel = () => {
      clearTimeout(hoverTimer);
      panel.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
    };

    const scheduleClose = () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        panel.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      }, 150);
    };

    btn.addEventListener("mouseenter", openPanel);
    panel.addEventListener("mouseenter", openPanel);
    btn.addEventListener("mouseleave", scheduleClose);
    panel.addEventListener("mouseleave", scheduleClose);
    btn.addEventListener("focus", openPanel);
    btn.addEventListener("blur", scheduleClose);

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "weather.html";
    });
  }

  // Unit toggles
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

  // Resolve location: GPS → IP → fallback (Atlanta)
  if (wxPlace) wxPlace.textContent = "Locating…";
  resolveLocation(fallback).then((loc) => {
    last = loc || fallback;
    refresh();
  });

  // Periodic refresh
  setInterval(refresh, 10 * 60 * 1000);
}


document.addEventListener("DOMContentLoaded", initWeather);

let wxUnit = "F"; // "F" or "C"
let wxData = null;
let lastPressure = null;

const DEFAULT_LAT = 40.7128;
const DEFAULT_LON = -74.0060;

const el = (id) => document.getElementById(id);
const els = {
  locate: el("wx-locate"),
  unitF: el("wx-unit-f"),
  unitC: el("wx-unit-c"),

  location: el("wx-location"),
  conditionText: el("wx-condition-text"),
  conditionIcon: el("wx-condition-icon"),
  currentTemp: el("wx-current-temp"),
  feelsLike: el("wx-feels-like"),
  hiLo: el("wx-hi-lo"),
  wind: el("wx-wind"),
  precip: el("wx-precip"),

  hourly: el("wx-hourly"),
  daily: el("wx-daily"),
  heroAnim: el("wx-hero-anim"),
  pressureValue: el("wx-pressure-value"),
  pressureTrend: el("wx-pressure-trend"),
};

// weather code → description + simple icon
function getWeatherInfo(code, isDay = 1) {
  const map = {
    0: { desc: "Clear sky", icon: isDay ? "☀️" : "🌙" },
    1: { desc: "Mostly clear", icon: isDay ? "🌤️" : "🌙" },
    2: { desc: "Partly cloudy", icon: "⛅" },
    3: { desc: "Cloudy", icon: "☁️" },
    45: { desc: "Fog", icon: "🌫️" },
    48: { desc: "Fog", icon: "🌫️" },
    51: { desc: "Light drizzle", icon: "🌦️" },
    53: { desc: "Drizzle", icon: "🌦️" },
    55: { desc: "Heavy drizzle", icon: "🌧️" },
    61: { desc: "Light rain", icon: "🌧️" },
    63: { desc: "Rain", icon: "🌧️" },
    65: { desc: "Heavy rain", icon: "🌧️" },
    71: { desc: "Light snow", icon: "🌨️" },
    73: { desc: "Snow", icon: "🌨️" },
    75: { desc: "Heavy snow", icon: "❄️" },
    95: { desc: "Thunderstorm", icon: "⛈️" },
  };
  return map[code] || { desc: "Unknown", icon: "❔" };
}

function toUnit(celsius) {
  if (wxUnit === "F") return Math.round((celsius * 9) / 5 + 32);
  return Math.round(celsius);
}

function findCurrentIndex(times) {
  const now = new Date();
  let idx = 0;
  let min = Infinity;
  times.forEach((t, i) => {
    const d = new Date(t);
    const diff = Math.abs(d - now);
    if (diff < min) {
      min = diff;
      idx = i;
    }
  });
  return idx;
}

function formatHour(iso, asNow) {
  if (asNow) return "Now";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric" });
}

function dayLabel(iso, isFirst) {
  if (isFirst) return "Today";
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short" });
}

function playHeroAnimationFor(code, isDay) {
  // hook for your real animations later; currently just a placeholder
}

function updateBarometer(pressure) {
  const minP = 970;
  const maxP = 1040;
  const clamped = Math.max(minP, Math.min(maxP, pressure));
  const ratio = (clamped - minP) / (maxP - minP);
  const angle = -40 + ratio * 80;
  document.documentElement.style.setProperty("--wx-needle-angle", angle + "deg");

  els.pressureValue.textContent = `${Math.round(pressure)} hPa`;

  if (lastPressure == null) {
    els.pressureTrend.textContent = "Trend steady";
  } else {
    const diff = pressure - lastPressure;
    if (Math.abs(diff) < 0.7) {
      els.pressureTrend.textContent = "Trend steady";
    } else if (diff > 0) {
      els.pressureTrend.textContent = "Rising pressure";
    } else {
      els.pressureTrend.textContent = "Falling pressure";
    }
  }
  lastPressure = pressure;
}

function render() {
  if (!wxData) return;
  const { current_weather: curr, hourly, daily } = wxData;
  const idx = findCurrentIndex(hourly.time);
  const info = getWeatherInfo(curr.weathercode, curr.is_day);

  els.location.textContent = wxData.locationName || "Your location";
  els.conditionText.textContent = info.desc;
  els.conditionIcon.textContent = info.icon;
  els.currentTemp.textContent = `${toUnit(curr.temperature)}°`;

  const feelsC =
    typeof hourly.apparent_temperature[idx] === "number"
      ? hourly.apparent_temperature[idx]
      : curr.temperature;
  els.feelsLike.textContent = `Feels like ${toUnit(feelsC)}°`;

  const hi = daily.temperature_2m_max[0];
  const lo = daily.temperature_2m_min[0];
  els.hiLo.textContent = `High ${toUnit(hi)}° · Low ${toUnit(lo)}°`;

  els.wind.textContent = `Wind ${Math.round(curr.windspeed)} ${
    curr.windspeed_unit || "km/h"
  }`;

  const precipNow = hourly.precipitation_probability?.[idx];
  els.precip.textContent =
    typeof precipNow === "number" ? `Precip ${precipNow}%` : "Precip —";

  playHeroAnimationFor(curr.weathercode, curr.is_day);

  // hourly (next 10 hours)
  let hourlyHTML = "";
  for (let i = idx; i < idx + 10 && i < hourly.time.length; i++) {
    const hInfo = getWeatherInfo(hourly.weathercode[i], hourly.is_day[i]);
    const temp = hourly.temperature_2m[i];
    const precip = hourly.precipitation_probability?.[i];

    hourlyHTML += `
      <div class="wx-hourly-item">
        <div class="wx-hourly-item-time">${formatHour(
          hourly.time[i],
          i === idx
        )}</div>
        <div class="wx-hourly-item-icon">${hInfo.icon}</div>
        <div class="wx-hourly-item-temp">${toUnit(temp)}°</div>
        ${
          typeof precip === "number"
            ? `<div class="wx-hourly-item-precip">${precip}%</div>`
            : ""
        }
      </div>`;
  }
  els.hourly.innerHTML = hourlyHTML;

  // daily (10-day)
  let dailyHTML = "";
  for (let i = 0; i < daily.time.length && i < 10; i++) {
    const dInfo = getWeatherInfo(daily.weathercode[i], 1);
    const high = daily.temperature_2m_max[i];
    const low = daily.temperature_2m_min[i];
    const label = dayLabel(daily.time[i], i === 0);
    const precip = daily.precipitation_probability_max?.[i];

    dailyHTML += `
      <div class="wx-daily-pill">
        <div class="wx-daily-pill-temps">
          <span>${toUnit(high)}°</span>
          <span>${toUnit(low)}°</span>
        </div>
        <div class="wx-daily-pill-icon">${dInfo.icon}</div>
        <div class="wx-daily-pill-label">${label}</div>
        ${
          typeof precip === "number"
            ? `<div style="font-size:0.7rem;color:#9ca3af;">${precip}%</div>`
            : ""
        }
      </div>`;
  }
  els.daily.innerHTML = dailyHTML;

  const pressure =
    typeof hourly.pressure_msl?.[idx] === "number"
      ? hourly.pressure_msl[idx]
      : hourly.surface_pressure?.[idx];
  if (typeof pressure === "number") {
    updateBarometer(pressure);
  }
}

async function loadWeather(useGeo) {
  let lat = DEFAULT_LAT;
  let lon = DEFAULT_LON;
  let locationName = "New York, US";

  if (useGeo && navigator.geolocation) {
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej)
      );
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
      locationName = "Your location";
    } catch (e) {
      console.warn("Geolocation failed, using default.", e);
      locationName = "New York, US (default)";
    }
  }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current_weather=true` +
    `&hourly=temperature_2m,apparent_temperature,weathercode,is_day,` +
    `precipitation_probability,pressure_msl,surface_pressure` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&windspeed_unit=mph` +
    `&timezone=auto`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    wxData = { ...data, locationName };
    render();
  } catch (err) {
    console.error("Failed to fetch weather:", err);
    els.location.textContent = "Error loading weather";
    els.conditionText.textContent = "Check your connection";
  }
}

function setUnit(unit) {
  if (unit === wxUnit) return;
  wxUnit = unit;
  els.unitF.classList.toggle("active", unit === "F");
  els.unitC.classList.toggle("active", unit === "C");
  els.unitF.setAttribute("aria-pressed", unit === "F");
  els.unitC.setAttribute("aria-pressed", unit === "C");
  render();
}

els.unitF.addEventListener("click", () => setUnit("F"));
els.unitC.addEventListener("click", () => setUnit("C"));
els.locate.addEventListener("click", () => loadWeather(true));

loadWeather(true);

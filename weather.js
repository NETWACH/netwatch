async function getWeather(city="Denver") {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=YOUR_KEY&units=imperial`);
    const data = await res.json();
    document.getElementById("weather").innerHTML = `${data.name}: ${Math.round(data.main.temp)}°F`;
  } catch (e) {
    console.error("Weather fetch failed", e);
    document.getElementById("weather").textContent = "Weather unavailable";
  }
}
getWeather();

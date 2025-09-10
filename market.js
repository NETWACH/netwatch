async function getMarket() {
  // Replace API_URL with real livestock/market data source
  try {
    const res = await fetch("API_URL");
    const data = await res.json();
    document.getElementById("market").innerHTML =
      `Cattle: $${data.cattle}<br>Hogs: $${data.hogs}`;
  } catch (e) {
    console.error("Market fetch failed", e);
    document.getElementById("market").textContent = "Market data unavailable";
  }
}
getMarket();

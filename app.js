// --- Congress directory (Google Apps Script JSON) ---
async function buildCongress() {
  const note = document.getElementById("congressNote");
  const tbody = document.querySelector("#congressTable tbody");
  if (!tbody) return;

  const DRIVE_API_URL =
    "https://script.google.com/macros/s/AKfycby_w0AbRiUVYipLMUiK8G5fYQRs5X5qOxaqJGtnUYrntXgOC9ey5DlU9ztwwcX3f3wdLw/exec";

  let members = [];

  try {
    const resp = await fetch(DRIVE_API_URL, { cache: "no-store" });
    if (!resp.ok) throw new Error("Network " + resp.status);

    const json = await resp.json();

    members = (json.members || []).map((m) => ({
      name: m.fullName,
      chamber: m.chamber,
      state: m.state,
      party: m.party,
      end: m.endDate,
      url: m.url,
      leadership: "",
    }));
  } catch (err) {
    console.error("Congress JSON fetch failed:", err);
  }

  if (!members.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--muted)">No live data loaded.</td></tr>`;
    const note = document.getElementById("congressNote");
    if (note) {
      note.innerHTML =
        "Could not load members from the Google Drive JSON API. Check that your Apps Script web app URL is correct and shared as 'Anyone with the link'.";
    }
    return;
  }

  const stateSelect = document.getElementById("filterState");
  const states = [...new Set(members.map((m) => m.state.split("-")[0]))].sort();
  if (stateSelect) {
    stateSelect.innerHTML =
      `<option value="">All States</option>` +
      states.map((s) => `<option value="${s}">${s}</option>`).join("");
  }

  const today = new Date();
  tbody.innerHTML = members
    .map((m) => {
      const end = m.end ? new Date(m.end) : null;
      const daysLeft = end ? Math.ceil((end - today) / 86400000) : "";
      const cls =
        daysLeft !== "" && daysLeft < 0
          ? "term-past"
          : daysLeft <= 120
          ? "term-soon"
          : "";

      return `
        <tr>
          <td>${m.name}</td>
          <td>${m.chamber}</td>
          <td>${m.state}</td>
          <td>${m.party}</td>
          <td>${m.end ? new Date(m.end).toLocaleDateString() : ""}</td>
          <td class="${cls}">${daysLeft}</td>
          <td><a href="${m.url}" target="_blank" rel="noopener">Profile ↗</a></td>
        </tr>`;
    })
    .join("");

  const filterText = document.getElementById("filterText");
  const filterChamber = document.getElementById("filterChamber");

  const applyFilter = () => {
    const q = (filterText.value || "").toLowerCase();
    const ch = filterChamber.value;
    const st = stateSelect.value;

    for (const tr of tbody.querySelectorAll("tr")) {
      const name = tr.children[0].textContent.toLowerCase();
      const chamber = tr.children[1].textContent;
      const state = tr.children[2].textContent;
      const party = tr.children[3].textContent.toLowerCase();

      const matchesText =
        !q ||
        name.includes(q) ||
        party.includes(q) ||
        state.toLowerCase().includes(q);

      const matchesChamber = !ch || chamber === ch;
      const matchesState = !st || state.startsWith(st);

      tr.style.display =
        matchesText && matchesChamber && matchesState ? "" : "none";
    }
  };

  if (filterText) filterText.addEventListener("input", applyFilter);
  if (filterChamber) filterChamber.addEventListener("change", applyFilter);
  if (stateSelect) stateSelect.addEventListener("change", applyFilter);
}

// --- Year, Clock, Last Update ---
function setNow() {
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  const clockEl = document.getElementById("clock");
  const lastUpdate = document.getElementById("last-update");
  const tz = "America/Denver";

  const clockFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const dateFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const tick = () => {
    if (clockEl) clockEl.textContent = clockFmt.format(new Date());
  };

  tick();
  setInterval(tick, 1000);

  if (lastUpdate) lastUpdate.textContent = dateFmt.format(new Date());
}

// --- Simple stubs / helpers so nothing crashes ---
function spinSeal() {
  // you can add animation later if you want
}

function initGovBanner() {
  const toggle = document.getElementById("gov-toggle");
  const info = document.getElementById("gov-info");
  if (!toggle || !info) return;

  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    info.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!info.contains(e.target) && e.target !== toggle) {
      info.classList.remove("show");
    }
  });
}

function initApprovalChart() {
  // placeholder – no chart yet
}

// --- Init on page load ---
window.addEventListener("DOMContentLoaded", () => {
  setNow();                         // ⏰ clock + year + last update
  spinSeal();                       // (no-op for now)
  initGovBanner();                  // gov banner toggle
  initApprovalChart();              // (no-op)
  if (typeof initWeather === "function") initWeather(); // from weather.js
  buildCongress();                  // load your JSON from Apps Script
});

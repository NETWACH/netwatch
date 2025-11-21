async function buildCongress() {
  const note = document.getElementById("congressNote");
  const tbody = document.querySelector("#congressTable tbody");
  if (!tbody) return;

 const DRIVE_API_URL = "https://script.google.com/macros/s/AKfycby_w0AbRiUVYipLMUiK8G5fYQRs5X5qOxaqJGtnUYrntXgOC9ey5DlU9ztwwcX3f3wdLw/exec";

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
    if (note) {
      note.innerHTML =
        "Could not load members from the Google Drive JSON API. Check that your Apps Script web app URL is correct and shared as 'Anyone with the link'.";
    }
    return;
  }

  const stateSelect = document.getElementById("filterState");
  const states = [...new Set(members.map((m) => m.state.split("-")[0]))].sort();
  stateSelect.innerHTML =
    `<option value="">All States</option>` +
    states.map((s) => `<option value="${s}">${s}</option>`).join("");

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
          <td><a href="${m.url}" target="_blank">Profile ↗</a></td>
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

  filterText.addEventListener("input", applyFilter);
  filterChamber.addEventListener("change", applyFilter);
  stateSelect.addEventListener("change", applyFilter);
}

window.addEventListener("DOMContentLoaded", () => {
  buildCongress();
});


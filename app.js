// --- Gov banner toggle ---
function initGovBanner(){
  const toggle=document.getElementById('gov-toggle');
  const info=document.getElementById('gov-info');
  if(toggle && info){ toggle.addEventListener('click',()=> info.classList.toggle('open')); }
}

// ===== GENERAL MODAL LOGIC (New) =====
function initPanelModals() {
    const navLinks = document.querySelectorAll('.sidenav a[href^="#"]');
    const singleModal = document.getElementById('singlePanelModal');
    const singleModalContent = document.getElementById('singlePanelContent');
    const homeContent = document.getElementById('home-content');

    const closeModal = () => {
        homeContent.style.display = 'block';
        singleModal.classList.remove("open");
        document.getElementById("congressModal").classList.remove("open");
    };

    // Close handlers for the single panel modal are set in index.html, but we set keydown here
    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && (singleModal.classList.contains("open") || document.getElementById("congressModal").classList.contains("open"))) {
            closeModal();
        }
    });

    navLinks.forEach(link => {
        // Skip #home and #congress (congress is handled separately below)
        if (link.getAttribute('href') === '#home' || link.getAttribute('href') === '#congress') {
            return;
        }

        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetContentId = `${targetId}-content`; // e.g., #watching -> #watching-content
            const targetContent = document.getElementById(targetContentId);

            if (!targetContent) return;

            // Hide main content
            homeContent.style.display = 'none';
            
            // Clear and inject new content into the generic modal wrapper
            singleModalContent.innerHTML = '';
            singleModalContent.appendChild(targetContent.cloneNode(true));
            
            // Open the modal
            singleModal.classList.add('open');

            // Special case: If market panel opens, try to re-render the market script content
            if (targetId === 'market-panel' && typeof renderMarket === 'function') {
                renderMarket();
            }
        });
    });
}

// ===== CONGRESS MODAL LOGIC (Restructured for clarity) =====
const CONGRESS_MODAL_ID = "congressModal";
let membersData = []; 

// This function now handles the Congress link click directly
function initCongressModalLogic() {
  const congressLink = document.querySelector('.sidenav a[href="#congress"]');
  const modal = document.getElementById(CONGRESS_MODAL_ID);
  const homeContent = document.getElementById('home-content');
  
  if (!congressLink || !modal) return;
  
  // Handlers for opening the modal
  congressLink.addEventListener('click', (e) => {
    e.preventDefault();
    homeContent.style.display = 'none';
    document.getElementById('singlePanelModal').classList.remove('open');
    modal.classList.add("open");
  });

  // Handlers for closing the modal (Red button, Backdrop)
  const closeModal = () => {
    homeContent.style.display = 'block';
    modal.classList.remove("open");
  };
  modal.querySelector(".panel-close").addEventListener("click", closeModal);
  modal.querySelector(".modal-backdrop").addEventListener("click", closeModal);
}

// ===== BUILD CONGRESS TABLE & FILTERS =====
async function buildCongressForModal() {
  const key = (document.querySelector('meta[name="congress-api-key"]') || {}).content;
  const tbody = document.querySelector("#congressTable tbody");
  const note = document.getElementById("congressNote");
  const congressNumber = 119;

  if (!tbody) return;

  // ... (API fetch and memberData construction remains the same) ...
  if (key) {
    try {
      const url =
        `https://api.congress.gov/v3/member/congress/${congressNumber}` +
        `?currentMember=true&limit=250&format=json&api_key=${key}`;

      const res = await fetch(url);
      const json = await res.json();
      membersData = (json.members || []).map(m => ({
        name: m.fullName,
        chamber: m.chamber,
        state: m.state + (m.district ? `-${m.district}` : ""),
        party: m.party,
        end: m.endDate,
        url: m.url
      }));
    } catch (err) {
      console.error(err);
    }
  }

  if (!membersData.length) {
    if (note) {
      note.innerHTML = 'Add your Congress.gov API key in <code>&lt;meta name="congress-api-key"&gt;</code> for live updates. Using official directories for now.';
    }
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--muted)">No live data loaded.</td></tr>`;
    return;
  }

  const stateSelect = document.getElementById("filterState");
  const states = [...new Set(membersData.map((m) => m.state.split("-")[0]))]
    .sort()
    .filter(Boolean);

  if (stateSelect) {
    stateSelect.innerHTML =
      '<option value="">All States</option>' +
      states.map((s) => `<option value="${s}">${s}</option>`).join("");
  }
  // ... (Rest of rendering and filter setup remains the same) ...
  renderCongressTable(membersData);
  initCongressFilters();
}

// Function to render the table (shared by initial load and filters)
function renderCongressTable(members) {
  const tbody = document.querySelector("#congressTable tbody");
  if (!tbody) return;

  tbody.innerHTML = members.map((m, i) => {
    const end = m.end ? new Date(m.end) : null;
    const today = new Date();
    const daysLeft = end
      ? Math.ceil((end - today) / 86400000)
      : "N/A";
    return `
      <tr class="member-row">
        <td>${m.name}</td>
        <td>${m.chamber}</td>
        <td>${m.state}</td>
        <td>${m.party}</td>
        <td>${m.end ? new Date(m.end).toLocaleDateString() : "N/A"}</td>
        <td>${daysLeft}</td>
        <td><a href="${m.url}" target="_blank" rel="noopener" class="profile-link">Profile ↗</a></td>
      </tr>
    `;
  }).join("");
}

// Function to handle filters (re-added to app.js)
function initCongressFilters() {
  const tbody = document.querySelector("#congressTable tbody");
  const filterText = document.getElementById("filterText");
  const filterChamber = document.getElementById("filterChamber");
  const filterState = document.getElementById("filterState");
  if (!tbody || !membersData.length) return;

  const apply = () => {
    const q = (filterText.value || "").toLowerCase();
    const ch = filterChamber.value;
    const st = filterState.value;

    const filtered = membersData.filter(m => {
      const name = m.name.toLowerCase();
      const chamber = m.chamber;
      const state = m.state;
      const party = m.party.toLowerCase();

      const matchesText =
        !q ||
        name.includes(q) ||
        party.includes(q) ||
        state.toLowerCase().includes(q);
      const matchesChamber = !ch || chamber === ch;
      const matchesState = !st || state.startsWith(st);
      return matchesText && matchesChamber && matchesState;
    });

    renderCongressTable(filtered);
  };

  if (filterText) filterText.addEventListener("input", apply);
  if (filterChamber) filterChamber.addEventListener("change", apply);
  if (filterState) filterState.addEventListener("change", apply);
}


// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  initGovBanner();
  initPanelModals(); // New generic modal logic
  buildCongressForModal(); // Initializes congress table data
  initCongressModalLogic(); // Initializes congress modal open/close
});

// --- Mock Data ---
const member = {
  username: "admin",
  fullName: "Ricky McElroy",
  email: "ricky@example.com",
  location: "Atlanta, GA",
  tier: "NetWatch Pro",
  memberSince: "2024-10-01",
  status: "active", // options: "active", "past-due", "canceled"

  primaryPlan: {
    name: "NetWatch Pro",
    price: 9.99,
    currency: "USD",
    cadence: "Monthly",
    nextPayment: "2025-01-15",
    status: "active",
  },

  addons: [
    {
      id: "sub-housing",
      name: "Housing Risk Feed",
      description: "Daily signals on HUD & housing safety programs.",
      price: 19.0,
      currency: "USD",
      cadence: "Monthly",
      status: "active",
    },
    {
      id: "sub-social",
      name: "Social Security Tracker",
      description: "Alerts on proposals touching Social Security.",
      price: 5.0,
      currency: "USD",
      cadence: "Monthly",
      status: "paused",
    },
    {
      id: "sub-medicaid",
      name: "Medicaid Rollback Monitor",
      description: "Live monitor for state-level waiver and waiver cuts.",
      price: 7.0,
      currency: "USD",
      cadence: "Monthly",
      status: "active",
    },
  ],

  history: [
    {
      id: "inv-004",
      date: "2024-11-15",
      description: "NetWatch Pro + Housing Risk Feed",
      method: "Visa •••• 6482",
      amount: -28.99,
      currency: "USD",
    },
    {
      id: "inv-003",
      date: "2024-10-15",
      description: "NetWatch Pro + Housing Risk Feed",
      method: "Visa •••• 6482",
      amount: -28.99,
      currency: "USD",
    },
    {
      id: "inv-002",
      date: "2024-09-15",
      description: "NetWatch Pro",
      method: "Visa •••• 6482",
      amount: -9.99,
      currency: "USD",
    },
    {
      id: "inv-001",
      date: "2024-09-01",
      description: "Welcome credit",
      method: "NetWatch promo",
      amount: 9.99,
      currency: "USD",
    },
  ],
};

// --- Utilities ---

function formatMoney(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00"); // Fix timezone offset issues
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

// --- Render Functions ---

function renderProfile(user) {
  const avatar = document.getElementById("profileAvatar");
  const statusWrap = document.getElementById("profileStatus");

  // Text Fields
  setText("profileName", user.fullName || user.username);
  setText("profileEmail", user.email);
  setText("profileTier", `Plan: ${user.tier}`);
  setText("profileSince", `Member since ${formatDate(user.memberSince)}`);
  setText("profileLocation", user.location);

  // Initials Avatar
  if (avatar && user.fullName) {
    const parts = user.fullName.split(" ");
    const initials = (parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "");
    avatar.textContent = initials.toUpperCase();
  }

  // Status Logic (Switches Classes instead of Inline Styles)
  if (statusWrap) {
    const label = statusWrap.querySelector("span:last-child");
    
    // Reset classes
    statusWrap.className = "pill-status"; 

    if (user.status === "active") {
      statusWrap.classList.add("status-active");
      if (label) label.textContent = "Active membership";
    } else if (user.status === "past-due") {
      statusWrap.classList.add("status-warning");
      if (label) label.textContent = "Payment past due";
    } else {
      statusWrap.classList.add("status-danger");
      if (label) label.textContent = "Membership canceled";
    }
  }
}

function renderPrimaryPlan(user) {
  const plan = user.primaryPlan;
  if (!plan) return;

  setText("primaryPlanName", plan.name);
  setText("primaryPlanPrice", formatMoney(plan.price, plan.currency));
  setText("primaryPlanStatus", `Status: ${plan.status}`);
  setText(
    "primaryPlanMeta",
    `${plan.cadence} • Next payment ${formatDate(plan.nextPayment)}`
  );
}

function renderAddons(user) {
  const list = document.getElementById("addonsList");
  if (!list) return;

  if (!user.addons?.length) {
    list.innerHTML = '<li><span class="addon-meta">No add-on subscriptions.</span></li>';
    return;
  }

  // Using Template Literals is cleaner than createElement for lists
  list.innerHTML = user.addons.map((sub) => {
      const badgeClass = sub.status === "active" ? "badge badge-primary" : "badge";
      const statusLabel = sub.status.charAt(0).toUpperCase() + sub.status.slice(1);
      
      return `
        <li>
          <div>
            <div class="addon-name">${sub.name}</div>
            <div class="addon-meta">${formatMoney(sub.price, sub.currency)} • ${sub.cadence}</div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="${badgeClass}">${statusLabel}</span>
            <div class="toggle-pill"></div>
          </div>
        </li>
      `;
    }).join("");
}

function renderHistory(user) {
  const body = document.getElementById("historyBody");
  if (!body) return;

  if (!user.history?.length) {
    body.innerHTML = '<div class="muted" style="font-size:12px; padding:8px 0;">No billing history yet.</div>';
    return;
  }

  body.innerHTML = user.history.map((item) => {
      const amountClass = item.amount < 0 ? "history-amount negative" : "history-amount positive";
      return `
        <div class="history-row">
          <div>${formatDate(item.date)}</div>
          <div>${item.description}</div>
          <div>${item.method}</div>
          <div class="${amountClass}">${formatMoney(item.amount, item.currency)}</div>
        </div>
      `;
    }).join("");
}

// Helper to safely set text content
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || "";
}

// --- Init ---

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  renderProfile(member);
  renderPrimaryPlan(member);
  renderAddons(member);
  renderHistory(member);
});

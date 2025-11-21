// Subscriptions-only mock data.
// Later you can load this from users.json or a real backend.
const member = {
  username: "admin",
  fullName: "Ricky McElroy",
  email: "ricky@example.com",
  location: "Atlanta, GA",
  tier: "NetWatch Pro",
  memberSince: "2024-10-01",
  status: "active", // "active", "past-due", "canceled"

  primaryPlan: {
    name: "NetWatch Pro",
    price: 9.99,
    currency: "USD",
    cadence: "Monthly",
    nextPayment: "2025-01-15",
    status: "active"
  },

  addons: [
    {
      id: "sub-housing",
      name: "Housing Risk Feed",
      description: "Daily signals on HUD & housing safety programs.",
      price: 19.0,
      currency: "USD",
      cadence: "Monthly",
      status: "active"
    },
    {
      id: "sub-social",
      name: "Social Security Tracker",
      description: "Alerts on proposals touching Social Security.",
      price: 5.0,
      currency: "USD",
      cadence: "Monthly",
      status: "paused"
    },
    {
      id: "sub-medicaid",
      name: "Medicaid Rollback Monitor",
      description: "Live monitor for state-level waiver and waiver cuts.",
      price: 7.0,
      currency: "USD",
      cadence: "Monthly",
      status: "active"
    }
  ],

  // These are *billing* entries, not bank balances.
  history: [
    {
      id: "inv-004",
      date: "2024-11-15",
      description: "NetWatch Pro + Housing Risk Feed",
      method: "Visa •••• 6482",
      amount: -28.99,
      currency: "USD"
    },
    {
      id: "inv-003",
      date: "2024-10-15",
      description: "NetWatch Pro + Housing Risk Feed",
      method: "Visa •••• 6482",
      amount: -28.99,
      currency: "USD"
    },
    {
      id: "inv-002",
      date: "2024-09-15",
      description: "NetWatch Pro",
      method: "Visa •••• 6482",
      amount: -9.99,
      currency: "USD"
    },
    {
      id: "inv-001",
      date: "2024-09-01",
      description: "Welcome credit",
      method: "NetWatch promo",
      amount: 9.99,
      currency: "USD"
    }
  ]
};

function formatMoney(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
}

function initYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

function renderProfile(user) {
  const avatar = document.getElementById("profileAvatar");
  const nameEl = document.getElementById("profileName");
  const emailEl = document.getElementById("profileEmail");
  const tierEl = document.getElementById("profileTier");
  const sinceEl = document.getElementById("profileSince");
  const locEl = document.getElementById("profileLocation");
  const statusWrap = document.getElementById("profileStatus");

  if (nameEl) nameEl.textContent = user.fullName || user.username;
  if (emailEl) emailEl.textContent = user.email || "";

  if (avatar && user.fullName) {
    const parts = user.fullName.split(" ");
    const initials =
      (parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "");
    avatar.textContent = initials.toUpperCase();
  }

  if (tierEl) tierEl.textContent = `Plan: ${user.tier}`;
  if (sinceEl)
    sinceEl.textContent = `Member since ${formatDate(user.memberSince)}`;
  if (locEl) locEl.textContent = user.location || "";

  if (statusWrap) {
    const label = statusWrap.querySelector("span:last-child");
    const dot = statusWrap.querySelector(".pill-dot");
    if (!label || !dot) return;

    if (user.status === "active") {
      label.textContent = "Active membership";
      dot.style.background = "#22c55e";
      statusWrap.style.borderColor = "rgba(34,197,94,.7)";
      statusWrap.style.color = "#bbf7d0";
    } else if (user.status === "past-due") {
      label.textContent = "Payment past due";
      dot.style.background = "#f97316";
      statusWrap.style.borderColor = "#f97316";
      statusWrap.style.color = "#fed7aa";
    } else {
      label.textContent = "Membership canceled";
      dot.style.background = "#ef4444";
      statusWrap.style.borderColor = "#ef4444";
      statusWrap.style.color = "#fecaca";
    }
  }
}

function renderPrimaryPlan(user) {
  const plan = user.primaryPlan;
  if (!plan) return;

  const nameEl = document.getElementById("primaryPlanName");
  const metaEl = document.getElementById("primaryPlanMeta");
  const priceEl = document.getElementById("primaryPlanPrice");
  const statusEl = document.getElementById("primaryPlanStatus");

  if (nameEl) nameEl.textContent = plan.name;
  if (metaEl)
    metaEl.textContent = `${plan.cadence} • Next payment ${formatDate(
      plan.nextPayment
    )}`;
  if (priceEl) priceEl.textContent = formatMoney(plan.price, plan.currency);
  if (statusEl) statusEl.textContent = `Status: ${plan.status}`;
}

function renderAddons(user) {
  const list = document.getElementById("addonsList");
  if (!list) return;

  if (!user.addons || !user.addons.length) {
    list.innerHTML =
      '<li><span class="addon-meta">No add-on subscriptions yet.</span></li>';
    return;
  }

  list.innerHTML = "";
  user.addons.forEach((sub) => {
    const li = document.createElement("li");

    const left = document.createElement("div");
    const name = document.createElement("div");
    name.className = "addon-name";
    name.textContent = sub.name;

    const meta = document.createElement("div");
    meta.className = "addon-meta";
    meta.textContent = `${formatMoney(
      sub.price,
      sub.currency
    )} • ${sub.cadence}`;

    left.appendChild(name);
    left.appendChild(meta);

    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.alignItems = "center";
    right.style.gap = "8px";

    const badge = document.createElement("span");
    badge.className = "badge";
    if (sub.status === "active") {
      badge.classList.add("badge-primary");
      badge.textContent = "Active";
    } else if (sub.status === "paused") {
      badge.textContent = "Paused";
    } else {
      badge.textContent = "Canceled";
    }

    const toggle = document.createElement("div");
    toggle.className = "toggle-pill";
    // purely visual for now

    right.appendChild(badge);
    right.appendChild(toggle);

    li.appendChild(left);
    li.appendChild(right);
    list.appendChild(li);
  });
}

function renderHistory(user) {
  const body = document.getElementById("historyBody");
  if (!body) return;

  if (!user.history || !user.history.length) {
    body.innerHTML =
      '<div class="muted" style="font-size:12px; padding:8px 0;">No billing history yet.</div>';
    return;
  }

  body.innerHTML = user.history
    .map((item) => {
      const amountClass =
        item.amount < 0 ? "history-amount negative" : "history-amount positive";
      return `
        <div class="history-row">
          <div>${formatDate(item.date)}</div>
          <div>${item.description}</div>
          <div>${item.method}</div>
          <div class="${amountClass}">
            ${formatMoney(item.amount, item.currency)}
          </div>
        </div>
      `;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  initYear();
  const user = member; // later: swap with live data
  renderProfile(user);
  renderPrimaryPlan(user);
  renderAddons(user);
  renderHistory(user);
});

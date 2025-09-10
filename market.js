// Example: mock values to illustrate UI. Replace with your API call.
async function getMarketData(){
  // TODO: replace with real API call (e.g., CME, TradingEconomics, etc.)
  return {
    cattle: { price: 184.35, change: -0.42 },
    hogs:   { price: 88.10,  change: +0.37 }
  };
}

function fmtChange(n){
  const s = (n>0? '+' : '') + n.toFixed(2);
  const color = n>0? '#22c55e' : (n<0? '#ef4444' : '#9ca3af');
  return `<span style="color:${color}">${s}</span>`;
}

async function renderMarket(){
  const box = document.getElementById('market');
  if(!box) return;
  try{
    const d = await getMarketData();
    box.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="card" style="padding:12px;background:#0f172a;border:1px solid var(--ring)">
          <div style="font-size:12px;color:var(--muted);text-transform:uppercase">Live Cattle</div>
          <div style="font-size:20px;font-weight:700;margin-top:4px">$${d.cattle.price.toFixed(2)}</div>
          <div style="font-size:13px;margin-top:2px">Change: ${fmtChange(d.cattle.change)}</div>
        </div>
        <div class="card" style="padding:12px;background:#0f172a;border:1px solid var(--ring)">
          <div style="font-size:12px;color:var(--muted);text-transform:uppercase">Lean Hogs</div>
          <div style="font-size:20px;font-weight:700;margin-top:4px">$${d.hogs.price.toFixed(2)}</div>
          <div style="font-size:13px;margin-top:2px">Change: ${fmtChange(d.hogs.change)}</div>
        </div>
      </div>
    `;
  }catch(e){
    console.error(e);
    box.textContent = "Market data unavailable";
  }
}

// refresh every minute
renderMarket();
setInterval(renderMarket, 60*1000);

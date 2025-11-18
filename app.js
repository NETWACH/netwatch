// --- Year, Clock, Last Update ---
function setNow(){
  const y=document.getElementById('year');
  if(y) y.textContent=new Date().getFullYear();

  const tz='America/Denver';
  const clock=document.getElementById('clock');
  const tf=new Intl.DateTimeFormat('en-US',{timeZone:tz,hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true});
  const df=new Intl.DateTimeFormat('en-US',{timeZone:tz,year:'numeric',month:'numeric',day:'numeric'});

  const tick=()=>{ if(clock) clock.textContent=tf.format(new Date()); };
  tick(); setInterval(tick,1000);

  const lu=document.getElementById('last-update');
  if(lu) lu.textContent=df.format(new Date());
}

// --- Seal animation ---
function spinSeal(){
  const seal=document.getElementById('seal'); if(!seal) return;
  const once=()=>{ seal.style.transition='transform 2.2s linear'; seal.style.transform='rotate(360deg)'; setTimeout(()=>{ seal.style.transform='rotate(0deg)'; },2300); };
  setTimeout(once,1200); setInterval(once,180000);
}

// --- Gov banner toggle ---
function initGovBanner(){
  const toggle=document.getElementById('gov-toggle');
  const info=document.getElementById('gov-info');
  if(toggle && info){ toggle.addEventListener('click',()=> info.classList.toggle('open')); }
}

// --- Approval chart (static sample; you can swap to live feed) ---
function initApprovalChart(){
  const el=document.getElementById('approvalChart');
  if(!el || typeof Chart==='undefined') return;
  new Chart(el, {
    type:'line',
    data:{
      labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep"],
      datasets:[{
        label:"Approval",
        data:[41,42,43,43,44,42,41,42,43],
        fill:false,
        borderColor:"rgba(96,165,250,1)",
        backgroundColor:"rgba(96,165,250,.15)",
        borderWidth:2,
        tension:.25,
        pointRadius:2
      }]
    },
    options:{responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{x:{grid:{display:false}}, y:{grid:{color:"rgba(255,255,255,.08)"}}}
    }
  });
}

// --- Congress directory (uses Congress.gov API if meta key is present; falls back to links) ---
async function buildCongress(){
  const key = (document.querySelector('meta[name="congress-api-key"]')||{}).content;
  const note = document.getElementById('congressNote');
  const tbody = document.querySelector('#congressTable tbody');
  if(!tbody) return;

  const congressNumber = 119; // adjust when needed
  let members=[];
  if(key){
    try{
      const pageSize = 250; let offset = 0; let more=true; let loops=0;
      while(more && loops<20){
        const url = `https://api.congress.gov/v3/member/congress/${congressNumber}?currentMember=true&limit=${pageSize}&offset=${offset}&format=json&api_key=${key}`;
        const resp = await fetch(url);
        if(!resp.ok) break;
        const json = await resp.json();
        const chunk = (json.members||[]).map(m=>({
          name: m.fullName,
          chamber: m.chamber,
          state: m.state + (m.district?`-${m.district}`:''),
          party: m.party,
          start: m.startDate,
          end: m.endDate,
          url: m.url,
          leadership: m.leadershipTitle || m.leadershipRole || ''
        }));
        members.push(...chunk);
        if(json.pagination && json.pagination.next){ offset += pageSize; loops++; } else { more=false; }
      }
    }catch(e){ console.error(e); }
  }

  if(!members.length){
    if(note){
      note.innerHTML = 'Live member data uses the official Congress.gov API. Add your API key in <code>&lt;meta name=\"congress-api-key\" content=\"YOUR_KEY\"&gt;</code> to enable real-time updates. In the meantime, use: <a href=\"https://www.senate.gov/senators/\" target=\"_blank\" rel=\"noopener\">Senators</a> · <a href=\"https://www.house.gov/representatives\" target=\"_blank\" rel=\"noopener\">Representatives</a>.';
    }
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--muted)">No live data loaded.</td></tr>`;
    return;
  }

  const stateSelect = document.getElementById('filterState');
  const stateSet = new Set(members.map(m=>m.state.split('-')[0]));
  const states = Array.from(stateSet).sort();
  if(stateSelect){ stateSelect.innerHTML = `<option value="">All States</option>` + states.map(s=>`<option value="${s}">${s}</option>`).join(''); }

  const rows = members.map(m=>{
    const end = m.end ? new Date(m.end) : null;
    const today = new Date();
    const daysLeft = end ? Math.ceil((end - today)/86400000) : '';
    const cls = daysLeft!=='' && daysLeft<=120 ? 'term-soon' : '';
    const badge = m.leadership ? `<span class="badge">${m.leadership}</span>` : '';
    return `<tr>
      <td>${m.name} ${badge}</td>
      <td>${m.chamber}</td>
      <td>${m.state}</td>
      <td>${m.party}</td>
      <td>${m.end? new Date(m.end).toLocaleDateString():''}</td>
      <td class="${cls}">${daysLeft}</td>
      <td><a href="${m.url}" target="_blank" rel="noopener">Profile ↗</a></td>
    </tr>`;
  }).join('');
  tbody.innerHTML = rows;

  // --- MERGED FILTER LOGIC ---
  const filterText = document.getElementById('filterText');
  const filterChamber = document.getElementById('filterChamber');
  // 'filterState' is already defined as 'stateSelect' above
  const applyFilter = ()=>{
    const q = (filterText.value||'').toLowerCase();
    const ch = filterChamber.value;
    const st = stateSelect.value; // Use stateSelect variable
    for(const tr of tbody.querySelectorAll('tr')){
      const name = tr.children[0].textContent.toLowerCase();
      const chamber = tr.children[1].textContent;
      const state = tr.children[2].textContent;
      const party = tr.children[3].textContent.toLowerCase();
      const matchesText = !q || name.includes(q) || party.includes(q) || state.toLowerCase().includes(q);
      const matchesChamber = !ch || chamber===ch;
      const matchesState = !st || state.startsWith(st);
      tr.style.display = (matchesText && matchesChamber && matchesState) ? '' : 'none';
    }
  };
  filterText.addEventListener('input', applyFilter);
  filterChamber.addEventListener('change', applyFilter);
  stateSelect.addEventListener('change', applyFilter); // Use stateSelect
  // --- END MERGED LOGIC ---

  // daily refresh
  setTimeout(buildCongress, 24*60*60*1000);
}

// --- Init ---
window.addEventListener('DOMContentLoaded', ()=>{
  setNow();
  spinSeal();
  initGovBanner();
  initApprovalChart();
  // weather.js provides initWeather()
  if(typeof initWeather === 'function') initWeather();
  buildCongress();
});

// If you prefer to fetch live series, swap the data here or export initApprovalChart from app.js.
// This file just ensures Chart.js is there (defensive double-init avoided).
if (typeof Chart !== 'undefined') {
  const el = document.getElementById('approvalChart');
  if (el && !el.dataset.inited) {
    el.dataset.inited = '1';
    new Chart(el, {
      type:'line',
      data:{
        labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep"],
        datasets:[{
          label:"Approval",
          data:[41,42,43,43,44,42,41,42,43],
          borderColor:"rgba(96,165,250,1)",
          backgroundColor:"rgba(96,165,250,.15)",
          borderWidth:2,
          tension:.25,
          pointRadius:2
        }]
      },
      options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
        scales:{x:{grid:{display:false}}, y:{grid:{color:"rgba(255,255,255,.08)"}}}
      }
    });
  }
}

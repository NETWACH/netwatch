function iconFromWeatherCode(code, isDay){
  const day = !!isDay;
  if(code===0) return day?'☀️':'🌙';
  if(code===1||code===2) return '⛅';
  if(code===3) return '☁️';
  if(code>=45&&code<=48) return '🌫️';
  if(code>=51&&code<=67) return '🌧️';
  if(code>=71&&code<=77) return '❄️';
  if(code>=80&&code<=82) return '🌦️';
  if(code>=95) return '⛈️';
  return '🌡️';
}

async function fetchWeather(lat, lon, unit){
  const tempUnit = unit==='celsius' ? 'celsius' : 'fahrenheit';
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation_probability,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&temperature_unit=${tempUnit}&timezone=auto`;
  const wxIcon=document.getElementById('wx-icon');
  const wxTemp=document.getElementById('wx-temp');
  const wxPlace=document.getElementById('wx-place');
  const wxMeta=document.getElementById('wx-meta');
  const boxH=document.getElementById('wx-forecast');
  const boxD=document.getElementById('wx-daily');

  try{
    const r = await fetch(url, {cache:'no-store'});
    const j = await r.json();
    const cw = j.current_weather;
    if(cw){
      wxIcon.textContent = iconFromWeatherCode(cw.weathercode, cw.is_day);
      wxTemp.textContent = Math.round(cw.temperature) + (tempUnit==='celsius'?'°C':'°F');
      wxPlace.textContent = j.timezone_abbreviation || 'Local';
      wxMeta.textContent = `Wind ${Math.round(cw.windspeed)} ${j.current_weather_units?.windspeed||'km/h'}`;
    }
    // next 8 hours
    boxH.innerHTML = '';
    if(j.hourly && j.hourly.time){
      const now = Date.now();
      const items = [];
      for(let i=0;i<j.hourly.time.length;i++){
        const t = new Date(j.hourly.time[i]).getTime();
        if(t >= now && items.length<8){
          items.push({
            time: new Date(t).toLocaleTimeString([], {hour:'numeric'}),
            temp: Math.round(j.hourly.temperature_2m[i]),
            pop: j.hourly.precipitation_probability ? j.hourly.precipitation_probability[i] : null,
            code: j.hourly.weathercode ? j.hourly.weathercode[i] : null
          });
        }
      }
      boxH.innerHTML = items.map(it=>`<div class="chip"><div class="t">${it.time}</div><div class="v">${it.temp}°</div><div class="t">${(it.pop??0)}% • ${iconFromWeatherCode(it.code,1)}</div></div>`).join('');
    }
    // next 3 days
    boxD.innerHTML = '';
    if(j.daily && j.daily.time){
      const rows = j.daily.time.slice(0,3).map((d,idx)=>{
        const hi = Math.round(j.daily.temperature_2m_max[idx]);
        const lo = Math.round(j.daily.temperature_2m_min[idx]);
        const ic = iconFromWeatherCode(j.daily.weathercode[idx], 1);
        const lbl = new Date(d).toLocaleDateString([], {weekday:'short'});
        return `<div class="row">${lbl}<div style="font-size:18px">${ic}</div><div>${lo}° / <strong>${hi}°</strong></div></div>`;
      }).join('');
      boxD.innerHTML = rows;
    }
  }catch(e){
    console.error(e);
    wxPlace.textContent = 'Weather unavailable';
  }
}

function initWeather(){
  const fallback = {lat:33.7490, lon:-84.3880, label:'Atlanta'};
  const wxPlace=document.getElementById('wx-place');
  const panel = document.getElementById('weatherPanel');
  const btn = document.getElementById('weatherBtn');
  const uF = document.getElementById('uF');
  const uC = document.getElementById('uC');
  let unit = 'fahrenheit';
  const refresh = (lat,lon)=>{ fetchWeather(lat,lon,unit); };

  // panel toggle + click away
  if(btn && panel){
    btn.addEventListener('click', ()=>{
      const open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open?'true':'false');
    });
    document.addEventListener('click', (e)=>{ if(!panel.contains(e.target) && !btn.contains(e.target)) panel.classList.remove('open'); });
  }
  // unit toggles
  if(uF && uC){
    uF.addEventListener('click', ()=>{ unit='fahrenheit'; uF.classList.add('active'); uC.classList.remove('active'); reFetch(); });
    uC.addEventListener('click', ()=>{ unit='celsius'; uC.classList.add('active'); uF.classList.remove('active'); reFetch(); });
  }
  let last = fallback;
  const reFetch = ()=> refresh(last.lat,last.lon);

  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>{
      last = {lat:pos.coords.latitude, lon:pos.coords.longitude, label:'Local'};
      if(wxPlace) wxPlace.textContent='Local';
      refresh(last.lat,last.lon);
    }, _err=>{
      if(wxPlace) wxPlace.textContent=fallback.label;
      last = fallback; refresh(last.lat,last.lon);
    }, {enableHighAccuracy:false, timeout:7000, maximumAge:10*60*1000});
  } else {
    if(wxPlace) wxPlace.textContent=fallback.label;
    last = fallback; refresh(last.lat,last.lon);
  }

  // periodic refresh
  setInterval(()=>refresh(last.lat,last.lon), 10*60*1000);
}

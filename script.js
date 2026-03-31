/* ── Canvas setup ── */
const canvas = document.getElementById("weatherCanvas");
const ctx    = canvas.getContext("2d");
let W, H, particles = [], droplets = [], effect = null;

function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
window.onresize = resize; resize();

/* ── Particles ── */
function rainDrop()  { return { x: Math.random()*W, y: Math.random()*H, len: 18, speed: 9+Math.random()*4 }; }
function snowFlake() { return { x: Math.random()*W, y: Math.random()*H, r: 1.5+Math.random()*2, speed: .6+Math.random()*.8, drift: (Math.random()-.5)*.3 }; }

function buildParticles(type) {
  particles = [];
  if (type === 'rain')  for(let i=0;i<220;i++) particles.push(rainDrop());
  if (type === 'snow')  for(let i=0;i<160;i++) particles.push(snowFlake());
}

/* ── Droplets ── */
function createDroplet() {
  return { x: Math.random()*W, y: Math.random()*-H, r: 2+Math.random()*3, speed: 1.2+Math.random()*2.2, trail: [] };
}
function initDroplets(n=60) { droplets=[]; for(let i=0;i<n;i++) droplets.push(createDroplet()); }

function drawDroplets() {
  ctx.fillStyle = "rgba(190,215,255,0.35)";
  droplets.forEach(d => {
    d.y += d.speed;
    d.trail.push({x:d.x, y:d.y});
    if(d.trail.length>12) d.trail.shift();
    ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.28); ctx.fill();
    d.trail.forEach((t,i) => {
      ctx.globalAlpha = (i/12)*0.3;
      ctx.beginPath(); ctx.arc(t.x, t.y, d.r*(i/12), 0, 6.28); ctx.fill();
    });
    ctx.globalAlpha = 1;
    if(d.y > H) { d.y=-10; d.x=Math.random()*W; d.trail=[]; }
  });
}

/* ── Animation loop ── */
function animate() {
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, W, H);

  if(effect === 'rain') {
    ctx.save();
    ctx.strokeStyle = 'rgba(160,200,255,.35)';
    ctx.lineWidth = 1;
    particles.forEach(p => {
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x-1, p.y+p.len); ctx.stroke();
      p.y += p.speed; if(p.y > H) { p.y=0; p.x=Math.random()*W; }
    });
    ctx.restore();
    drawDroplets();
  }

  if(effect === 'snow') {
    ctx.fillStyle = 'rgba(230,240,255,.75)';
    particles.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
      p.y += p.speed; p.x += p.drift;
      if(p.y > H) { p.y=0; p.x=Math.random()*W; }
      if(p.x > W) p.x=0; if(p.x < 0) p.x=W;
    });
  }
}
animate();

/* ── Orb colours per weather ── */
const orbColors = {
  sunny:      ['rgba(255,180,30,.4)',  'rgba(255,140,0,.25)'],
  rain:       ['rgba(30,60,160,.4)',   'rgba(60,120,220,.25)'],
  heavy_rain: ['rgba(10,30,80,.5)',    'rgba(20,60,140,.3)'],
  snow:       ['rgba(160,180,220,.35)','rgba(200,220,255,.2)'],
  fog:        ['rgba(100,120,140,.4)', 'rgba(140,160,180,.25)'],
  thunder:    ['rgba(60,20,120,.5)',   'rgba(120,40,180,.3)'],
};
function setOrbs(type) {
  const [c1,c2] = orbColors[type] || orbColors.sunny;
  document.getElementById('orb1').style.background = c1;
  document.getElementById('orb2').style.background = c2;
}

/* ── Theme ── */
function applyTheme(type) {
  const overlay = document.getElementById("weatherOverlay");
  overlay.className = '';
  effect = null;

  if(type==='rain')       { effect='rain'; overlay.classList.add('rain-overlay');       buildParticles('rain'); initDroplets(70); }
  else if(type==='heavy_rain') { effect='rain'; overlay.classList.add('heavy-rain-overlay'); buildParticles('rain'); initDroplets(120); }
  else if(type==='snow')  { effect='snow'; overlay.classList.add('snow-overlay');       buildParticles('snow'); }
  else if(type==='fog')   { overlay.classList.add('fog-overlay'); }
  else if(type==='sunny') { overlay.classList.add('sun-overlay'); }
  else if(type==='thunder'){ effect='rain'; overlay.classList.add('thunder-overlay');   buildParticles('rain'); initDroplets(80); }

  setOrbs(type);
  playSound(type);
}

/* ── Sound ── */
function playSound(type) {
  const rain    = document.getElementById("rainSound");
  const thunder = document.getElementById("thunderSound");
  rain.pause(); thunder.pause();
  if(type==='rain'||type==='heavy_rain') { rain.play().catch(()=>{}); }
  if(type==='thunder') { thunder.play().catch(()=>{}); }
}

/* ── Weather code → type ── */
function applyWeatherCode(code) {
  let type = 'sunny';
  if(code>=51 && code<=65) type = 'rain';
  if(code>=63)             type = 'heavy_rain';
  if(code>=71 && code<=77) type = 'snow';
  if(code===45||code===48) type = 'fog';
  if(code>=95)             type = 'thunder';
  applyTheme(type);
  showResult(type, code);
}

const weatherLabels = {
  sunny:      { icon: '☀️',  label: 'Clear & Sunny',     sub: 'Bright skies ahead' },
  rain:       { icon: '🌧️', label: 'Rainy',              sub: 'Bring an umbrella' },
  heavy_rain: { icon: '⛈️', label: 'Heavy Rain',         sub: 'Stay sheltered if possible' },
  snow:       { icon: '❄️',  label: 'Snowing',            sub: 'Cold and wintry conditions' },
  fog:        { icon: '🌫️', label: 'Foggy',              sub: 'Reduced visibility' },
  thunder:    { icon: '⚡',  label: 'Thunderstorms',      sub: 'Lightning risk – stay indoors' },
};

function showResult(type, code) {
  const el  = document.getElementById("result");
  const info = weatherLabels[type] || weatherLabels.sunny;
  el.className = 'has-data';
  el.innerHTML = `
    <div class="weather-result">
      <div class="weather-icon">${info.icon}</div>
      <div class="weather-text">
        <div class="weather-label">${info.label}</div>
        <div class="weather-sub">${info.sub} · WMO ${code}</div>
      </div>
      <div class="status-dot"></div>
    </div>`;
}

function showLoading() {
  const el = document.getElementById("result");
  el.className = '';
  el.innerHTML = `<div class="loading"><div class="spinner"></div> Fetching weather…</div>`;
}

function showError(msg) {
  const el = document.getElementById("result");
  el.className = '';
  el.innerHTML = `<div class="error-msg">⚠️ ${msg}</div>`;
}

/* ── API calls ── */
async function getWeather() {
  const city = document.getElementById("city").value.trim();
  if(!city) return;
  showLoading();
  try {
    const geo  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    const g    = await geo.json();
    if(!g.results?.length) throw new Error(`City "${city}" not found.`);
    const { latitude, longitude } = g.results[0];
    const res  = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code`);
    const data = await res.json();
    applyWeatherCode(data.current.weather_code);
  } catch(e) { showError(e.message || 'Could not fetch weather.'); }
}

function getMyLocation() {
  if(!navigator.geolocation) return showError('Geolocation not supported.');
  showLoading();
  navigator.geolocation.getCurrentPosition(
    async pos => {
      try {
        const res  = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current=weather_code`);
        const data = await res.json();
        applyWeatherCode(data.current.weather_code);
      } catch(e) { showError('Could not fetch weather for your location.'); }
    },
    () => showError('Location access denied.')
  );
}

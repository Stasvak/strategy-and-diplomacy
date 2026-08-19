// scripts/app.js — simple prototype engine for the vertical slice
(function(){
  // Load data-config from DOM script tag
  const configEl = document.getElementById('configData');
  const config = configEl ? JSON.parse(configEl.textContent || '{}') : {};

  // Game state
  const state = {
    running:true,
    speed:1,
    tickMs:1000, // real-time seconds per tick
    timeDays:0,
    years:1,
    nations:[],
    player:null,
    resources:{treasury:1000,oil:500,steel:300,manpower:50},
    provinces:[],
    selectedProvince:null
  };

  // DOM
  const gameTime = document.getElementById('gameTime');
  const treasuryEl = document.getElementById('treasury');
  const oilEl = document.getElementById('oil');
  const steelEl = document.getElementById('steel');
  const manpowerEl = document.getElementById('manpower');
  const playPause = document.getElementById('playPause');
  const speedSelect = document.getElementById('speedSelect');
  const openCreator = document.getElementById('openCreator');
  const nationModal = document.getElementById('nationModal');
  const closeModal = document.getElementById('closeModal');
  const nationForm = document.getElementById('nationForm');
  const govSelect = document.getElementById('govSelect');
  const ideologySelect = document.getElementById('ideologySelect');
  const selectedInfo = document.getElementById('selectedInfo');

  // Canvas map
  const canvas = document.getElementById('mapCanvas');
  const ctx = canvas.getContext('2d');
  let cam = {x:0,y:0,scale:1,drag:false,lastX:0,lastY:0};

  // Setup config selects
  (config.governments||[]).forEach(g=>{const o=document.createElement('option');o.value=g;o.textContent=g;govSelect.appendChild(o)});
  (config.ideologies||[]).forEach(g=>{const o=document.createElement('option');o.value=g;o.textContent=g;ideologySelect.appendChild(o)});

  // Sample provinces (simple polygons)
  function makeProvinces(){
    const w=canvas.width,h=canvas.height;
    const provinces=[
      {id:'P1',name:'Coastal Province',owner:null,poly:[{x:80,y:80},{x:340,y:60},{x:420,y:160},{x:220,y:220}] ,pop:2_000_000,industry:2,resources:{oil:100,steel:10},buildings:[]},
      {id:'P2',name:'Central Plains',owner:null,poly:[{x:420,y:160},{x:220,y:220},{x:360,y:340},{x:560,y:260}] ,pop:3_000_000,industry:4,resources:{oil:20,steel:80},buildings:[]},
      {id:'P3',name:'Northern Highlands',owner:null,poly:[{x:200,y:20},{x:420,y:60},{x:340,y:160},{x:220,y:220}] ,pop:800_000,industry:1,resources:{oil:0,steel:150},buildings:[]},
      {id:'P4',name:'Southern Delta',owner:null,poly:[{x:560,y:260},{x:360,y:340},{x:740,y:420},{x:860,y:300}] ,pop:1_500_000,industry:3,resources:{oil:200,steel:20},buildings:[]}
    ];
    state.provinces = provinces;
  }

  function drawMap(){
    ctx.save();
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.translate(cam.x,cam.y);
    ctx.scale(cam.scale,cam.scale);

    // draw provinces
    state.provinces.forEach((p,i)=>{
      ctx.beginPath();
      p.poly.forEach((pt,idx)=>{if(idx===0)ctx.moveTo(pt.x,pt.y);else ctx.lineTo(pt.x,pt.y)});
      ctx.closePath();
      ctx.fillStyle = (state.player && p.owner===state.player.id) ? 'rgba(43,94,168,0.35)' : 'rgba(255,255,255,0.02)';
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 2 / Math.max(0.5, cam.scale);
      ctx.fill();
      ctx.stroke();

      // province label
      const cx = p.poly.reduce((s,pt)=>s+pt.x,0)/p.poly.length;
      const cy = p.poly.reduce((s,pt)=>s+pt.y,0)/p.poly.length;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = `${12/Math.max(0.5,cam.scale)}px sans-serif`;
      ctx.fillText(p.name, cx, cy);

      // building progress
      p.buildings.forEach((b,idx)=>{
        if(b.progress < b.time){
          const bx = p.poly[0].x + 10;
          const by = p.poly[0].y + 10 + idx*12;
          const w = 80;
          const pct = b.progress / b.time;
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(bx,by,w,8);
          ctx.fillStyle = 'rgba(43,94,168,0.9)';
          ctx.fillRect(bx,by,w*pct,8);
        }
      });
    });
    ctx.restore();
  }

  // Map interaction
  canvas.addEventListener('mousedown',e=>{cam.drag=true;cam.lastX=e.clientX;cam.lastY=e.clientY});
  window.addEventListener('mouseup',()=>{cam.drag=false});
  window.addEventListener('mousemove',e=>{if(cam.drag){cam.x += e.clientX - cam.lastX;cam.y += e.clientY - cam.lastY;cam.lastX = e.clientX;cam.lastY = e.clientY;drawMap()}});
  canvas.addEventListener('wheel',e=>{e.preventDefault();const delta = e.deltaY>0?0.9:1.1;const prevScale = cam.scale;cam.scale *= delta;cam.scale = Math.max(0.4,Math.min(3,cam.scale));drawMap()});

  function screenToWorld(x,y){const rect = canvas.getBoundingClientRect();const sx = x - rect.left;const sy = y - rect.top;return {x:(sx-cam.x)/cam.scale, y:(sy-cam.y)/cam.scale};}

  canvas.addEventListener('click',e=>{const w = screenToWorld(e.clientX,e.clientY);const clicked = state.provinces.find(p=>{return pointInPoly(w,p.poly)});state.selectedProvince = clicked||null;updateSelected();drawMap();});

  function pointInPoly(pt,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const xi=poly[i].x,yi=poly[i].y,xj=poly[j].x,yj=poly[j].y;const intersect = ((yi>pt.y)!=(yj>pt.y)) && (pt.x < (xj-xi)*(pt.y-yi)/(yj-yi)+xi); if(intersect) inside=!inside;}return inside}

  function updateSelected(){if(!state.selectedProvince){selectedInfo.innerHTML='No selection';return;}const p=state.selectedProvince;let html = `<strong>${p.name}</strong><br/>Owner: ${p.owner||'Unowned'}<br/>Population: ${p.pop.toLocaleString()}<br/>Industry: ${p.industry}<br/>Resources: Oil ${p.resources.oil}, Steel ${p.resources.steel}<br/>Buildings:<ul>`;p.buildings.forEach(b=>{html += `<li>${b.type} - ${Math.round((b.progress/b.time)*100)}%</li>`});html += `</ul>`;html += `<button id="buildFactory">Build Factory (cost: 200 steel, 200 money, 10 days)</button>`;selectedInfo.innerHTML = html;const btn = document.getElementById('buildFactory');if(btn)btn.addEventListener('click',()=>{startConstruction(p,'Factory',{time:10,cost:{steel:200,treasury:200}})});
  }

  function startConstruction(province,type,opts){if(state.resources.steel < opts.cost.steel || state.resources.treasury < opts.cost.treasury){alert('Not enough resources');return;}state.resources.steel -= opts.cost.steel;state.resources.treasury -= opts.cost.treasury;province.buildings.push({type:type,progress:0,time:opts.time});}

  // simulation tick
  function tick(){
    // advance time
    state.timeDays += state.speed; if(state.timeDays >= 365){state.years += 1; state.timeDays = state.timeDays - 365}
    // simple resource production/consumption per tick
    // produce small amount of money from industry
    const industry = state.provinces.reduce((s,p)=>s+p.industry,0);
    state.resources.treasury += industry * 0.1 * state.speed;
    // passive oil and steel consumption/production
    state.resources.oil += 0.05 * state.speed; state.resources.steel += 0.02 * state.speed;
    // contractors progress building
    state.provinces.forEach(p=>{p.buildings.forEach(b=>{ if(b.progress < b.time){ b.progress += (0.5 * state.speed); if(b.progress >= b.time){ b.progress = b.time; p.industry += 1; }}})});

    // update UI
    updateUI();
    drawMap();
  }

  function updateUI(){gameTime.textContent = `Year ${state.years}, Day ${Math.floor(state.timeDays)}`;treasuryEl.textContent = Math.floor(state.resources.treasury);oilEl.textContent = Math.floor(state.resources.oil);steelEl.textContent = Math.floor(state.resources.steel);manpowerEl.textContent = Math.floor(state.resources.manpower);}

  // Start loop
  let loopHandle = null;
  function startLoop(){if(loopHandle)clearInterval(loopHandle); if(state.speed>0){loopHandle = setInterval(()=>{if(state.running) tick()}, state.tickMs)} }

  playPause.addEventListener('click',()=>{state.running = !state.running;playPause.textContent = state.running? 'Pause' : 'Resume'});
  speedSelect.addEventListener('change',()=>{const v = parseInt(speedSelect.value,10);state.speed = v; if(v===0) state.running=false; else state.running=true; startLoop();});

  // Nation creator
  openCreator.addEventListener('click',()=>{nationModal.classList.remove('hidden')});
  closeModal.addEventListener('click',()=>{nationModal.classList.add('hidden')});
  nationForm.addEventListener('submit',e=>{e.preventDefault();const form = new FormData(nationForm);const nation = {};for(const [k,v] of form.entries()) nation[k]=v; // numeric fields
    nation.treasury = Number(nation.treasury);nation.oil = Number(nation.oil);nation.steel = Number(nation.steel);
    nation.id = `N_${Date.now()}`;
    state.nations.push(nation); state.player = nation; state.resources.treasury = nation.treasury; state.resources.oil = nation.oil; state.resources.steel = nation.steel; nationModal.classList.add('hidden'); alert('Nation created: '+nation.commonName);
  });

  // Initialise
  makeProvinces(); drawMap(); updateUI(); startLoop();

  // Expose for debugging
  window.SD = {state,config};
})();

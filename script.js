// ---------- helpers ----------
const $ = id => document.getElementById(id);
const timeEl= $('time');

function pad(n){return n.toString().padStart(2,'0');}
function format(sec){
  const h = pad(Math.floor(sec/3600));
  const m = pad(Math.floor((sec%3600)/60));
  const s = pad(sec%60);
  return `${h}:${m}:${s}`;
}

// ---------- state in storage ----------

async function getState(){
  const d = await chrome.storage.local.get(['running','start','elapsed']);
  return { running: !!d.running, start: d.start||0, elapsed: d.elapsed||0 };
}
function setState(obj){ chrome.storage.local.set(obj); }

// ---------- UI update loop ----------
let uiTimer=null;
async function renderLoop(){
  clearInterval(uiTimer);
  const state = await getState();
  function update(){
    let secs = state.elapsed;
    if(state.running) secs += Math.floor((Date.now()-state.start)/1000);
    timeEl.textContent = format(secs);
  }
  update();
  uiTimer = setInterval(update,1000);
}

// ---------- button handlers ----------
$('start').onclick = async ()=>{
  const st = await getState();
  if(st.running) return;
  const newState = {
    running:true,
    start: Date.now(),
    elapsed: st.elapsed
  };
  setState(newState);
  renderLoop();
};

$('stop').onclick = async ()=>{
  const st = await getState();
  if(!st.running) return;
  const nowElapsed = st.elapsed + Math.floor((Date.now()-st.start)/1000);
  setState({ running:false, elapsed:nowElapsed });
  renderLoop();
};

$('reset').onclick = ()=>{
  setState({ running:false, elapsed:0, start:0 });
  renderLoop();
};

// ---------- init ----------
renderLoop();


$('time').ondblclick = () =>{
  chrome.windows.create({
    url: chrome.runtime.getURL('popup.html'),
    type:'popup',
    width:120,
    height:80
  });
};


// ---------- Drag inside popup -----------

(() => {
  const box   = document.getElementById('wrapper');
  let drag    = false;
  let offsetX = 0, offsetY = 0;

  box.addEventListener('mousedown', e => {
    drag   = true;
    const r = box.getBoundingClientRect();
    offsetX = e.clientX - r.left;
    offsetY = e.clientY - r.top;
  });

  document.addEventListener('mousemove', e => {
    if (!drag) return;
    
    box.style.position = 'absolute';
    box.style.left = `${e.clientX - offsetX}px`;
    box.style.top  = `${e.clientY - offsetY}px`;
  });

  document.addEventListener('mouseup', () => drag = false);
})();

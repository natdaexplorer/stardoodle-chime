import { initializeApp } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, set, remove } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_AUTH_DOMAIN",
  databaseURL: "PASTE_DATABASE_URL",
  projectId: "PASTE_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: true });
const colorInput = document.getElementById('color');
const sizeInput = document.getElementById('size');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const statusEl = document.getElementById('status');
const joinBtn = document.getElementById('joinBtn');
const roomIdInput = document.getElementById('roomId');

let drawing = false;
let roomRef = null;
let last = null;
let strokes = [];

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.scale(dpr, dpr);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}
window.addEventListener('resize', () => { resize(); redrawFromHistory(); });
resize();

function drawStroke(s) {
  if (!s || !s.points || s.points.length===0) return;
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.size;
  ctx.beginPath();
  ctx.moveTo(s.points[0].x, s.points[0].y);
  for (let p of s.points) ctx.lineTo(p.x, p.y);
  ctx.stroke();
}
function redrawFromHistory(){
  ctx.clearRect(0,0,canvas.width, canvas.height);
  for (let s of strokes) drawStroke(s);
}

function getPos(e){
  const rect = canvas.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  return {x, y};
}

function startDraw(e){
  drawing = true;
  last = getPos(e);
  const stroke = { color: colorInput.value, size: parseInt(sizeInput.value,10), points: [last] };
  strokes.push(stroke);
  if (roomRef) {
    const newStrokeRef = push(roomRef);
    newStrokeRef.set(stroke);
    stroke._key = newStrokeRef.key;
  }
}

function moveDraw(e){
  if (!drawing) return;
  const p = getPos(e);
  const currentStroke = strokes[strokes.length-1];
  currentStroke.points.push(p);
  drawStroke({color: currentStroke.color, size: currentStroke.size, points: [last, p]});
  last = p;
  if (roomRef && currentStroke._key) {
    set(ref(db, `${roomRef.path.pieces_.join('/')}/${currentStroke._key}`), currentStroke);
  }
}
function endDraw(){ drawing = false; last = null; }

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); startDraw(e); }, {passive:false});
window.addEventListener('mousemove', moveDraw);
canvas.addEventListener('touchmove', (e)=>{ e.preventDefault(); moveDraw(e); }, {passive:false});
window.addEventListener('mouseup', endDraw);
canvas.addEventListener('touchend', endDraw);

clearBtn.addEventListener('click', async ()=> {
  strokes = [];
  redrawFromHistory();
  if (roomRef) await remove(roomRef);
});
saveBtn.addEventListener('click', ()=> {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'meadow.png';
  link.click();
});

joinBtn.addEventListener('click', () => {
  const roomId = roomIdInput.value.trim() || 'meadow1';
  joinRoom(roomId);
});

function joinRoom(roomId){
  roomRef = ref(db, 'rooms/' + roomId);
  statusEl.textContent = 'Connected to ' + roomId;
  strokes = [];
  redrawFromHistory();
  onChildAdded(roomRef, (snap) => {
    const s = snap.val();
    strokes.push(s);
    drawStroke(s);
  });
}

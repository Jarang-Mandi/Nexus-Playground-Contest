// VARIABEL DAN PERSIAPAN
const game = document.getElementById('game');
const msg = document.getElementById('message');
const restart = document.getElementById('restart');
const lvl = document.getElementById('level');
const start = document.getElementById('startBtn');
const toggleBtn = document.getElementById('toggleMusic');
const sWin = document.getElementById('sound-win');
const sLose = document.getElementById('sound-lose');
const bgm = document.getElementById('sound-bgm');
const emojis = ["🍒","⭐","🍀","🔔","🥇","🍉","🍇","🍎","🎁","🎉"];
let bombIdx = [], cellsRevealed = 0, gSize = 3, totalBombs = 1, totCells = 9;
let isMuted = false; // Tambahkan flag mute

// Auto play music saat awal load jika tidak mute
window.addEventListener('load', () => {
  if (!isMuted) {
    bgm.volume = 0.5;
    bgm.play().catch(() => {});
  }
});

// SHOW POPUP RULES SAAT LOAD
window.addEventListener("load", () => {
  const popup = document.getElementById("popup-rules");
  const closeBtn = document.getElementById("popup-close");

popup.style.display = "flex";
closeBtn.addEventListener("click", () => {
  popup.style.display = "none";
  if (!isMuted) {
    bgm.volume = 0.5;
    bgm.play().catch(() => {});
  }
});
});

// INIT GAME
function startGame() {
  game.innerHTML = '';
  msg.textContent = '';
  restart.style.display = 'none';
  cellsRevealed = 0;
  bombIdx = [];
  switch (lvl.value) {
    case 'easy': gSize = 3; totalBombs = 1; break;
    case 'medium': gSize = 4; totalBombs = 1; break;
    case 'hard': gSize = 5; totalBombs = 2; break;
  }
  totCells = gSize * gSize;
  game.style.gridTemplateColumns = `repeat(${gSize}, auto)`;
  setBombs();
  makeCells();
  bgm.currentTime = 0;
  if (!isMuted) {
    bgm.play().catch(() => {});
    toggleBtn.textContent = "🔊 Music"; // perbaiki icon
  } else {
    toggleBtn.textContent = "🔇 Mute Mode";
  }
}

function setBombs() {
  while (bombIdx.length < totalBombs) {
    let r = Math.floor(Math.random()*totCells);
    if(!bombIdx.includes(r)) bombIdx.push(r);
  }
}

function makeCells() {
  for(let i=0;i<totCells;i++) {
    const wrap = document.createElement('div');
    wrap.className = 'cell-wrap';

    const c = document.createElement('div');
    c.className = 'cell';
    c.dataset.i = i;
    c.dataset.emoji = emojis[Math.floor(Math.random() * emojis.length)];
    c.textContent = c.dataset.emoji;
    wrap.appendChild(c);

    const canv = document.createElement('canvas');
    let size = window.innerWidth < 400 ? 39 : 60;
    canv.width = size;
    canv.height = size;
    canv.className = 'cover-canvas';
    canv.style.width = canv.style.height = size + "px";
    wrap.appendChild(canv);

    drawBlackCover(canv, size);
    setupScratchCanvas(canv, c, i);
    game.appendChild(wrap);
  }
}

function drawBlackCover(canv, size) {
  const ctx = canv.getContext("2d");
  ctx.clearRect(0,0,size,size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
  ctx.clip();
  ctx.fillStyle = "#222";
  ctx.globalAlpha = 1;
  ctx.fillRect(0,0,size,size);
  ctx.restore();
}

function setupScratchCanvas(canv, cellDiv, idx) {
  let isDown = false, last=null;
  const size = canv.width;

  canv.addEventListener('mousedown', on(e=>{isDown=true;scratch(e);}));
  canv.addEventListener('touchstart', on(e=>{isDown=true;scratch(e);e.preventDefault();}));
  canv.addEventListener('mouseup', on(()=>{isDown=false;last=null;}));
  canv.addEventListener('mouseleave', on(()=>{isDown=false;last=null;}));
  canv.addEventListener('mousemove', on(e =>{ if(isDown) scratch(e); }));
  canv.addEventListener('touchmove', on(e => { if(isDown) scratch(e); e.preventDefault();}));

  function on(fn){ return e=>fn(e); }

  function scratch(e){
    let rect = canv.getBoundingClientRect();
    let clientX, clientY;
    if(e.touches && e.touches.length) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX; clientY = e.clientY;
    }
    let x = clientX - rect.left, y = clientY - rect.top;
    const ctx = canv.getContext("2d");
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, size/7, 0, Math.PI*2);
    ctx.fill();
    if(last!==null){
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineWidth = size/6.2;
      ctx.moveTo(last.x,last.y);
      ctx.lineTo(x,y);
      ctx.stroke();
    }
    ctx.restore();
    last = {x:x, y:y};
    if(estimateScratched(canv,size) > 0.25){
      canv.style.opacity = 0;
      setTimeout(()=>{canv.style.display='none';},400);
      revealCell(cellDiv, idx);
    }
  }
}

function estimateScratched(canv,size){
  let ctx = canv.getContext('2d');
  let imgData = ctx.getImageData(0,0,size,size).data;
  let total = 0, empty=0;
  let r2 = (size/2)*(size/2);
  for(let y=0;y<size;y++) {
    for(let x=0;x<size;x++) {
      let dx = x - size/2, dy = y - size/2;
      if(dx*dx+dy*dy<r2) {
        total++;
        let idx = (y*size + x)*4;
        if(imgData[idx+3]<80) empty++;
      }
    }
  }
  return empty/total;
}

function revealCell(cellDiv, idx){
  if (cellDiv.classList.contains('revealed')) return;
  cellDiv.classList.add('revealed');
  if (bombIdx.includes(idx)) {
    cellDiv.classList.add('bomb');
    cellDiv.textContent = '💣';
    finish(false);
  } else {
    cellsRevealed++;
    if (cellsRevealed === totCells - totalBombs) finish(true);
  }
}

function finish(win) {
  let wraps = game.querySelectorAll('.cell-wrap');
  wraps.forEach(wrap=>{
    let c = wrap.querySelector('.cell');
    let canv = wrap.querySelector('canvas');
    c.classList.add('revealed');
    if (bombIdx.includes(+c.dataset.i)) {
      c.classList.add('bomb');
      c.textContent = '💣';
    }
    if(canv) {canv.style.display='none';}
  });
  msg.textContent = win ? '🎉 You Win!' : '💥 NOOB! You Lose!';
  restart.style.display = 'inline';
  bgm.pause();
  if (!isMuted) (win ? sWin : sLose).play(); // hanya play jika tidak mute
}

start.addEventListener('click', startGame);
restart.addEventListener('click', startGame);
toggleBtn.addEventListener('click', () => {
  if (bgm.paused) {
    bgm.play();
    toggleBtn.textContent = "🔊 Music";
    isMuted = false;
  } else {
    bgm.pause();
    toggleBtn.textContent = "🔇 Mute Mode";
    isMuted = true;
  }
});
window.addEventListener('resize', ()=>{ });

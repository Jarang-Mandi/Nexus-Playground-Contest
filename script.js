const game = document.getElementById('game');
const canvas = document.getElementById('scratchCanvas');
const msg = document.getElementById('message');
const restart = document.getElementById('restart');
const lvl = document.getElementById('level');
const start = document.getElementById('startBtn');
const toggleBtn = document.getElementById('toggleMusic');

const sClick = document.getElementById('sound-click');
const sWin = document.getElementById('sound-win');
const sLose = document.getElementById('sound-lose');
const bgm = document.getElementById('sound-bgm');

const emojis = ["🍒", "⭐", "🍀", "🔔", "🥇", "🍉", "🍇", "🍎", "🎁", "🎉"];

let bombIdx = [], cellsRevealed = 0, gSize = 3, totalBombs = 1, totCells = 9;

function startGame() {
  game.innerHTML = '';
  msg.textContent = '';
  restart.style.display = 'none';
  cellsRevealed = 0;
  bombIdx = [];

  switch (lvl.value) {
    case 'easy': gSize = 3; totalBombs = 1; break;
    case 'medium': gSize = 4; totalBombs = 1; break;
    case 'hard': gSize = 6; totalBombs = 2; break;
  }

  totCells = gSize * gSize;
  game.style.gridTemplateColumns = `repeat(${gSize}, auto)`;

  canvas.width = game.clientWidth;
  canvas.height = game.clientHeight;
  clearCanvas();
  setBombs();
  makeCells();

  bgm.currentTime = 0;
  bgm.play();
}

function setBombs() {
  while (bombIdx.length < totalBombs) {
    let r = Math.floor(Math.random() * totCells);
    if (!bombIdx.includes(r)) bombIdx.push(r);
  }
}

function makeCells() {
  for (let i = 0; i < totCells; i++) {
    const c = document.createElement('div');
    c.className = 'cell';
    c.dataset.i = i;
    c.dataset.emoji = emojis[Math.floor(Math.random() * emojis.length)];
    c.textContent = ''; // disembunyikan dulu
    c.addEventListener('click', reveal);
    game.appendChild(c);
  }
}

function reveal(e) {
  const c = e.target;
  const i = +c.dataset.i;
  if (c.classList.contains('revealed')) return;

  c.classList.add('revealed');
  c.textContent = c.dataset.emoji;

  sClick.currentTime = 0;
  sClick.play();
  scratchEffect(c);

  if (bombIdx.includes(i)) {
    c.classList.add('bomb');
    finish(false);
  } else {
    cellsRevealed++;
    if (cellsRevealed === totCells - totalBombs) finish(true);
  }
}

function finish(win) {
  const all = game.querySelectorAll('.cell');
  all.forEach(c => {
    c.removeEventListener('click', reveal);
    const idx = +c.dataset.i;
    if (bombIdx.includes(idx)) {
      c.classList.add('bomb', 'revealed');
      c.textContent = '💣';
    } else if (!c.textContent) {
      c.textContent = c.dataset.emoji;
      c.classList.add('revealed');
    }
  });

  msg.textContent = win ? '🎉 You Win!' : '💥 NOOB! You Lose!';
  restart.style.display = 'inline';
  bgm.pause();
  (win ? sWin : sLose).play();
  spawnParticles(win);
}

function scratchEffect(cell) {
  const rect = cell.getBoundingClientRect();
  const ctx = canvas.getContext('2d');
  const x = rect.left - game.offsetLeft;
  const y = rect.top - game.offsetTop;

  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x + rect.width / 2, y + rect.height / 2, rect.width / 2, 0, 2 * Math.PI);
  ctx.fill();
}

function clearCanvas() {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function spawnParticles(win) {
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 6 + 2;
    const color = win ? 'gold' : 'red';
    drawParticle(ctx, x, y, size, color);
  }
}

function drawParticle(ctx, x, y, size, color) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.fill();
  setTimeout(() => {
    ctx.clearRect(x - size, y - size, size * 2, size * 2);
  }, 800);
}

let scratching = false;
canvas.addEventListener('mousedown', e => { scratching = true; scratchAt(e); });
canvas.addEventListener('mousemove', e => { if (scratching) scratchAt(e); });
canvas.addEventListener('mouseup', () => scratching = false);
canvas.addEventListener('mouseleave', () => scratching = false);

function scratchAt(e) {
  const rect = canvas.getBoundingClientRect();
  const ctx = canvas.getContext('2d');
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x, y, 25, 0, 2 * Math.PI);
  ctx.fill();
}

start.addEventListener('click', startGame);
restart.addEventListener('click', startGame);

toggleBtn.addEventListener('click', () => {
  if (bgm.paused) {
    bgm.play();
    toggleBtn.textContent = "🔊 Music";
  } else {
    bgm.pause();
    toggleBtn.textContent = "🔇 Mute Mode";
  }
});

window.addEventListener('resize', () => {
  if (game.children.length) {
    canvas.width = game.clientWidth;
    canvas.height = game.clientHeight;
  }
});

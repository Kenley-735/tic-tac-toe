(() => {
  // --- DOM elements
  const boardEl = document.getElementById('board');
  const modeEl = document.getElementById('mode');
  const restartBtn = document.getElementById('restart');
  const resetScoresBtn = document.getElementById('reset-scores');
  const undoBtn = document.getElementById('undo');
  const themeToggleBtn = document.getElementById('theme-toggle');
  const turnEl = document.getElementById('turn');
  const msgEl = document.getElementById('message');
  const scoreXEl = document.getElementById('scoreX');
  const scoreOEl = document.getElementById('scoreO');
  const scoreTEl = document.getElementById('scoreT');

  // --- state
  let board = Array(9).fill(null);
  let current = 'X';
  let running = true;
  let history = [];
  let scores = { X: 0, O: 0, T: 0 };

  // --- theme toggle
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    themeToggleBtn.textContent = document.body.classList.contains('dark') 
      ? "☀️ Light Mode" 
      : "🌙 Dark Mode";
  });

  // --- create board cells
  function createBoard() {
    boardEl.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const btn = document.createElement('button');
      btn.className = 'cell';
      btn.type = 'button';
      btn.dataset.index = i;
      btn.setAttribute('aria-label', `cell ${i+1}`);
      btn.addEventListener('click', onCellClick);
      boardEl.appendChild(btn);
    }
    render();
  }

  // --- render UI
  function render() {
    for (let i = 0; i < 9; i++) {
      const btn = boardEl.children[i];
      btn.textContent = board[i] || '';
      btn.disabled = !running || board[i] !== null;
      btn.classList.toggle('win', false);
    }
    turnEl.textContent = running ? current : '-';
    scoreXEl.textContent = scores.X;
    scoreOEl.textContent = scores.O;
    scoreTEl.textContent = scores.T;
    undoBtn.style.display = history.length ? 'inline-block' : 'none';
  }

  // --- cell click
  function onCellClick() {
    if (!running) return;
    const idx = Number(this.dataset.index);
    if (board[idx] !== null) return;
    playerMove(idx, current);
    if (!checkEnd()) {
      if (modeEl.value === 'pvc') {
        setTimeout(() => {
          const cpu = pickComputerMove(board);
          if (cpu != null) {
            playerMove(cpu, 'O');
            checkEnd();
          }
        }, 300);
      }
    }
  }

  // --- place a move
  function playerMove(idx, player) {
    board[idx] = player;
    history.push({ idx, player });
    current = (player === 'X') ? 'O' : 'X';
    msgEl.textContent = '';
    render();
  }

  // --- check win/tie
  function checkEnd() {
    const win = checkWinner(board);
    if (win) {
      running = false;
      highlightLine(win.line);
      msgEl.innerHTML = `Player <strong>${win.player}</strong> wins!`;
      scores[win.player] += 1;
      render();
      return true;
    }
    if (board.every(cell => cell !== null)) {
      running = false;
      msgEl.textContent = "It's a tie!";
      scores.T += 1;
      render();
      return true;
    }
    return false;
  }

  // --- winner detection
  function checkWinner(b) {
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    for (const L of lines) {
      const [a,b1,c] = L;
      if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
        return { player: b[a], line: L };
      }
    }
    return null;
  }

  // --- highlight winning cells
  function highlightLine(line) {
    for (const i of line) {
      boardEl.children[i].classList.add('win');
    }
  }

  // --- simple computer move
  function pickComputerMove(b) {
    const empty = b.map((v,i) => v === null ? i : null).filter(v => v !== null);
    if (!empty.length) return null;
    for (const i of empty) {
      const copy = b.slice(); copy[i] = 'O';
      if (checkWinner(copy)) return i;
    }
    for (const i of empty) {
      const copy = b.slice(); copy[i] = 'X';
      if (checkWinner(copy)) return i;
    }
    if (b[4] === null) return 4;
    const corners = [0,2,6,8].filter(i => b[i] === null);
    if (corners.length) return corners[Math.floor(Math.random()*corners.length)];
    const sides = [1,3,5,7].filter(i => b[i] === null);
    if (sides.length) return sides[Math.floor(Math.random()*sides.length)];
    return empty[0];
  }

  // --- restart game
  function restart(full=false) {
    board = Array(9).fill(null);
    history = [];
    running = true;
    current = 'X';
    msgEl.textContent = '';
    if (full) scores = { X: 0, O: 0, T: 0 };
    for (const c of boardEl.children) c.classList.remove('win');
    render();
  }

  // --- undo last turn
  function undo() {
    if (!history.length) return;
    const last = history.pop();
    board[last.idx] = null;
    if (modeEl.value === 'pvc' && last.player === 'O' && history.length) {
      const prev = history.pop();
      board[prev.idx] = null;
    }
    running = true;
    current = history.length === 0 ? 'X' : (history[history.length-1].player === 'X' ? 'O' : 'X');
    for (const c of boardEl.children) c.classList.remove('win');
    msgEl.textContent = '';
    render();
  }

  // --- events
  restartBtn.addEventListener('click', () => restart(false));
  resetScoresBtn.addEventListener('click', () => restart(true));
  modeEl.addEventListener('change', () => restart(false));
  undoBtn.addEventListener('click', undo);

  // --- init
  createBoard();
})();

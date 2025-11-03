const qs = (el) => document.querySelector(el);

document.addEventListener('DOMContentLoaded', () => {
  
  fetchBoard();

});

async function fetchBoard() {
  try {
    
    const res = await fetch('/board');
    const data = await res.json();
    if (!res.ok) {
      window.location.href = '/';
    }
    
    const { username, board } = data;
    
    qs('#emptyBoard').classList.toggle('hidden', board);
    qs('#activeBoard').classList.toggle('hidden', !board);
    
    qs('#username').textContent = `Hi! ${username}`;
    board ? renderActiveBoard() : renderEmptyBoard();
    
  } catch (e) {
    console.log(e);
  }
}

function renderEmptyBoard() {
  
}

function renderActiveBoard(board) {
  const activeBoard = qs('#activeBoard');
  
  const header = document.createElement('header');
  header.classList = [
    'mb-8 flex flex-col items-start justify-between',
    'gap-4 sm:flex-row sm:items-center'
  ].join(' ');
  header.innerHTML = `
    <div class="space-y-1">
      <p class="text-sm uppercase tracking-wide text-gray-600">Board Name</p>
      <h1 class="text-2xl font-bold" id="boardName">${board.title}</h1>
    </div>

    <div class="flex items-center gap-3">
      <button class="rounded-full border border-black px-5 py-2 text-sm font-medium text-black transition hover:bg-black hover:text-white">
        + New Card
      </button>
    </div>`
  
  
}
const qs = (el) => document.querySelector(el);
const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

document.addEventListener('DOMContentLoaded', () => {
  
  fetchBoard();
  qs('#logoutBtn').addEventListener('click', () => logout());

});

async function logout() {
  try {
    const res = await fetch('/auth/logout');
    if (res.ok) {
      window.location.href = '/';
      return;
    }
  } catch (e) {
    console.log(e.message);
  }
}

async function fetchBoard() {
  try {
    const res = await fetch('/board');
    const data = await res.json();
    if (!res.ok) {
      window.location.href = '/';
      return;
    } 
    
    const { username, board } = data;
    
    qs('#emptyBoard').classList.toggle('hidden', board);
    qs('#activeBoard').classList.toggle('hidden', !board);
    
    qs('#username').textContent = `Hi! ${username}`;
    if (board) await renderActiveBoard();
  } catch (e) {
    console.error(e.message);
  }
}

async function renderActiveBoard(board) {
  const activeBoard = qs('#activeBoard');
  const statuses = ['open', 'in_progress', 'needs_reflection', 'resolved'];
  
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
      <button class="rounded-full border border-black 
      px-5 py-2 text-sm font-medium text-black transition 
      hover:bg-black hover:text-white">
        + New Card
      </button>
    </div>`
  
  activeBoard.append(header);
  statuses.forEach((s) => {
    const cardContainer = buildCardContainer(s);
    activeBoard.append(cardContainer);
  });
  
  const cards = {
    open: qs('#openCardsContainer'),
    in_progress: qs('#in_progressCardsContainer'),
    need_reflection: qs('#needs_reflectionCardsContainer'),
    resolved: qs('#resolvedCardsContainer'),
  }
  
  try {
    const res = await fetch('/tickets');
    const tickets = await res.json();
    
    if (!res.ok) {
      window.location.href = '/';
      return;
    }
    if (tickets.length === 0) return;
    
    tickets.forEach(t => {
      const ticket = buildTickets(t);
      const container = cards[t.status];
      
      if (container) {
        container.append(ticket);
      } else {
        console.warn(`No container found for status "${t.status}"`);
      }
    });
    
  } catch (e) {
    console.error(e.message);
  }
}

function buildCardContainer(statuses) {
  const cardContainer = document.createElement('div');
  cardContainer.classList = [
    'flex min-w-[260px] flex-col rounded-2xl',
    'border border-black/10 bg-white p-4'
  ].join(' ');
  cardContainer.innerHTML = `
    <h2 class="mb-3 text-lg font-semibold tracking-wide">
    ${capitalize(s)}
    </h2>
    <div id="${s}CardsContainer" class="space-y-3"></div>`
  
  return cardContainer;
}

function buildTickets(ticket) {
  const ticketEl = document.createElement('div');
  
  const getPriorityClasses = (priority) => {
      if (priority === 'high')   return 'bg-red-400';
      if (priority === 'medium') return 'bg-yellow-400';
      return 'bg-green-400';
  };
  ticketEl.classList = [
    'rounded-xl border border-black/10',
    'bg-white p-4 shadow-sm'
  ].join(' ');
  ticketEl.innerHTML = `
    <p class="text-base font-semibold">${ticket.title}</p>
      <div class="mt-3 flex items-center justify-between text-sm text-gray-700">
          <span>issued by: <span class="font-medium">${ticket.authorId.name}</span></span>
          <span class="flex items-center gap-1">
          ${capitalize(ticket.priority)}
          <span class="h-3 w-3 rounded-full ${getPriorityClasses(ticket.priority)}"></span>
          </span>
      </div>`
  
  return ticketEl;
}
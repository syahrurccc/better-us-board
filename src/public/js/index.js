const qs = (el) => document.querySelector(el);
const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

document.addEventListener('DOMContentLoaded', () => {
  
  fetchBoard();
  fetchInvites();
  qs('#logoutBtn').addEventListener('click', () => logout());
  qs('#inviteForm')?.addEventListener('submit', invite);
  qs('#userMenuBtn')?.addEventListener('click', () => toggleMenu());
  qs('#openInvites')?.addEventListener('click', async () => {
    qs('#menuMain').classList.add('hidden');
    qs('#invitesView').classList.remove('hidden');
    await fetchInvites();
  });
  qs('#backToMenu').addEventListener('click', () => {
    qs('#menuMain').classList.remove('hidden');
    qs('#invitesView').classList.add('hidden');
  });

});

function toggleMenu() {
  const menu = qs('#userMenu');
  const menuBtn = qs('#userMenuBtn');
  const menuMain = qs('#menuMain');
  const invitesView = qs('#invitesView');
  
  const isHidden = menu.classList.contains('hidden');
  menu.classList.toggle('hidden', !isHidden);
  if (isHidden) {
    menuMain.classList.remove('hidden');
    invitesView.classList.add('hidden');
  }
  
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
      menu.classList.add('hidden');
    }
  });
}

async function fetchInvites() {
  try {
    const res = await fetch('/connections/requests', {
      credentials: 'include'
    });
    const invites = res.ok ? await res.json() : [];
    
    const listEl = qs('#invitesList');
    listEl.innerHTML = '';
    qs('#noInvites').classList.toggle('hidden', invites.length > 0);
    invites.forEach(inv => {
      listEl.append(renderInvite(inv));
    });
  } catch (e) {
    console.log(e.message)
  }
}

function renderInvite(invite){
  const li = document.createElement('li');
  li.className = 'flex items-center justify-between rounded-xl border border-black/10 px-4 py-3';

  const name = document.createElement('span');
  name.className = 'font-medium';
  name.textContent = invite.inviterId.name;

  const actions = document.createElement('div');
  actions.className = 'flex items-center gap-2';

  const accept = document.createElement('button');
  accept.className = 'rounded-full bg-green-500 px-3 py-1 text-white';
  accept.textContent = '✓';
  accept.addEventListener('click', () => respondInvite(invite._id, true));

  const reject = document.createElement('button');
  reject.className = 'rounded-full bg-red-500 px-3 py-1 text-white';
  reject.textContent = '✕';
  reject.addEventListener('click', () => respondInvite(invite._id, false));

  actions.append(accept, reject);
  li.append(name, actions);
  return li;
}

async function respondInvite(id, response) {
  try {
    const payload = {
      inviteId: id,
      response
    };
    
    const res = await fetch('/connections/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    
    // TODO: The json has a success message, create it later
    
    setTimeout(() => { location.href = '/'; }, 3000);
  } catch (e) {
    console.log(e.message)
  }
}


async function invite(event) {
  event.preventDefault();
  const f = event.currentTarget;
  const payload = { 
    inviteeEmail: f.value.partnerEmail.trim() 
  };
  
  if (!payload.inviteeEmail) return;
  
  try {
    const res = await fetch('/connections/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json(); 
    if (!res.ok) throw new Error(data.error);
    
    console.log(data.message);
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
    
    const { username, inviteCount, board } = data;
    
    qs('#emptyBoard').classList.toggle('hidden', board);
    qs('#activeBoard').classList.toggle('hidden', !board);
    
    qs('#username').textContent = `Hi, ${username}!`;
    setBadge(inviteCount);
    
    if (board) await renderActiveBoard();
  } catch (e) {
    console.error(e.message);
  }
}

function setBadge(count) {
  const show = count > 0;
  [qs('#inviteBadge'), qs('#inviteBadgeInside')]
    .forEach(b => {
    if (!b) return;
    b.textContent = String(count);
    b.classList.toggle('hidden', !show);
  });
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

function buildCardContainer(status) {
  const cardContainer = document.createElement('div');
  cardContainer.classList = [
    'flex min-w-[260px] flex-col rounded-2xl',
    'border border-black/10 bg-white p-4'
  ].join(' ');
  cardContainer.innerHTML = `
    <h2 class="mb-3 text-lg font-semibold tracking-wide">
    ${capitalize(status)}
    </h2>
    <div id="${status}CardsContainer" class="space-y-3"></div>`
  
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
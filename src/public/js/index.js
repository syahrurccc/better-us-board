const qs = (el) => document.querySelector(el);
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

document.addEventListener("DOMContentLoaded", () => {
  fetchBoard();
  fetchInvites();
  qs("#logoutBtn").addEventListener("click", () => logout());
  qs("#inviteForm")?.addEventListener("submit", invite);
  qs("#userMenuBtn")?.addEventListener("click", () => toggleMenu());
  qs("#createTicket")?.addEventListener("click", () =>
    editOrCreateTicket("create"),
  );
  qs("#openInvites")?.addEventListener("click", async () => {
    qs("#menuMain").classList.add("hidden");
    qs("#invitesView").classList.remove("hidden");
    await fetchInvites();
  });
  qs("#backToMenu").addEventListener("click", () => {
    qs("#menuMain").classList.remove("hidden");
    qs("#invitesView").classList.add("hidden");
  });
  document.querySelectorAll(".backToBoard")?.forEach((b) => {
    b.addEventListener("click", () => {
      console.log("clicked");
      location.href = "/";
    });
  });
});

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function toggleMenu() {
  const menu = qs("#userMenu");
  const menuBtn = qs("#userMenuBtn");
  const menuMain = qs("#menuMain");
  const invitesView = qs("#invitesView");

  const isHidden = menu.classList.contains("hidden");
  menu.classList.toggle("hidden", !isHidden);
  if (isHidden) {
    menuMain.classList.remove("hidden");
    invitesView.classList.add("hidden");
  }

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
      menu.classList.add("hidden");
    }
  });
}

async function fetchInvites() {
  try {
    const res = await fetch("/connections/requests", {
      credentials: "include",
    });
    const invites = res.ok ? await res.json() : [];

    const listEl = qs("#invitesList");
    listEl.innerHTML = "";
    qs("#noInvites").classList.toggle("hidden", invites.length > 0);
    invites.forEach((inv) => {
      listEl.append(renderInvite(inv));
    });
  } catch (e) {
    showAlert("error", e.message);
  }
}

function renderInvite(invite) {
  const li = document.createElement("li");
  li.className =
    "flex items-center justify-between rounded-xl border border-black/10 px-4 py-3";

  const name = document.createElement("span");
  name.className = "font-medium";
  name.textContent = invite.inviterId.name;

  const actions = document.createElement("div");
  actions.className = "flex items-center gap-2";

  const accept = document.createElement("button");
  accept.className =
    "rounded-full bg-green-500 px-3 py-1 text-white hover:cursor-pointer";
  accept.textContent = "✓";
  accept.addEventListener("click", () => respondInvite(invite._id, true));

  const reject = document.createElement("button");
  reject.className =
    "rounded-full bg-red-500 px-3 py-1 text-white hover:cursor-pointer";
  reject.textContent = "✕";
  reject.addEventListener("click", () => respondInvite(invite._id, false));

  actions.append(accept, reject);
  li.append(name, actions);
  return li;
}

async function respondInvite(id, response) {
  try {
    const payload = {
      inviteId: id,
      response,
    };

    const res = await fetch("/connections/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    showAlert("success", result.message);

    setTimeout(() => {
      location.href = "/";
    }, 3000);
  } catch (e) {
    console.log("error", e.message);
  }
}

async function invite(event) {
  console.log("clicked");
  event.preventDefault();
  const f = event.currentTarget;
  const payload = {
    inviteeEmail: f.partnerEmail.value.trim(),
  };

  if (!payload.inviteeEmail) return;

  try {
    const res = await fetch("/connections/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showAlert(data.message);
  } catch (e) {
    showAlert(e.message);
  }
}

function setBadge(count) {
  console.log(`invite count is ${count}`);
  const show = count > 0;
  [qs("#inviteBadge"), qs("#inviteBadgeInside")].forEach((b) => {
    if (!b) return;
    b.textContent = String(count);
    b.classList.toggle("hidden", !show);
  });
}

async function fetchBoard() {
  try {
    const res = await fetch("/board", {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) {
      window.location.href = "/";
      return;
    }

    const { username, inviteCount, board } = data;

    qs("#emptyBoard").classList.toggle("hidden", board);
    qs("#activeBoard").classList.toggle("hidden", !board);

    qs("#username").textContent = `Hi, ${username}!`;
    setBadge(inviteCount);

    if (board) await renderActiveBoard(board);
  } catch (e) {
    console.error(e.message);
  }
}

async function renderActiveBoard(board) {
  qs("#activeBoard").dataset.id = board._id;
  qs("#boardName").textContent = `${board.name}`;

  const cards = {
    open: qs("#openTickets"),
    in_progress: qs("#in_progressTickets"),
    need_reflection: qs("#needs_reflectionTickets"),
    resolved: qs("#resolvedTickets"),
  };

  try {
    const res = await fetch("/tickets", {
      method: "GET",
      credentials: "include",
    });
    const tickets = await res.json();

    if (!res.ok) {
      location.href = "/";
      return;
    }
    if (tickets.length === 0) return;

    tickets.forEach((t) => {
      const ticket = buildTicketCards(t);
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

function buildTicketCards(ticket) {
  const ticketEl = document.createElement("div");

  const getPriorityClasses = (priority) => {
    if (priority === "high") return "bg-red-400";
    if (priority === "medium") return "bg-yellow-400";
    return "bg-green-400";
  };
  ticketEl.className = [
    "rounded-xl border border-black/10",
    "bg-white p-4 shadow-sm",
    "hover:shadow-lg hover:cursor-pointer hover:scale-103",
    "transition duration-150 ease-in-out",
  ].join(" ");
  ticketEl.innerHTML = `
    <p class="text-base font-semibold">${ticket.title}</p>
      <div class="mt-3 flex items-center justify-between text-sm text-gray-700">
          <span>issued by: <span class="font-medium">${ticket.authorId.name}</span></span>
          <span class="flex items-center gap-1">
          ${capitalize(ticket.priority)}
          <span class="h-3 w-3 rounded-full ${getPriorityClasses(ticket.priority)}"></span>
          </span>
      </div>`;

  ticketEl.addEventListener("click", () => loadTicket(ticket._id));

  return ticketEl;
}

async function loadTicket(ticketId) {
  try {
    const res = await fetch(`/tickets/${ticketId}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    const { ticket, comments, isAuthor } = data;
    const isArchived = ticket.archived;

    qs("#activeBoard").classList.add("hidden");
    qs("#ticketView").classList.remove("hidden");

    qs("#ticketTitle").textContent = ticket.title;
    qs("#ticketIssuer").textContent = ticket.authorId.name;
    qs("#ticketDate").textContent = formatDate(ticket.createdAt);
    qs("#ticketDescription p").textContent = ticket.description || "";
    qs("#ticketCategory").textContent = capitalize(ticket.category);
    const priority = ticket.priority;
    qs("#ticketPriority").textContent = capitalize(priority);
    const getPriorityClasses = (priority) => {
      if (priority === "high") return "h-3 w-3 rounded-full bg-red-400";
      if (priority === "medium") return "h-3 w-3 rounded-full bg-yellow-400";
      return "h-3 w-3 rounded-full bg-green-400";
    };
    qs("#ticketPriorityDot").classList = getPriorityClasses(priority);

    const commentList = qs("#commentsList");
    comments.forEach((c) => {
      const comment = renderComment(c);
      commentList.append(comment);
    });

    qs("#modifyButtons").classList.toggle("hidden", !isAuthor);
    qs("#archiveTicket").textContent = isArchived ? "Unarchive" : "Archive";

    qs("#commentForm").addEventListener("submit", (e) =>
      sendComment(e, ticket._id),
    );
    qs("#editTicket")?.addEventListener("click", () =>
      editOrCreateTicket("edit", ticket),
    );
    qs("archiveTicket")?.addEventListener("click", () =>
      archiveTicket(ticket._id),
    );
    qs("#deleteTicket")?.addEventListener("click", () =>
      deleteTicket(ticket._id, isArchived),
    );
  } catch (e) {
    console.log(e.message);
  }
}

function renderComment(c) {
  const comment = document.createElement("li");
  comment.className = "border-t border-black/10 pt-4";
  comment.innerHTML`
    <div class="flex items-baseline justify-between">
        <p class="font-medium">${c.authorId.name}</p>
        <time class="text-xs text-gray-600">${formatDate(c.createdAt)}</time>
    </div>
    <p class="mt-1 text-lg italic">${c.body}</p>`;

  return comment;
}

async function sendComment(event, ticketId) {
  event.preventDefault();
  const f = event.currentTarget;
  const payload = {
    body: f.body.value.trim(),
  };

  if (!payload.body) return;

  try {
    const res = await fetch(`/${ticketId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    const { comment } = result;
    const li = renderComment(comment);

    qs("#commentsList").append(li);
  } catch (e) {
    console.log(e);
  }
}

function editOrCreateTicket(type, ticket = null) {
  const isEdit = type === "edit";
  qs("#activeBoard").classList.add("hidden");
  qs("#ticketView").classList.add("hidden");
  qs("#createTicketView").classList.remove("hidden");
  qs("#createTicketView h2").textContent = isEdit
    ? "Edit Ticket"
    : "Create New Ticket";

  const form = qs("#createTicketForm");
  form.reset();
  if (isEdit) {
    form.title.value = ticket.title;
    form.description.value = ticket.description ?? "";
    form.category.value = ticket.category;
    form.priority.value = ticket.priority;
  }

  const method = isEdit ? "PATCH" : "POST";
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const p = {
      boardId: qs("#activeBoard").dataset.id,
      title: form.title.value.trim(),
      description: form.description.value.trim() || null,
      category: form.category.value,
      priority: form.priority.value,
    };

    const required = [p.boardId, p.title, p.category, p.priority];
    if (required.some((e) => !e)) return;

    try {
      const res = await fetch("/tickets", {
        method: method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(p),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      showAlert("success", result.message);
      setTimeout(() => (location.href = "/"), 3000);
    } catch (e) {
      showAlert("error", e.message);
    }
  });
}

async function deleteTicket(ticketId) {
  try {
    const res = await fetch(`/${ticketId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    showAlert("success", result.message);
  } catch (e) {
    showAlert("error", e.message);
  }
}

async function archiveTicket(ticketId, isArchived) {
  try {
    const res = await fetch(`/tickets/${ticketId}/archive`, {
      method: 'PATCH',
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ archived: !isArchived }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    
    showAlert("success", result.message);
  } catch (e) {
    showAlert("error", e.message)
  }
}

async function logout() {
  const res = await fetch("/auth/logout");
  if (res.ok) window.location.href = "/";
}

function showAlert(type, message) {
  const alert = document.createElement("div");
  const isError = type === "error";

  alert.setAttribute("role", "alert");
  alert.className = `
    fixed left-1/2 top-6 z-[1000]
    w-[90%] max-w-md -translate-x-1/2
    rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg
    transition-all duration-300 ease-out
    ${isError ? "bg-red-500" : "bg-green-500"}
  `;
  alert.textContent = message;

  alert.style.opacity = "0";
  alert.style.transform = "translate(-50%, -1rem)";
  document.body.append(alert);

  requestAnimationFrame(() => {
    alert.style.opacity = "1";
    alert.style.transform = "translate(-50%, 0)";
  });

  setTimeout(() => {
    alert.style.opacity = "0";
    alert.style.transform = "translate(-50%, -1rem)";
    setTimeout(() => alert.remove(), 300);
  }, 3000);
}

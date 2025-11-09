const qs = (el) => document.querySelector(el);

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = qs('#registerForm');
  const loginForm = qs('#loginForm');
  
  registerForm?.reset();
  loginForm?.reset();
  registerForm?.addEventListener('submit', register);
  loginForm?.addEventListener('submit', login);
});

async function register(event) {
  event.preventDefault();
  const f = event.currentTarget;
  const payload = {
    name: f.name.value.trim(),
    email: f.email.value.trim(),
    password: f.password.value,
    confirmation: f.confirmation.value
  };
  
  if (!payload.name || !payload.email || !payload.password || !payload.confirmation) return;
  
  try {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error);
    }
    
    window.location.href = '/login';
    return;
  } catch (e) {
    console.error(e.message);
  }
}

async function login(event) {
  
  event.preventDefault();
  const f = event.currentTarget;
  const payload = {
    email: f.email.value.trim(),
    password: f.password.value,
  }
  
  console.log(payload)
  
  if (!payload.email || !payload.password) return;
  
  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error);
    }
    
    window.location.href = '/';
    return;
  } catch (e) {
    console.error(e.message);
  }
}
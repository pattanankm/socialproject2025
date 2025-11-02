const API_BASE = "http://localhost:8000/api"; // change after deploy, or use env variable

// this file contains all API calls to the backend

// ---------- AUTH ----------
export async function registerUser(username, email, password) {
  const res = await fetch(`${API_BASE}/API.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  return res.json();
}

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE}/API.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

// ---------- POSTS ----------
export async function getAllPosts() {
  const res = await fetch(`${API_BASE}/API.php`);
  return res.json();
}

export async function createPost(user_id, content) {
  const res = await fetch(`${API_BASE}/API.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, content }),
  });
  return res.json();
}

// ---------- LIKES ----------
export async function toggleLike(user_id, post_id) {
  const res = await fetch(`${API_BASE}/API.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, post_id }),
  });
  return res.json();
}

// ---------- COMMENTS ----------
export async function addComment(user_id, post_id, text) {
  const res = await fetch(`${API_BASE}/API.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, post_id, text }),
  });
  return res.json();
}

// ---------- HEALTH CHECK ----------
export async function checkServer() {
  const res = await fetch(`${API_BASE}/health.php`);
  return res.json();
}
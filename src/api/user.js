export async function login(username, password) {
  const res = await fetch('/api/login.php', { // Login user - API call post request
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  return res.json()
}

// Register a new user - API call
export async function register(username, email, password) {
  const res = await fetch('/api/register.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  })
  return res.json()
}

// Fetch user profile by user ID
export async function fetchUserProfile(userId) {
  const res = await fetch(`/api/userProfile.php?userId=${userId}`)
  return res.json()
}
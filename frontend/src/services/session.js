// Session helpers.
//
// The session token and user id are kept in localStorage, which is exactly the
// approach taught in week 4. These helpers wrap the two keys so components and
// services call one place instead of repeating localStorage everywhere.

const TOKEN_KEY = 'session_token'
const USER_ID_KEY = 'user_id'

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function getUserId() {
  return localStorage.getItem(USER_ID_KEY)
}

function isLoggedIn() {
  return !!getToken()
}

// Call after a successful POST /login.
function startSession(userId, token) {
  localStorage.setItem(USER_ID_KEY, userId)
  localStorage.setItem(TOKEN_KEY, token)
}

// Call after a successful POST /logout (or when clearing a dead session).
function endSession() {
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

export default {
  getToken,
  getUserId,
  isLoggedIn,
  startSession,
  endSession
}

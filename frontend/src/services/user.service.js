// User service: register, login, logout, getUser.
// All functions return Promises and use fetch() against the local backend.

import session from './session.js'

const BASE_URL = 'http://localhost:3333'

function jsonHeaders(extra) {
  return Object.assign(
    { 'Content-Type': 'application/json' },
    extra || {}
  )
}

// POST /users
function register(first_name, last_name, email, password) {
  return fetch(BASE_URL + '/users', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      first_name: first_name,
      last_name: last_name,
      email: email,
      password: password
    })
  })
    .then((res) => {
      if (res.status === 201) {
        return res.json()
      }
      return res.json().then(
        (data) => Promise.reject(data.error_message || 'Registration failed'),
        () => Promise.reject('Registration failed')
      )
    })
    .catch((err) => {
      if (typeof err === 'string') return Promise.reject(err)
      return Promise.reject('Network error')
    })
}

// POST /login
function login(email, password) {
  return fetch(BASE_URL + '/login', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ email: email, password: password })
  })
    .then((res) => {
      if (res.status === 200) {
        return res.json().then((data) => {
          session.startSession(data.user_id, data.session_token)
          return data
        })
      }
      return res.json().then(
        (data) => Promise.reject(data.error_message || 'Login failed'),
        () => Promise.reject('Login failed')
      )
    })
    .catch((err) => {
      if (typeof err === 'string') return Promise.reject(err)
      return Promise.reject('Network error')
    })
}

// POST /logout
function logout() {
  return fetch(BASE_URL + '/logout', {
    method: 'POST',
    headers: jsonHeaders({
      'X-Authorization': localStorage.getItem('session_token')
    })
  })
    .then((res) => {
      if (res.status === 200) {
        session.endSession()
        return
      }
      if (res.status === 401) return Promise.reject('Not logged in')
      return Promise.reject('Logout failed')
    })
    .catch((err) => {
      if (typeof err === 'string') return Promise.reject(err)
      return Promise.reject('Network error')
    })
}

// GET /users/:user_id
function getUser(user_id) {
  return fetch(BASE_URL + '/users/' + user_id)
    .then((res) => {
      if (res.status === 200) {
        return res.json()
      }
      if (res.status === 404) return Promise.reject('User not found')
      return res.json().then(
        (data) => Promise.reject(data.error_message || 'Could not load user'),
        () => Promise.reject('Could not load user')
      )
    })
    .catch((err) => {
      if (typeof err === 'string') return Promise.reject(err)
      return Promise.reject('Network error')
    })
}

export default {
  register,
  login,
  logout,
  getUser
}

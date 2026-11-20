// Core auction service: item search, detail, bids, questions.
// All functions return Promises and use fetch() against the local backend.

import session from './session.js'

const BASE_URL = 'http://localhost:3333'

function authHeaders(extra) {
  return Object.assign(
    { 'Content-Type': 'application/json' },
    session.getToken() ? { 'X-Authorization': session.getToken() } : {},
    extra || {}
  )
}

// GET /search?q=...&category_id=...&status=...&limit=...&offset=...
// (status is optional and is one of BID / OPEN / ARCHIVE; it needs a session
// token because it filters by the signed-in user's own auctions)
function searchItems(q, category_id, status, limit, offset) {
  const parts = ['limit=' + (limit || 24), 'offset=' + (offset || 0)]
  if (q) parts.push('q=' + encodeURIComponent(q))
  if (category_id) parts.push('category_id=' + encodeURIComponent(category_id))
  if (status) parts.push('status=' + encodeURIComponent(status))
  const query = '?' + parts.join('&')

  const options = status && session.getToken()
    ? { headers: { 'X-Authorization': session.getToken() } }
    : {}

  return fetch(BASE_URL + '/search' + query, options)
    .then((res) => {
      if (res.status === 200) {
        return res.json()
      }
      return res.json().then(
        (data) => Promise.reject(data.error_message || 'Search failed'),
        () => Promise.reject('Search failed')
      )
    })
    .catch((err) => {
      if (typeof err === 'string') return Promise.reject(err)
      return Promise.reject('Network error')
    })
}

// GET /item/:item_id
function getItem(item_id) {
  return fetch(BASE_URL + '/item/' + item_id)
    .then((res) => {
      if (res.status === 200) {
        return res.json()
      }
      if (res.status === 404) return Promise.reject('Item not found')
      return res.json().then(
        (data) => Promise.reject(data.error_message || 'Could not load item'),
        () => Promise.reject('Could not load item')
      )
    })
    .catch((err) => {
      if (typeof err === 'string') return Promise.reject(err)
      return Promise.reject('Network error')
    })
}

// POST /item  (AUTH required). category_ids is an optional array for Extension 2
// and image is an optional small data URL for the card photo.
function createItem(name, description, starting_bid, end_date, category_ids, image) {
  const payload = {
    name: name,
    description: description,
    starting_bid: starting_bid,
    end_date: end_date,
    category_ids: category_ids || []
  }
  // Only send the optional photo when one was actually chosen.
  if (image) payload.image = image

  return fetch(BASE_URL + '/item', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  })
    .then((res) => {
      if (res.status === 201) {
        return res.json()
      }
      if (res.status === 401) return Promise.reject('You must be logged in')
      return res.json().then(
        (data) => Promise.reject(data.error_message || 'Could not create item'),
        () => Promise.reject('Could not create item')
      )
    })
    .catch((err) => {
      if (typeof err === 'string') return Promise.reject(err)
      return Promise.reject('Network error')
    })
}

// POST /item/:item_id/bid  (AUTH)
function placeBid(item_id, amount) {
  return fetch(BASE_URL + '/item/' + item_id + '/bid', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ amount: amount })
  })
    .then((res) => {
      if (res.status === 201) {
        return res.json().catch(() => ({}))
      }
      if (res.status === 403) return Promise.reject('You cannot bid on your own item')
      if (res.status === 404) return Promise.reject('Item not found')
      if (res.status === 401) return Promise.reject('You must be logged in')
      return res.json().then(
        (data) => Promise.reject(data.error_message || 'Bid failed'),
        () => Promise.reject('Bid failed')
      )
    })
    .catch((err) => {
      if (typeof err === 'string') return Promise.reject(err)
      return Promise.reject('Network error')
    })
}

// GET /item/:item_id/bid  (highest bid first)
function getBidHistory(item_id) {
  return fetch(BASE_URL + '/item/' + item_id + '/bid')
    .then((res) => {
      if (res.status === 200) {
        return res.json()
      }
      return res.json().then(
        (data) => Promise.reject(data.error_message || 'Could not load bids'),
        () => Promise.reject('Could not load bids')
      )
    })
    .catch((err) => {
      if (typeof err === 'string') return Promise.reject(err)
      return Promise.reject('Network error')
    })
}

// GET /item/:item_id/question
function getQuestions(item_id) {
  return fetch(BASE_URL + '/item/' + item_id + '/question')
    .then((res) => {
      if (res.status === 200) {
        return res.json()
      }
      return res.json().then(
        (data) => Promise.reject(data.error_message || 'Could not load questions'),
        () => Promise.reject('Could not load questions')
      )
    })
    .catch((err) => {
      if (typeof err === 'string') return Promise.reject(err)
      return Promise.reject('Network error')
    })
}

// POST /item/:item_id/question  (AUTH, cannot ask on own item)
function askQuestion(item_id, question_text) {
  return fetch(BASE_URL + '/item/' + item_id + '/question', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ question_text: question_text })
  })
    .then((res) => {
      if (res.status === 200) {
        return res.json().catch(() => ({}))
      }
      if (res.status === 403) return Promise.reject('You cannot ask a question on your own item')
      if (res.status === 404) return Promise.reject('Item not found')
      if (res.status === 401) return Promise.reject('You must be logged in')
      return res.json().then(
        (data) => Promise.reject(data.error_message || 'Could not ask question'),
        () => Promise.reject('Could not ask question')
      )
    })
    .catch((err) => {
      if (typeof err === 'string') return Promise.reject(err)
      return Promise.reject('Network error')
    })
}

// POST /question/:question_id  (AUTH, item creator only)
function answerQuestion(question_id, answer_text) {
  return fetch(BASE_URL + '/question/' + question_id, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ answer_text: answer_text })
  })
    .then((res) => {
      if (res.status === 200) {
        return res.json().catch(() => ({}))
      }
      if (res.status === 403) return Promise.reject('Only the item creator can answer this question')
      if (res.status === 404) return Promise.reject('Question not found')
      if (res.status === 401) return Promise.reject('You must be logged in')
      return res.json().then(
        (data) => Promise.reject(data.error_message || 'Could not answer question'),
        () => Promise.reject('Could not answer question')
      )
    })
    .catch((err) => {
      if (typeof err === 'string') return Promise.reject(err)
      return Promise.reject('Network error')
    })
}

// Extension 2: GET /categories
function getCategories() {
  return fetch(BASE_URL + '/categories')
    .then((res) => {
      if (res.status === 200) return res.json()
      return Promise.reject('Could not load categories')
    })
    .catch(() => Promise.reject('Network error'))
}

// Extension 2: POST /categories (AUTH)
function createCategory(name) {
  return fetch(BASE_URL + '/categories', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name: name })
  })
    .then((res) => {
      if (res.status === 201) return res.json()
      if (res.status === 401) return Promise.reject('You must be logged in')
      return res.json().then(
        (data) => Promise.reject(data.error_message || 'Could not create category'),
        () => Promise.reject('Could not create category')
      )
    })
    .catch((err) => {
      if (typeof err === 'string') return Promise.reject(err)
      return Promise.reject('Network error')
    })
}

export default {
  searchItems,
  getItem,
  createItem,
  placeBid,
  getBidHistory,
  getQuestions,
  askQuestion,
  answerQuestion,
  getCategories,
  createCategory
}

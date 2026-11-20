const crypto = require('crypto');
const db = require('../../database');

// Private function: not exported.
// Creates and returns a hash of the password and salt as a Hex string.
const getHash = function (password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 256, 'sha256').toString('hex');
};

// 1) Creates a random salt and a hash of the password and salt (using getHash)
// 2) Inserts all the relevant user data into the users table
const addNewUser = function (user, done) {
    const salt = crypto.randomBytes(64);
    const hash = getHash(user.password, salt);

    const sql = 'INSERT INTO users (first_name, last_name, email, password, salt) VALUES (?, ?, ?, ?, ?)';
    const values = [user.first_name, user.last_name, user.email, hash, salt.toString('hex')];

    db.run(sql, values, function (err) {
        if (err) return done(err);
        return done(null, this.lastID);
    });
};

// 1) Gets the user record from the DB using the email
// 2) Passes the incoming password and salt from the DB to the getHash function
// 3) Checks the generated hash is the same as the DB hash
// 4) Handles all errors (unknown email -> 404, wrong password -> 404)
const authenticateUser = function (email, password, done) {
    const sql = 'SELECT user_id, password, salt FROM users WHERE email=?';

    db.get(sql, [email], (err, row) => {
        if (err) return done(err);
        if (!row) return done(404); // wrong email

        if (row.salt === null) row.salt = '';
        const salt = Buffer.from(row.salt, 'hex');

        if (row.password === getHash(password, salt)) {
            return done(null, row.user_id);
        } else {
            return done(404); // wrong password
        }
    });
};

const checkEmailExists = function (email, done) {
    const sql = 'SELECT user_id FROM users WHERE email=?';

    db.get(sql, [email], (err, row) => {
        if (err) return done(err);
        return done(null, row ? true : false);
    });
};

// Gets the session token for the user whose ID matches the parameter ID
const getToken = function (id, done) {
    const sql = 'SELECT session_token FROM users WHERE user_id=?';

    db.get(sql, [id], (err, row) => {
        if (err) return done(err);
        return done(null, row ? row.session_token : null);
    });
};

// Creates a random token and adds it to the DB for the user with the given ID
const setToken = function (id, done) {
    const token = crypto.randomBytes(16).toString('hex');
    const sql = 'UPDATE users SET session_token=? WHERE user_id=?';

    db.run(sql, [token, id], (err) => {
        if (err) return done(err);
        return done(null, token);
    });
};

// Clears the provided token from the DB
const removeToken = function (token, done) {
    const sql = 'UPDATE users SET session_token=null WHERE session_token=?';

    db.run(sql, [token], (err) => {
        return done(err);
    });
};

// 1) Checks the token is valid
// 2) Gets the user ID from the DB where the token matches the incoming token
// 3) Handles any errors
const getIDFromToken = function (token, done) {
    if (!token) return done(null, null);

    const sql = 'SELECT user_id FROM users WHERE session_token=?';

    db.get(sql, [token], (err, row) => {
        if (err) return done(err);
        return done(null, row ? row.user_id : null);
    });
};

// Used by GET /users/:user_id - returns basic profile info (no password/salt/token)
const getUserById = function (id, done) {
    const sql = 'SELECT user_id, first_name, last_name, email FROM users WHERE user_id=?';

    db.get(sql, [id], (err, row) => {
        if (err) return done(err);
        return done(null, row ? row : null);
    });
};

module.exports = {
    addNewUser,
    authenticateUser,
    checkEmailExists,
    getToken,
    setToken,
    removeToken,
    getIDFromToken,
    getUserById
};

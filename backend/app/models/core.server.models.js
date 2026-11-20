const db = require('../../database');

// Columns used whenever an item is returned to the client.
const ITEM_COLUMNS =
    'items.item_id, items.name, items.description, items.starting_bid, items.end_date, items.creator_id, items.image, users.first_name, users.last_name';
const ITEM_JOIN = 'FROM items JOIN users ON items.creator_id = users.user_id';

// Insert a new item and return its ID.
const addNewItem = function (item, done) {
    const sql = 'INSERT INTO items (name, description, starting_bid, start_date, end_date, creator_id, image) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [item.name, item.description, item.starting_bid, item.start_date, item.end_date, item.creator_id, item.image || null];

    db.run(sql, values, function (err) {
        if (err) return done(err);
        return done(null, this.lastID);
    });
};

// Fetch the basic info needed for existence checks and bid/question rules.
const getItemBrief = function (item_id, done) {
    const sql = 'SELECT creator_id, starting_bid FROM items WHERE item_id=?';

    db.get(sql, [item_id], (err, row) => {
        if (err) return done(err);
        return done(null, row ? row : null);
    });
};

// Fetch the current highest bid (with the bidder's details) for an item.
const getHighestBid = function (item_id, done) {
    const sql = `SELECT bids.amount, bids.user_id, users.first_name, users.last_name
                 FROM bids JOIN users ON bids.user_id = users.user_id
                 WHERE bids.item_id = ?
                 ORDER BY bids.amount DESC LIMIT 1`;

    db.get(sql, [item_id], (err, row) => {
        if (err) return done(err);
        return done(null, row ? row : null);
    });
};

// Full item details for GET /item/:item_id (includes current bid + holder).
const getItemById = function (item_id, done) {
    const cols = ITEM_COLUMNS.replace(
        'items.end_date',
        'items.start_date, items.end_date'
    );
    const sql = `SELECT ${cols} ${ITEM_JOIN} WHERE items.item_id=?`;

    db.get(sql, [item_id], (err, row) => {
        if (err) return done(err);
        if (!row) return done(null, null);

        getHighestBid(item_id, (err2, highest) => {
            if (err2) return done(err2);
            done(null, {
                item_id: row.item_id,
                name: row.name,
                description: row.description,
                starting_bid: row.starting_bid,
                start_date: row.start_date,
                end_date: row.end_date,
                creator_id: row.creator_id,
                image: row.image,
                first_name: row.first_name,
                last_name: row.last_name,
                current_bid: highest ? highest.amount : row.starting_bid,
                current_bid_holder: highest
                    ? { user_id: highest.user_id, first_name: highest.first_name, last_name: highest.last_name }
                    : null
            });
        });
    });
};


// Collect a list of items (standard shape) from an arbitrary SQL query.
const getAllItems = function (sql, params, done) {
    const results = [];

    db.each(
        sql,
        params,
        (err, row) => {
            if (err) return;
            results.push({
                item_id: row.item_id,
                name: row.name,
                description: row.description,
                starting_bid: row.starting_bid,
                end_date: row.end_date,
                creator_id: row.creator_id,
                image: row.image,
                first_name: row.first_name,
                last_name: row.last_name
            });
        },
        (err) => {
            if (err) return done(err);
            return done(null, results);
        }
    );
};

// Items created by a user (for GET /users/:user_id -> selling).
const getItemsByCreator = function (creator_id, done) {
    const sql = `SELECT ${ITEM_COLUMNS} ${ITEM_JOIN} WHERE items.creator_id=? ORDER BY items.item_id ASC`;
    getAllItems(sql, [creator_id], done);
};

// Distinct items a user has bid on (for GET /users/:user_id -> bidding_on).
const getItemsBidOn = function (user_id, done) {
    const sql = `SELECT ${ITEM_COLUMNS} ${ITEM_JOIN}
                 WHERE items.item_id IN (SELECT item_id FROM bids WHERE user_id=?)
                 ORDER BY items.item_id ASC`;
    getAllItems(sql, [user_id], done);
};

// Items a user created where bidding has now closed (for GET /users/:user_id -> auctions_ended).
const getEndedItemsByCreator = function (creator_id, done) {
    const sql = `SELECT ${ITEM_COLUMNS} ${ITEM_JOIN} WHERE items.creator_id=? AND items.end_date < ? ORDER BY items.item_id ASC`;
    getAllItems(sql, [creator_id, Date.now()], done);
};

// The bid history for an item, ordered by highest amount first.
const getBidsForItem = function (item_id, done) {
    const sql = `SELECT bids.item_id, bids.amount, bids.timestamp, bids.user_id, users.first_name, users.last_name
                 FROM bids JOIN users ON bids.user_id = users.user_id
                 WHERE bids.item_id = ?
                 ORDER BY bids.amount DESC`;

    const results = [];

    db.each(
        sql,
        [item_id],
        (err, row) => {
            if (err) return;
            results.push({
                item_id: row.item_id,
                amount: row.amount,
                timestamp: row.timestamp,
                user_id: row.user_id,
                first_name: row.first_name,
                last_name: row.last_name
            });
        },
        (err) => {
            if (err) return done(err);
            return done(null, results);
        }
    );
};

// Add a bid to an item.
const addBid = function (item_id, user_id, amount, done) {
    const sql = 'INSERT INTO bids (item_id, user_id, amount, timestamp) VALUES (?, ?, ?, ?)';

    db.run(sql, [item_id, user_id, amount, Date.now()], (err) => {
        return done(err);
    });
};

// The /search endpoint. criteria: { q, status, user_id, limit, offset }
const searchItems = function (criteria, done) {
    let sql = `SELECT ${ITEM_COLUMNS} ${ITEM_JOIN} WHERE 1=1`;
    const params = [];

    if (criteria.q) {
        sql += ' AND items.name LIKE ?';
        params.push('%' + criteria.q + '%');
    }

    // Extension 2: filter by category via the join table.
    if (criteria.category_id) {
        sql += ' AND items.item_id IN (SELECT item_id FROM item_categories WHERE category_id=?)';
        params.push(criteria.category_id);
    }

    if (criteria.status) {
        if (criteria.status === 'BID') {
            sql += ' AND items.item_id IN (SELECT item_id FROM bids WHERE user_id=?)';
            params.push(criteria.user_id);
        } else if (criteria.status === 'OPEN') {
            sql += ' AND items.creator_id=? AND items.end_date > ?';
            params.push(criteria.user_id, Date.now());
        } else if (criteria.status === 'ARCHIVE') {
            sql += ' AND items.creator_id=? AND items.end_date <= ?';
            params.push(criteria.user_id, Date.now());
        }
    }

    sql += ' ORDER BY items.item_id ASC LIMIT ? OFFSET ?';
    params.push(criteria.limit, criteria.offset);

    getAllItems(sql, params, done);
};

module.exports = {
    addNewItem,
    getItemBrief,
    getHighestBid,
    getItemById,
    getItemsByCreator,
    getItemsBidOn,
    getEndedItemsByCreator,
    getBidsForItem,
    addBid,
    searchItems
};

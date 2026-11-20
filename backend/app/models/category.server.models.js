const db = require('../../database');

// Extension 2: category system (many-to-many with items).

// Get all categories, ordered by id.
const getAllCategories = function (done) {
    const sql = 'SELECT category_id, name FROM categories ORDER BY category_id ASC';
    db.all(sql, [], (err, rows) => {
        if (err) return done(err);
        return done(null, rows || []);
    });
};

// Create a category (returns its id; reuses an existing name).
const addCategory = function (name, done) {
    db.get('SELECT category_id FROM categories WHERE name=?', [name], (err, row) => {
        if (err) return done(err);
        if (row) return done(null, row.category_id);
        db.run('INSERT INTO categories (name) VALUES (?)', [name], function (err2) {
            if (err2) return done(err2);
            return done(null, this.lastID);
        });
    });
};

// Verify that the given category ids all exist.
const categoriesExist = function (ids, done) {
    if (!ids || ids.length === 0) return done(null, true);
    const placeholders = ids.map(() => '?').join(',');
    db.get(`SELECT COUNT(*) AS n FROM categories WHERE category_id IN (${placeholders})`, ids, (err, row) => {
        if (err) return done(err);
        return done(null, row.n === ids.length);
    });
};

// Replace an item's category links with the supplied set of category ids.
const setItemCategories = function (item_id, categoryIds, done) {
    const unique = Array.from(new Set(categoryIds));
    db.run('DELETE FROM item_categories WHERE item_id=?', [item_id], (err) => {
        if (err) return done(err);
        if (unique.length === 0) return done(null);

        let remaining = unique.length;
        let failed = false;
        unique.forEach((cid) => {
            db.run('INSERT OR IGNORE INTO item_categories (item_id, category_id) VALUES (?, ?)', [item_id, cid], (err2) => {
                if (err2 && !failed) { failed = true; return done(err2); }
                remaining -= 1;
                if (remaining === 0 && !failed) return done(null);
            });
        });
    });
};

// Get categories for a single item.
const getCategoriesForItem = function (item_id, done) {
    const sql = `SELECT categories.category_id, categories.name
                 FROM categories JOIN item_categories ON categories.category_id = item_categories.category_id
                 WHERE item_categories.item_id=? ORDER BY categories.category_id ASC`;
    db.all(sql, [item_id], (err, rows) => {
        if (err) return done(err);
        return done(null, rows || []);
    });
};

// Get categories for many items at once -> Map(item_id -> [categories]).
const getCategoriesForItems = function (item_ids, done) {
    const result = new Map();
    if (!item_ids || item_ids.length === 0) return done(null, result);

    const placeholders = item_ids.map(() => '?').join(',');
    const sql = `SELECT item_categories.item_id AS item_id, categories.category_id AS category_id, categories.name AS name
                 FROM item_categories JOIN categories ON item_categories.category_id = categories.category_id
                 WHERE item_categories.item_id IN (${placeholders}) ORDER BY categories.category_id ASC`;
    db.all(sql, item_ids, (err, rows) => {
        if (err) return done(err);
        for (const row of rows) {
            if (!result.has(row.item_id)) result.set(row.item_id, []);
            result.get(row.item_id).push({ category_id: row.category_id, name: row.name });
        }
        return done(null, result);
    });
};

module.exports = {
    getAllCategories,
    addCategory,
    categoriesExist,
    setItemCategories,
    getCategoriesForItem,
    getCategoriesForItems
};

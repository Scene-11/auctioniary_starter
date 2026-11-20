const Joi = require('joi');
const items = require('../models/core.server.models');
const users = require('../models/user.server.models');
const { containsProfanity } = require('../lib/profanity');
const categories = require('../models/category.server.models');

// POST /item
const createItem = function (req, res) {
    const schema = Joi.object({
        name: Joi.string().min(1).required(),
        description: Joi.string().min(1).required(),
        starting_bid: Joi.number().integer().min(0).required(),
        end_date: Joi.number().integer().greater(Date.now()).required(),
        category_ids: Joi.array().items(Joi.number().integer().min(1)).optional(),
        // Optional seller photo. The front end downsizes it and sends a small
        // data URL, so the column stays lightweight.
        image: Joi.string().allow('').max(120000).optional()
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error_message: error.details[0].message });

    // Extension 1: reject offensive language in the title or description.
    if (containsProfanity(req.body.name) || containsProfanity(req.body.description)) {
        return res.status(400).json({ error_message: 'Offensive language is not allowed in item listings' });
    }

    const item = {
        name: req.body.name,
        description: req.body.description,
        starting_bid: req.body.starting_bid,
        start_date: Date.now(),
        end_date: req.body.end_date,
        creator_id: req.user_id,
        image: req.body.image || null
    };

    items.addNewItem(item, (err, id) => {
        if (err) return res.sendStatus(500);

        // Extension 2: link the new item to the chosen categories (many-to-many).
        const categoryIds = Array.isArray(req.body.category_ids) ? req.body.category_ids : [];
        categories.setItemCategories(id, categoryIds, (err2) => {
            if (err2) return res.sendStatus(500);
            return res.status(201).json({ item_id: id });
        });
    });
};

// GET /item/:item_id
const getItem = function (req, res) {
    const id = parseInt(req.params.item_id);

    items.getItemById(id, (err, item) => {
        if (err) return res.sendStatus(500);
        if (!item) return res.sendStatus(404);

        categories.getCategoriesForItem(id, (err2, cats) => {
            if (err2) return res.sendStatus(500);
            return res.status(200).json(Object.assign({}, item, { categories: cats }));
        });
    });
};

// POST /item/:item_id/bid
const createBid = function (req, res) {
    const id = parseInt(req.params.item_id);

    const schema = Joi.object({
        amount: Joi.number().integer().min(1).required()
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error_message: error.details[0].message });

    items.getItemBrief(id, (err, item) => {
        if (err) return res.sendStatus(500);
        if (!item) return res.sendStatus(404);

        if (item.creator_id === req.user_id) return res.sendStatus(403);

        items.getHighestBid(id, (err2, highest) => {
            if (err2) return res.sendStatus(500);

            const currentBid = highest ? highest.amount : item.starting_bid;

            if (req.body.amount <= currentBid) {
                return res.status(400).json({ error_message: 'Bid must be higher than the current bid' });
            }

            items.addBid(id, req.user_id, req.body.amount, (err3) => {
                if (err3) return res.sendStatus(500);
                return res.sendStatus(201);
            });
        });
    });
};

// GET /item/:item_id/bid
const getBidsForItem = function (req, res) {
    const id = parseInt(req.params.item_id);

    items.getItemBrief(id, (err, item) => {
        if (err) return res.sendStatus(500);
        if (!item) return res.sendStatus(404);

        items.getBidsForItem(id, (err2, bids) => {
            if (err2) return res.sendStatus(500);
            return res.status(200).json(bids);
        });
    });
};

// GET /search
const search = function (req, res) {
    const q = req.query.q;
    const status = req.query.status;
    const category_id = req.query.category_id ? parseInt(req.query.category_id) : null;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // Status search (BID / OPEN / ARCHIVE) is only meaningful for a specific
    // authenticated user, so it requires a valid session token.
    const runSearch = function (user_id) {
        const criteria = {
            q: q,
            status: status,
            category_id: category_id,
            user_id: user_id,
            limit: limit,
            offset: offset
        };

        items.searchItems(criteria, (err, results) => {
            if (err) return res.sendStatus(500);

            // Attach categories to each result.
            const ids = results.map((r) => r.item_id);
            categories.getCategoriesForItems(ids, (err2, catMap) => {
                if (err2) return res.sendStatus(500);
                const withCats = results.map((r) =>
                    Object.assign({}, r, { categories: catMap.get(r.item_id) || [] }));
                return res.status(200).json(withCats);
            });
        });
    };

    if (status) {
        const validStatuses = ['BID', 'OPEN', 'ARCHIVE'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error_message: 'Invalid status' });
        }

        const token = req.get('X-Authorization');

        users.getIDFromToken(token, (err, id) => {
            if (err || id === null) {
                return res.status(400).json({ error_message: 'Authentication required for status search' });
            }
            runSearch(id);
        });
    } else {
        runSearch(null);
    }
};

// Extension 2: GET /categories
const getCategories = function (req, res) {
    categories.getAllCategories((err, cats) => {
        if (err) return res.sendStatus(500);
        return res.status(200).json(cats);
    });
};

// Extension 2: POST /categories
const createCategory = function (req, res) {
    const schema = Joi.object({
        name: Joi.string().min(1).required()
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error_message: error.details[0].message });

    if (containsProfanity(req.body.name)) {
        return res.status(400).json({ error_message: 'Offensive language is not allowed in category names' });
    }

    categories.addCategory(req.body.name.trim(), (err, id) => {
        if (err) return res.sendStatus(500);
        return res.status(201).json({ category_id: id });
    });
};

module.exports = {
    createItem,
    getItem,
    createBid,
    getBidsForItem,
    search,
    getCategories,
    createCategory
};

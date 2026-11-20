const Joi = require('joi');
const users = require('../models/user.server.models');
const items = require('../models/core.server.models');

// POST /users
const createUser = function (req, res) {
    const schema = Joi.object({
        first_name: Joi.string().min(1).required(),
        last_name: Joi.string().min(1).required(),
        email: Joi.string().email().required(),
        password: Joi.string()
            .min(8)
            .max(20)
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$'))
            .required()
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error_message: error.details[0].message });

    const user = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        password: req.body.password
    };

    users.checkEmailExists(user.email, (err, exists) => {
        if (err) return res.sendStatus(500);
        if (exists) return res.status(400).json({ error_message: 'Email already in use' });

        users.addNewUser(user, (err2, id) => {
            if (err2) return res.status(400).json({ error_message: 'Email already in use' });
            return res.status(201).json({ user_id: id });
        });
    });
};

// POST /login
const login = function (req, res) {
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error_message: error.details[0].message });

    users.authenticateUser(req.body.email, req.body.password, (err, id) => {
        if (err === 404) return res.status(400).json({ error_message: 'Invalid email/password supplied' });
        if (err) return res.sendStatus(500);

        users.getToken(id, (err2, token) => {
            if (err2) return res.sendStatus(500);

            if (token) {
                // already logged in -> return the existing token
                return res.status(200).json({ user_id: id, session_token: token });
            } else {
                users.setToken(id, (err3, newToken) => {
                    if (err3) return res.sendStatus(500);
                    return res.status(200).json({ user_id: id, session_token: newToken });
                });
            }
        });
    });
};

// POST /logout
const logout = function (req, res) {
    const token = req.get('X-Authorization');

    users.getIDFromToken(token, (err, id) => {
        if (err || id === null) return res.sendStatus(401);

        users.removeToken(token, (err2) => {
            if (err2) return res.sendStatus(500);
            return res.sendStatus(200);
        });
    });
};

// GET /users/:user_id
const getUser = function (req, res) {
    const id = parseInt(req.params.user_id);

    users.getUserById(id, (err, user) => {
        if (err) return res.sendStatus(500);
        if (!user) return res.sendStatus(404);

        items.getItemsByCreator(id, (err1, selling) => {
            if (err1) return res.sendStatus(500);

            items.getItemsBidOn(id, (err2, bidding_on) => {
                if (err2) return res.sendStatus(500);

                items.getEndedItemsByCreator(id, (err3, auctions_ended) => {
                    if (err3) return res.sendStatus(500);

                    return res.status(200).json({
                        user_id: user.user_id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        selling: selling,
                        bidding_on: bidding_on,
                        auctions_ended: auctions_ended
                    });
                });
            });
        });
    });
};

module.exports = {
    createUser,
    login,
    logout,
    getUser
};

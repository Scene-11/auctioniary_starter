const users = require('../models/user.server.models');

const isAuthenticated = function (req, res, next) {
    const token = req.get('X-Authorization');

    users.getIDFromToken(token, (err, id) => {
        if (err || id === null) {
            return res.sendStatus(401);
        }

        req.user_id = id;
        next();
    });
};

module.exports = {
    isAuthenticated
};

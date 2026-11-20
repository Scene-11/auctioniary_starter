const userController = require('../controllers/user.server.controllers');

module.exports = function (app) {
    app.route('/users')
        .post(userController.createUser);

    app.route('/users/:user_id')
        .get(userController.getUser);

    app.route('/login')
        .post(userController.login);

    app.route('/logout')
        .post(userController.logout);
};

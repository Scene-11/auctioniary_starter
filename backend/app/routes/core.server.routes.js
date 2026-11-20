const coreController = require('../controllers/core.server.controllers');
const auth = require('../lib/authentication');

module.exports = function (app) {
    app.route('/item')
        .post(auth.isAuthenticated, coreController.createItem);

    app.route('/item/:item_id')
        .get(coreController.getItem);

    app.route('/item/:item_id/bid')
        .get(coreController.getBidsForItem)
        .post(auth.isAuthenticated, coreController.createBid);

    app.route('/search')
        .get(coreController.search);

    // Extension 2: category system.
    app.route('/categories')
        .get(coreController.getCategories)
        .post(auth.isAuthenticated, coreController.createCategory);
};

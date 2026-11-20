const questionController = require('../controllers/question.server.controllers');
const auth = require('../lib/authentication');

module.exports = function (app) {
    app.route('/item/:item_id/question')
        .get(questionController.getQuestionsForItem)
        .post(auth.isAuthenticated, questionController.addQuestion);

    app.route('/question/:question_id')
        .post(auth.isAuthenticated, questionController.answerQuestion);
};

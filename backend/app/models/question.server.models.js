const db = require('../../database');

// Insert a new question for an item (asked_by is the current user's ID).
const addQuestion = function (item_id, asked_by, question_text, done) {
    const sql = 'INSERT INTO questions (question, answer, asked_by, item_id) VALUES (?, ?, ?, ?)';

    db.run(sql, [question_text, null, asked_by, item_id], (err) => {
        return done(err);
    });
};

// Get all questions for an item, newest first.
const getQuestionsForItem = function (item_id, done) {
    const sql = 'SELECT question_id, question, answer FROM questions WHERE item_id=? ORDER BY question_id DESC';

    const results = [];

    db.each(
        sql,
        [item_id],
        (err, row) => {
            if (err) return;
            results.push({
                question_id: row.question_id,
                question_text: row.question,
                answer_text: row.answer
            });
        },
        (err) => {
            if (err) return done(err);
            return done(null, results);
        }
    );
};

// Fetch a single question (used to check it exists and find its item's creator).
const getQuestionById = function (question_id, done) {
    const sql = 'SELECT question_id, question, answer, asked_by, item_id FROM questions WHERE question_id=?';

    db.get(sql, [question_id], (err, row) => {
        if (err) return done(err);
        return done(null, row ? row : null);
    });
};

// Allow the seller to answer a question.
const answerQuestion = function (question_id, answer_text, done) {
    const sql = 'UPDATE questions SET answer=? WHERE question_id=?';

    db.run(sql, [answer_text, question_id], (err) => {
        return done(err);
    });
};

module.exports = {
    addQuestion,
    getQuestionsForItem,
    getQuestionById,
    answerQuestion
};

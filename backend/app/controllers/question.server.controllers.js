const Joi = require('joi');
const questions = require('../models/question.server.models');
const items = require('../models/core.server.models');
const { containsProfanity } = require('../lib/profanity');

// POST /item/:item_id/question
const addQuestion = function (req, res) {
    const item_id = parseInt(req.params.item_id);

    const schema = Joi.object({
        question_text: Joi.string().min(1).required()
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error_message: error.details[0].message });

    // Extension 1: reject offensive questions.
    if (containsProfanity(req.body.question_text)) {
        return res.status(400).json({ error_message: 'Offensive language is not allowed in questions' });
    }

    items.getItemBrief(item_id, (err, item) => {
        if (err) return res.sendStatus(500);
        if (!item) return res.sendStatus(404);

        if (item.creator_id === req.user_id) return res.sendStatus(403);

        questions.addQuestion(item_id, req.user_id, req.body.question_text, (err2) => {
            if (err2) return res.sendStatus(500);
            return res.sendStatus(200);
        });
    });
};

// POST /question/:question_id
const answerQuestion = function (req, res) {
    const question_id = parseInt(req.params.question_id);

    const schema = Joi.object({
        answer_text: Joi.string().min(1).required()
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error_message: error.details[0].message });

    // Extension 1: reject offensive answers.
    if (containsProfanity(req.body.answer_text)) {
        return res.status(400).json({ error_message: 'Offensive language is not allowed in answers' });
    }

    questions.getQuestionById(question_id, (err, question) => {
        if (err) return res.sendStatus(500);
        if (!question) return res.sendStatus(404);

        items.getItemBrief(question.item_id, (err2, item) => {
            if (err2) return res.sendStatus(500);
            if (!item) return res.sendStatus(404);

            if (item.creator_id !== req.user_id) return res.sendStatus(403);

            questions.answerQuestion(question_id, req.body.answer_text, (err3) => {
                if (err3) return res.sendStatus(500);
                return res.sendStatus(200);
            });
        });
    });
};

// GET /item/:item_id/question
const getQuestionsForItem = function (req, res) {
    const item_id = parseInt(req.params.item_id);

    items.getItemBrief(item_id, (err, item) => {
        if (err) return res.sendStatus(500);
        if (!item) return res.sendStatus(404);

        questions.getQuestionsForItem(item_id, (err2, questionList) => {
            if (err2) return res.sendStatus(500);
            return res.status(200).json(questionList);
        });
    });
};

module.exports = {
    addQuestion,
    answerQuestion,
    getQuestionsForItem
};

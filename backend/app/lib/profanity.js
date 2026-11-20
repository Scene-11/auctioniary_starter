// Extension 1: profanity filter helper.
// Uses the third-party `bad-words` library to detect offensive language.
const Filter = require('bad-words');

const filter = new Filter();

// Returns true if the given text contains an offensive word.
function containsProfanity(text) {
    if (!text) return false;
    return filter.isProfane(String(text));
}

module.exports = {
    containsProfanity
};

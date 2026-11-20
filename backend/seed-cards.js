/**
 * seed-cards.js
 * Replaces all demo auction data with the 47 trading cards from public/cards.
 * Run with:  node seed-cards.js
 *
 * Creates six demo accounts (all use password: Password123!):
 *   wang@example.com          (Wang)        - main seller
 *   li@example.com            (Li)          - second seller
 *   sun.jiaqi@example.com     (Sun Jiaqi)   - third seller
 *   zhang@example.com         (Zhang)       - bidder
 *   chen@example.com          (Chen)        - bidder
 *   zhou@example.com          (Zhou)        - bidder
 */

const db = require('./database');
const users = require('./app/models/user.server.models');
const fs = require('fs');
const path = require('path');

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();

// Where the card faces live. The front end serves them from its public/cards
// folder, so by default we look for the sibling project.
// Card faces are served by the front end. Accept the original starter folder
// name too, so the same script works in both layouts.
const CARD_DIR = process.env.CARD_DIR || [
    path.join(__dirname, '..', 'frontend', 'public', 'cards'),
    path.join(__dirname, '..', 'auctionary_starter-vue-project', 'public', 'cards')
].find((dir) => fs.existsSync(dir)) || path.join(__dirname, '..', 'frontend', 'public', 'cards');

// ---- Card catalogue: file, code, rarity, series ----------------------------
// rarity is one of: SSP, SP, RRR, SR, Common
const RAW = [
    // W95 - BanG Dream!
    ['195px-BD-W95-003.png', 'W95-003', 'Common'],
    ['195px-BD-W95-009.png', 'W95-009', 'Common'],
    ['195px-BD-W95-009SSP.png', 'W95-009', 'SSP'],
    ['195px-BD-W95-024SR.png', 'W95-024', 'SR'],
    ['195px-BD-W95-030SSP.png', 'W95-030', 'SSP'],
    ['195px-BD-W95-033SP.png', 'W95-033', 'SP'],
    ['195px-BD-W95-043SP.png', 'W95-043', 'SP'],
    ['195px-BD-W95-054SR.png', 'W95-054', 'SR'],
    ['195px-BD-W95-064SSP.png', 'W95-064', 'SSP'],
    ['195px-BD-W95-065SSP.png', 'W95-065', 'SSP'],
    ['195px-BD-W95-070SP.png', 'W95-070', 'SP'],
    ['195px-BD-W95-078RRR.png', 'W95-078', 'RRR'],
    ['195px-BD-W95-082.png', 'W95-082', 'Common'],
    ['195px-BD-W95-082SSP.png', 'W95-082', 'SSP'],
    ['195px-BD-W95-103SP.png', 'W95-103', 'SP'],
    ['195px-BD-W95-112.png', 'W95-112', 'Common'],
    ['195px-BD-W95-116SR.png', 'W95-116', 'SR'],
    // W63 - BanG Dream!
    ['195px-BD-W63-012SPMb.png', 'W63-012', 'SP'],
    ['195px-BD-W63-027SSP.png', 'W63-027', 'SSP'],
    ['195px-BD-W63-034.png', 'W63-034', 'Common'],
    ['195px-BD-W63-051.png', 'W63-051', 'Common'],
    ['195px-BD-W63-055SPMb.png', 'W63-055', 'SP'],
    ['195px-BD-W63-059.png', 'W63-059', 'Common'],
    ['195px-BD-W63-072.png', 'W63-072', 'Common'],
    ['195px-BD-W63-086SR.png', 'W63-086', 'SR'],
    // WE35 - BanG Dream!
    ['195px-BD-WE35-01.png', 'WE35-01', 'Common'],
    ['195px-BD-WE35-02.png', 'WE35-02', 'Common'],
    ['195px-BD-WE35-03.png', 'WE35-03', 'Common'],
    ['195px-BD-WE35-06.png', 'WE35-06', 'Common'],
    ['195px-BD-WE35-09.png', 'WE35-09', 'Common'],
    ['195px-BD-WE35-10.png', 'WE35-10', 'Common'],
    ['195px-BD-WE35-11.png', 'WE35-11', 'Common'],
    ['195px-BD-WE35-18.png', 'WE35-18', 'Common'],
    ['195px-BD-WE35-20.png', 'WE35-20', 'Common'],
    ['195px-BD-WE35-22.png', 'WE35-22', 'Common'],
    // W92 - Love Live! Superstar!!
    ['195px-LSP-W92-013SR.png', 'W92-013', 'SR'],
    ['195px-LSP-W92-015.png', 'W92-015', 'Common'],
    ['195px-LSP-W92-018.png', 'W92-018', 'Common'],
    ['195px-LSP-W92-037.png', 'W92-037', 'Common'],
    ['195px-LSP-W92-047SPb.png', 'W92-047', 'SP'],
    ['195px-LSP-W92-050SR.png', 'W92-050', 'SR'],
    ['195px-LSP-W92-059.png', 'W92-059', 'Common'],
    ['195px-LSP-W92-060.png', 'W92-060', 'Common'],
    ['195px-LSP-W92-063.png', 'W92-063', 'Common'],
    ['195px-LSP-W92-082.png', 'W92-082', 'Common'],
    ['195px-LSP-W92-088.png', 'W92-088', 'Common'],
    ['195px-LSP-W92-104.png', 'W92-104', 'Common']
];

const SERIES_NAME = {
    W95: 'BanG Dream! Girls Band Party! (W95)',
    W63: 'BanG Dream! Girls Band Party! (W63)',
    WE35: 'BanG Dream! Girls Band Party! Premium Booster (WE35)',
    W92: 'Love Live! Superstar!! (W92)'
};

// Rarity tiers drive both the description and the price: `base` is the floor
// for the tier, and `step`/`steps` spread the cards inside it so that no two
// listings start at exactly the same amount.
const RARITY_INFO = {
    SSP: { label: 'SSP (Super Special)', note: 'hot-stamped signed foil parallel, the highest rarity in the set', base: 170, step: 15, steps: 4 },
    SP: { label: 'SP (Special)', note: 'special parallel foil with alternate artwork', base: 45, step: 6, steps: 5 },
    RRR: { label: 'RRR (Triple Rare)', note: 'triple-rare stamped foil', base: 32, step: 5, steps: 4 },
    SR: { label: 'SR (Super Rare)', note: 'super-rare foil card', base: 12, step: 3, steps: 5 },
    Common: { label: 'Common', note: 'standard non-foil card', base: 3, step: 1, steps: 5 }
};

// Condition and packaging lines are rotated so the listings do not all read
// like the same copy-pasted advert.
const CONDITION_NOTES = [
    'Pulled and sleeved the same day, so the face is clean with a sharp, straight cut and no whitening along the edges.',
    'Sleeved from new and only handled over a clean mat; corners are crisp with no dents, bends or surface scuffs.',
    'Kept flat in a binder since it was pulled: no creases, no print lines and no scratching on the finish.'
];

const PACKAGING_NOTES = [
    'Posted in a penny sleeve inside a rigid top loader and a bubble mailer, with tracked delivery.',
    'Sent double sleeved in a hard card saver, sandwiched between two rigid boards, with tracked delivery.',
    'Shipped in a top loader inside a team bag and a padded envelope; tracked postage on every order.'
];

// Positions in RAW (1-based) whose auction has already finished. These give the
// "ended" states something to show: the profile archive, status=ARCHIVE search
// results and the sold notices on the item page.
const ENDED_INDEXES = [11, 19, 40];

function seriesOf(code) {
    return code.split('-')[0];
}

function buildDescription(code, rarity, i) {
    const info = RARITY_INFO[rarity];
    return [
        'Single Weiss Schwarz card, ' + info.label + ': ' + info.note + '.',
        'Card number ' + code + ', from ' + SERIES_NAME[seriesOf(code)] + '.',
        CONDITION_NOTES[i % CONDITION_NOTES.length],
        PACKAGING_NOTES[(i + 1) % PACKAGING_NOTES.length],
        'Level, power, soul and trigger values are printed on the card face, and the photo shows the exact card you will receive.'
    ].join(' ');
}

function startingBid(rarity, code, i) {
    const info = RARITY_INFO[rarity];
    // Deterministic per-card variation, driven by the card number, so the
    // catalogue has a realistic spread inside each rarity tier.
    const cardNumber = parseInt(code.split('-')[1], 10) || 0;
    return info.base + ((cardNumber + i) % info.steps) * info.step;
}

function run(sql, params) {
    return new Promise((resolve, reject) => {
        db.run(sql, params || [], function (err) {
            if (err) return reject(err);
            resolve(this);
        });
    });
}

function addUser(user) {
    return new Promise((resolve, reject) => {
        users.addNewUser(user, (err, id) => (err ? reject(err) : resolve(id)));
    });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
    // Wait for database.js table creation to settle.
    await sleep(800);

    // 1) Wipe existing auction data (categories are reseeded for the card theme).
    for (const t of ['questions', 'bids', 'item_categories', 'items', 'categories', 'users']) {
        await run('DELETE FROM ' + t);
    }
    for (const t of ['questions', 'bids', 'items', 'categories', 'users']) {
        await run("UPDATE sqlite_sequence SET seq=0 WHERE name=?", [t]);
    }
    console.log('Existing data cleared.');

    // 2) Categories = rarity tiers.
    const catIds = {};
    for (const name of ['SSP', 'SP', 'RRR', 'SR', 'Common']) {
        const res = await run('INSERT INTO categories (name) VALUES (?)', [name]);
        catIds[name] = res.lastID;
    }
    console.log('Rarity categories created.');

    // 3) Demo users (all share the password Password123!).
    const wang = await addUser({ first_name: 'Wang', last_name: '', email: 'wang@example.com', password: 'Password123!' });
    const li = await addUser({ first_name: 'Li', last_name: '', email: 'li@example.com', password: 'Password123!' });
    const sun = await addUser({ first_name: 'Sun', last_name: 'Jiaqi', email: 'sun.jiaqi@example.com', password: 'Password123!' });
    const zhang = await addUser({ first_name: 'Zhang', last_name: '', email: 'zhang@example.com', password: 'Password123!' });
    const chen = await addUser({ first_name: 'Chen', last_name: '', email: 'chen@example.com', password: 'Password123!' });
    const zhou = await addUser({ first_name: 'Zhou', last_name: '', email: 'zhou@example.com', password: 'Password123!' });
    console.log('Demo users created (password for all: Password123!).');

    // 4) Check that every card face is really present before the listings are
    //    created, so a missing image cannot go unnoticed.
    const referenced = new Set(RAW.map(([file]) => file));
    if (!fs.existsSync(CARD_DIR)) {
        console.log('Card image folder not found, skipping the image check: ' + CARD_DIR);
    } else {
        const missing = [...referenced].filter((file) => !fs.existsSync(path.join(CARD_DIR, file)));
        const unlisted = fs.readdirSync(CARD_DIR).filter((file) => !referenced.has(file));
        if (missing.length) {
            console.log('WARNING - ' + missing.length + ' card image(s) are listed but missing from ' + CARD_DIR + ':');
            missing.forEach((f) => console.log('  - ' + f));
        } else {
            console.log('All ' + RAW.length + ' card images found in ' + CARD_DIR + '.');
        }
        if (unlisted.length) {
            console.log('Note - ' + unlisted.length + ' image(s) in that folder are not listed here: ' + unlisted.join(', '));
        }
    }

    // 5) One card auction per image.
    let counter = 0;
    for (const [file, code, rarity] of RAW) {
        counter += 1;
        // Three sellers, so the profile pages and "only the seller can answer"
        // rule can both be demonstrated.
        let creator = wang;
        if (counter % 4 === 0) creator = li;
        else if (counter % 9 === 0) creator = sun;
        const isEnded = ENDED_INDEXES.includes(counter);
        // Finished auctions ran for 5-8 days and closed 2-6 days ago; the rest
        // are still open, starting 1-9 days ago and ending 3-24 days from now.
        const end = isEnded ? NOW - ((counter % 5) + 2) * DAY : NOW + ((counter % 22) + 3) * DAY;
        const start = isEnded ? end - ((counter % 4) + 5) * DAY : NOW - ((counter % 9) + 1) * DAY;
        const bid = startingBid(rarity, code, counter);
        const name = code + ' ' + rarity + ' - ' + SERIES_NAME[seriesOf(code)].split(' (')[0];
        const description = buildDescription(code, rarity, counter);
        const image = '/cards/' + file;

        const res = await run(
            'INSERT INTO items (name, description, starting_bid, start_date, end_date, creator_id, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description, bid, start, end, creator, image]
        );
        const itemId = res.lastID;
        await run('INSERT INTO item_categories (item_id, category_id) VALUES (?, ?)', [itemId, catIds[rarity]]);

        // Give higher-rarity cards, every 6th common card and the finished
        // auctions some bid activity (so ended listings have a winner).
        const hasBids = isEnded || rarity === 'SSP' || rarity === 'SP' || counter % 6 === 0;
        if (hasBids) {
            const bidders = [zhang, sun, chen, zhou];
            const firstBidder = bidders[counter % bidders.length];
            const secondBidder = bidders[(counter + 1) % bidders.length];
            const amount1 = bid + (rarity === 'Common' ? 1 : 5);
            const amount2 = amount1 + (rarity === 'SSP' ? 15 : rarity === 'SP' ? 8 : 3);
            await run('INSERT INTO bids (item_id, user_id, amount, timestamp) VALUES (?, ?, ?, ?)',
                [itemId, firstBidder, amount1, start + 2 * 3600 * 1000]);
            await run('INSERT INTO bids (item_id, user_id, amount, timestamp) VALUES (?, ?, ?, ?)',
                [itemId, secondBidder, amount2, start + 5 * 3600 * 1000]);
        }
    }
    console.log(RAW.length + ' card auctions created.');

    // 6) Preset questions and answers. Items 1, 5 and 14 belong to Wang and are
    //    deliberately left unanswered, so the seller can be seen answering them
    //    during the demo. Item 9 belongs to Sun, which shows the
    //    "only the seller can answer" rule for a different account.
    const sampleQA = [
        // [item_id, asked_by, question, answer (null = still waiting)]
        [1, zhang, 'Does the foil have any surface scratches?', 'No scratches - it went straight from the pack into a sleeve and top loader.'],
        [1, chen, 'Do you combine postage for multiple cards?', null],
        [2, zhang, 'Is this the signed version? Can you show a close-up of the stamp?', 'Yes, it is the hot-stamped signed SSP. I can upload a close-up of the signature area after purchase if needed.'],
        [3, sun, 'Is grading available?', 'Grading is not included, but I can send extra close-up photos before shipping.'],
        [3, zhou, 'Would you ship to the UK mainland?', 'Yes - tracked postage to the UK mainland is included in the shipping price.'],
        [5, chen, 'How is the centring on this one?', null],
        [9, zhang, 'Any whitening on the back edges?', null],
        [14, sun, 'Can you confirm the card number and set?', 'Confirmed: it is the card in the photo, and the set code is printed in the listing title.'],
        [14, zhou, 'Is the price negotiable for a bundle?', null]
    ];
    for (const [item, asker, question, answer] of sampleQA) {
        await run('INSERT INTO questions (question, answer, asked_by, item_id) VALUES (?, ?, ?, ?)',
            [question, answer, asker, item]);
    }
    const waiting = sampleQA.filter((entry) => entry[3] === null).length;
    console.log(sampleQA.length + ' sample questions added (' + waiting + ' still waiting for an answer).');

    console.log('Seeding complete.');
    }

// Run as a script (`node seed-cards.js`) or reused by demo.js.
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Seeding failed:', err);
            process.exit(1);
        });
}

module.exports = { seed: main };

/**
 * demo.js - start the API with the demo catalogue loaded.
 *
 *   node demo.js
 *
 * If the database has no items yet, the 47 card auctions from seed-cards.js are
 * loaded first and then the normal server starts. If the catalogue is already
 * populated it just starts the server.
 *
 * `npm run dev` is deliberately left untouched: the marking flow (start the
 * server, then run the supplied tests against a clean database) still behaves
 * exactly as the assignment expects. The demo catalogue is only ever loaded
 * through this file or through `node seed-cards.js`.
 */
const db = require('./database');
const { seed } = require('./seed-cards');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function countItems() {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) AS n FROM items', (err, row) => {
            if (err) return reject(err);
            return resolve(row.n);
        });
    });
}

async function main() {
    // database.js queues its CREATE TABLE statements when the connection opens,
    // so give them a moment before counting.
    await sleep(800);

    let items = 0;
    try {
        items = await countItems();
    } catch (err) {
        console.error('Could not read the items table:', err.message);
        process.exit(1);
    }

    if (items === 0) {
        console.log('Catalogue is empty, loading the demo cards...');
        await seed();
    } else {
        console.log('Catalogue already holds ' + items + ' item(s), starting the server.');
    }

    require('./server');
}

main().catch((err) => {
    console.error('Could not start the demo server:', err);
    process.exit(1);
});

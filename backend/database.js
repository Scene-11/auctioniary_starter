const sqlite3 = require('sqlite3').verbose();

const DBSOURCE = 'db.sqlite';

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if(err){
        console.log(err.message);
        throw err;
    }else{
        console.log('Connected to the SQLite database.')

        db.run(`CREATE TABLE users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name text,
                last_name text,
                email text UNIQUE,
                password text,
                salt text,
                session_token text,
                CONSTRAINT email_unique UNIQUE (email)
            )`, (err) => {
                if(err){
                    console.log('Users table already created');
                }else{
                    console.log('Users table created');
                }
            }
        );

        
        db.run(`CREATE TABLE items (
                item_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                description TEXT,
                starting_bid INTEGER,
                start_date INTEGER,
                end_date INTEGER,
                creator_id INTEGER,
                image TEXT,
                FOREIGN KEY(creator_id) REFERENCES users(user_id)
            )`, (err) => {
                if(err){
                    console.log('Items table already created');
                    // Migration for databases created before the card theme: add the image column if it is missing.
                    db.run(`ALTER TABLE items ADD COLUMN image TEXT`, (alterErr) => {
                        if (alterErr) {
                            // Column already exists - safe to ignore.
                        } else {
                            console.log('Items table: image column added');
                        }
                    });
                }else{
                    console.log('Items table created');
                }
            }
        );

        db.run(`CREATE TABLE bids (
                item_id INTEGER,
                user_id INTEGER,
                amount INTEGER,
                timestamp INTEGER,
                PRIMARY KEY (item_id, user_id, amount),
                FOREIGN KEY (item_id) REFERENCES items(item_id),
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )`, (err) => {
                if(err){
                    // console.log(err)
                    console.log('Bid table already created');
                }else{
                    console.log('Bid table created');
                }
            }
        );

        db.run(`CREATE TABLE questions (
                question_id INTEGER PRIMARY KEY AUTOINCREMENT,
                question TEXT,
                answer TEXT,
                asked_by INTEGER,
                item_id INTEGER,
                FOREIGN KEY (asked_by) REFERENCES users(user_id),
                FOREIGN KEY (item_id) REFERENCES items(item_id)
            )`, (err) => {
                if(err){
                    console.log('Questions table already created');
                }else{
                    console.log('Questions table created');
                }
            }
        );

        // Extension 2: categories + many-to-many link table.
        db.run(`CREATE TABLE categories (
                category_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE
            )`, (err) => {
                if(err){
                    console.log('Categories table already created');
                }else{
                    console.log('Categories table created');
                }

                // Extension 2: seed a baseline set of categories for the
                // trading-card theme (idempotent).
                // This runs from the CREATE callback so the table is guaranteed
                // to exist first (node-sqlite3 runs queued statements in
                // parallel by default), and serialize() keeps the seeded
                // category_ids in a stable order.
                const seedCategories = ['SSP', 'SP', 'RRR', 'SR', 'Common'];
                db.serialize(function () {
                    seedCategories.forEach((name) => {
                        db.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [name], (seedErr) => {
                            if (seedErr) console.log('Categories seed failed: ' + seedErr.message);
                        });
                    });
                });
            }
        );

        db.run(`CREATE TABLE item_categories (
                item_id INTEGER,
                category_id INTEGER,
                PRIMARY KEY (item_id, category_id),
                FOREIGN KEY (item_id) REFERENCES items(item_id),
                FOREIGN KEY (category_id) REFERENCES categories(category_id)
            )`, (err) => {
                if(err){
                    console.log('Item-categories table already created');
                }else{
                    console.log('Item-categories table created');
                }
            }
        );
    }
});

module.exports = db;

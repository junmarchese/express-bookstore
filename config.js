/** Common config for bookstore. */
let DB_URI;

if (process.env.NODE_ENV === "test") {
  DB_URI = process.env.TEST_DATABASE_URL || "postgresql:///books-test";
} else {
  DB_URI = process.env.DATABASE_URL || "postgresql:///books";
}

const SECRET_KEY = process.env.SECRET_KEY || "secret";


module.exports = { 
  DB_URI,
  SECRET_KEY
};




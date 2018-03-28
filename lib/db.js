const MongoClient = require("mongodb");

const { MONGO_DB_URL, MONGO_DB_NAME } = process.env;

if (!MONGO_DB_URL) {
  throw new ReferenceError("Missing MONGO_DB_URL environment variable");
}

if (!MONGO_DB_NAME) {
  throw new ReferenceError("Missing MONGO_DB_NAME environment variable");
}

module.exports = new Promise((resolve, reject) => {
  MongoClient.connect(MONGO_DB_URL, (error, client) => {
    if (error) return reject(error);
    return resolve(client.db(MONGO_DB_NAME));
  });
});

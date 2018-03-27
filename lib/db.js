const MongoClient = require('mongodb')

const URL = process.env.MONGO_DB_URL;
const DB_NAME = process.env.MONGO_DB_NAME;

module.exports = new Promise((resolve, reject) => {
  MongoClient.connect(URL, (error, client) => {
    if (error) return reject(error);
    return resolve(client.db(DB_NAME));
  })
});

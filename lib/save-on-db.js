function saveOnDB(db, { type, ...document }) {
  const collection = db.collection(type);

  return new Promise((resolve, reject) => {
    collection.insert(
      [Object.assign(document, { createdAt: Date.now() })],
      (error, respoonse) => {
        if (error) return reject(error);
        resolve(respoonse);
      }
    );
  });
}

module.exports = saveOnDB;

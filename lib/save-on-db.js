function parseUserAgent(ua) {
  return Object.entries(ua)
    .map(([key, value]) => {
      switch (key) {
        case "ua": {
          return { title: "Original", value };
        }
        case "browser": {
          return {
            title: "Browser",
            value: `${value.name}@${value.version}`
          };
        }
        case "engine": {
          return {
            title: "Engine",
            value: `${value.name}@${value.version}`
          };
        }
        case "os": {
          return {
            title: "OS",
            value: `${value.name}@${value.version}`
          };
        }
        default: {
          return false;
        }
      }
    })
    .filter(value => !!value)
    .reduce(
      (userAgent, item) => ({
        ...userAgent,
        [item.title.toLowerCase()]: item.value
      }),
      {}
    );
}

function saveOnDB(db, { type, ua, ...document }) {
  const collection = db.collection(type);

  return new Promise((resolve, reject) => {
    collection.insert(
      [
        Object.assign(document, {
          createdAt: Date.now(),
          userAgent: parseUserAgent(ua)
        })
      ],
      (error, respoonse) => {
        if (error) return reject(error);
        resolve(respoonse);
      }
    );
  });
}

module.exports = saveOnDB;

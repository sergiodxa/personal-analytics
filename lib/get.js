const { parse } = require("url");
const ms = require("ms");
const format = require("date-fns/distance_in_words_to_now");

const ONE_MONTH = ms("30d");
const ONE_DAY = ms("1d");
const ONE_WEEK = ms("7d");
const ONE_HOUR = ms("1h");

function getTime(time) {
  switch (time) {
    case "month":
    case "m": {
      return ONE_MONTH;
    }
    case "week":
    case "w": {
      return ONE_WEEK;
    }
    case "day":
    case "d": {
      return ONE_DAY;
    }
    case "hour":
    case "h": {
      return ONE_HOUR;
    }
    default: {
      return ONE_MONTH;
    }
  }
}

async function getDocuments(db, { type, action, time }) {
  const collection = db.collection(type);

  return new Promise((resolve, reject) => {
    collection
      .find(
        { createdAt: { $gt: Date.now() - time }, action },
        {
          sort: { description: 1 }
        }
      )
      .toArray(function(error, documents) {
        if (error) return reject(error);
        return resolve(documents);
      });
  });
}

module.exports = async (db, req, res) => {
  const { query } = parse(req.url, true);

  const { type = "event", action, time = ONE_MONTH } = query;

  if (
    type !== "event" &&
    type !== "info" &&
    type !== "warning" &&
    type !== "error"
  ) {
    return send(res, 400, {
      error: {
        code: "invalid-type",
        message:
          "The defined type is not valid, it could only be `event` (default), `info`, `warning` or `error`.",
        url: "https://err.sh/sergiodxa/personal-analytics/invalid-type"
      }
    });
  }

  const documents = (await getDocuments(db, {
    type,
    time: getTime(time),
    action
  }))
    .map(({ createdAt, ...document }) => {
      // format date
      return {
        ...document,
        createdAt: format(createdAt)
      };
    })
    .reduce((reduced, document) => {
      // group by description
      if (!reduced[document.description])
        return {
          ...reduced,
          [document.description]: {
            amount: 1,
            documents: [document]
          }
        };

      return {
        ...reduced,
        [document.description]: {
          amount: reduced[document.description] + 1,
          documents: [...reduced[document.description].documents, document]
        }
      };
    }, {});

  return documents;
};

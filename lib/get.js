const { parse } = require("url");
const ms = require("ms");
const { send } = require("micro");
const format = require("date-fns/distance_in_words_to_now");

const ONE_MONTH = ms("30d");
const ONE_DAY = ms("1d");
const ONE_WEEK = ms("7d");
const ONE_HOUR = ms("1h");
const ZERO = 0;

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
      return ms(time);
    }
  }
}

function getSort(sort) {
  switch (sort) {
    case "ASC":
    case "asc":
    case 1: {
      return 1;
    }
    case "DESC":
    case "desc":
    case -1: {
      return -1;
    }
    default: {
      return -1;
    }
  }
}

async function getDocuments(db, { type, action, time, sort, skip }) {
  const collection = db.collection(type);

  const query = { action };

  if (skip) {
    query.createdAt = {
      $lt: Date.now() - time
    };
  } else {
    query.createdAt = {
      $gt: Date.now() - time
    };
  }

  return new Promise((resolve, reject) => {
    collection
      .find(query, {
        sort: { createdAt: getSort(sort) }
      })
      .toArray(function(error, documents) {
        if (error) return reject(error);
        return resolve(documents);
      });
  });
}

module.exports = async (db, req, res) => {
  const { pathname, query } = parse(req.url, true);
  
  if (pathname === '/favicon.ico') return {};

  const {
    type = "event",
    time = ms(ONE_MONTH),
    sort = "desc",
    skip,
    action
  } = query;

  if (!action) {
    return send(res, 400, {
      error: {
        code: "missing-action",
        message: "The action is required, define it as `?action=My%20Action`",
        url: "https://err.sh/sergiodxa/personal-analytics/missing-action"
      }
    });
  }

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
    sort,
    skip: typeof skip !== "boolean" ? Boolean(skip) : skip,
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
          amount: (reduced.amount || 0) + 1,
          [document.description]: {
            amount: 1,
            documents: [document]
          }
        };

      return {
        ...reduced,
        amount: (reduced.amount || 0) + 1,
        [document.description]: {
          amount: reduced[document.description].amount + 1,
          documents: [...reduced[document.description].documents, document]
        }
      };
    }, {});

  return documents;
};

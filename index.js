require("now-env");
const { parse } = require("url");
const { stringify } = require("querystring");
const { send, json } = require("micro");
const fetch = require("node-fetch");

const { REFERER, SLACK_API_TOKEN, CHANNEL = "#events" } = process.env;

if (!REFERER) {
  throw new ReferenceError("Missing REFERER environment variable");
}

if (!SLACK_API_TOKEN) {
  throw new ReferenceError("Missing SLACK_API_TOKEN environment variable");
}

function getColor(type) {
  switch (type) {
    case "error": {
      return "#ff5f56";
    }
    case "warning": {
      return "#ffbd2f";
    }
    case "info": {
      return "#067df7";
    }
    default: {
      return "#27c93f";
    }
  }
}

function saveOnDB(db, { type, ...document }) {
  const collection = db.collection(type);

  return new Promise((resolve, reject) => {
    collection.insert([document], (error, respoonse) => {
      if (error) return reject(error);
      resolve(respoonse);
    });
  });
}

async function slack({ action, description, type, message, source }) {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SLACK_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      channel: CHANNEL,
      as_user: false,
      username: "sergiodxa.com",
      text: message,
      attachments: [
        {
          fallback: message,
          color: getColor(type),
          title: action,
          text: description,
          fields: [
            {
              title: "Type",
              value: type,
              short: true
            },
            {
              title: "Source",
              value: source,
              short: true
            }
          ],
          footer: "Analytics"
        }
      ]
    })
  });
}

function log({ type, message }) {
  switch (type) {
    case "error": {
      console.error(message);
    }
    case "warning": {
      console.warn(message);
    }
    case "info": {
      console.info(message);
    }
    default: {
      console.log(message);
    }
  }

  return Promise.resolve();
}

async function getData(req) {
  const url = parse(req.url, true);
  if (url.query && url.query.action) {
    return url.query;
  }
  return await json(req);
}

const main = async (db, req, res) => {
  if (req.method !== "POST") {
    return send(res, 405, {
      error: {
        code: "method-not-allowed",
        message: "The method you used to fetch the API is not supported."
      }
    });
  }

  const { action, description = "", type = "event", source } = await getData(
    req
  );

  if (
    req.headers.origin === REFERER &&
    req.headers.referer.indexOf(REFERER) >= 0
  ) {
    return send(res, 401, {
      error: {
        code: "unauthorized",
        message: "You are not authorized to use this API."
      }
    });
  }

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

  let message = [`[${type}]`, action];

  if (description) message.push(description);

  message = message.join(" - ");

  await Promise.all([
    saveOnDB(db, {
      type,
      action,
      description,
      source
    }),

    slack({
      type,
      action,
      description,
      message,
      source
    }),

    log({ type, message })
  ]);

  return { message };
};

const setup = async handler => {
  const db = await require("./lib/db");
  return handler.bind(null, db);
};

module.exports = setup(main);

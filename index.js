require("now-env");
const { parse } = require("url");
const { stringify } = require("querystring");
const { send } = require("micro");
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

async function slack({ action, description, type, message }) {
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
            }
          ],
          footer: "Analytics"
        }
      ]
    })
  });
  console.log(response);
  const body = await response.json();
  console.log(body);
}

module.exports = async (req, res) => {
  const url = parse(req.url, true);
  const { query: { action, description = "", type = "event" } } = url;

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

  switch (type) {
    case "error": {
      await slack({
        type,
        action,
        description,
        message
      });
      console.error(message);
    }
    case "warning": {
      await slack({
        type,
        action,
        description,
        message
      });
      console.warn(message);
    }
    case "info": {
      await slack({
        type,
        action,
        description,
        message
      });
      console.info(message);
    }
    default: {
      await slack({
        type,
        action,
        description,
        message
      });
      console.log(message);
    }
  }

  return { message };
};

require("now-env");
const { parse } = require("url");
const { send } = require("micro");
const slack = require("slackup");

const { REFERER, SLACK_API_TOKEN, CHANNEL = "#events" } = process.env;

if (!REFERER) {
  throw new ReferenceError("Missing REFERER environment variable");
}

if (!SLACK_API_TOKEN) {
  throw new ReferenceError("Missing SLACK_API_TOKEN environment variable");
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
        token: SLACK_API_TOKEN,
        channel: CHANNEL,
        text: message
      });
      console.error(message);
    }
    case "warning": {
      await slack({
        token: SLACK_API_TOKEN,
        channel: CHANNEL,
        text: message
      });
      console.warn(message);
    }
    case "info": {
      await slack({
        token: SLACK_API_TOKEN,
        channel: CHANNEL,
        text: message
      });
      console.info(message);
    }
    default: {
      await slack({
        token: SLACK_API_TOKEN,
        channel: CHANNEL,
        text: message
      });
      console.log(message);
    }
  }

  return { message };
};

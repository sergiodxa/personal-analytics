const { parse } = require("url");
const { send } = require("micro");

module.exports = (req, res) => {
  const url = parse(req.url, true);
  const { query: { action, description = "", type = "event" } } = url;

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

  message = message.join(" - ")

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

  return { message };
};

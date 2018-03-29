const { send } = require("micro");
const UA = require("ua-parser-js");

const getData = require("./get-data");
const log = require("./log");
const slack = require("./slack");
const saveOnDB = require("./save-on-db");

const { REFERER } = process.env;

if (!REFERER) {
  throw new ReferenceError("Missing REFERER environment variable");
}

module.exports = async (db, req, res) => {
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

  const ip = req.headers["x-forwarded-for"];
  const ua = new UA(req.headers["user-agent"]).getResult();

  let message = [`[${type}]`, action];

  if (description) message.push(description);

  message = message.join(" - ");

  await Promise.all([
    saveOnDB(db, {
      type,
      action,
      description,
      source,
      ip,
      ua
    }),

    slack({
      type,
      action,
      description,
      message,
      source,
      ip,
      ua
    }),

    log({ type, message })
  ]);

  return { message };
};

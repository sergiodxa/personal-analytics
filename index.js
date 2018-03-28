require("now-env");
const { send } = require("micro");

const get = require("./lib/get");
const post = require("./lib/post");

const main = async (db, req, res) => {
  switch (req.method) {
    case "GET": {
      return get(db, req, res);
    }
    case "POST": {
      return post(db, req, res);
    }
    default: {
      return send(res, 405, {
        error: {
          code: "method-not-allowed",
          message: "The method you used to fetch the API is not supported."
        }
      });
    }
  }
};

const setup = async handler => {
  const db = await require("./lib/db");
  return handler.bind(null, db);
};

module.exports = setup(main);

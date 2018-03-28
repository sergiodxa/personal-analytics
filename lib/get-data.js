const { parse } = require("url");
const { json } = require("micro");

async function getData(req) {
  const url = parse(req.url, true);
  if (url.query && url.query.action) {
    return url.query;
  }
  return await json(req);
}

module.exports = getData;

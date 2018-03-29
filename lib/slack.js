const fetch = require("node-fetch");
const getColor = require("./get-color");

const { SLACK_API_TOKEN, CHANNEL = "#events" } = process.env;

if (!SLACK_API_TOKEN) {
  throw new ReferenceError("Missing SLACK_API_TOKEN environment variable");
}

async function slack({ action, description, type, message, source, ip, ua }) {
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
            },
            {
              title: "IP",
              value: ip,
              short: true
            },
            ...Object.entries(ua)
              .map(([key, value]) => {
                switch (key) {
                  case "ua": {
                    return { title: "User-Agent", value, short: false };
                  }
                  case "browser": {
                    return {
                      title: "Browser",
                      value: `${value.name}@${value.version}`,
                      short: true
                    };
                  }
                  case "engine": {
                    return {
                      title: "Engine",
                      value: `${value.name}@${value.version}`,
                      short: true
                    };
                  }
                  case "os": {
                    return {
                      title: "OS",
                      value: `${value.name}@${value.version}`,
                      short: true
                    };
                  }
                  default: {
                    return false;
                  }
                }
              })
              .filter(value => !!value)
          ],
          footer: "Analytics"
        }
      ]
    })
  });
}

module.exports = slack;

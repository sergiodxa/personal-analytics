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

module.exports = log;

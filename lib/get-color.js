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

module.exports = getColor;

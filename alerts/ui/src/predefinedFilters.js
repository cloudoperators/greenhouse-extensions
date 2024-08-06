module.exports = {
  filters: [
    {
      name: "prod",
      displayName: "Prod",
      matchers: {
        // regex that matches anything except regions that start with qa-de-
        region: "^(?!qa-de-).*",
      },
    },
    {
      name: "prod-qa",
      displayName: "Prod + QA",
      matchers: {
        // regex that matches anything except regions that start with qa-de- and end with a number that is not 1
        // regex is used in RegExp constructor, so we need to escape the backslashes for flags
        region: "^(?!qa-de-(?!1$)\\d+).*",
      },
    },
    {
      name: "labs",
      displayName: "Labs",
      matchers: {
        // regex that matches all regions that start with qa-de- and end with a number that is not 1
        // regex is used in RegExp constructor, so we need to escape the backslashes for flags
        region: "^qa-de-(?!1$)\\d+",
      },
    },
    {
      name: "all",
      displayName: "All",
      matchers: {
        region: ".*",
      },
    },
  ],
}

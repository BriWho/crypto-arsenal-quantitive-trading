const { execute, makePromise } = require("apollo-link");
const { WebSocketLink } = require("apollo-link-ws");
const { SubscriptionClient } = require("subscriptions-transport-ws");
const { spawn } = require("child_process");
const gql = require("graphql-tag");
const WebSocket = require("ws");

// EDIT THIS SECTION
// START Configure params
const STRATEGY_TOKEN = "acbc46c4-446e-4b1c-9573-12e6c871c30f"; // Create a remote strategy and get token
// Generate from account page
const API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mzk1LCJ2IjoxLCJhcGlDaGVja2VyIjp0cnVlLCJpYXQiOjE1OTI3NTI3NzZ9.mrkg8czJMNCpucWrJyfSoK_8fkIC7zEx9q7kbyi8YQc";
const LANG = "PYTHON"; // PYTHON or JS
const STRATEGY_FILE_NAME = "MYSTRATEGY.py"; // your local strategy source file name
// END Configure

// Const
const GRAPHQL_ENDPOINT = "wss://api.crypto-arsenal.io/subscriptions";
const operation = {
  query: gql`mutation { remoteStrategyHeartbeat(strategyToken: "${STRATEGY_TOKEN}") { isOk } }`
};
const client = new SubscriptionClient(
  GRAPHQL_ENDPOINT,
  {
    reconnect: true,
    connectionParams: {
      API_TOKEN: API_TOKEN
    }
  },
  WebSocket
);
const wslink = new WebSocketLink(client);
const subOp = {
  query: gql`
    subscription {
      remoteStrategyOnNewTask {
        jobName
      }
    }
  `
};

execute(wslink, subOp).subscribe({
  next: data => {
    console.log(`received new task: ${JSON.stringify(data, null, 2)}`);
    if (LANG.toLowerCase() === "js") {
      spawn(
        "node",
        [
          "nodejs/index.js",
          `${__dirname}/${STRATEGY_FILE_NAME}`,
          `${data.data.remoteStrategyOnNewTask.jobName}.remote.crypto-arsenal.io:17888`
        ],
        { stdio: "inherit" }
      );
    } else {
      spawn(
        "python.exe",
        [
          "python/strategy.py",
          `${__dirname}/${STRATEGY_FILE_NAME}`,
          `${data.data.remoteStrategyOnNewTask.jobName}.remote.crypto-arsenal.io:17888`
        ],
        { stdio: "inherit" }
      );
    }
  },
  error: error => console.log(`received error ${JSON.stringify(error)}`),
  complete: () => console.log(`complete`)
});

const makeHeartBeat = () => {
  return makePromise(execute(wslink, operation))
    .then(data => console.log(`received data ${JSON.stringify(data, null, 2)}`))
    .catch(error => console.log(`received error ${error}`));
};

makeHeartBeat();
setInterval(makeHeartBeat, 60000);

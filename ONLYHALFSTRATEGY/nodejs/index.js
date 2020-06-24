/*
 *
 * Copyright 2015 gRPC authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
var grpc = require('grpc');
var messages = require('./strategy_pb');
var services = require('./strategy_grpc_pb');
var { loopWhile } = require('deasync');
const { VM } = require('vm2');
const { promisify } = require('util');
const TA = require('talib-binding');
const MAX_RECONNECTION_RETRY = 10;
const util = require('util');
const fs = require('fs');


const strategyFile = process.argv[2];
const endpoint = process.argv[3];
if (!strategyFile || !endpoint) {
  console.log(`no info to run, Usage: ${process.argv[1]} script_path broker_endpoint`);
  process.exit(-1);
}
const ENDPOINT = endpoint; //ENDPOINT;

require('google-protobuf/google/protobuf/struct_pb');
// change version of deasync, pass object 'this' reference to fn.apply
function deasync(that, fn) {
	return function () {
		var done = false
		var args = Array.prototype.slice.apply(arguments).concat(cb)
		var err
		var res

		fn.apply(that, args)
		loopWhile(function () {
			return !done
		})
		if (err)
			throw err

		return res

		function cb(e, r) {
			err = e
			res = r
			done = true
		}
	}
}


const tlsChannel = grpc.credentials.createSsl(fs.readFileSync('caremote.crt'));

let client = new services.StrategyClient(ENDPOINT, tlsChannel);

async function forceDelay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  })
}

function fetchTaskData() {
  client = new services.StrategyClient(ENDPOINT, tlsChannel);
  return new Promise((resolve, reject) => {
    client.getTaskData(new messages.Empty(), (err, rst) => {
      if(!err) resolve(rst);
      reject(err);
    });
  });
}


function storage(name, value=null) {
  const v = new messages.UserVar();
  v.setName(name);
  if (arguments.length === 1) {
    const getUserVar = deasync(client, client.getUserVar);
    const rtn = getUserVar(v);
    const str = rtn.getStrValue();
    const num = rtn.getNumValue();
    console.log('got user var', str, num);
    if(rtn.getIsEmpty()) {
      return undefined;
    }
    if(!str) return num;
    return str;
  } else {
    v.setIsEmpty(false);
    if (typeof value === 'string') {
      v.setStrValue(value);
    } else if (typeof value === 'number') {
      v.setNumValue(value);
    } else if (value === null || value === undefined) {
      v.setIsEmpty(true);
    } else {
      LogError('not support type for storage ' + typeof value);
      return;
    }
    const setUserVar = deasync(client, client.setUserVar);
    setUserVar(v);
    console.log('set user value done');
  }
}

function tryLogErrorAndExit(err) {
  try {
    syncLog(err.message, 9);
  } catch(e) {
    console.log(e);
    console.log('Unable to log error');
  }
  client.shutdown(new messages.Empty(), () => {
    console.log('shutdowned');
    process.exit(0);
  });
}

process.on('uncaughtException', (err) => {
  console.log('err in global exception handler', err);
  console.trace();
  process.exit(0);
});

async function main() {
  let reconnectCount = 0;
  let taskData;
  while (reconnectCount < MAX_RECONNECTION_RETRY) {
    console.log(123);
    await fetchTaskData()
      .then(dt => {
        taskData = dt;
      })
      .catch(async (err) => {
        console.log(err.toString());
        console.log("connect failed, retrying...")
        reconnectCount++;
        await forceDelay(3000);
      });
    if (taskData) break;
  }

  if (!taskData) {
    console.log('fatal error, unable to connect to broker');
    process.exit(0);
  }

  let informationStream = client.getInformationStream(new messages.Empty());
  let onOrderStateChangeStream = client.getOnOrderStateChangeStream(new messages.Empty());
  // if local run, defined strategy
  let strategy;
  let strategyOptions;
  let vm;
  let vmRef = [];

  console.log('calling getStrategyOptions');
  strategyOptions = taskData.getOptions().toJavaScript().options;
  console.log('got strategy options', JSON.stringify((strategyOptions)));
  // const code = taskData.getCode();
  const code = fs.readFileSync(strategyFile).toString();


  if (code) {
    try {
      strategy = new VM({ sandbox: { Log, TA, CAStorage: storage, CancelOrder: cancelOrder } }).run(`klass=${code};console.log(klass);new klass();`);
      vm = new VM({ sandbox: { strategy: strategy, ref: vmRef } });
    } catch (err) {
      console.log('code cant run');
      tryLogErrorAndExit(err);
    }
  }

  if (strategyOptions) {
    strategyOptions.forEach((data) => {
      strategy[data.name] = data.value;
    });
  }

  console.log('calling config update');
  const config = new messages.StrategyConfig();
  config.setPeriod(strategy.period);
  config.setSubscribedbooks(proto.google.protobuf.Struct.fromJavaScript(strategy.subscribedBooks));
  let configUpdateStream = client.updateConfig(config);
  configUpdateStream.on('data', (d) => {
    console.log('updating strategy config');
    const subs = d.getSubscribedbooks().toJavaScript();
    console.log('new sub books', JSON.stringify(subs));
    strategy.subscribedBooks = subs;
  });


  informationStream.on('data', (data) => {
    const candles = data.getCandles().toJavaScript();
    const orderBooks = data.getOrderbooks().toJavaScript();
    const orderHistories = data.getOrders().toJavaScript();
    const assets = data.getAssets().toJavaScript();

    // Sync assets
    strategy.assets = assets;

    if (vmRef.length > 0)
      vmRef.pop();
    vmRef.push({ candles, orderBooks, orders: orderHistories.data });
    let orders;
    try {
      orders = vm.run('strategy.trade(ref[0]);');
      if (!orders) { // in case not return anything
        orders = [];
      }
    } catch (e) {
      LogError(e.toString());
      orders = [];
    }

    console.log('got orders from strategy', JSON.stringify(orders));

    for (let o = 0; o < orders.length; o++) {
      const pack = new messages.OrderEntry();
      pack.setExchange(orders[o].exchange);
      pack.setPair(orders[o].pair);
      pack.setAmount(orders[o].amount);
      pack.setPrice(orders[o].price);
      pack.setType(orders[o].type);
      orders[o] = pack;
    }
    const reply = new messages.Orders();
    reply.setOrdersList(orders);
    client.makeOrders(reply, (err, rst) => {});
  });

  onOrderStateChangeStream.on('data', (data) => {
    console.log('Got orderStateChange in client');
    const order = {
      exchange: data.getExchange(),
      pair: data.getPair(),
      amount: data.getAmount(),
      amountFilled: data.getAmountFilled(),
      price: data.getPrice(),
      type: data.getType(),
      status: data.getStatus(),
    };

    while (vmRef.length > 0) {
      vmRef.pop();
    }
    vmRef.push(order);

    try {
      vm.run('strategy.onOrderStateChanged(ref[0]);');
    } catch (e) {
      LogError(e.toString());
    }
  });
}

function Log(msg) {
  console.log('got log', msg);
  const log = new messages.LogEntry();
  log.setMessage(msg);
  log.setType(1);
  client.logging(log, () => {});
}

function cancelOrder(order) {
  console.log('cancel order', order);

  const cancelOrder = new messages.CancelOrder();
  cancelOrder.setExchange(order.exchange);
  cancelOrder.setPair(order.pair);
  cancelOrder.setOrderId(order.orderID);

  client.cancelOrder(cancelOrder, () => {});
}


function LogError(msg) {
  console.log('got err log', msg);
  const log = new messages.LogEntry();
  log.setMessage(msg);
  log.setType(9);
  client.logging(log, () => {});
}

function syncLog(msg, type=1) {
  const logging = deasync(client, client.logging);
  const log = new messages.LogEntry();
  log.setMessage(msg);
  log.setType(type);
  logging(log);
}

main()
  .catch((err) => {
    console.log("wrapper error", err);
    tryLogErrorAndExit(err);
  });

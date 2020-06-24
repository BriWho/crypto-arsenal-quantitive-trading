// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var strategy_pb = require('./strategy_pb.js');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');

function serialize_cryptoarsenal_CancelOrder(arg) {
  if (!(arg instanceof strategy_pb.CancelOrder)) {
    throw new Error('Expected argument of type cryptoarsenal.CancelOrder');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_cryptoarsenal_CancelOrder(buffer_arg) {
  return strategy_pb.CancelOrder.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cryptoarsenal_Empty(arg) {
  if (!(arg instanceof strategy_pb.Empty)) {
    throw new Error('Expected argument of type cryptoarsenal.Empty');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_cryptoarsenal_Empty(buffer_arg) {
  return strategy_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cryptoarsenal_Information(arg) {
  if (!(arg instanceof strategy_pb.Information)) {
    throw new Error('Expected argument of type cryptoarsenal.Information');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_cryptoarsenal_Information(buffer_arg) {
  return strategy_pb.Information.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cryptoarsenal_LogEntry(arg) {
  if (!(arg instanceof strategy_pb.LogEntry)) {
    throw new Error('Expected argument of type cryptoarsenal.LogEntry');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_cryptoarsenal_LogEntry(buffer_arg) {
  return strategy_pb.LogEntry.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cryptoarsenal_OrderEntry(arg) {
  if (!(arg instanceof strategy_pb.OrderEntry)) {
    throw new Error('Expected argument of type cryptoarsenal.OrderEntry');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_cryptoarsenal_OrderEntry(buffer_arg) {
  return strategy_pb.OrderEntry.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cryptoarsenal_Orders(arg) {
  if (!(arg instanceof strategy_pb.Orders)) {
    throw new Error('Expected argument of type cryptoarsenal.Orders');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_cryptoarsenal_Orders(buffer_arg) {
  return strategy_pb.Orders.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cryptoarsenal_StrategyConfig(arg) {
  if (!(arg instanceof strategy_pb.StrategyConfig)) {
    throw new Error('Expected argument of type cryptoarsenal.StrategyConfig');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_cryptoarsenal_StrategyConfig(buffer_arg) {
  return strategy_pb.StrategyConfig.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cryptoarsenal_TaskData(arg) {
  if (!(arg instanceof strategy_pb.TaskData)) {
    throw new Error('Expected argument of type cryptoarsenal.TaskData');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_cryptoarsenal_TaskData(buffer_arg) {
  return strategy_pb.TaskData.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cryptoarsenal_UserVar(arg) {
  if (!(arg instanceof strategy_pb.UserVar)) {
    throw new Error('Expected argument of type cryptoarsenal.UserVar');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_cryptoarsenal_UserVar(buffer_arg) {
  return strategy_pb.UserVar.deserializeBinary(new Uint8Array(buffer_arg));
}


var StrategyService = exports.StrategyService = {
  // broker as server, strategy as client
  getInformationStream: {
    path: '/cryptoarsenal.Strategy/getInformationStream',
    requestStream: false,
    responseStream: true,
    requestType: strategy_pb.Empty,
    responseType: strategy_pb.Information,
    requestSerialize: serialize_cryptoarsenal_Empty,
    requestDeserialize: deserialize_cryptoarsenal_Empty,
    responseSerialize: serialize_cryptoarsenal_Information,
    responseDeserialize: deserialize_cryptoarsenal_Information,
  },
  getOnOrderStateChangeStream: {
    path: '/cryptoarsenal.Strategy/getOnOrderStateChangeStream',
    requestStream: false,
    responseStream: true,
    requestType: strategy_pb.Empty,
    responseType: strategy_pb.OrderEntry,
    requestSerialize: serialize_cryptoarsenal_Empty,
    requestDeserialize: deserialize_cryptoarsenal_Empty,
    responseSerialize: serialize_cryptoarsenal_OrderEntry,
    responseDeserialize: deserialize_cryptoarsenal_OrderEntry,
  },
  // strategy client update subscribeBooks/period to broker, and broker stream back config if override needed(single pair)
  updateConfig: {
    path: '/cryptoarsenal.Strategy/updateConfig',
    requestStream: false,
    responseStream: true,
    requestType: strategy_pb.StrategyConfig,
    responseType: strategy_pb.StrategyConfig,
    requestSerialize: serialize_cryptoarsenal_StrategyConfig,
    requestDeserialize: deserialize_cryptoarsenal_StrategyConfig,
    responseSerialize: serialize_cryptoarsenal_StrategyConfig,
    responseDeserialize: deserialize_cryptoarsenal_StrategyConfig,
  },
  logging: {
    path: '/cryptoarsenal.Strategy/logging',
    requestStream: false,
    responseStream: false,
    requestType: strategy_pb.LogEntry,
    responseType: strategy_pb.Empty,
    requestSerialize: serialize_cryptoarsenal_LogEntry,
    requestDeserialize: deserialize_cryptoarsenal_LogEntry,
    responseSerialize: serialize_cryptoarsenal_Empty,
    responseDeserialize: deserialize_cryptoarsenal_Empty,
  },
  cancelOrder: {
    path: '/cryptoarsenal.Strategy/cancelOrder',
    requestStream: false,
    responseStream: false,
    requestType: strategy_pb.CancelOrder,
    responseType: strategy_pb.Empty,
    requestSerialize: serialize_cryptoarsenal_CancelOrder,
    requestDeserialize: deserialize_cryptoarsenal_CancelOrder,
    responseSerialize: serialize_cryptoarsenal_Empty,
    responseDeserialize: deserialize_cryptoarsenal_Empty,
  },
  makeOrders: {
    path: '/cryptoarsenal.Strategy/makeOrders',
    requestStream: false,
    responseStream: false,
    requestType: strategy_pb.Orders,
    responseType: strategy_pb.Empty,
    requestSerialize: serialize_cryptoarsenal_Orders,
    requestDeserialize: deserialize_cryptoarsenal_Orders,
    responseSerialize: serialize_cryptoarsenal_Empty,
    responseDeserialize: deserialize_cryptoarsenal_Empty,
  },
  getTaskData: {
    path: '/cryptoarsenal.Strategy/getTaskData',
    requestStream: false,
    responseStream: false,
    requestType: strategy_pb.Empty,
    responseType: strategy_pb.TaskData,
    requestSerialize: serialize_cryptoarsenal_Empty,
    requestDeserialize: deserialize_cryptoarsenal_Empty,
    responseSerialize: serialize_cryptoarsenal_TaskData,
    responseDeserialize: deserialize_cryptoarsenal_TaskData,
  },
  getUserVar: {
    path: '/cryptoarsenal.Strategy/getUserVar',
    requestStream: false,
    responseStream: false,
    requestType: strategy_pb.UserVar,
    responseType: strategy_pb.UserVar,
    requestSerialize: serialize_cryptoarsenal_UserVar,
    requestDeserialize: deserialize_cryptoarsenal_UserVar,
    responseSerialize: serialize_cryptoarsenal_UserVar,
    responseDeserialize: deserialize_cryptoarsenal_UserVar,
  },
  setUserVar: {
    path: '/cryptoarsenal.Strategy/setUserVar',
    requestStream: false,
    responseStream: false,
    requestType: strategy_pb.UserVar,
    responseType: strategy_pb.Empty,
    requestSerialize: serialize_cryptoarsenal_UserVar,
    requestDeserialize: deserialize_cryptoarsenal_UserVar,
    responseSerialize: serialize_cryptoarsenal_Empty,
    responseDeserialize: deserialize_cryptoarsenal_Empty,
  },
  shutdown: {
    path: '/cryptoarsenal.Strategy/shutdown',
    requestStream: false,
    responseStream: false,
    requestType: strategy_pb.Empty,
    responseType: strategy_pb.Empty,
    requestSerialize: serialize_cryptoarsenal_Empty,
    requestDeserialize: deserialize_cryptoarsenal_Empty,
    responseSerialize: serialize_cryptoarsenal_Empty,
    responseDeserialize: deserialize_cryptoarsenal_Empty,
  },
};

exports.StrategyClient = grpc.makeGenericClientConstructor(StrategyService);

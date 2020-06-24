# Copyright 2015 gRPC authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""The Python implementation of the gRPC route guide client."""

from __future__ import print_function

import signal, json
import random
import marshal, base64
import threading

import time
import grpc

import numpy
import talib
#talib = {}
import sys

import strategy_pb2_grpc
import strategy_pb2

from google.protobuf import struct_pb2


print(len(sys.argv))

ENDPOINT = 'localhost:50051'
STRATEGY_FILE = ''

if (len(sys.argv) == 3):
    ENDPOINT = sys.argv[2]
    STRATEGY_FILE = sys.argv[1]
else:
    print('no args to run')
    exit(-1)
stub = None

def Log(msg):
    print('on Log called', msg)
    entry = strategy_pb2.LogEntry()
    entry.message = msg
    entry.type = 1
    stub.logging(entry)

def LogError(msg):
    print('on LogError', msg)
    entry = strategy_pb2.LogEntry()
    entry.message = msg
    entry.type = 9
    stub.logging(entry)

def CancelOrder(cancelOrder):
    print('on cancelOrder called', cancelOrder)
    entry = strategy_pb2.CancelOrder()
    entry.exchange = cancelOrder['exchange']
    entry.pair = cancelOrder['pair']
    entry.order_id = cancelOrder['orderId']
    stub.cancelOrder(entry)

def CAStorage(*args):
    print('len', len(args))
    entry = strategy_pb2.UserVar()
    entry.name = str(args[0])
    if len(args) == 1: # get user var
        rst = stub.getUserVar(entry)
        print('str value', rst.str_value, len(rst.str_value), type(rst.str_value))
        print('num value', rst.num_value, type(rst.num_value))
        print('var_type', rst.var_type)
        if rst.is_empty:
            return None
        if rst.var_type == 1:
            return rst.str_value
        if rst.var_type == 2:
            return rst.num_value
    elif len(args) == 2: # set user var
        print('setting')
        entry.is_empty = False
        value = args[1]
        print(value, type(value))
        if value is None:
            entry.is_empty = True
            rst = stub.setUserVar(entry)
        elif isinstance(value, str):
            entry.str_value = value
        elif isinstance(value, int) or isinstance(value, float):
            entry.num_value = float(value)
        else:
            return
        print('calling set user var', entry)
        rst = stub.setUserVar(entry)

def informationStruct2Object(struct):
    info = {}
    info['assets'] = {}
    info['candles'] = {}
    info['orders'] = []
    if 'data' in struct.Orders:
        info['orders'] = []
        for index in range(0, len(struct.Orders['data'])):
            info['orders'].append({
                'time': struct.Orders['data'][index]['time'],
                'exchange': struct.Orders['data'][index]['exchange'],
                'pair': struct.Orders['data'][index]['pair'],
                'amount': struct.Orders['data'][index]['amount'],
                'amountFilled': struct.Orders['data'][index]['amountFilled'],
                'price': struct.Orders['data'][index]['price'],
                'type': struct.Orders['data'][index]['type'],
                'orderId': int(struct.Orders['data'][index]['orderId']),
                'status': struct.Orders['data'][index]['status']
            })
    info['orderBooks'] = {}
    for exchange in struct.Orderbooks:
        info['orderBooks'][exchange] = {}
        for pair in struct.Orderbooks[exchange]:
            info['orderBooks'][exchange][pair] = {
                'asks': list(struct.Orderbooks[exchange][pair]['asks']),
                'bids': list(struct.Orderbooks[exchange][pair]['bids']),
            }

    for exchange in struct.Assets:
        info['assets'][exchange] = {}
        for currency in struct.Assets[exchange]:
            info['assets'][exchange][currency] = struct.Assets[exchange][currency]

    for exchange in struct.Candles:
        info['candles'][exchange] = {}
        for pair in struct.Candles[exchange]:
            info['candles'][exchange][pair] = []
            for candle in struct.Candles[exchange][pair]:
                info['candles'][exchange][pair].append({
                    'open': candle['open'],
                    'high': candle['high'],
                    'low': candle['low'],
                    'close': candle['close'],
                    'volume': candle['volume'],
                    'time': candle['time'],
                })
    return info

def is_list_of_dict(v):
    if type(v) != type([]):
        return False
    for c in v:
        if type(c) != type({}):
            return False
    return True

def start_connect_to_server():
    global stub
    with open('caremote.crt', 'rb') as ca:
        cred = ca.read()
    ch_cred = grpc.ssl_channel_credentials(cred)
    # NOTE(gRPC Python Team): .close() is possible on a channel and should be
    # used in circumstances in which the with statement does not fit the needs
    # of the code.
    # with grpc.insecure_channel(ENDPOINT) as channel:
    with grpc.secure_channel(ENDPOINT, ch_cred) as channel:


        stub = strategy_pb2_grpc.StrategyStub(channel)
        task_data = stub.getTaskData(strategy_pb2.Empty())

        options = task_data.options['options']
        is_binary = task_data.is_binary

        # raw_entity_to_run = task_data.code
        with open(STRATEGY_FILE, 'r') as f:
            raw_entity_to_run = str(f.read())

        gt = {}
        try:
            if is_binary:
                raw_entity_to_run = marshal.loads(base64.b64decode(raw_entity_to_run)[12:])
            rtn = exec(raw_entity_to_run, {
                '__builtins__': {
                    '__build_class__': __build_class__,
                    '__name__': __name__,
                    'str': str,
                    'int': int,
                    'list': list,
                    'dict': dict,
                    'range': range,
                    'len': len,
                    'sorted': sorted,
                    'max': max,
                    'min': min,
                    'sum': sum,
                    'float': float,
                },
                'talib': talib,
                'np': numpy,
                'Log': Log,
                'json': json,
                'CAStorage': CAStorage,
                'CancelOrder': CancelOrder,
            }, gt)
            print('rtn', rtn, gt['Strategy'])
            strategy = gt['Strategy']()
        except Exception as e:
            LogError("Unable to run this code: " + str(e))
            print('going to shutdown')
            stub.shutdown(strategy_pb2.Empty())
            exit(0)
            return

        if options is not None:
            for opt in options:
                strategy[opt['name']] = opt['value']

        print('got task data', task_data)

        informationStream = stub.getInformationStream(strategy_pb2.Empty())
        onOrderStateChangeStream = stub.getOnOrderStateChangeStream(strategy_pb2.Empty())

        config = strategy_pb2.StrategyConfig()
        config.period = strategy.period

        for exchange in strategy.subscribedBooks:
            config.subscribedBooks[exchange] = strategy.subscribedBooks[exchange]

        # async call update config
        configStream = stub.updateConfig(config)

        for newConfig in configStream:
            print('got new config', newConfig)
            strategy.subscribedBooks = newConfig.subscribedBooks

        print('config updated')

        lock = threading.Lock()

        threads = []
        information_stream_worker_reference = threading.Thread(target=information_stream_worker, args=(lock, strategy, informationStream))
        order_state_change_stream_worker_reference = threading.Thread(target=order_state_change_stream_worker, args=(lock, strategy, onOrderStateChangeStream))

        information_stream_worker_reference.start()
        order_state_change_stream_worker_reference.start()

        information_stream_worker_reference.join()
        order_state_change_stream_worker_reference.join()

def information_stream_worker(lock, strategy, informationStream):
    global stub
    print('InformationStream worker started!')
    try:
        for information in informationStream:
            print('on get information')
            pureObj = informationStruct2Object(information)

            strategy['assets'] = pureObj['assets']

            try:
                lock.acquire()
                orders = strategy.trade(pureObj)
            except Exception as e:
                orders = []
                print('strategy error [trade]', e)
                LogError(str(e))
            finally:
                lock.release()

            if not is_list_of_dict(orders):
                LogError('strategy return error datatype: ' + str(type(orders)))
                # should make empty order list to get next information
                stub.makeOrders(strategy_pb2.Orders(orders=[]))
                continue

            print('Got orders from strategy. Length: {}'.format(len(orders)))
            lst = []
            for order in orders:
                entry = strategy_pb2.OrderEntry(
                    exchange=order.get('exchange', ''),
                    amount=order.get('amount', 0),
                    price=order.get('price', 0),
                    type=order.get('type', ''),
                    pair=order.get('pair', ''),
                )
                lst.append(entry)
            ordersMessage = strategy_pb2.Orders(orders=lst)

            stub.makeOrders(ordersMessage)
            # assets = information.Assets
            # strategy.assets = assets
            # print(type(assets['Bitfinex']))
            # candles = information.Candles
    except Exception as e:
        print('exception when getting information, exit process', e)
        exit(0)

def order_state_change_stream_worker(lock, strategy, onOrderStateChangeStream):
    global stub
    print('OrderStateChange worker started!')
    try:
        for orderStateChange in onOrderStateChangeStream:
            print('on get onOrderStateChange')

            try:
                lock.acquire()
                strategy.on_order_state_change(orderStateChange)
            except Exception as e:
                print('strategy error [on_order_state_change]', e)
                LogError(str(e))
            finally:
                lock.release()

    except Exception as e:
        print('exception when getting onOrderStateChange, exit process', e)
        exit(0)

def run():
    reconnection_retry = 10
    while reconnection_retry > 0:
        try:
            start_connect_to_server()
        except Exception as e:
            print('failed to start wrapper')
            print(e)
            # local connecto to broker and remote
            if 'Connect Failed' not in str(e) and 'StatusCode.UNIMPLEMENTED' not in str(e) and 'StatusCode.UNAVAILABLE' not in str(e):
                break
            print('trying to reconnect in 3 secs')
        time.sleep(3)
        reconnection_retry -= 1
    print('retry count exceed, exiting...')


def shutdown():
    print('on sigterm')
    exit(0)

if __name__ == '__main__':
    signal.signal(signal.SIGTERM, shutdown)
    run()

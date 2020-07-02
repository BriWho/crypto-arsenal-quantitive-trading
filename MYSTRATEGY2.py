
class Strategy():

    def __setitem__(self, key, value):
        self.options[key] = value

    def __getitem__(self, key):
        return self.options.get(key, '')

    def __init__(self):
        self.subscribedBooks = {
            'Binance': {
                'pairs': ['BTC-USDT'],
            },
        }
        self.period = 60 * 60
        self.options = {}

        # user defined class attribute
        self.last_type = 'sell'
        self.last_cross_status = None
        self.close_price_trace = np.array([])
    
        self.UP = 1
        self.DOWN = 2

    def trade(self, information):

        exchange = list(information['candles'])[0]
        pair = list(information['candles'][exchange])[0]
        close_price = information['candles'][exchange][pair][0]['close']
        USDT_asset = self['assets'][exchange]['USDT']
        BTC_asset =  self['assets'][exchange]['BTC']

        self.close_price_trace = np.append(self.close_price_trace, [float(close_price)])
        self.close_price_trace = self.close_price_trace[-40:]
        dif , dem , osc = talib.MACD(self.close_price_trace ,
            fastperiod = 12 , slowperiod = 26 , signalperiod = 9)


        if np.isnan(osc[-1]):
            return []

        current_cross = self.UP if osc[-1] > 0 else self.DOWN
        amount = 0

        if self.last_cross_status == None:
            self.last_cross_status = current_cross
            return []

        if USDT_asset > close_price and current_cross == self.UP and self.last_cross_status == self.DOWN:
            amount = amount + USDT_asset//close_price
        if BTC_asset > 1.0 and current_cross == self.DOWN and self.last_cross_status == self.UP:
            amount = amount - BTC_asset
        self.last_cross_status = current_cross

        if amount != 0:
            return[
                {
                    'exchange': exchange,
                    'amount': amount,
                    'price': -1,
                    'type': 'MARKET',
                    'pair': pair,
                }
            ]
        return []

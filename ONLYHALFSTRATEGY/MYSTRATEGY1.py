
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
        self.period = 10 * 60
        self.options = {}

        # user defined class attribute
        self.last_type = 'sell'
        self.last_cross_status = None
        self.close_price_trace = np.array([])
        self.ma_long = 50
        self.ma_short = 4
        self.UP = 1
        self.DOWN = 2
        self.N = 20

    def min(self , a , b):
        return a if a < b else b
    def abs(self, a):
        return a if a > 0 else -a

    def trade(self, information):

        exchange = list(information['candles'])[0]
        pair = list(information['candles'][exchange])[0]
        close_price = information['candles'][exchange][pair][0]['close']
        USDT_asset = self['assets'][exchange]['USDT']
        BTC_asset =  self['assets'][exchange]['BTC']

        self.close_price_trace = np.append(self.close_price_trace, [float(close_price)])
        self.close_price_trace = self.close_price_trace[-self.ma_long:]
        l_kama = talib.EMA(self.close_price_trace, self.ma_long)[-1]
        mom = talib.MOM(self.close_price_trace , self.ma_short)[-1]
        current_cross = self.UP if close_price > l_kama else self.DOWN

        if np.isnan(l_kama) or np.isnan(mom):
            return []

        if self.last_cross_status == None:
            self.last_cross_status = current_cross
            return []

        max_amount = int(self.abs(mom//self.N))
        max_USDT_BTC = int(USDT_asset // close_price)
        max_BTC = int(BTC_asset)
        #Log('info: ' + str(information['candles'][exchange][pair][0]['time']) + ', ' + str(information['candles'][exchange][pair][0]['open']) + ', assets' + str(self['assets'][exchange]['BTC']))
        #Log('close price: ' +str(close_price) + 'l_kama: ' + str(l_kama)+ 'mom: ' + str(mom))
        if USDT_asset > close_price:
            if (current_cross == self.DOWN and close_price > l_kama * 0.99 and mom > self.N) or \
                (current_cross == self.UP and self.last_cross_status == self.DOWN and mom > self.N) or \
                (close_price < l_kama * 0.98 and mom > self.N):
                self.last_cross_status = current_cross
                return [
                    {
                        'exchange': exchange,
                        'amount': self.min(max_amount , max_USDT_BTC),
                        'price': -1,
                        'type': 'MARKET',
                        'pair': pair,
                    }
                ]
        elif BTC_asset > 1.0:
            if (current_cross == self.UP and close_price < l_kama * 1.01 and mom < -self.N) or \
               (current_cross == self.DOWN and self.last_cross_status == self.UP and \
                close_price < l_kama and mom < -self.N) or \
               (close_price > l_kama * 1.02 and mom < -self.N):
                self.last_cross_status = current_cross
                return [
                    {
                        'exchange': exchange,
                        'amount': -self.min(max_amount , max_BTC),
                        'price': -1,
                        'type': 'MARKET',
                        'pair': pair,
                    }
                ]
        self.last_cross_status = current_cross
        return []
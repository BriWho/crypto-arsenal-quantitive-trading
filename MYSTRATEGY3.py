
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
        self.period = 4 * 60 * 60
        self.options = {}

        # user defined class attribute
        self.last_type = 'sell'
        self.last_cross_status = None
        self.close_price_trace = np.array([])
        self.last_price = None
        self.UP = 1
        self.DOWN = 2

    def max(self , a , b):
        return a if a > b else b 
    def min(self , a, b):
        return b if b < a else a

    def trade(self, information):

        exchange = list(information['candles'])[0]
        pair = list(information['candles'][exchange])[0]
        close_price = information['candles'][exchange][pair][0]['close']
        USDT_asset = self['assets'][exchange]['USDT']
        BTC_asset =  self['assets'][exchange]['BTC']


        if self.last_price == None:
            self.last_price = close_price
            return []

        amount = (close_price - self.last_price)//10
        amount = self.min(amount , USDT_asset // close_price)
        amount = self.max(amount , -BTC_asset)

        self.last_price = close_price
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
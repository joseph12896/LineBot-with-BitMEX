const binance = require('node-binance-api');
const moment = require('moment');

var Binance = {};
module.exports = {
    find: function (input) {
        return Binance[input] || [];
    }
}
getData();

function getData() {
    try {
        binance.prices(function (ticker) {
            Binance = {};
            Object.keys(ticker).map(symbol => {
                parse(symbol, ticker[symbol])
            });
            // console.log(Binance)
            setTimeout(getData, 60 * 1000);
        });
    } catch (e) {
        console.log(e)
    }
}

function parse(symbol, price) {
    let Regexp = /([A-Z]{3,5})(BTC|ETH|USDT|BNB)/g;
    let tmp = Regexp.exec(symbol);

    if (tmp !== null) {
        if (!Binance[tmp[1]]) Binance[tmp[1]] = []; // init
        Binance[tmp[1]].push({
            price: price,
            price_base: tmp[2],
            timestamp: moment().unix()
        })
    }
}
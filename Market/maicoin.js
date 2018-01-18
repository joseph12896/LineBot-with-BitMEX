const fetch = require('node-fetch');
const moment = require('moment');

/**
 * Maicoin Object
 * 買賣價(TWD),更新時間(unix timestamp)
 */
const maicoin = {
    btc: {
        sell_price_twd: null,
        buy_price_twd: null,
        timestamp: null,
    },
    eth: {
        sell_price_twd: null,
        buy_price_twd: null,
        timestamp: null,
    },
    ltc: {
        sell_price_twd: null,
        buy_price_twd: null,
        timestamp: null,
    },
};
module.exports = maicoin;

/**
 * Initialize
 */
getData();
setInterval(getData, 20 * 1000);

/**
 * getPrices
 * @param {string} coin - 欲查詢的貨幣
 */
async function getPrices(coin) {
    try {
        // 回應格式
        // {
        //     "raw_sell_price": 47796861577,
        //     "raw_buy_price": 57859358751,
        //     "raw_price": 52828110164,
        //     "formatted_sell_price": "NT$477,968.615770",
        //     "formatted_buy_price": "NT$578,593.587510",
        //     "formatted_price": "NT$528,281.101640",
        //     "raw_sell_price_in_twd": 47796861577,
        //     "raw_buy_price_in_twd": 57859358751,
        //     "raw_price_in_twd": 52828110164,
        //     "formatted_sell_price_in_twd": "NT$477,968.615770",
        //     "formatted_buy_price_in_twd": "NT$578,593.587510",
        //     "formatted_price_in_twd": "NT$528,281.101640"
        // }
        let res = await fetch(`https://www.maicoin.com/api/prices/${coin}-twd`);
        res = await res.json();
        return res;
    } catch (e) {
        console.log(e);
        return false;
    }
}

/**
 * getData - Get ETH Price from maicoin
 */
async function getData() {
    {
        try {
            const coins = ['btc', 'eth', 'ltc'];
            for (var i = 0; i < coins.length; i = i + 1) {
                let result = await getPrices(coins[i]);
                if (result) {
                    maicoin[coins[i]] = {
                        sell_price_twd: parseInt(result.raw_sell_price / 100000), // 轉換單位成TWD
                        buy_price_twd: parseInt(result.raw_buy_price / 100000),
                        timestamp: moment().unix(),
                    }
                }
            }
            // console.log(maicoin)
        } catch (e) {
            console.log(e);
        }
    }
}




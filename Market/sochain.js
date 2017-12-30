const fetch = require('node-fetch');
var trading_pair = [],
    currencies = {};

module.exports = {
    "find": function (currency) {
        // output:
        //  [
        // {
        //     "price" : "303.28",
        //     "price_base" : "USD",
        //     "exchange" : "bitstamp",
        //     "time" : 1513869566
        // },...]
        return currencies[currency] || [];
    }
};



/**
 * Init
 */
(async () => {
    await getTradingPair();
    routine();
})();

/**
 * routine - 從sochain依據trading pair抓資料
 */
async function routine() {
    for (let i = 0; i < trading_pair.length; i = i + 1) {
        try {
            let res = await fetch(`https://chain.so/api/v2/get_price/${trading_pair[i]}`);
            res = await res.json();
            if (res["status"] == "success" && res.data.prices.length > 0) {
                currencies[res.data.network] = res.data.prices;
                // console.log('Got data from sochain:', res.data.network, ',', res.data.prices.length);
            }
        } catch (e) {
            console.log(e);
        }
        await delay(10 * 1000);
    }
    // Repeatedly run
    setTimeout(routine, 60 * 1000);
}

/**
 * init - 取得trading pair
 */
async function getTradingPair() {
    try {
        let res,
            list = [];

        // Bitfinex
        // ["btcusd","ltcusd","ltcbtc","ethusd"...]
        res = await fetch('https://api.bitfinex.com/v1/symbols');
        let bitf = await res.json();
        bitf = bitf.map(item => item.slice(0, 3).toUpperCase());
        list = list.concat(bitf);

        // Bitstamp
        res = await fetch('https://www.bitstamp.net/api/v2/trading-pairs-info/');
        let bitstamp = await res.json();
        bitstamp = bitstamp.map(item => item.name.slice(0, 3).toUpperCase());
        list = list.concat(bitstamp);

        // Coinbase,bitpay,bittrex略過
        trading_pair = uniq(list);
        console.log('Got trading pair. Length:', trading_pair.length)
    } catch (e) {
        console.log(e);
    }
};

/**
 * uniq - Remove duplicate element from array
 */
function uniq(a) {
    return a.sort().filter(function (item, pos, ary) {
        return !pos || item != ary[pos - 1];
    })
}

/**
 * delay
 */
function delay(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, ms)
    })
}
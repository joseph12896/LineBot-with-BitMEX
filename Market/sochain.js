const fetch = require('node-fetch');
const moment = require('moment');

/**
 * SoChain Object
 * 買賣價(TWD),更新時間(unix timestamp)
 */
const sochain = {
    ltc: {
        price_usd: null,
        timestamp: null,
    },
};
module.exports = () => sochain;

/**
 * Initialize
 */
getData();
setInterval(getData, 20 * 1000);

/**
 * getData
 */
async function getData() {
    try {
        // {
        //     "status" : "success",
        //     "data" : {
        //       "network" : "LTC",
        //       "prices" : [
        //         {
        //           "price" : "303.28",
        //           "price_base" : "USD",
        //           "exchange" : "bitstamp",
        //           "time" : 1513869566
        //         },...
        //       ]
        //     }
        //   }
        let res = await fetch(`https://chain.so/api/v2/get_price/LTC/USD`);
        res = await res.json();
        if (res["status"] == "success") {
            let sum = 0, timestamp = Number.MAX_SAFE_INTEGER;
            res["data"]["prices"].map((item, idx) => {
                sum = sum + Number(item["price"]); // 取bitfinex/bitstamp/coinbase的平均
                timestamp = Math.min(timestamp, Number(item["time"])); // 取最小的時間
            });
            sochain.ltc = {
                price_usd: parseInt(sum / res["data"]["prices"].length),
                timestamp: timestamp,
            }
        }
        // console.log(sochain);
    } catch (e) {
        console.log(e);
    }
}

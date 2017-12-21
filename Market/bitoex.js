const fetch = require('node-fetch');

/**
 * Bitoex Object
 * 買賣價(TWD),更新時間(unix timestamp)
 */
const bitoex = {
    btc: {
        buy_price_twd: null,
        sell_price_twd: null,
        timestamp: null,
    }
};
module.exports = () => bitoex;

// Init
getData();
setInterval(getData, 20 * 1000);

// Get data from bitoex
async function getData() {
    {
        try {
            let res = await fetch('https://www.bitoex.com/api/v1/get_rate')
            // res = await res.json();
            res = await res.text();
            console.log(res);
            res = JSON.parse(res);
            bitoex.btc = {
                buy_price_twd: res.buy,
                sell_price_twd: res.sell,
                timestamp: res.timestamp,
            }
            // console.log(bitoex)
        } catch (e) {
            console.log(e);
        }
    }
}




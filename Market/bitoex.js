const fetch = require('node-fetch');
const cloudscraper = require('cloudscraper');

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
module.exports = bitoex;

// Init
getData();
setInterval(getData, 20 * 1000);

// Get data from bitoex
async function getData() {
    {
        try {
            // 繞過cloudflare
            cloudscraper.get('https://www.bitoex.com/api/v1/get_rate', function (error, response, body) {
                if (error) {
                    console.log('Error occurred');
                } else {
                    let res = JSON.parse(body);
                    bitoex.btc = {
                        buy_price_twd: res.buy,
                        sell_price_twd: res.sell,
                        timestamp: res.timestamp,
                    }
                }
            });
        } catch (e) {
            console.log(e);
        }
    }
}




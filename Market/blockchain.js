const fetch = require('node-fetch');
const moment = require('moment');

/**
 * blockchain Object
 * 均價(USD),更新時間(unix timestamp)
 */
const blockchain = {
    btc: {
        price_usd: null,
        timestamp: null
    }
}
module.exports = () => blockchain;

/**
 * Initialize
 */
getData();
setInterval(getData, 30 * 1000);

/**
 * getData
 */
async function getData() {
    try {
        let res = await fetch(`https://blockchain.info/ticker`);
        res = await res.json();
        blockchain.btc = {
            price_usd: Number(res["USD"]["15m"]),
            timestamp: moment().unix(),
        }
        // console.log(blockchain);
    } catch (e) {
        console.log(e);
    }
}



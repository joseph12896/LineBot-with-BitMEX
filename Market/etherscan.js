const fetch = require('node-fetch');
const moment = require('moment');

/**
 * etherchain Object
 * price(USD),更新時間(unix timestamp)
 */
const etherscan = {
    eth: {
        price_usd: null,
        timestamp: null
    }
}
module.exports = () => etherscan;

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
        let res = await fetch(`https://api.etherscan.io/api?module=stats&action=ethprice`);
        res = await res.json();
        if (res.message == 'OK') {
            etherscan.eth = {
                price_usd: res.result.ethusd,
                timestamp: res.result.ethusd_timestamp
            }
        }
        // console.log(etherscan);
    } catch (e) {
        console.log(e);
    }
}



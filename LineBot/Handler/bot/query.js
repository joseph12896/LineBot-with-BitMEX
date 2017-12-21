// 使用者查詢價位
const wsc = require('../../../BitMEX/BitMEX_realtime.js'); // 提供BitMEX查價
const coinmarket = require('../../../Market/coinmarket'); // 提供CoinMarket查價
const bitoex = require('../../../Market/bitoex'); // bitoex查價
const maicoin = require('../../../Market/maicoin'); // maicoin查價
const sochain = require('../../../Market/sochain'); // SoChain查價
const blockchain = require('../../../Market/blockchain'); // SoChain查價
const etherscan = require('../../../Market/etherscan'); // SoChain查價

const moment = require('moment');
const Query = require('./Schema').Query; // 紀錄使用查詢指令的人數

const fetch = require('node-fetch');

const wrapper = require('../wrapper.js');
module.exports = new wrapper(/^([A-Za-z0-9]+)$/ig, query);

/**
 * Query
 * 查詢幣價，依序查詢BitMEX/Coinmarket/BitoEX/Maicoin/SoChain
 * @param {Object} event - Line oevent bject
 * @param {String} matchedStr - 比對吻合的訊息
 */
async function query(event, matchedStr) {
    let userinput = matchedStr.toUpperCase();

    /**
     * 使用者輸入是否屬於BitMEX提供的合約之一
     */
    let quote = wsc.quote.get(userinput),
        instrument = wsc.instrument.get(userinput);

    if (quote && quote.bidPrice && instrument) { // 如果quote的price為NULL代表該合約已結算
        // 紀錄查詢紀錄
        await new Query({
            userID: event.source.userId || null,
            groupID: event.source.groupId || null,
            message: event.message.text,
            timestamp: Number(moment().valueOf()),
        }).save();

        // 產生回應訊息
        let replyMsg = `[ ${userinput} ]\n`;

        // Quote
        // 將ask,bidPrice取平均後維持原始格式小數點後的位數，對於ask,bitPrice差距較大的幣種(ex.zecz17)作用距大
        let p1 = (tmp = /^\d+\.(\d+)$/ig.exec(quote.bidPrice)) ? tmp[1] : ''; // 取小數點後的數字
        let p2 = (tmp = /^\d+\.(\d+)$/ig.exec(quote.askPrice)) ? tmp[1] : '';
        let p = Math.max(p1.length, p2.length); // 小數點後o位
        replyMsg = replyMsg + '[ Avg Price ] ' + Number((quote.bidPrice + quote.askPrice) / 2).toFixed(p) + '\n';
        replyMsg = replyMsg + '[ Ask Price ] ' + quote.askPrice + '\n';
        replyMsg = replyMsg + '[ Bid Price ] ' + quote.bidPrice;

        // Instrument
        replyMsg = `${replyMsg}\n`;

        replyMsg = `${replyMsg}[ 標記價格 ] ${instrument.markPrice}\n`;
        replyMsg = `${replyMsg}[ 指數價格 ] ${instrument.indicativeSettlePrice}\n`;
        if (instrument.fundingRate && instrument.indicativeFundingRate) {
            replyMsg = `${replyMsg}[ 資金費率 ] ${Number(100 * instrument.fundingRate).toFixed(4)} %\n`;
            replyMsg = `${replyMsg}[ 預測費率 ] ${Number(100 * instrument.indicativeFundingRate).toFixed(4)} %\n`;
        }
        replyMsg = `${replyMsg}[ 最後更新 ] ${moment().diff(moment().parseZone(instrument.timestamp), 'seconds')} 秒前`;

        event.reply(replyMsg);
        return;
    }

    /**
    * 非BitMEX合約之一，查詢CoinMarket (x-usd/twd/btc)
    */

    // 查詢coinmarket
    let matched = coinmarket().find((ele) => {
        let name = (ele.name).toUpperCase(),
            symbol = (ele.symbol).toUpperCase();
        return (name == userinput) || (symbol == userinput);
    });

    if (typeof matched != 'undefined') {
        // 紀錄查詢紀錄
        await new Query({
            userID: event.source.userId || null,
            groupID: event.source.groupId || null,
            message: event.message.text,
            timestamp: Number(moment().valueOf()),
        }).save();

        // 查詢ETH價格(USD)
        let eth_price_usd = coinmarket().find((ele) => {
            return ele.name == "Ethereum";
        }).price_usd;

        // 產生回應訊息
        let replyMsg = `[ ${matched.name} ] ${matched.percent_change_24h > 0 ? '+' : ''}${matched.percent_change_24h} %\n` +
            `[ Supply ] ${formatNum(matched.total_supply)} ${matched.symbol}\n` +
            `[ Mkt Cap ] ${formatNum(matched.market_cap_usd)} USD\n` +
            `[ 24H Vol ] ${formatNum(matched["24h_volume_usd"])} USD\n` +
            `[ USD ] ${matched.price_usd}\n` +
            `[ TWD ] ${matched.price_twd}\n` +
            `[ ETH ] ${Number(matched.price_usd / eth_price_usd).toFixed(9)}\n` + // 兌換成ETH
            `[ BTC ] ${matched.price_btc}\n` +
            `[ Updated ] ${moment().diff(moment.unix(matched.last_updated), 'minutes')} mins ago`;

        /**
        * p_diff - 和coinmarket價格比較，回傳差異百分比字串
        */
        function p_diff(price, base) {
            let result = 100 * (price - base) / base;
            let str = `${(result >= 0 ? '+' : '-') + (Math.abs(result) > 10 ? '' : ' ') + Number(Math.abs(result)).toFixed(1)} %`; // 回傳百分比
            return str;
        }

        // 針對BTC/LTC/ETH特別查詢台灣交易所報價
        if (userinput == 'BTC' || userinput == 'BITCOIN') {
            replyMsg = replyMsg +
                `\n\n` +
                `< BitoEX >\n` +
                `[ Buy ] ${formatNum(bitoex().btc.buy_price_twd)} TWD  ${p_diff(bitoex().btc.buy_price_twd, matched.price_twd)}\n` +
                `[ Sell ] ${formatNum(bitoex().btc.sell_price_twd)} TWD  ${p_diff(bitoex().btc.sell_price_twd, matched.price_twd)}\n` +
                `[ Updated ] ${moment().diff(moment.unix(bitoex().btc.timestamp), 'minutes')} mins ago\n` +
                `\n` +
                `< MaiCoin >\n` +
                `[ Buy ] ${formatNum(maicoin().btc.buy_price_twd)} TWD  ${p_diff(maicoin().btc.buy_price_twd, matched.price_twd)}\n` +
                `[ Sell ] ${formatNum(maicoin().btc.sell_price_twd)} TWD  ${p_diff(maicoin().btc.sell_price_twd, matched.price_twd)}\n` +
                `[ Updated ] ${moment().diff(moment.unix(maicoin().btc.timestamp), 'minutes')} mins ago`;
        } else if (userinput == 'ETH' || userinput == 'ETHEREUM') {
            replyMsg = replyMsg +
                `\n\n` +
                `< MaiCoin >\n` +
                `[ Buy ] ${formatNum(maicoin().eth.buy_price_twd)} TWD  ${p_diff(maicoin().eth.buy_price_twd, matched.price_twd)}\n` +
                `[ Sell ] ${formatNum(maicoin().eth.sell_price_twd)} TWD  ${p_diff(maicoin().eth.sell_price_twd, matched.price_twd)}\n` +
                `[ Updated ] ${moment().diff(moment.unix(maicoin().eth.timestamp), 'minutes')} mins ago`;
        } else if (userinput == 'LTC' || userinput == 'LITECOIN') {
            replyMsg = replyMsg +
                `\n\n` +
                `< MaiCoin >\n` +
                `[ Buy ] ${formatNum(maicoin().ltc.buy_price_twd)} TWD  ${p_diff(maicoin().ltc.buy_price_twd, matched.price_twd)}\n` +
                `[ Sell ] ${formatNum(maicoin().ltc.sell_price_twd)} TWD  ${p_diff(maicoin().ltc.sell_price_twd, matched.price_twd)}\n` +
                `[ Updated ] ${moment().diff(moment.unix(maicoin().ltc.timestamp), 'minutes')} mins ago`;
        }

        // 回傳結果    
        event.reply(replyMsg);
        return;
    }
}


// 格式化顯示金額
function formatNum(num) {
    return Number(num).toFixed(0).replace(/./g, function (c, i, a) {
        return i && c !== "." && ((a.length - i) % 3 === 0) ? ',' + c : c;
    });
};
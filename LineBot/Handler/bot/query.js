// 使用者查詢價位
const wsc = require('../../../BitMEX/BitMEX_realtime.js'); // 提供BitMEX查價
const coinmarket = require('../../../Market/coinmarket'); // 提供CoinMarket查價
const moment = require('moment');
const Query = require('./Schema').Query; // 紀錄使用查詢指令的人數

const fetch = require('node-fetch');

const wrapper = require('../wrapper.js');
module.exports = new wrapper(/^([A-Za-z0-9]+)$/ig, query);

async function query(event, matchedStr) {
    let userinput = matchedStr.toUpperCase();

    /**
     * 使用者輸入是否屬於BitMEX提供的合約之一
     */
    let quote = wsc.quote.get(userinput),
        instrument = wsc.instrument.get(userinput);

    if (quote && quote.bidPrice && instrument) { // 如果quote的price為NULL代表該合約已結算
        // 紀錄
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
    * 非BitMEX合約之一，查詢: CoinMarket (x-usd/twd/btc)
    */

    // coinmarket
    let matched = coinmarket().find((ele) => {
        let name = (ele.name).toUpperCase(),
            symbol = (ele.symbol).toUpperCase();
        return (name == userinput) || (symbol == userinput);
    });

    if (typeof matched != 'undefined') {
        // 紀錄
        await new Query({
            userID: event.source.userId || null,
            groupID: event.source.groupId || null,
            message: event.message.text,
            timestamp: Number(moment().valueOf()),
        }).save();

        // 產生回應訊息
        let replyMsg = `[ ${matched.name} ]\n` +
            `[ USD ] ${matched.price_usd}\n` +
            `[ TWD ] ${matched.price_twd}\n` +
            `[ BTC ] ${matched.price_btc}`;

        // KYC多一項對ETH匯率
        if (matched.symbol == 'KNC') {
            try {
                let res = await fetch('https://api.coinmarketcap.com/v1/ticker/kyber-network/?convert=ETH');
                res = await res.json();
                replyMsg = replyMsg + `\n[ ETH ] ${res[0].price_eth}`
            } catch (e) {
                console.log(e)
            }
        }

        event.reply(replyMsg);
        return;
    }
}
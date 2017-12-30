// BitMEX
const BitMEX_Quote = require('../../../Websocket/BitMEX_Realtime/Quote'),
    BitMEX_Instrument = require('../../../Websocket/BitMEX_Realtime/Instrument');

// Others *********************************
const coinmarket = require('../../../Market/coinmarket'); // 提供CoinMarket查價
const bitoex = require('../../../Market/bitoex'); // bitoex查價
const maicoin = require('../../../Market/maicoin'); // maicoin查價
const sochain = require('../../../Market/sochain'); // SoChain查價
const binance = require('../../../Market/binance'); // binance查價

const Query = require(SCHEMA_PATH).Query; // 紀錄使用查詢指令的人數
const moment = require('moment');
const emoji = require('node-emoji')
const fetch = require('node-fetch');

const wrapper = require('../wrapper.js');
module.exports = new wrapper(/^([A-Za-z0-9]+)$/ig, query);

/**
 * Query
 * 查詢幣價，依序查詢BitMEX/Coinmarket/BitoEX/Maicoin/SoChain...
 * @param {Object} event - Line oevent bject
 * @param {String} matchedStr - 比對吻合的訊息
 */
async function query(event, matchedStr) {
    let replyMsg = '',
        userinput = matchedStr.toUpperCase();

    /**
     * BitMEX Contract
     */
    let quote = BitMEX_Quote.get(userinput),
        instrument = BitMEX_Instrument.get(userinput);
    if (quote && quote.bidPrice && instrument) { // 如果quote的price為NULL代表該合約已結算

        // 產生回應訊息
        replyMsg = `- Online Casino - ${genLight(moment(quote.timestamp).unix())}\n` +
            `[ ${quote.symbol} ]\n`;

        // Quote
        // 將ask,bidPrice取平均後維持原始格式小數點後的位數，對於ask,bitPrice差距較大的幣種(ex.zecz17)作用距大
        let p1 = (tmp = /^\d+\.(\d+)$/ig.exec(quote.bidPrice)) ? tmp[1] : ''; // 取小數點後的數字
        let p2 = (tmp = /^\d+\.(\d+)$/ig.exec(quote.askPrice)) ? tmp[1] : '';
        let p = Math.max(p1.length, p2.length); // 小數點後o位
        replyMsg = replyMsg + '[ Avg Price ] ' + Number((quote.bidPrice + quote.askPrice) / 2).toFixed(p) + '\n';
        replyMsg = replyMsg + '[ Ask Price ] ' + quote.askPrice + '\n';
        replyMsg = replyMsg + '[ Bid Price ] ' + quote.bidPrice + '\n';

        // Instrument
        replyMsg = `${replyMsg}[ 標記價格 ] ${instrument.markPrice}\n`;
        replyMsg = `${replyMsg}[ 指數價格 ] ${instrument.indicativeSettlePrice}\n`;
        if (instrument.fundingRate && instrument.indicativeFundingRate) {
            replyMsg = `${replyMsg}[ 資金費率 ] ${Number(100 * instrument.fundingRate).toFixed(4)} %\n`;
            replyMsg = `${replyMsg}[ 預測費率 ] ${Number(100 * instrument.indicativeFundingRate).toFixed(4)} %\n`;
        }
    }

    /**
     * CoinMarket
     */
    let coinmkt_item = coinmarket().find((ele) => {
        let name = (ele.name).toUpperCase(),
            symbol = (ele.symbol).toUpperCase();
        return (name == userinput) || (symbol == userinput);
    });

    if (typeof coinmkt_item != 'undefined') {
        // 查詢ETH價格(USD)
        let eth_price_usd = coinmarket().find((ele) => {
            return ele.name == "Ethereum";
        }).price_usd;

        // 產生回應訊息
        replyMsg =
            `- CoinMarket - ${genLight(coinmkt_item.last_updated)}\n` +
            `[ ${coinmkt_item.name} ] ${coinmkt_item.percent_change_24h > 0 ? '+' : ''}${coinmkt_item.percent_change_24h} %\n` +
            `[ Supply ] ${formatNum(coinmkt_item.total_supply)} ${coinmkt_item.symbol}\n` +
            `[ Mkt Cap ] ${formatNum(coinmkt_item.market_cap_usd)} USD\n` +
            `[ 24H Vol ] ${formatNum(coinmkt_item["24h_volume_usd"])} USD\n` +
            `[ USD ] ${coinmkt_item.price_usd}\n` +
            `[ TWD ] ${coinmkt_item.price_twd}\n` +
            `[ ETH ] ${Number(coinmkt_item.price_usd / eth_price_usd).toFixed(9)}\n` + // 兌換成ETH
            `[ BTC ] ${coinmkt_item.price_btc}\n`;
    }

    /**
     * Maicoin & BitoEX
     */
    if (userinput == 'BTC' || userinput == 'BITCOIN') {
        replyMsg = replyMsg +
            `\n` +
            // price和coinmarket的price做比較
            `- BitoEX - ${genLight(bitoex.btc.timestamp)}\n` +
            `[ Buy ] ${formatNum(bitoex.btc.buy_price_twd)} TWD  ${p_diff(bitoex.btc.buy_price_twd, coinmkt_item.price_twd)}\n` +
            `[ Sell ] ${formatNum(bitoex.btc.sell_price_twd)} TWD  ${p_diff(bitoex.btc.sell_price_twd, coinmkt_item.price_twd)}\n` +
            `\n` +
            `- MaiCoin - ${genLight(maicoin.btc.timestamp)}\n` +
            `[ Buy ] ${formatNum(maicoin.btc.buy_price_twd)} TWD  ${p_diff(maicoin.btc.buy_price_twd, coinmkt_item.price_twd)}\n` +
            `[ Sell ] ${formatNum(maicoin.btc.sell_price_twd)} TWD  ${p_diff(maicoin.btc.sell_price_twd, coinmkt_item.price_twd)}\n`;
    } else if (userinput == 'ETH' || userinput == 'ETHEREUM') {
        replyMsg = replyMsg +
            `\n` +
            `- MaiCoin - ${genLight(maicoin.eth.timestamp)}\n` +
            `[ Buy ] ${formatNum(maicoin.eth.buy_price_twd)} TWD  ${p_diff(maicoin.eth.buy_price_twd, coinmkt_item.price_twd)}\n` +
            `[ Sell ] ${formatNum(maicoin.eth.sell_price_twd)} TWD  ${p_diff(maicoin.eth.sell_price_twd, coinmkt_item.price_twd)}\n`;
    } else if (userinput == 'LTC' || userinput == 'LITECOIN') {
        replyMsg = replyMsg +
            `\n` +
            `- MaiCoin - ${genLight(maicoin.ltc.timestamp)}\n` +
            `[ Buy ] ${formatNum(maicoin.ltc.buy_price_twd)} TWD  ${p_diff(maicoin.ltc.buy_price_twd, coinmkt_item.price_twd)}\n` +
            `[ Sell ] ${formatNum(maicoin.ltc.sell_price_twd)} TWD  ${p_diff(maicoin.ltc.sell_price_twd, coinmkt_item.price_twd)}\n`;
    }

    /**
     * search - 尋找source內相對應的coin和exchange資料，回傳字串
     * @param {String} header - 回應訊息要顯示的
     * @param {String} exchange - 指定交易所
     */
    function search(source, header, exchange) {
        // 以userinput或是coinmkt_item.symbol找source內符合的幣種
        let data = source.find(userinput) || source.find(coinmkt_item.symbol);
        data = data.filter(item => (exchange ? (item.exchange == exchange) : true));

        if (data.length > 0) {
            // 隨便一筆資料的timestamp都可，因為資料皆一起取得
            return `\n- ${header} - ${genLight(data[0].time || data[0].timestamp)}\n` +
                data.map(item => `[ ${item.price_base} ] ${item.price}`).join('\n') +
                `\n`;
        }
        return '';
    }

    /**
     * binance
     */
    replyMsg = replyMsg +
        search(binance, 'Binance');

    /**
     * Sochain(bitstamp/bitifinex/coinbase/bittrex)
     */
    replyMsg = replyMsg +
        search(sochain, 'Bitfinex', 'bitfinex') +
        search(sochain, 'Bitstamp', 'bitstamp') +
        search(sochain, 'Bittrex', 'bittrex') +
        search(sochain, 'Coinbase', 'coinbase');

    /**
     * reply
     */
    if (replyMsg) {
        // 去除最後一個字元(通常是\n)
        event.reply(replyMsg.slice(0, replyMsg.length - 1));

        // 紀錄查詢
        await new Query({
            userID: event.source.userId || null,
            groupID: event.source.groupId || null,
            message: event.message.text,
            timestamp: Number(moment().valueOf()),
        }).save();
    }
}

/**
 * formatNum - 格式化顯示金額
 */
function formatNum(num) {
    return Number(num).toFixed(0).replace(/./g, function (c, i, a) {
        return i && c !== "." && ((a.length - i) % 3 === 0) ? ',' + c : c;
    });
};

/**  
 * genLight - 依據timestamp產生對應燈號，讓使用者知道所查詢的資料多舊
 */
function genLight(timestamp) { // unix timestamp
    let diff = moment().diff(moment.unix(timestamp), 'minutes');
    if (diff < 5) { // <= 5minutes
        return emoji.emojify(':small_blue_diamond:');
    } else if (diff < 30) {
        return emoji.emojify(':small_orange_diamond:');
    } else {
        return emoji.emojify(':exclamation:');
    }
}

/**
* p_diff - 和base比較，回傳差異百分比(+-xx%)字串
*/
function p_diff(price, base) {
    let result = 100 * (price - base) / base;
    let str = `${(result >= 0 ? '+' : '-') + (Math.abs(result) > 10 ? '' : ' ') + Number(Math.abs(result)).toFixed(1)} %`; // 回傳百分比
    return str;
}
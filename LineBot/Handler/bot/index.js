// 過濾非bot開頭的使用者輸入
const wrapper = require('../wrapper.js');
const help = require('./help.js');
const info = require('./info.js');
const watch = require('./watch/');
const group = require('./group/');
// 查價
const query = require('./query.js'); // coinmarket & bitmex
const bitt = require('./bitt/'); // bittrex
const polo = require('./polo/'); // poloniex
const bitf = require('./bitf/'); // bitfinex
// 排名(指令使用次數、爆倉)
const rank = require('./rank/');

module.exports = new wrapper(/^bot\s(.+)$/ig, bot);

function bot(event, matchedStr) {
    group.test(event, matchedStr) ||
        watch.test(event, matchedStr) ||
        help.test(event, matchedStr) ||
        info.test(event, matchedStr) ||
        bitt.test(event, matchedStr) ||
        polo.test(event, matchedStr) ||
        bitf.test(event, matchedStr) ||
        rank.test(event, matchedStr) ||
        query.test(event, matchedStr); // query接收所有字元，務必放在最尾端
}

// 過濾非bot開頭的使用者輸入
const wrapper = require('../wrapper.js');
const help = require('./help.js');
const info = require('./info.js');
const group = require('./group/');
const query = require('./query.js');
const rank = require('./rank/');

module.exports = new wrapper(/^bot\s(.+)$/ig, bot);

function bot(event, matchedStr) {
    group.test(event, matchedStr) ||
        help.test(event, matchedStr) ||
        info.test(event, matchedStr) ||
        rank.test(event, matchedStr) ||
        query.test(event, matchedStr); // query接收所有字元，務必放在最尾端
}

// 查詢價格數統計
const wrapper = require('../../wrapper.js');
const Query = require('../Schema').Query;
const moment = require('moment');
module.exports = new wrapper(/^rank$/ig, rank);

async function rank(event, matchedStr) {
    let t_start = moment(), t_end, replyMsg = '';
    //event.reply('查詢中...');

    // 尋找紀錄
    let records = await Query.find().exec(); // large data

    if (records.length > 0) {
        let category = {};
        records.map((record) => {
            // 去除作者自己查詢的次數
            if (record.userID == 'Ud14d4a2d758acb05cc86df1a4f1279c7') return;

            // 統計各貨幣被查詢的次數
            let msg = record.message.toUpperCase();
            msg = msg.substr(4); // remove 'bot\s'
            if (typeof category[msg] == 'undefined') {
                category[msg] = 0;
            } else {
                category[msg] = category[msg] + 1;;
            };
        });

        // 取出從記錄開始前15最常被查詢的
        let most = Object.keys(category).map((symbol) => {
            return ({ symbol: symbol, num: category[symbol] });
        }).sort(function (a, b) {
            return b.num - a.num;
        }).slice(0, 15);
        // 附加至回傳文字
        replyMsg = replyMsg + '[ 查詢次數 ]\n'
        most.map((item, idx) => {
            replyMsg = replyMsg + `${(idx + 1 < 10 ? ' ' : '') + (idx + 1)}. ${item.num} 次 - ${item.symbol}\n`
        });
    }

    // reply
    t_end = moment();
    replyMsg = replyMsg + `\n耗時 ${t_end.diff(t_start, 's')} 秒`;

    event.reply(replyMsg);
    return;
}

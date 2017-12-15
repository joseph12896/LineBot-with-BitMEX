// 查詢價格數統計
const wrapper = require('../../wrapper.js');
const Query = require('../Schema').Query;
const moment = require('moment');
const mongoose = require('mongoose');
module.exports = new wrapper(/^rank$/ig, rank);

async function rank(event, matchedStr) {
    let t_start = moment(), t_end, replyMsg = '';
    //event.reply('查詢中...');

    // 尋找紀錄
    let records = await Query.find().exec(); // large data

    if (records.length > 0) {
        /**
         * 取出從記錄開始前15最常被查詢的
         */
        let category = {};
        records.map((record) => {
            // 去除作者自己查詢的次數
            if (record.userID == 'Ud14d4a2d758acb05cc86df1a4f1279c7') return;
            // 統計各貨幣被查詢的次數
            let msg = record.message.toUpperCase();
            msg = msg.substr(4); // remove 'bot\s'
            if (typeof category[msg] == 'undefined') {
                category[msg] = 1;
            } else {
                category[msg] = category[msg] + 1;;
            };
        });

        // 附加至回傳文字
        let most = Object.keys(category).map((symbol) => {
            return ({ symbol: symbol, num: category[symbol] });
        }).sort(function (a, b) {
            return b.num - a.num;
        }).slice(0, 15);
        replyMsg = replyMsg + '[ 查詢次數 ]\n'
        most.map((item, idx) => {
            replyMsg = replyMsg + `${(idx + 1 < 10 ? ' ' : '') + (idx + 1)}. ${item.num} 次 - ${item.symbol}\n`
        });

        /**
         * 取出24h(+8時區)前6最常被查詢的，方便做快捷鍵
         */
        let category_24h = {},
            begin = moment().zone('+0800').startOf('day').valueOf();
        records.map((record) => {
            // 去除作者自己查詢的次數
            if (record.userID == 'Ud14d4a2d758acb05cc86df1a4f1279c7') return;
            // 只取24hr內
            if (
                moment(new mongoose.Types.ObjectId(record._id).getTimestamp()).valueOf()
                < begin) return;
            // 統計各貨幣被查詢的次數
            let msg = record.message.toUpperCase();
            msg = msg.substr(4); // remove 'bot\s'
            if (typeof category_24h[msg] == 'undefined') {
                category_24h[msg] = 1;
            } else {
                category_24h[msg] = category_24h[msg] + 1;;
            };
        });
        // 附加至回傳文字
        let most_24h = Object.keys(category_24h).map((symbol) => {
            return ({ symbol: symbol, num: category_24h[symbol] });
        }).sort(function (a, b) {
            return b.num - a.num;
        }).slice(0, 6);
        replyMsg = replyMsg + '\n[ 本日查詢次數 ]\n'
        most_24h.map((item, idx) => {
            replyMsg = replyMsg + `${(idx + 1 < 10 ? ' ' : '') + (idx + 1)}. ${item.num} 次 - ${item.symbol}\n`
        });
    }

    // reply
    t_end = moment();
    replyMsg = replyMsg + `\n耗時 ${t_end.diff(t_start, 's')} 秒`;

    event.reply(replyMsg);
    return;
}

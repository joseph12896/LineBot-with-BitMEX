// 爆倉通知(對group)，限定XBT合約
const moment = require('moment');
const emoji = require('node-emoji');

const { Group, Rekt, Setting } = require(SCHEMA_PATH);

module.exports = main;

var lastTime = moment();

/**
 * main - 產生rekt訊息&發送訊息
 */
async function main() {

    try {
        // 取得group
        let groupList = await Group
            .find({ rekt: true })
            .exec();

        // 取得最新的爆倉資訊，從上次main()執行的時間點開始/倉位
        let rektList = await Rekt.
            find({ symbol: /^XBT.*/ }).
            where('timestamp').gt(lastTime.valueOf()).
            sort('timestamp').
            exec();
        if (rektList.length == 0) return;

        lastTime = moment();

        // 對每個group依據Threshold產生訊息
        groupList.map((group) => {
            let newList = rektList.map((item) => {
                if (item.leavesQty >= group.rektThreshold) {
                    return item;
                }
            });
            bot.push(group.groupLineId, genLiqText(newList));
        })
    } catch (e) {
        console.log(e);
    }
}

/**
 * genLiqText - 產生爆倉訊息
 */
function genLiqText(rektList) {
    let replyText = '';
    rektList.map((item, idx) => {
        let Qty = formatNum(item.leavesQty);
        if (item.side == 'Buy') {
            replyText = replyText + `${item.symbol} 空倉被爆: 買入 ${Qty} @ ${item.price}`;
        } else if (item.side == 'Sell') {
            replyText = replyText + `${item.symbol} 多倉被爆: 賣出 ${Qty} @ ${item.price}`;
        };
        // generate new line character
        if (rektList.length - 1 != idx) replyText = replyText + '\n';
    });
    return replyText;
}

/**
 * formatNum - 格式化顯示金額
 */
function formatNum(num) {
    return Number(num).toFixed(0).replace(/./g, function (c, i, a) {
        return i && c !== "." && ((a.length - i) % 4 === 0) ? ',' + c : c;
    });
};

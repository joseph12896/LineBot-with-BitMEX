// 提醒在groupPool內的group爆倉通知，限定XBTUSD,XBTZ17
const moment = require('moment');
const Rekt = require('./Schema').Rekt;
const emoji = require('node-emoji');

/**
 * 過去24小時Liquidation總和和最大值
 */
async function in24hour() {
    // UTC, 24 hours ago
    let t = moment().subtract(24, 'hours').valueOf();
    // XBTUSD/XBTZ17 - Buy/Sell
    let xbtusd = await Promise.all([
        Rekt.find({ symbol: 'XBTUSD', side: 'Buy' }).
            where('timestamp').
            gt(t).exec(),

        Rekt.find({ symbol: 'XBTUSD', side: 'Sell' }).
            where('timestamp').
            gt(t).exec(),
    ]);
    let xbtz17 = await Promise.all([
        Rekt.find({ symbol: 'XBTZ17', side: 'Buy' }).
            where('timestamp').
            gt(t).exec(),
        Rekt.find({ symbol: 'XBTZ17', side: 'Sell' }).
            where('timestamp').
            gt(t).exec(),
    ]);

    xbtusd = {
        buy: {
            max: xbtusd[0].reduce((previous, current) => {
                return Math.max(previous, current.leavesQty)
            }, 0),
            total: xbtusd[0].reduce((previous, current) => {
                return previous + current.leavesQty
            }, 0)
        },
        sell: {
            max: xbtusd[1].reduce((previous, current) => {
                return Math.max(previous, current.leavesQty)
            }, 0),
            total: xbtusd[1].reduce((previous, current) => {
                return previous + current.leavesQty
            }, 0)
        }
    };

    xbtz17 = {
        buy: {
            max: xbtz17[0].reduce((previous, current) => {
                return Math.max(previous, current.leavesQty)
            }, 0),
            total: xbtz17[0].reduce((previous, current) => {
                return previous + current.leavesQty
            }, 0)
        },
        sell: {
            max: xbtz17[1].reduce((previous, current) => {
                return Math.max(previous, current.leavesQty)
            }, 0),
            total: xbtz17[1].reduce((previous, current) => {
                return previous + current.leavesQty
            }, 0)
        }
    };

    return { xbtusd, xbtz17 };
}

/**
 * 定期通知Liquidation
 */
var lastTime = moment(),
    count = 0,
    minQty = 30 * 10000; // 只報倉位>多少的倉
async function showLiquidationMsg() {

    // 格式化顯示金額
    function formatNum(num) {
        return Number(num).toFixed(0).replace(/./g, function (c, i, a) {
            return i && c !== "." && ((a.length - i) % 4 === 0) ? ',' + c : c;
        });
    };

    // 從上次統計的時間點開始/倉位>30萬
    let query = Rekt.find({ symbol: /XBTUSD|XBTZ17/ }).
        where('timestamp').gt(lastTime.valueOf()).
        where('leavesQty').gt(minQty).
        sort('timestamp');
    lastTime = moment();

    let data = await query.exec();
    if (data.length == 0) return;

    // 格式化資料
    let replyMsg = '';
    data.map((ele, idx) => {
        let Qty = formatNum(ele.leavesQty);

        if (ele.side == 'Buy') {
            replyMsg = replyMsg + `${ele.symbol} 空倉被爆: 買入 ${Qty} @ ${ele.price}`;
        } else if (ele.side == 'Sell') {
            replyMsg = replyMsg + `${ele.symbol} 多倉被爆: 賣出 ${Qty} @ ${ele.price}`;
        };

        if (data.length - 1 != idx) replyMsg = replyMsg + '\n';
    });

    // 每5次額外顯示過去24hr紀錄
    if (count >= 5) {
        count = 0;

        let last24 = await in24hour();
        replyMsg = replyMsg +
            `\n\n${emoji.get('star')} Liquidation in 24HR ${emoji.get('star')}\n\n` +
            `[ XBTUSD ]\n` +
            `[ Long   ] ${formatNum(last24.xbtusd.sell.total)} USD\n` +
            `[ Max    ] ${formatNum(last24.xbtusd.sell.max)} USD\n` +
            `[ Short  ] ${formatNum(last24.xbtusd.buy.total)} USD\n` +
            `[ Max    ] ${formatNum(last24.xbtusd.buy.max)} USD\n` +
            '\n' +
            `[ XBTZ17 ]\n` +
            `[ Long   ] ${formatNum(last24.xbtz17.sell.total)} USD\n` +
            `[ Max    ] ${formatNum(last24.xbtz17.sell.max)} USD\n` +
            `[ Short  ] ${formatNum(last24.xbtz17.buy.total)} USD\n` +
            `[ Max    ] ${formatNum(last24.xbtz17.buy.max)} USD`;
    }

    // 發送訊息
    sendNotice(replyMsg);
    count = count + 1;
}

// 
setInterval(async () => {
    await showLiquidationMsg();
}, 5000);

// 發送訊息給有開啟爆倉提醒的group
function sendNotice(text) {
    global.groupPool.map((group) => {
        let groupLineId = group.groupLineId,
            rekt = group.rekt;
        if (rekt) {
            bot.push(groupLineId, text);
        }
    })
}
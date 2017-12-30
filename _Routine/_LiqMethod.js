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

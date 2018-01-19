const wrapper = require('../wrapper.js');
module.exports = new wrapper(/^bot 志(\s.+)?$/iug, EventMsgToImgLink);

const webshot = require('./webshot'),
    uploadToImgur = require('./uploadToImgur'),
    fs = require('fs'),
    moment = require('moment'),
    ccxt = require('ccxt'),
    cheerio = require('cheerio'),
    path = require('path');

const apiKey = process.env.apiKey,
    secret = process.env.secret;

const template_path = path.resolve(__dirname);

async function EventMsgToImgLink(event, matchedStr = ' ') {
    console.log(matchedStr);
    matchedStr = matchedStr.substr(1); // 消去跟在後面的空格
    try {
        // 取得對應資料，產生html
        let html, windowSize = {
            width: 1024,
            height: 768
        };
        if (matchedStr == 'exec') {
            // show execution
            windowSize.height = 768; // 限制截圖高度
            html = await execHtml();
        } else if (matchedStr == 'ord') {
            // show order
            windowSize.height = 400; // 限制截圖高度
            html = await ordHtml();
        } else if (matchedStr == '') {
            // show position
            windowSize.height = 150; // 限制截圖高度
            html = await posHtml();
        } else {
            return;
        };

        // 檢驗資料長度
        if (!html || html.length == 0) {
            event.reply('No data.');
            return;
        }
        console.log(`已產生html ${html.length} bytes`);
        // return fs.writeFileSync('ttt.html', html);
        // 產生截圖
        let ImgBuffer = await webshot(html, windowSize);
        console.log(`已產生截圖 ${ImgBuffer.length} bytes`);
        // 上傳至imgur取得link
        let wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        let ImgObject = await Promise.race([
            uploadToImgur(ImgBuffer),
            wait(20 * 1000),// 處理過久則捨棄
        ]);
        // Reply       
        if (ImgObject) {
            let ImgLink = ImgObject.link;
            console.log(`已產生Imgur link - ${ImgLink}`);
            event.reply({
                type: 'image',
                originalContentUrl: ImgLink,
                previewImageUrl: ImgLink
            });
        }
    } catch (e) {
        console.log(e)
    }
};


/**
 * 產生execution的html
 */
async function execHtml() {
    let bitmex = new ccxt.bitmex({
        apiKey: apiKey,
        secret: secret,
    });

    // 成交歷史
    let execHistory = await bitmex.privateGetExecutionTradeHistory({
        reverse: true,
        count: 40
    });

    // 載入預設範本
    let $ = cheerio.load(fs.readFileSync(path.resolve(template_path, './execTemplate.html')));

    // 插入資料
    if (execHistory.length == 0) return '';
    execHistory.map(item => {
        let transactTime = moment(item.transactTime).
            format('YYYY年MM月DD日 A hh:mm:ss').
            replace('AM', '上午').replace('PM', '下午');
        $('tbody').append(`
    <tr class="${(item.side).toLowerCase()} exec">
        <td>${item.symbol}</th>
        <td>${item.orderQty}</td>
        <td>${item.side == 'Sell' ? item.lastQty * -1 : item.lastQty}</td>
        <td>${item.leavesQty}</td>
        <td>${Number(item.lastPx).toFixed(1)}</td>
        <td>${item.ordType == 'Market' ? 'Market' : Number(item.price).toFixed(1)}</td>
        <td>${Number(Math.abs(Math.floor(item.execCost / Math.pow(10, 4)) / Math.pow(10, 4))).toFixed(4)} XBT</th>
        <td>${item.ordType}</td>
        <td>${(item.text == 'Liquidation') ? item.text : (item.orderID).substr(0, 8)}</td>
        <td>${transactTime}</td>
</tr>`);
    });

    // 產生HTML
    return $.html();
}

/**
 * 產生position的html
 */
async function posHtml() {
    let bitmex = new ccxt.bitmex({
        apiKey: apiKey,
        secret: secret,
    });

    // 目前倉位
    let currentPosition = await bitmex.privateGetPosition({
        filter: { "isOpen": true }
    });

    // 載入預設範本
    let $ = cheerio.load(fs.readFileSync(path.resolve(template_path, './posTemplate.html')));

    // 插入資料
    if (currentPosition.length == 0) return '';
    currentPosition.map(item => {
        $('tbody').append(`
    <tr class="${item.currentQty > 0 ? 'buy' : 'sell'} pos">
        <td>${item.symbol}</th>
        <td>${Math.abs(item.currentQty)}</td>
        <td>${Math.abs(item.homeNotional).toFixed(4)} ${item.underlying}</td>
        <td>${Number(item.avgEntryPrice).toFixed(2)}</td>
        <td>${Number(item.markPrice).toFixed(2)}</td>
        <td>${Number(item.liquidationPrice).toFixed(1)}</td>
        <td>${Number(item.maintMargin / Math.pow(10, 8)).toFixed(4)} ${item.underlying} (${item.leverage}x)</th>
        <td style="color:${item.unrealisedPnl > 0 ? '#52b370' : '#e8704f'};font-weight: bold;">${Number(item.unrealisedPnl / Math.pow(10, 8)).toFixed(4)} ${item.underlying} (${Number(item.unrealisedRoePcnt * 100).toFixed(2)}%)</td>
</tr>`);
    });

    // 產生HTML
    return $.html();
}

/**
 * 產生order的html
 */
async function ordHtml() {
    let bitmex = new ccxt.bitmex({
        apiKey: apiKey,
        secret: secret,
    });

    // 目前order
    let newOrder = await bitmex.privateGetOrder({
        reverse: true,
        filter: { "ordStatus": ["New", "PartiallyFilled"] }
    });

    // 載入預設範本
    let $ = cheerio.load(fs.readFileSync(path.resolve(template_path, './ordTemplate.html')));

    // 插入資料
    if (newOrder.length == 0) return '';
    newOrder.map(item => {
        $('tbody').append(`
    <tr class="${(item.side).toLowerCase()} ord">
        <td>${item.symbol}</td>
        <td>${item.orderQty}</td>
        <td>${item.ordType == 'Market' ? 'Market' : item.price}</td>
        <td>${item.leavesQty}</td>
        <td>${item.ordType}</td>
        <td>${item.ordStatus}</td>
</tr>`);
    });

    // 產生HTML
    return $.html();
}

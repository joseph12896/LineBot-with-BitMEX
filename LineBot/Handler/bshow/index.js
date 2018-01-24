const wrapper = require('../wrapper.js');
module.exports = new wrapper(/^bot ([^\s.]+)(\s.+)?$/iug, EventMsgToImgLink);

const webshot = require('./webshot'),
    uploadToImgur = require('./uploadToImgur'),
    fs = require('fs'),
    moment = require('moment'),
    ccxt = require('ccxt'),
    cheerio = require('cheerio'),
    path = require('path'),
    File = require(SCHEMA_PATH).File,
    url = require('url'),
    crypto = require('crypto'),
    fetch = require('node-fetch'),
    Person = require(SCHEMA_PATH).Person;

// dev
// const apiKey = process.env.apiKey,
//     secret = process.env.secret;

const template_path = path.resolve(__dirname);

async function EventMsgToImgLink(event, str1, str2) {
    // 尋找使用者
    let setting = await Person.findOne({ "bitmexQuerySetting.displayName": str1 }).exec();
    if (!setting) return;
    // 使用者允許啟用?
    if (!setting.bitmexQuerySetting.enabled) {
        event.reply('Disabled');
        return; // protect
    }
    // 取得apikey&secret
    let apiKey = setting.bitmexQuerySetting.apikey;
    let secret = setting.bitmexQuerySetting.secret;
    // 驗證apikey有效性
    try {
        let url = '/api/v1/user/affiliateStatus';
        let nonce = moment().format('x');
        let signature = bitmex_signature('GET', url, nonce, secret);
        let valid = await fetch('https://www.bitmex.com' + url, { //隨便抓一頁需要apikey的
            headers: {
                'content-type': 'application/json',
                'Accept': 'application/json',
                'api-key': apiKey,
                'api-nonce': nonce,
                'api-signature': signature,
            }
        });
        valid = await valid.json();
        if (valid.error) return;
    } catch (error) {
        return console.log(error);
    }

    // 主函式
    let matchedStr = '';
    if (str2) {
        matchedStr = str2.substr(1); // 消去跟在後面的空格
    }
    try {
        // 取得對應資料，產生html
        let html, windowSize = {
            width: 1024,
            height: 768
        };
        if (matchedStr == 'exec') {
            if (!setting.bitmexQuerySetting.execution) {
                event.reply('Denied');
                return; // protect
            }
            // show execution
            windowSize.height = 1024; // 限制截圖高度
            html = await execHtml(apiKey, secret);
        } else if (matchedStr == 'ord') {
            if (!setting.bitmexQuerySetting.order) {
                event.reply('Denied');
                return; // protect
            }
            // show order
            windowSize.height = 400; // 限制截圖高度
            html = await ordHtml(apiKey, secret);
        } else if (matchedStr == '') {
            if (!setting.bitmexQuerySetting.position) {
                event.reply('Denied');
                return; // protect
            }
            // show position
            windowSize.height = 150; // 限制截圖高度
            html = await posHtml(apiKey, secret);
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
        // let wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        // let ImgObject = await Promise.race([
        //     uploadToImgur(ImgBuffer),
        //     wait(20 * 1000),// 處理過久則捨棄
        // ]);

        // 儲存至mongodb並回傳link
        let hash = crypto.createHash('sha1').update(ImgBuffer).digest('hex'),
            ImgObject = {};
        if (await File.count({ hash: hash }) > 0) {
            console.log(`圖片已存在`);
        } else {
            console.log(`儲存截圖中`);
            await new File({ filename: `${moment().unix()}.jpg`, data: ImgBuffer, hash: hash }).save();
        }
        ImgObject.link = url.resolve(process.env.APP_DOMAIN, `/file/${hash}`);
        console.log(`已產生image link - ${ImgObject.link}`);

        // Reply       
        if (ImgObject) {
            let ImgLink = ImgObject.link;
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
async function execHtml(apiKey, secret) {
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
async function posHtml(apiKey, secret) {
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
async function ordHtml(apiKey, secret) {
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

/**
 * 產生bitMEX簽名
 */
function bitmex_signature(VERB, PATH, NONCE, API_SECRET) {
    return crypto
        .createHmac('sha256', API_SECRET)
        .update(VERB + PATH + NONCE)
        .digest('hex');
}
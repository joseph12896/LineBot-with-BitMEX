const webshot = require('webshot'),
    fs = require('fs'),
    path = require('path');

/**
 * 輸入html code，產生網頁截圖
 * @param {String} htmlText 
 */
module.exports = async function (htmlText = '<body></body>', windowSize = {
    width: 1024, height: 768
}) {

    // 設定要截圖的網頁&截圖大小
    let options = {
        siteType: 'html',
        defaultWhiteBackground: true,
        windowSize: windowSize,
        timeout: 10 * 1000,
        phantomPath: path.join('./vendor/phantomjs/bin/phantomjs') // for heroku
    };
    let renderStream = webshot(htmlText, options);

    /**
     * 合併分散的截圖資料，並等待截圖完成回傳imgBuffer
     */
    return await new Promise((resolve, reject) => {
        let BufferList = [];
        renderStream.on('data', function (data) {
            // file.write(data.toString('binary'), 'binary');
            BufferList.push(data);
        });
        renderStream.on('end', async function () {
            let imgBuffer = new Buffer.concat(BufferList);
            resolve(imgBuffer);
        });
    });
}





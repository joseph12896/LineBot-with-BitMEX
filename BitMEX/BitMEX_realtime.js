// BitMEX查價系統
// wss://www.bitmex.com/realtime
const utility = require('../LineBot/Utility');
const WebSocketClient = require('./WebSocketClient.js');
const emoji = require('node-emoji')
const wsc = new WebSocketClient(30 * 1000, 30);
module.exports = wsc;

// BitMEX資料物件
const Quote = require('./Quote.js');
const Instrument = require('./Instrument.js');
const Liquidation = require('./Liquidation.js');
wsc.quote = new Quote();
wsc.instrument = new Instrument();
wsc.liquidation = new Liquidation();

// 初始程序
wsc.init = function () {
    // 訂閱BitMEX特定頻道
    this.subscribe('quote', 'liquidation', 'instrument');

    // reset
    this.quote.clear();
    this.instrument.clear();
    this.liquidation.clear();

    // 向使用者廣播已上線
    // utility.broadcast(`${emoji.get('white_check_mark')}查價功能已上線`);
}

// ONOPEN
wsc.onopen = function (e) {
    // 初始程序
    this.init();
}

// ONCLOSE
wsc.onclose = function (e) {
}

// ONRECONNECT
wsc.onreconnect = function () {
    // 向使用者廣播已斷線，重新連線中
    // utility.broadcast(`${emoji.get('warning')}查價功能已離線，${this.autoReconnectInterval / (60 * 1000)}分後重新連線\n${emoji.get('warning')}重試次數:${this.reconnectCount}/${this.reconnectCountLimit}`);
}

// ONMESSAGE
wsc.onmessage = function (data, flags, number) {

    let rev = JSON.parse(data);
    if (rev.table == 'quote') {
        this.quote.parse(rev);
    } else if (rev.table == 'instrument') {
        this.instrument.parse(rev);
    } else if (rev.table == 'liquidation') {
        this.liquidation.parse(rev);
    }

}

/**
 * 發送 BitMEX 訊息相關Function 
 */

// 訂閱訊息
wsc.subscribe = function () {
    let arr = [];
    for (var i = 0; i < arguments.length; i++) {
        arr.push(arguments[i]);
    }
    this.sendCommand('subscribe', arr)
}

// 發送基本指令
wsc.sendCommand = function (op, args = []) {
    this.send(JSON.stringify({ op, args }));
}
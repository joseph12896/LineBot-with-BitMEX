// BitMEX查價系統
// wss://www.bitmex.com/realtime
const WebSocketClient = require('../WebSocketClient.js');
const wsc = new WebSocketClient();
const Quote = require('./Quote.js');
const Instrument = require('./Instrument.js');
module.exports = wsc;

wsc.onopen = function (e) {
    Quote.reset();
    Instrument.reset();

    // 訂閱BitMEX特定頻道
    this.subscribe('quote', 'liquidation', 'instrument');
}

// ONMESSAGE
wsc.onmessage = function (data, flags) {
    try {
        let rev = JSON.parse(data);
        if (rev.table == 'quote') {
            Quote.parse(rev);
        } else if (rev.table == 'instrument') {
            Instrument.parse(rev);
        }
    } catch (e) {
        console.log(e)
    }
}
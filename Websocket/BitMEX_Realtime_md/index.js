// BitMEX
// wss://www.bitmex.com/realtimemd
const WebSocketClient = require('../WebSocketClient.js');
const wsc = new WebSocketClient();
module.exports = wsc;

wsc.onopen = function (e) {

}

wsc.onmessage = function (data, flags, number) {
    console.log(data, flags, number);
}
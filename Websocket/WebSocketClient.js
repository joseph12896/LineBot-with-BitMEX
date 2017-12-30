// Reference:https://github.com/websockets/ws/wiki/Websocket-client-implementation-for-auto-reconnect
// 新增功能:在open和close內加入了Heartbeat
const WebSocket = require('ws');

/**
 * WebSocketClient - Constructor
 * @param {Number} autoReconnectInterval - 重連間隔(ms)
 */
function WebSocketClient(autoReconnectInterval) {
    this.autoReconnectInterval = autoReconnectInterval || 30 * 1000;
}
module.exports = WebSocketClient;

/**
 * WebSocketClient::open
 * @param {String} url 
 */
WebSocketClient.prototype.open = function (url) {
    this.url = url;
    this.instance = new WebSocket(this.url);
    this.instance.on('open', () => {
        this.initHeartbeat();
        this.onopen();
    });
    this.instance.on('message', (data, flags) => { this.onmessage(data, flags); });
    this.instance.on('close', (e) => { this.onclose(e); });
    this.instance.on('error', (e) => { this.onerror(e); });
}

/**
 * WebSocketClient::send
 * @param {String} data
 * @param {*} option 
 */
WebSocketClient.prototype.send = function (data, option) {
    try {
        this.instance.send(data, option);
    } catch (e) {
        this.instance.emit('error', e);
    }
}

WebSocketClient.prototype.reconnect = function (e) {
    console.log(`Retry in ${this.autoReconnectInterval} ms`);

    var that = this;
    setTimeout(function () {
        that.open(that.url);
    }, this.autoReconnectInterval);
}

WebSocketClient.prototype.onopen = function (e) {
    console.log(`Connection established - ${this.url}`, arguments);
}

WebSocketClient.prototype.onmessage = function (data, flags, number) {
    console.log("Receive message - ", arguments);
}

WebSocketClient.prototype.onerror = function (e) {
    console.log("Error - ", arguments);
    switch (e.code) {
        case 'ECONNREFUSED':
            this.reconnect(e);
            break;
    }
}

WebSocketClient.prototype.onclose = function (e) {
    console.log(`Connection closed - ${this.url}`, arguments);
    switch (e) {
        // 參考: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes
        case 1000:
            // CLOSE_NORMAL
            break;
        case 4000:
            // 因為Heartbeat引發的關閉
            this.reconnect(e);
            break;
        default:
            // Abnormal closure
            this.reconnect(e);
            break;
    }
}

WebSocketClient.prototype.initHeartbeat = function () {
    this.isAlive = true;

    // pong event handler
    this.instance.on('pong', () => {
        this.isAlive = true;
    });

    // send 'ping' every 10s
    this.heartbeat = setInterval(() => {
        if (this.isAlive === false) {
            clearInterval(this.heartbeat);
            return this.instance.close(4000);
        }

        // ping
        this.isAlive = false;
        this.instance.ping('', true, true);
    }, 10 * 1000);
}

/**
 * BitMEX 相關函數
 */

// 訂閱訊息
WebSocketClient.prototype.subscribe = function() {
    let arr = [];
    for (var i = 0; i < arguments.length; i++) {
        arr.push(arguments[i]);
    }
    this.sendCommand('subscribe', arr)
}

// 發送基本指令
WebSocketClient.prototype.sendCommand = function (op, args = []) {
    this.send(JSON.stringify({ op, args }));
}
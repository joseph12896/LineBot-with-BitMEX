const linebot = require('linebot');
const fs = require('fs');
const path = require('path');

/**
 * Initialize LineBot
 */
const bot = linebot(
    {
        "channelId": process.env.channelId,
        "channelSecret": process.env.channelSecret,
        "channelAccessToken": process.env.channelAccessToken
    }
);
global.bot = bot;
module.exports = bot;

// 執行BitMEX相關程式
require('../Websocket/BitMEX_Realtime').open('wss://www.bitmex.com/realtime');
require('../Websocket/BitMEX_Realtime_md').open('wss://www.bitmex.com/realtimemd');

/**
 * Event
 */
const handler_bot = require('./Handler/bot/');
const handler_bug = require('./Handler/bug/');
const handler_bshow = require('./Handler/bshow/');
bot.on('message', function (event) {
    if (event.message.type == 'text') {
        console.log(event.message.text)
        handler_bot.test(event, event.message.text);
        handler_bug.test(event, event.message.text);
        // 報倉位的
        handler_bshow.test(event, event.message.text);
    }
});

/**
 * Unused event
 */
bot.on('follow', function (event) {
    // event.reply('follow: ' + event.source.userId);
});

bot.on('unfollow', function (event) {
    // event.reply('unfollow: ' + event.source.userId);
});

bot.on('join', function (event) {
    // event.reply('join: ' + event.source.groupId);
});

bot.on('leave', function (event) {
    // event.reply('leave: ' + event.source.groupId);
});

bot.on('postback', function (event) {
    // event.reply('postback: ' + event.postback.data);
});

bot.on('beacon', function (event) {
    // event.reply('beacon: ' + event.beacon.hwid);
});


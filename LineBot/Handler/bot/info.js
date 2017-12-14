// 版本資訊
const emoji = require('node-emoji');
const moment = require('moment');
const fetch = require('node-fetch');

const wrapper = require('../wrapper.js');
module.exports = new wrapper(/^info$/ig, info);

async function info(event) {

    let str = "[ Info ]\n" +
        `[ Node.js Version ] ${process.version}\n` +
        `[ Platform ] ${process.platform}\n` +
        `[ Source Code ] tinyurl.com/ycobwnoh \n` +
        `[ Others ]\n` +
        `- BOT使用Heroku的Hobby plan至2017年底，此後每月只運行550小時\n` +
        `- Line Messenger API使用dev trial，因此此BOT好友數量限制50人`;

    event.reply(str);
    return;
}

/**
 * 使用etherscan.io API查詢錢包餘額
 */

// var walletBalance = 0, goal = 0.023, perc = Number(100 * walletBalance / goal);;

// async function updateWalletBalance() {
//     try {
//         let res = await fetch('https://api.etherscan.io/api?module=account&action=balance&address=0xa087C9E3eAE348D16B95ea19719c67f77EDa7080&tag=latest&apikey=S518HCWQBFSCA3C9ERQXM4PJTIK45SZFI4')
//         res = await res.json();
//         if (res.message == 'OK') walletBalance = Number(res.result / 1000000000000000000).toFixed(3);
//     } catch (e) {
//         console.log(e)
//     }
// }

// setInterval(updateWalletBalance, 10 * 1000);

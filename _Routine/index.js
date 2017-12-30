const LiqNotice = require('./LiquidationNotice');

const period = 30; // second
setInterval(() => {
    LiqNotice();

}, period * 1000)
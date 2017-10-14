const wrapper = require('../../wrapper.js');

module.exports = new wrapper(/^rekt$/ig, rekt);

// BitMEX爆倉提醒(於群組)
async function rekt(event, debug) {

    let groupLineId = event.source.roomId || event.source.groupId;
    
    // 尋找Group
    var idx = global.groupPool.findIndex((group) => {
        return group.groupLineId == groupLineId;
    });
    var group = global.groupPool[idx];

    // 開關rekt
    if (group.ToggleRekt()){
        event.reply('Liquidation Notice: ON');
    }else{
        event.reply('Liquidation Notice: OFF');
    }
}
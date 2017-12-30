const wrapper = require('../wrapper.js');
module.exports = new wrapper(/^bug\s(.+)/ug, bug);

const Bug = require(SCHEMA_PATH).Bug; // 紀錄使用查詢指令的人數

async function bug(event, matchedStr) {

    await new Bug({
        userID: event.source.userId || null,
        groupID: event.source.groupId || null,
        message: event.message.text,
    }).save();

    event.reply(`已記錄${matchedStr.length}字`)
}

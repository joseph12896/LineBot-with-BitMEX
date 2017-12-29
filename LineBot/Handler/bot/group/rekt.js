const wrapper = require('../../wrapper.js');
module.exports = new wrapper(/^rekt$/ig, rekt);

const Group = require(SCHEMA_PATH).Group;

// 開關群組BitMEX爆倉通知
async function rekt(event, debug) {

    // Get line id of group.
    let groupLineId = event.source.roomId || event.source.groupId;
    if (!groupLineId) return;

    // Find with line id of group.
    let selectedGroup = await Group.
        findOne({ groupLineId }).
        exec();

    // If not found, create a new one.
    if (!groupList.length) {
        selectedGroup = await new Group({ groupLineId }).save();
    }

    // Update
    await Group.
        findAndUpdate({
            groupLineId: selectedGroup.groupLineId
        },
        {
            "$set": { rekt: !selectedGroup.rekt }
        }).
        exec();

    // 通知使用者
    if (selectedGroup.rekt) {
        event.reply('On');
    } else {
        event.reply('OFF');
    }
}
const mongoose = require('mongoose');

/**
 * Schema
 */
var Schema = mongoose.Schema;

// User
// const userSchema = new Schema({
//     lineUserId: { type: String, required: true, unique: true },
//     apikey: { type: String, default: null },
//     secret: { type: String, default: null },
//     status: { type: Number, default: 0 },
//     bound: { type: Number, default: 5.0 },
// });
// const User = mongoose.model('User', userSchema);

// Group
const groupSchema = new Schema({
    groupLineId: { type: String, required: true, unique: true },
    rekt: { type: Boolean, required: true, default: false },
    rektThreshold: { type: Number, required: true, default: 1 },
});
const Group = mongoose.model('Group', groupSchema);

// Rekt
// const rektSchema = new Schema({
//     symbol: { type: String },
//     side: { type: String },
//     price: { type: Number },
//     leavesQty: { type: Number },
//     timestamp: { type: Number },
// });
// const Rekt = mongoose.model('Rekt', rektSchema);

// Query
const querySchema = new Schema({
    userID: { type: String },
    groupID: { type: String },
    message: { type: String }
});
const Query = mongoose.model('Query', querySchema);

// Bug
const bugSchema = new Schema({
    userID: { type: String },
    groupID: { type: String },
    message: { type: String }
});
const Bug = mongoose.model('Bug', bugSchema);

// File
const FileSchema = new Schema({
    hash: { type: String, required: true, unique: true },
    filename: { type: String, default: '' },
    data: { type: Buffer }
});
const File = mongoose.model('File', FileSchema);

module.exports = {
    Group,
    Query,
    Bug,
    File
}
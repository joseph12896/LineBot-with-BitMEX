const mongoose = require('mongoose');

var Schema = mongoose.Schema;
var querySchema = new Schema({
    userID: { type: String },
    groupID: { type: String },
    message: { type: String }
});
var Query = mongoose.model('Query', querySchema);

module.exports = {
    Query
}
const mongoose = require('mongoose');

var Schema = mongoose.Schema;
var rektSchema = new Schema({
    symbol: { type: String },
    side: { type: String },
    price: { type: Number },
    leavesQty: { type: Number },
    timestamp: { type: Number },
});
var Rekt = mongoose.model('Rekt', rektSchema);

module.exports ={
    Rekt
}
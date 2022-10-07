const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const WalletSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    bitcoinAddress: {
        type: String,
        required: true
    },
    ERC20Address: {
        type: String,
        required: true
    },
    privateKey: {
        type: String,
        required: true
    },
    tokenlist: {
        type: Array,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});
module.exports = Wallet = mongoose.model("wallet", WalletSchema);
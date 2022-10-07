const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    full_name: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: false
    },
    phoneNumber: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false
    },
    recoveryPhrase: {
        type: Array,
        required: false
    },
    address: {
        type: String,
        required: false
    },
    birthday: {
        type: String,
        required: false
    },
    city: {
        type: String,
        required: false
    },
    country: {
        type: String,
        required: false
    },
    region: {
        type: String,
        required: false
    },
    zip_code: {
        type: String,
        required: false
    },
    id_front_image: {
        type: String,
        required: false
    },
    id_back_image: {
        type: String,
        required: false
    },
    real_photo: {
        type: String,
        required: false
    },
    permission:{
        type:String,
        required:true,
    },
    date: {
        type: Date,
        default: Date.now
    }
});
module.exports = User = mongoose.model("users", UserSchema);

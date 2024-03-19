const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    msg: {
        type: String,
        required: [true, "message is required for creating a msg document"]
    },

    Sender: {
        type: String,
        required: true
    },

    Reciever: {
        type: String,
    },
},

    {
        timestamps: true
    }
)

module.exports = mongoose.model("Messages", messageSchema)
const mongoose = require('mongoose');

const groupSchema = mongoose.Schema({
    groupName:{
        type: String,
        unique: true
    },

    img:{
        type: String,
        default: '89138bf8-542c-4152-b202-28c9c755b0de.png'
    },

    about:{
        type: String,
        default: 'Hello! Welcome to Group Chat.'
    },

    users:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    ]
})

module.exports = mongoose.model('group', groupSchema);
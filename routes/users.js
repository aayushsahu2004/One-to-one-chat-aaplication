const mongoose = require("mongoose");
require('dotenv').config({ path: './.env' })
mongoose.connect(process.env.Mongo_Url);
const plm = require('passport-local-mongoose');

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required for creating a user"],
    unique: true
  },

  contact:{
    type: String,
    required: true
  },

  img:{
    type: String,
    default: '89138bf8-542c-4152-b202-28c9c755b0de.png'
  },

  about:{
    type: String, 
    default: 'Hello! I am using One to One and Group Chat application.'
  },

  onlineStutas:{
    type: Boolean, 
    default: false
  },

  sendRequest: [
    {
      type: String
    }
  ],

  pendingRequest: [
    {
      type: String
    }
  ],

  friends: [
    {
      type: String
    }
  ],

  socketId:{
    type: String
  }
});

userSchema.plugin(plm);
module.exports = mongoose.model("user", userSchema);
const io = require( "socket.io" )();
const socketapi = {
    io: io
};

const userModel = require("./routes/users");
const messageModel = require("./routes/message");
const groupModel = require("./routes/group");
const { use } = require("passport");


// Add your socket.io logic here!
io.on( "connection", function( socket ) {
    
    socket.on('join-server', async username =>{

        const currentUser = await userModel.findOne({
            username: username
        })
        

        const myfriend = currentUser.friends

        const MyFriend = await userModel.find({
            _id: myfriend
        })

        socket.emit('myFriends', MyFriend)

        
        const NotMyFriends = await userModel.find({
            username: {$nin: username},
            _id: {$nin: myfriend},
            _id: {$nin: currentUser.pendingRequest},
            _id: {$nin: currentUser.friends}
        })
        
        socket.emit('NotMyFriends', NotMyFriends)
       
        const RequstedUserDetails = await userModel.find({
            _id: currentUser.pendingRequest
        })

        socket.emit('Show-Recieve-Request', RequstedUserDetails);

        const SendRequestDetails = await userModel.find({
            _id: currentUser.sendRequest
        })
        socket.emit('Show-Send-Request', SendRequestDetails) 

        const allGroup = await groupModel.find({
            users:{
                $in:[
                    currentUser._id
                ]
            }
        })

        allGroup.forEach(groupDetails =>{
            socket.emit("created-group-join",{
                groupName: groupDetails.groupName,
                img: groupDetails.img,
                id: groupDetails._id
            })
        });

        const stutas = await userModel.findOneAndUpdate({
            username: username
        },{
            onlineStutas: true
        })  
        

        currentUser.socketId = socket.id
        await currentUser.save();


        const UserNotInGroup = await groupModel.find({
            users: {$nin: currentUser}
        });

        socket.emit('show-groups', UserNotInGroup)

    })

    socket.on("disconnect", async () =>{
        await userModel.findOneAndUpdate({
            socketId: socket.id,
            onlineStutas: true
        },{
            socketId: "",
            onlineStutas: false
        })
    })

    // socket.on('my-friend', async myfriend=>{
    //     const currentUser = await userModel.findOne({
    //         username: myfriend.Sender
    //     })

    //     const RequstedUser = await userModel.findOne({
    //         _id: myfriend.RequestedBy
    //     })
    //     currentUser.friends.push(RequstedUser._id)
    //     await currentUser.save()
        
    // })

    socket.on('Request-send', async RequestUser=>{
        const RecieveRequestUser = await userModel.findOne({
            _id: RequestUser.RecieveRequestUserId
        })

        RecieveRequestUser.pendingRequest.push(RequestUser.SendRequestUserId)
        await RecieveRequestUser.save();

        const RecieveRequest = RecieveRequestUser.pendingRequest

        const RecieveAllRequest = await userModel.find({
            _id: RecieveRequest
        })
        
        socket.to(RecieveRequestUser.socketId).emit('Recieve-Request', RecieveAllRequest);

        const SendRequestUser = await userModel.findOne({
            _id: RequestUser.SendRequestUserId
        })
        
        SendRequestUser.sendRequest.push(RequestUser.RecieveRequestUserId)
        await SendRequestUser.save();
        
        const SendAllRequest = await userModel.findOne({
            _id: RequestUser.RecieveRequestUserId
        })

        socket.emit('Send-Request-user', SendAllRequest);
    })

    socket.on('Accept-Request', async AcceptRequestDetails=>{
        const SendRequestUser = await userModel.updateOne({
            _id: AcceptRequestDetails.SendRequestUserId
        },{
            $pull: {sendRequest: AcceptRequestDetails.AcceptRequestUserId}
        })

        const SendRequestDetails = await userModel.findOne({
            _id: AcceptRequestDetails.SendRequestUserId
        })

        SendRequestDetails.friends.push(AcceptRequestDetails.AcceptRequestUserId)
        await SendRequestDetails.save()
        

        const AcceptRequestUser = await userModel.updateOne({
            _id: AcceptRequestDetails.AcceptRequestUserId
        },{
            $pull: {pendingRequest: AcceptRequestDetails.SendRequestUserId}
        })

        const AcceptRequestUserDetails = await userModel.findOne({
            _id: AcceptRequestDetails.AcceptRequestUserId
        })

        socket.to(SendRequestDetails.socketId).emit('Request-Accepted', AcceptRequestUserDetails);

        AcceptRequestUserDetails.friends.push(AcceptRequestDetails.SendRequestUserId)
        await AcceptRequestUserDetails.save();

        socket.emit('UserRequestAccept', SendRequestDetails);
    })

    socket.on('online-stutas', async function(isOnline){
        const userStutas = await userModel.findOne({
            username: isOnline
        })

        if(!userStutas){
            return
        }

        socket.emit('userOnline', {isOnline: userStutas.onlineStutas})
    })

    socket.on('contactUserDetails', async contactUser=>{
        const contactUserDetails = await userModel.findOne({
            username: contactUser
        })



        if(!contactUserDetails){
            const ContactGroupDetails = await groupModel.findOne({
                groupName: contactUser
            })
            socket.emit('UserDetails', {
                username: ContactGroupDetails.groupName,
                img: ContactGroupDetails.img,
                about: ContactGroupDetails.about
            })
        }

        if(contactUserDetails){
            socket.emit('UserDetails', {
                username: contactUserDetails.username,
                img: contactUserDetails.img,
                about: contactUserDetails.about
            })
        }

    })

    socket.on('privatemsg', async function(msg){
        await messageModel.create({
            msg: msg.msg,
            Reciever: msg.Reciever,
            Sender: msg.Sender
        });

        const Reciever = await userModel.findOne({
            username: msg.Reciever
        });

        if(!Reciever){
            const group = await groupModel.findOne({
                groupName: msg.Reciever
            }).populate('users')


            if(!group){
                return
            }

            group.users.forEach(user =>{
                socket.to(user.socketId).emit('recievePrivatemsg', msg)
            })
        }


        if(Reciever)
            socket.to(Reciever.socketId).emit('recievePrivatemsg', msg)
    })

    socket.on('getMessage', async function(msgObject){
        const isUser = await userModel.findOne({
            username: msgObject.Reciever
        })

        if(isUser){
            const allMessages = await messageModel.find({
                $or : [
                    {
                        Sender: msgObject.Sender,
                        Reciever: msgObject.Reciever
                    },
                    {
                        Sender: msgObject.Reciever,
                        Reciever: msgObject.Sender
                    }
                ]
            })
            socket.emit('chatMessages', allMessages)
        }
        else{
            const allMessages = await messageModel.find({
                Reciever: msgObject.Reciever
            })

            socket.emit('chatMessages', allMessages)
        }
            
    })

    socket.on('create-new-group', async GroupDetails=>{

        const group = await groupModel.findOne({
            groupName: GroupDetails.groupName
        })

        if(group){
            socket.emit('group-already-exist',{
                AlreadyExist: "The Group Name is alredy exist! Please use another Name"
            })
            return
        }

        const newGroup = await groupModel.create({
            groupName: GroupDetails.groupName
        })

        const currentUser = await userModel.findOne({
            username: GroupDetails.sender
        })

        socket.broadcast.emit('NewGroup', newGroup);

        newGroup.users.push(currentUser._id);
        await newGroup.save()
        socket.emit('group-created', newGroup)
    })

    

    socket.on('join-group', async joinGroupDetails=>{

        const group = await groupModel.findOne({
            groupName:  joinGroupDetails.groupName
        })

        const JoinUser = await userModel.findOne({
            username: joinGroupDetails.sender
        })

        group.users.push(JoinUser._id);
        await group.save();

        socket.emit('group-joined', group);

    })

    console.log( "A user connected" );
});
// end of socket.io logic





module.exports = socketapi;
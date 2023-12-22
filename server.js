const express = require('express');
const app = express();
const routes = require("./routes/routes.js");
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
      origin: "https://admin.socket.io",
      methods: ["GET", "POST"],
      credentials: true,
    }
});
const PORT = process.env.PORT || 3000;
const { instrument } = require('@socket.io/admin-ui');
const Models = require('./models/models.js')
const Message = Models.Message
var stream = Models.stream // MongoDB collection change stream

app.use(express.json())
app.use(express.static('public'))
app.use('/', routes);

// MongoDB connection
const mongoose = require('mongoose');
const mongoDB = 'mongodb+srv://olli:REDACTED@nodejs-practice.fnmnaw4.mongodb.net/RuuviTag?retryWrites=true&w=majority'
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true})
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function() { console.log("RuuviTag database connected") });

io.on('connection', async socket => {
    // Find and emit all messages from database.
    const messages = await Message.find({})
    messages.forEach(item => {
        let message_text = item.text;
        let message_user = item.user;
        let message_timestamp = item.timestamp;
        socket.emit('receive-message', message_text, message_user, message_timestamp);
    });
});

io.on('connection', socket => {
    socket.on('send-message', async (message, user, timestamp) => {
        socket.broadcast.emit('receive-message', message, user, timestamp);

        const text = message;
        const username = user;
        const time = timestamp;
        const message_to_send = new Message({
            user: username,
            text: text,
            timestamp: time
        });

        const saved_message = await message_to_send.save()
    });
});

// Start listening for changes.
io.on('connection', socket => { socket.on('auto_start', () => { stream.on('change', () => {io.emit('update')})})});
// Stop listening for changes.
io.on('connection', socket => { socket.on('auto_stop', () => stream.close())});

instrument(io, {
    // Websocket admin ui
    auth: {
      type: "basic",
      username: "admin",
      password: "$2a$12$NPvCsP1BNDSXW3hafzNa8ehJsEqM2zpx6moMuFANBlOYz70VekFya"
    }
});

http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
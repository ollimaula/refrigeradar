const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
    payload: { type: String, required: true } 
});
const chatSchema = new mongoose.Schema({
    user: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: String, required: true }
});

const Message = mongoose.model('Message', chatSchema, 'ChatLogs');
const Payload = mongoose.model('Payload', dataSchema, 'Data');
var stream = Payload.watch();

module.exports = {
    Message: Message,
    Payload: Payload,
    stream: stream
};
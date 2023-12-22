const express = require('express');
const router = express.Router();

const Models = require('../models/models.js')
const Payload = Models.Payload // RuuviTag JSON Payloads
var stream = Models.stream // MongoDB collection change stream

router.get('/data', async (req, res) => {
    // Find all documents in collection.
    const Payloads = await Payload.find({})
    res.json(Payloads)
});

router.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html")
});

module.exports = router;
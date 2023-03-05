const express = require('express');
const app = express();
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://test.mosquitto.org');
const cors = require('cors');
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.use(express.urlencoded({ extended: true }));

// enable CORS for all origins
app.use(cors());

// Subscribe to 'lock-status' topic
client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe('lock-status');
});

// Handle messages on 'lock-status' topic
client.on('message', (topic, message) => {
    const status = message.toString();
    console.log(`Status: ${status}`);

    // Send status to client application via socket connection
    io.emit('status', status);
});

// Handle commands from client application via REST API
app.post('/command', (req, res) => {
    const command = req.body.command;
    if (command === 'true') {
        console.log('Publishing command: true');
        client.publish('command', 'true');
    } else {
        console.log('Publishing command: false');
        client.publish('command', 'false');
    }
    res.send('Command received');
});

// Start server
http.listen(3000, () => {
    console.log('Server listening on port 3000');
});

// Clean up
process.on('SIGINT', () => {
    console.log('Closing MQTT client connection');
    client.end();
    console.log('Exiting');
    process.exit();
});

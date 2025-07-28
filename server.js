const express = require('express');
const { DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const makeWASocket = require('@whiskeysockets/baileys').default;
const QRCode = require('qrcode');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Global variables
let sock;
let qr;
let isConnected = false;

// Ensure auth folder exists
const authFolder = './auth_info_baileys';
if (!fs.existsSync(authFolder)) {
    fs.mkdirSync(authFolder);
}

// Initialize WhatsApp connection
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr: newQr } = update;
        
        if (newQr) {
            qr = newQr;
            QRCode.toDataURL(qr, (err, url) => {
                if (!err) {
                    io.emit('qr', url);
                }
            });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
            
            isConnected = false;
            io.emit('disconnected');
            
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('WhatsApp connected successfully');
            isConnected = true;
            io.emit('connected', sock.user);
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/status', (req, res) => {
    res.json({ 
        connected: isConnected,
        user: sock?.user || null
    });
});

app.post('/disconnect', (req, res) => {
    try {
        if (sock && isConnected) {
            console.log('Manually disconnecting WhatsApp...');
            sock.logout();
            isConnected = false;
            io.emit('disconnected');
            res.json({ success: true, message: 'Disconnected successfully' });
        } else {
            res.status(400).json({ error: 'No active connection to disconnect' });
        }
    } catch (error) {
        console.error('Disconnect error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/send-broadcast', async (req, res) => {
    try {
        const { contacts, message, delay } = req.body;
        
        if (!isConnected || !sock) {
            return res.status(400).json({ error: 'WhatsApp not connected' });
        }

        const contactList = contacts.split('\n').filter(line => line.trim());
        const results = [];
        
        for (let i = 0; i < contactList.length; i++) {
            const contact = contactList[i].trim();
            if (!contact) continue;
            
            const [nama, nomorhp] = contact.split(',').map(item => item.trim());
            
            if (!nama || !nomorhp) {
                results.push({ contact, status: 'error', message: 'Format tidak valid' });
                continue;
            }
            
            try {
                // Replace variables in message
                let personalizedMessage = message
                    .replace(/{nama}/g, nama)
                    .replace(/{nomorhp}/g, nomorhp);
                
                // Format phone number (remove special characters and add country code if needed)
                let formattedNumber = nomorhp.replace(/[^0-9]/g, '');
                if (!formattedNumber.startsWith('62')) {
                    if (formattedNumber.startsWith('0')) {
                        formattedNumber = '62' + formattedNumber.substring(1);
                    } else {
                        formattedNumber = '62' + formattedNumber;
                    }
                }
                
                const jid = formattedNumber + '@s.whatsapp.net';
                
                await sock.sendMessage(jid, { text: personalizedMessage });
                
                results.push({ 
                    contact: `${nama} (${nomorhp})`, 
                    status: 'success', 
                    message: 'Pesan terkirim' 
                });
                
                // Emit progress to client
                io.emit('broadcast-progress', { 
                    current: i + 1, 
                    total: contactList.length, 
                    contact: `${nama} (${nomorhp})`,
                    status: 'success'
                });
                
                // Delay between messages
                if (i < contactList.length - 1 && delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay * 1000));
                }
                
            } catch (error) {
                console.error('Error sending message:', error);
                results.push({ 
                    contact: `${nama} (${nomorhp})`, 
                    status: 'error', 
                    message: error.message 
                });
                
                io.emit('broadcast-progress', { 
                    current: i + 1, 
                    total: contactList.length, 
                    contact: `${nama} (${nomorhp})`,
                    status: 'error',
                    error: error.message
                });
            }
        }
        
        io.emit('broadcast-complete', results);
        res.json({ success: true, results });
        
    } catch (error) {
        console.error('Broadcast error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Socket.IO events
io.on('connection', (socket) => {
    console.log('Client connected');
    
    if (isConnected && sock?.user) {
        socket.emit('connected', sock.user);
    } else if (qr) {
        QRCode.toDataURL(qr, (err, url) => {
            if (!err) {
                socket.emit('qr', url);
            }
        });
    }
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
    connectToWhatsApp();
});

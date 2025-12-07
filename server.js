import express from 'express';
import { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Global variables - Store multiple sessions
const sessions = new Map(); // sessionId -> { sock, isConnected, qr }

// Generate session directory
function getSessionFolder(sessionId) {
    const sessionFolder = `./sessions/${sessionId}`;
    if (!fs.existsSync('./sessions')) {
        fs.mkdirSync('./sessions');
    }
    if (!fs.existsSync(sessionFolder)) {
        fs.mkdirSync(sessionFolder);
    }
    return sessionFolder;
}

// Initialize WhatsApp connection for specific session
async function connectToWhatsApp(sessionId, socket) {
    const sessionFolder = getSessionFolder(sessionId);
    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
    
    const sock = makeWASocket({
        auth: state
    });

    // Store session
    sessions.set(sessionId, {
        sock: sock,
        isConnected: false,
        qr: null
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr: newQr } = update;
        const session = sessions.get(sessionId);
        
        if (newQr) {
            session.qr = newQr;
            sessions.set(sessionId, session);
            QRCode.toDataURL(newQr, (err, url) => {
                if (!err) {
                    socket.emit('qr', url);
                }
            });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
            
            session.isConnected = false;
            sessions.set(sessionId, session);
            socket.emit('disconnected');
            
            if (shouldReconnect) {
                connectToWhatsApp(sessionId, socket);
            }
        } else if (connection === 'open') {
            console.log('WhatsApp connected successfully for session:', sessionId);
            session.isConnected = true;
            sessions.set(sessionId, session);
            socket.emit('connected', sock.user);
        }
    });

    sock.ev.on('creds.update', saveCreds);
    return sock;
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/status/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    const session = sessions.get(sessionId);
    
    res.json({ 
        connected: session?.isConnected || false,
        user: session?.sock?.user || null
    });
});

app.post('/disconnect/:sessionId', (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const session = sessions.get(sessionId);
        
        if (session?.sock && session.isConnected) {
            console.log('Manually disconnecting WhatsApp for session:', sessionId);
            session.sock.logout();
            session.isConnected = false;
            sessions.set(sessionId, session);
            res.json({ success: true, message: 'Disconnected successfully' });
        } else {
            res.status(400).json({ error: 'No active connection to disconnect' });
        }
    } catch (error) {
        console.error('Disconnect error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/send-broadcast/:sessionId', async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const { contacts, message, delay } = req.body;
        const session = sessions.get(sessionId);
        
        if (!session?.isConnected || !session.sock) {
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
                
                await session.sock.sendMessage(jid, { text: personalizedMessage });
                
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
    
    socket.on('init-session', (sessionId) => {
        console.log('Initializing session:', sessionId);
        const session = sessions.get(sessionId);
        
        if (session?.isConnected && session.sock?.user) {
            socket.emit('connected', session.sock.user);
        } else if (session?.qr) {
            QRCode.toDataURL(session.qr, (err, url) => {
                if (!err) {
                    socket.emit('qr', url);
                }
            });
        } else {
            // Start new session
            connectToWhatsApp(sessionId, socket);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});

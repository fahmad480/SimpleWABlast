import express from 'express';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    path: '/socket.io',
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
});

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Global variables - Store multiple sessions
const sessions = new Map(); // sessionId -> { sock, isConnected, qr, socketClient }
const broadcastStatus = new Map(); // sessionId -> { isRunning, shouldStop }

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
async function connectToWhatsApp(sessionId, socketClient) {
    const sessionFolder = getSessionFolder(sessionId);
    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
    
    const sock = makeWASocket({
        auth: state
    });

    // Store session with socket client reference
    sessions.set(sessionId, {
        sock: sock,
        isConnected: false,
        qr: null,
        socketClient: socketClient
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr: newQr } = update;
        const session = sessions.get(sessionId);
        
        if (newQr) {
            session.qr = newQr;
            sessions.set(sessionId, session);
            console.log('QR Code generated for session:', sessionId);
            QRCode.toDataURL(newQr, (err, url) => {
                if (!err) {
                    // Emit to the stored socket client
                    if (session.socketClient && session.socketClient.connected) {
                        session.socketClient.emit('qr', url);
                        console.log('QR Code sent to client for session:', sessionId);
                    } else {
                        console.warn('Socket client not connected for session:', sessionId);
                    }
                } else {
                    console.error('Error generating QR code:', err);
                }
            });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            const statusCode = (lastDisconnect?.error)?.output?.statusCode;
            console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
            
            session.isConnected = false;
            sessions.set(sessionId, session);
            if (session.socketClient && session.socketClient.connected) {
                session.socketClient.emit('disconnected');
            }
            
            // If 401 error (unauthorized), clear the session and start fresh
            if (statusCode === 401) {
                console.log('401 Unauthorized - Clearing corrupted session:', sessionId);
                const sessionFolder = getSessionFolder(sessionId);
                try {
                    if (fs.existsSync(sessionFolder)) {
                        fs.rmSync(sessionFolder, { recursive: true, force: true });
                        console.log('Session folder deleted:', sessionFolder);
                    }
                    // Start fresh connection
                    connectToWhatsApp(sessionId, session.socketClient);
                } catch (err) {
                    console.error('Error clearing session:', err);
                }
            } else if (shouldReconnect) {
                connectToWhatsApp(sessionId, session.socketClient);
            }
        } else if (connection === 'open') {
            console.log('WhatsApp connected successfully for session:', sessionId);
            session.isConnected = true;
            sessions.set(sessionId, session);
            if (session.socketClient && session.socketClient.connected) {
                session.socketClient.emit('connected', sock.user);
            }
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

app.post('/clear-session/:sessionId', (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const sessionFolder = getSessionFolder(sessionId);
        
        // Remove from memory
        const session = sessions.get(sessionId);
        if (session?.sock) {
            try {
                session.sock.end();
            } catch (e) {
                console.log('Error ending socket:', e.message);
            }
        }
        sessions.delete(sessionId);
        
        // Delete session folder
        if (fs.existsSync(sessionFolder)) {
            fs.rmSync(sessionFolder, { recursive: true, force: true });
            console.log('Session folder deleted:', sessionFolder);
        }
        
        res.json({ success: true, message: 'Session cleared successfully' });
    } catch (error) {
        console.error('Clear session error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/send-broadcast/:sessionId', upload.single('mediaFile'), async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const { contacts, message, delay, sendWithCaption } = req.body;
        const session = sessions.get(sessionId);
        
        if (!session?.isConnected || !session.sock) {
            return res.status(400).json({ error: 'WhatsApp not connected' });
        }

        // Set broadcast status
        broadcastStatus.set(sessionId, { isRunning: true, shouldStop: false });

        const contactList = contacts.split('\n').filter(line => line.trim());
        const results = [];
        const mediaFile = req.file;
        const useCaptionMode = sendWithCaption === 'true';
        
        for (let i = 0; i < contactList.length; i++) {
            // Check if broadcast should stop
            const status = broadcastStatus.get(sessionId);
            if (status?.shouldStop) {
                io.emit('broadcast-stopped', { 
                    stopped: true, 
                    at: i, 
                    total: contactList.length,
                    message: 'Broadcasting dihentikan oleh user'
                });
                break;
            }
            const contact = contactList[i].trim();
            if (!contact) continue;
            
            const [nama, nomorhp] = contact.split(',').map(item => item.trim());
            
            if (!nama || !nomorhp) {
                results.push({ contact, status: 'error', message: 'Format tidak valid' });
                continue;
            }
            
            try {
                // Replace variables in message (case-insensitive, allow spaces inside braces)
                let personalizedMessage = message
                    .replace(/\{\s*nama\s*\}/gi, nama)
                    .replace(/\{\s*nomorhp\s*\}/gi, nomorhp);
                
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
                
                // Send message with or without media
                if (mediaFile) {
                    const mediaBuffer = fs.readFileSync(mediaFile.path);
                    const mimeType = mediaFile.mimetype;
                    
                    if (useCaptionMode) {
                        // Mode 1: Send file with caption (1 balloon)
                        let messageContent;
                        
                        if (mimeType.startsWith('image/')) {
                            messageContent = {
                                image: mediaBuffer,
                                caption: personalizedMessage
                            };
                        } else if (mimeType.startsWith('video/')) {
                            messageContent = {
                                video: mediaBuffer,
                                caption: personalizedMessage,
                                fileName: mediaFile.originalname
                            };
                        } else if (mimeType.startsWith('audio/')) {
                            // Audio doesn't support caption, send text first then audio
                            await session.sock.sendMessage(jid, { text: personalizedMessage });
                            messageContent = {
                                audio: mediaBuffer,
                                mimetype: mimeType,
                                fileName: mediaFile.originalname
                            };
                        } else {
                            // Document (PDF, DOC, etc.)
                            messageContent = {
                                document: mediaBuffer,
                                mimetype: mimeType,
                                fileName: mediaFile.originalname,
                                caption: personalizedMessage
                            };
                        }
                        
                        await session.sock.sendMessage(jid, messageContent);
                    } else {
                        // Mode 2: Send text and file separately (2 balloons)
                        // Send text first
                        await session.sock.sendMessage(jid, { text: personalizedMessage });
                        
                        // Small delay between messages
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        // Then send file
                        let fileContent;
                        if (mimeType.startsWith('image/')) {
                            fileContent = {
                                image: mediaBuffer
                            };
                        } else if (mimeType.startsWith('video/')) {
                            fileContent = {
                                video: mediaBuffer,
                                fileName: mediaFile.originalname
                            };
                        } else if (mimeType.startsWith('audio/')) {
                            fileContent = {
                                audio: mediaBuffer,
                                mimetype: mimeType,
                                fileName: mediaFile.originalname
                            };
                        } else {
                            fileContent = {
                                document: mediaBuffer,
                                mimetype: mimeType,
                                fileName: mediaFile.originalname
                            };
                        }
                        
                        await session.sock.sendMessage(jid, fileContent);
                    }
                } else {
                    await session.sock.sendMessage(jid, { text: personalizedMessage });
                }
                
                results.push({ 
                    contact: `${nama} (${nomorhp})`, 
                    status: 'success', 
                    message: mediaFile ? 'Pesan dengan file terkirim' : 'Pesan terkirim' 
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
        
        // Cleanup broadcast status
        broadcastStatus.delete(sessionId);
        
        // Cleanup uploaded file after broadcast
        if (mediaFile && fs.existsSync(mediaFile.path)) {
            fs.unlinkSync(mediaFile.path);
        }
        
        io.emit('broadcast-complete', results);
        res.json({ success: true, results });
        
    } catch (error) {
        console.error('Broadcast error:', error);
        // Cleanup broadcast status
        broadcastStatus.delete(req.params.sessionId);
        // Cleanup uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
});

// Get groups list for specific session
app.get('/groups/:sessionId', async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const session = sessions.get(sessionId);
        
        if (!session?.isConnected || !session.sock) {
            return res.status(400).json({ error: 'WhatsApp not connected' });
        }
        
        const groups = await session.sock.groupFetchAllParticipating();
        const myJid = session.sock.user.id;
        // Extract phone number from JID (format: 628xxx:xx@s.whatsapp.net or 628xxx@s.whatsapp.net)
        const myNumber = myJid.split('@')[0].split(':')[0];
        
        console.log('My JID:', myJid, 'My Number:', myNumber);
        
        const groupList = Object.values(groups).map(group => {
            // Check if current user is admin in this group
            const isAdmin = group.participants.some(p => {
                const participantNumber = p.id.split('@')[0].split(':')[0];
                const isMe = participantNumber === myNumber;
                const hasAdminRole = p.admin === 'admin' || p.admin === 'superadmin';
                return isMe && hasAdminRole;
            });
            
            return {
                id: group.id,
                subject: group.subject,
                participants: group.participants.length,
                // isAdmin: isAdmin
                isAdmin: true // For testing purposes, assume user is admin in all groups
            };
        });
        
        res.json({ success: true, groups: groupList });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: error.message });
    }
});

// Invite members to group
app.post('/invite-to-group/:sessionId', async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const { groupId, contacts, delay } = req.body;
        const session = sessions.get(sessionId);
        
        if (!session?.isConnected || !session.sock) {
            return res.status(400).json({ error: 'WhatsApp not connected' });
        }
        
        // Set invite status
        broadcastStatus.set(`invite_${sessionId}`, { isRunning: true, shouldStop: false });
        
        const contactList = contacts.split('\n').filter(line => line.trim());
        const results = [];
        
        for (let i = 0; i < contactList.length; i++) {
            // Check if invite should stop
            const status = broadcastStatus.get(`invite_${sessionId}`);
            if (status?.shouldStop) {
                io.emit('invite-stopped', { 
                    stopped: true, 
                    at: i, 
                    total: contactList.length,
                    message: 'Invite dihentikan oleh user'
                });
                break;
            }
            
            const contact = contactList[i].trim();
            if (!contact) continue;
            
            try {
                // Format phone number
                let formattedNumber = contact.replace(/[^0-9]/g, '');
                if (!formattedNumber.startsWith('62')) {
                    if (formattedNumber.startsWith('0')) {
                        formattedNumber = '62' + formattedNumber.substring(1);
                    } else {
                        formattedNumber = '62' + formattedNumber;
                    }
                }
                
                const jid = formattedNumber + '@s.whatsapp.net';
                
                // Add participant to group
                const response = await session.sock.groupParticipantsUpdate(
                    groupId,
                    [jid],
                    'add'
                );
                
                const result = response[0];
                let statusMessage = 'Berhasil di-invite';
                let statusType = 'success';
                
                if (result.status === '403') {
                    statusMessage = 'Gagal: Tidak punya izin';
                    statusType = 'error';
                } else if (result.status === '408') {
                    statusMessage = 'Gagal: Nomor baru keluar dari grup';
                    statusType = 'error';
                } else if (result.status === '409') {
                    statusMessage = 'Gagal: Sudah ada di grup';
                    statusType = 'error';
                } else if (result.status === '401') {
                    statusMessage = 'Gagal: Nomor tidak valid/tidak ada WA';
                    statusType = 'error';
                } else if (result.status !== '200' && result.status !== 200) {
                    statusMessage = `Gagal: Status ${result.status}`;
                    statusType = 'error';
                }
                
                results.push({ 
                    contact: formattedNumber, 
                    status: statusType, 
                    message: statusMessage 
                });
                
                // Emit progress to client
                io.emit('invite-progress', { 
                    current: i + 1, 
                    total: contactList.length, 
                    contact: formattedNumber,
                    status: statusType,
                    message: statusMessage
                });
                
            } catch (error) {
                console.error('Error inviting member:', error);
                
                let errorMessage = error.message;
                if (error.message.includes('not-authorized')) {
                    errorMessage = 'Anda bukan admin grup';
                } else if (error.message.includes('item-not-found')) {
                    errorMessage = 'Nomor tidak terdaftar di WhatsApp';
                }
                
                results.push({ 
                    contact: contact, 
                    status: 'error', 
                    message: errorMessage 
                });
                
                io.emit('invite-progress', { 
                    current: i + 1, 
                    total: contactList.length, 
                    contact: contact,
                    status: 'error',
                    error: errorMessage
                });
            }
            
            // Delay between invites
            if (i < contactList.length - 1 && delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }
        }
        
        // Cleanup invite status
        broadcastStatus.delete(`invite_${sessionId}`);
        
        io.emit('invite-complete', results);
        res.json({ success: true, results });
        
    } catch (error) {
        console.error('Invite error:', error);
        broadcastStatus.delete(`invite_${req.params.sessionId}`);
        res.status(500).json({ error: error.message });
    }
});

// Socket.IO events
io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.on('stop-invite', (sessionId) => {
        console.log('Stop invite requested for session:', sessionId);
        const status = broadcastStatus.get(`invite_${sessionId}`);
        if (status?.isRunning) {
            status.shouldStop = true;
            broadcastStatus.set(`invite_${sessionId}`, status);
        }
    });
    
    socket.on('stop-broadcast', (sessionId) => {
        console.log('Stop broadcast requested for session:', sessionId);
        const status = broadcastStatus.get(sessionId);
        if (status?.isRunning) {
            status.shouldStop = true;
            broadcastStatus.set(sessionId, status);
        }
    });
    
    socket.on('init-session', (sessionId) => {
        console.log('Initializing session:', sessionId);
        let session = sessions.get(sessionId);
        
        // Update socket client reference for this session
        if (session) {
            session.socketClient = socket;
            sessions.set(sessionId, session);
        }
        
        if (session?.isConnected && session.sock?.user) {
            console.log('Session already connected, sending user info');
            socket.emit('connected', session.sock.user);
        } else if (session?.qr) {
            console.log('Session has QR, sending to client');
            QRCode.toDataURL(session.qr, (err, url) => {
                if (!err) {
                    socket.emit('qr', url);
                } else {
                    console.error('Error generating QR from stored data:', err);
                }
            });
        } else {
            // Start new session
            console.log('Starting new WhatsApp connection for session:', sessionId);
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

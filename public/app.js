// Initialize Socket.IO
const socket = io();

// Generate or get session ID from localStorage
let sessionId = localStorage.getItem('wa_session_id');
if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('wa_session_id', sessionId);
}

console.log('Session ID:', sessionId);

// Display session ID in UI
document.getElementById('sessionDisplay').textContent = sessionId.substr(-8);

// DOM Elements
const loginSection = document.getElementById('loginSection');
const mainApp = document.getElementById('mainApp');
const qrContainer = document.getElementById('qrContainer');
const connectionStatus = document.getElementById('connectionStatus');
const statusText = document.getElementById('statusText');
const userInfo = document.getElementById('userInfo');
const broadcastForm = document.getElementById('broadcastForm');
const sendBtn = document.getElementById('sendBtn');
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const progressLog = document.getElementById('progressLog');
const totalSent = document.getElementById('totalSent');
const totalFailed = document.getElementById('totalFailed');
const totalContacts = document.getElementById('totalContacts');

// Statistics
let stats = {
    sent: 0,
    failed: 0,
    total: 0
};

// Local Storage functions
function saveToLocalStorage() {
    const contacts = document.getElementById('contacts').value;
    const message = document.getElementById('message').value;
    const delay = document.getElementById('delay').value;
    
    localStorage.setItem('wa_blast_contacts', contacts);
    localStorage.setItem('wa_blast_message', message);
    localStorage.setItem('wa_blast_delay', delay);
    localStorage.setItem('wa_blast_last_saved', new Date().toISOString());
    
    // Show indicators if data exists
    if (contacts.trim()) {
        document.getElementById('contactsLoadedIndicator').style.display = 'inline-block';
    } else {
        document.getElementById('contactsLoadedIndicator').style.display = 'none';
    }
    
    if (message.trim()) {
        document.getElementById('messageLoadedIndicator').style.display = 'inline-block';
    } else {
        document.getElementById('messageLoadedIndicator').style.display = 'none';
    }
}

function loadFromLocalStorage() {
    const contacts = localStorage.getItem('wa_blast_contacts');
    const message = localStorage.getItem('wa_blast_message');
    const delay = localStorage.getItem('wa_blast_delay');
    const lastSaved = localStorage.getItem('wa_blast_last_saved');
    
    if (contacts) {
        document.getElementById('contacts').value = contacts;
        document.getElementById('contactsLoadedIndicator').style.display = 'inline-block';
        // Update contact counter
        const contactList = contacts.split('\n').filter(line => line.trim());
        stats.total = contactList.length;
        document.getElementById('totalContacts').textContent = stats.total;
    }
    
    if (message) {
        document.getElementById('message').value = message;
        document.getElementById('messageLoadedIndicator').style.display = 'inline-block';
    }
    
    if (delay) {
        document.getElementById('delay').value = delay;
    }
    
    if (lastSaved && (contacts || message)) {
        const savedDate = new Date(lastSaved);
        const timeAgo = getTimeAgo(savedDate);
        addLogEntry(`Data terakhir dimuat (${timeAgo})`, 'info');
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} hari yang lalu`;
}

function clearLocalStorage() {
    if (confirm('Apakah Anda yakin ingin menghapus semua data tersimpan?')) {
        localStorage.removeItem('wa_blast_contacts');
        localStorage.removeItem('wa_blast_message');
        localStorage.removeItem('wa_blast_delay');
        localStorage.removeItem('wa_blast_last_saved');
        
        // Clear form fields
        document.getElementById('contacts').value = '';
        document.getElementById('message').value = '';
        document.getElementById('delay').value = '2';
        
        // Hide indicators
        document.getElementById('contactsLoadedIndicator').style.display = 'none';
        document.getElementById('messageLoadedIndicator').style.display = 'none';
        
        // Reset stats
        stats.total = 0;
        document.getElementById('totalContacts').textContent = '0';
        
        addLogEntry('Data tersimpan telah dihapus', 'info');
    }
}

function clearSession() {
    if (confirm('Apakah Anda yakin ingin menghapus session WhatsApp? Anda perlu login ulang.')) {
        localStorage.removeItem('wa_session_id');
        location.reload();
    }
}

// Check connection status on load
async function checkStatus() {
    try {
        const response = await fetch(`/status/${sessionId}`);
        const data = await response.json();
        
        if (data.connected && data.user) {
            showMainApp(data.user);
        } else {
            showLoginSection();
            // Initialize session with server
            socket.emit('init-session', sessionId);
        }
    } catch (error) {
        console.error('Error checking status:', error);
        showLoginSection();
        socket.emit('init-session', sessionId);
    }
}

// Show login section
function showLoginSection() {
    loginSection.style.display = 'block';
    mainApp.style.display = 'none';
    updateConnectionStatus(false);
}

// Show main application
function showMainApp(user) {
    loginSection.style.display = 'none';
    mainApp.style.display = 'block';
    updateConnectionStatus(true, user);
    
    // Load saved data from localStorage
    loadFromLocalStorage();
}

// Update connection status
function updateConnectionStatus(connected, user = null) {
    if (connected) {
        connectionStatus.classList.remove('status-disconnected');
        connectionStatus.classList.add('status-connected');
        statusText.textContent = 'Connected';
        
        if (user) {
            userInfo.textContent = `${user.name || user.id} (${user.id})`;
        }
    } else {
        connectionStatus.classList.remove('status-connected');
        connectionStatus.classList.add('status-disconnected');
        statusText.textContent = 'Disconnected';
    }
}

// Update statistics
function updateStats() {
    totalSent.textContent = stats.sent;
    totalFailed.textContent = stats.failed;
    totalContacts.textContent = stats.total;
}

// Add log entry
function addLogEntry(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const icon = type === 'success' ? 'bi-check-circle text-success' : 
                 type === 'error' ? 'bi-x-circle text-danger' : 
                 'bi-info-circle text-info';
    
    const logEntry = document.createElement('div');
    logEntry.className = 'progress-item';
    logEntry.innerHTML = `
        <small class="text-muted">${timestamp}</small><br>
        <i class="bi ${icon}"></i> ${message}
    `;
    
    progressLog.appendChild(logEntry);
    progressLog.scrollTop = progressLog.scrollHeight;
}

// Socket.IO Event Handlers
socket.on('qr', (qrDataURL) => {
    qrContainer.innerHTML = `
        <div class="text-center">
            <img src="${qrDataURL}" alt="QR Code" class="img-fluid" style="max-width: 300px;">
            <p class="mt-3">Scan QR Code dengan WhatsApp Anda</p>
        </div>
    `;
});

socket.on('connected', (user) => {
    showMainApp(user);
    addLogEntry(`Berhasil terhubung sebagai ${user.name || user.id}`, 'success');
});

socket.on('disconnected', () => {
    showLoginSection();
    addLogEntry('Koneksi WhatsApp terputus', 'error');
});

socket.on('broadcast-progress', (data) => {
    const percentage = (data.current / data.total) * 100;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${data.current} / ${data.total}`;
    
    if (data.status === 'success') {
        stats.sent++;
        addLogEntry(`✓ ${data.contact} - Pesan terkirim`, 'success');
    } else {
        stats.failed++;
        addLogEntry(`✗ ${data.contact} - ${data.error || 'Gagal mengirim'}`, 'error');
    }
    
    updateStats();
});

socket.on('broadcast-complete', (results) => {
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<i class="bi bi-send"></i> Mulai Broadcasting';
    
    addLogEntry(`Broadcasting selesai! ${stats.sent} berhasil, ${stats.failed} gagal`, 'info');
    
    // Hide progress section after 3 seconds
    setTimeout(() => {
        progressSection.style.display = 'none';
    }, 3000);
});

// Form submission
broadcastForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const contacts = document.getElementById('contacts').value.trim();
    const message = document.getElementById('message').value.trim();
    const delay = parseInt(document.getElementById('delay').value) || 2;
    
    if (!contacts || !message) {
        alert('Mohon isi daftar kontak dan template pesan!');
        return;
    }
    
    // Save to localStorage before sending
    saveToLocalStorage();
    
    // Reset statistics
    stats = { sent: 0, failed: 0, total: contacts.split('\n').filter(line => line.trim()).length };
    updateStats();
    
    // Show progress section
    progressSection.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = `0 / ${stats.total}`;
    
    // Clear previous logs
    progressLog.innerHTML = '';
    
    // Disable send button
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Mengirim...';
    
    addLogEntry('Memulai broadcasting...', 'info');
    
    try {
        const response = await fetch(`/send-broadcast/${sessionId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contacts,
                message,
                delay
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Terjadi kesalahan');
        }
        
    } catch (error) {
        console.error('Broadcast error:', error);
        addLogEntry(`Error: ${error.message}`, 'error');
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="bi bi-send"></i> Mulai Broadcasting';
    }
});

// Contact counter
document.getElementById('contacts').addEventListener('input', (e) => {
    const contacts = e.target.value.split('\n').filter(line => line.trim());
    stats.total = contacts.length;
    document.getElementById('totalContacts').textContent = stats.total;
    
    // Auto-save on input change
    saveToLocalStorage();
});

// Message character counter
document.getElementById('message').addEventListener('input', (e) => {
    const length = e.target.value.length;
    // Auto-save on input change
    saveToLocalStorage();
});

// Delay input change
document.getElementById('delay').addEventListener('input', (e) => {
    // Auto-save on input change
    saveToLocalStorage();
});

// Clear data button
document.getElementById('clearDataBtn').addEventListener('click', clearLocalStorage);

// Clear session button
document.getElementById('clearSessionBtn').addEventListener('click', clearSession);

// Disconnect button
document.getElementById('disconnectBtn').addEventListener('click', async () => {
    if (confirm('Apakah Anda yakin ingin memutus koneksi WhatsApp?')) {
        try {
            const response = await fetch(`/disconnect/${sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                addLogEntry('Koneksi WhatsApp terputus', 'info');
                showLoginSection();
                socket.emit('init-session', sessionId);
            } else {
                const error = await response.json();
                addLogEntry(`Error: ${error.error}`, 'error');
            }
        } catch (error) {
            console.error('Disconnect error:', error);
            addLogEntry(`Error: ${error.message}`, 'error');
        }
    }
});

// Initialize app
checkStatus();

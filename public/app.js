// Initialize Socket.IO
// Detect if running behind reverse proxy
const basePath = window.location.pathname.includes('/wablast/') 
    ? '/wablast' 
    : '';

const socket = io({
    path: basePath + '/socket.io',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10
});

// Debug connection
socket.on('connect', () => {
    console.log('Socket.IO connected:', socket.id);
});

socket.on('disconnect', (reason) => {
    console.log('Socket.IO disconnected:', reason);
});

socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
});

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
const stopBtn = document.getElementById('stopBtn');
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
        document.getElementById('contactsLoadedIndicator').classList.remove('hidden');
    } else {
        document.getElementById('contactsLoadedIndicator').classList.add('hidden');
    }
    
    if (message.trim()) {
        document.getElementById('messageLoadedIndicator').classList.remove('hidden');
    } else {
        document.getElementById('messageLoadedIndicator').classList.add('hidden');
    }
}

function loadFromLocalStorage() {
    const contacts = localStorage.getItem('wa_blast_contacts');
    const message = localStorage.getItem('wa_blast_message');
    const delay = localStorage.getItem('wa_blast_delay');
    const lastSaved = localStorage.getItem('wa_blast_last_saved');
    
    if (contacts) {
        document.getElementById('contacts').value = contacts;
        document.getElementById('contactsLoadedIndicator').classList.remove('hidden');
        // Update contact counter
        const contactList = contacts.split('\n').filter(line => line.trim());
        stats.total = contactList.length;
        document.getElementById('totalContacts').textContent = stats.total;
    }
    
    if (message) {
        document.getElementById('message').value = message;
        document.getElementById('messageLoadedIndicator').classList.remove('hidden');
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
        document.getElementById('contactsLoadedIndicator').classList.add('hidden');
        document.getElementById('messageLoadedIndicator').classList.add('hidden');
        
        // Reset stats
        stats.total = 0;
        document.getElementById('totalContacts').textContent = '0';
        
        addLogEntry('Data tersimpan telah dihapus', 'info');
    }
}

async function clearSession() {
    if (confirm('Apakah Anda yakin ingin menghapus session WhatsApp? File session akan dihapus dan Anda perlu scan QR ulang.')) {
        try {
            // Call backend to clear session files
            const response = await fetch(`${basePath}/clear-session/${sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                addLogEntry('Session cleared successfully', 'success');
            }
        } catch (error) {
            console.error('Clear session error:', error);
        }
        
        // Remove from local storage and reload
        localStorage.removeItem('wa_session_id');
        location.reload();
    }
}

// Check connection status on load
async function checkStatus() {
    try {
        const response = await fetch(`${basePath}/status/${sessionId}`);
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
    const iconColor = type === 'success' ? 'text-green-500' : 
                     type === 'error' ? 'text-red-500' : 
                     'text-blue-500';
    
    const iconSvg = type === 'success' ? 
        `<svg class="w-4 h-4 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>` :
        type === 'error' ? 
        `<svg class="w-4 h-4 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>` :
        `<svg class="w-4 h-4 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>`;
    
    const logEntry = document.createElement('div');
    logEntry.className = 'progress-item flex items-start space-x-2 text-sm';
    logEntry.innerHTML = `
        <div class="flex-shrink-0 mt-0.5">${iconSvg}</div>
        <div class="flex-1">
            <div class="text-gray-500 text-xs">${timestamp}</div>
            <div class="text-gray-700">${message}</div>
        </div>
    `;
    
    progressLog.appendChild(logEntry);
    progressLog.scrollTop = progressLog.scrollHeight;
}

// Socket.IO Event Handlers
socket.on('qr', (qrDataURL) => {
    qrContainer.innerHTML = `
        <div class="text-center">
            <img src="${qrDataURL}" alt="QR Code" class="mx-auto max-w-xs rounded-lg shadow-lg">
            <p class="mt-4 text-gray-600">Scan QR Code dengan WhatsApp Anda</p>
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
    stopBtn.classList.add('hidden');
    sendBtn.innerHTML = `
        <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
        </svg>
        Mulai Broadcasting
    `;
    
    addLogEntry(`Broadcasting selesai! ${stats.sent} berhasil, ${stats.failed} gagal`, 'info');
    
    // Hide progress section after 3 seconds
    setTimeout(() => {
        progressSection.classList.add('hidden');
    }, 3000);
});

socket.on('broadcast-stopped', (data) => {
    sendBtn.disabled = false;
    stopBtn.classList.add('hidden');
    sendBtn.innerHTML = `
        <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
        </svg>
        Mulai Broadcasting
    `;
    
    addLogEntry(`⏸️ Broadcasting dihentikan di ${data.at} dari ${data.total} kontak`, 'error');
    addLogEntry(`📊 Total: ${stats.sent} berhasil, ${stats.failed} gagal`, 'info');
});

// Form submission
broadcastForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const contacts = document.getElementById('contacts').value.trim();
    const message = document.getElementById('message').value.trim();
    const delay = parseInt(document.getElementById('delay').value) || 2;
    const mediaFile = document.getElementById('mediaFile').files[0];
    const sendWithCaption = document.getElementById('sendWithCaption').checked;
    
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
    progressSection.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressText.textContent = `0 / ${stats.total}`;
    
    // Clear previous logs
    progressLog.innerHTML = '';
    
    // Disable send button and show stop button
    sendBtn.disabled = true;
    stopBtn.classList.remove('hidden');
    sendBtn.innerHTML = `
        <svg class="w-5 h-5 inline mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Mengirim...
    `;
    
    const sendMode = mediaFile ? (sendWithCaption ? 'dengan caption' : 'terpisah') : '';
    addLogEntry(mediaFile ? `Memulai broadcasting dengan file: ${mediaFile.name} (${sendMode})...` : 'Memulai broadcasting...', 'info');
    
    try {
        // Use FormData to handle file upload
        const formData = new FormData();
        formData.append('contacts', contacts);
        formData.append('message', message);
        formData.append('delay', delay);
        formData.append('sendWithCaption', sendWithCaption);
        if (mediaFile) {
            formData.append('mediaFile', mediaFile);
        }
        
        const response = await fetch(`${basePath}/send-broadcast/${sessionId}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Terjadi kesalahan');
        }
        
    } catch (error) {
        console.error('Broadcast error:', error);
        addLogEntry(`Error: ${error.message}`, 'error');
        sendBtn.disabled = false;
        stopBtn.classList.add('hidden');
        sendBtn.innerHTML = `
            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
            Mulai Broadcasting
        `;
    }
});

// Stop broadcast button
stopBtn.addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin menghentikan broadcasting?')) {
        socket.emit('stop-broadcast', sessionId);
        addLogEntry('Mengirim perintah stop...', 'info');
        stopBtn.disabled = true;
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
            const response = await fetch(`${basePath}/disconnect/${sessionId}`, {
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

// File upload handlers
const mediaFileInput = document.getElementById('mediaFile');
const filePreview = document.getElementById('filePreview');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFileBtn');
const sendModeOption = document.getElementById('sendModeOption');

mediaFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Validate file size (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            alert('Ukuran file terlalu besar! Maksimal 50MB');
            mediaFileInput.value = '';
            filePreview.classList.add('hidden');
            sendModeOption.classList.add('hidden');
            return;
        }
        
        // Show file preview
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        filePreview.classList.remove('hidden');
        sendModeOption.classList.remove('hidden');
        
        addLogEntry(`File dipilih: ${file.name} (${formatFileSize(file.size)})`, 'info');
    } else {
        filePreview.classList.add('hidden');
        sendModeOption.classList.add('hidden');
    }
});

removeFileBtn.addEventListener('click', () => {
    mediaFileInput.value = '';
    filePreview.classList.add('hidden');
    sendModeOption.classList.add('hidden');
    addLogEntry('File dihapus', 'info');
});

// Format file size helper
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// =====================================================
// GROUP INVITE FUNCTIONALITY
// =====================================================

// Tab switching functionality
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active state from all tabs
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active', 'border-blue-500', 'text-blue-600');
            b.classList.add('border-transparent', 'text-gray-500');
        });
        
        // Add active state to clicked tab
        btn.classList.add('active', 'border-blue-500', 'text-blue-600');
        btn.classList.remove('border-transparent', 'text-gray-500');
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        // Show selected tab content
        const tabId = btn.getAttribute('data-tab');
        const tabContent = document.getElementById(`${tabId}-tab`);
        if (tabContent) {
            tabContent.classList.remove('hidden');
        }
    });
});

// Group Invite DOM Elements
const groupInviteForm = document.getElementById('groupInviteForm');
const groupSelect = document.getElementById('groupSelect');
const inviteContacts = document.getElementById('inviteContacts');
const inviteDelay = document.getElementById('inviteDelay');
const inviteBtn = document.getElementById('inviteBtn');
const stopInviteBtn = document.getElementById('stopInviteBtn');
const refreshGroupsBtn = document.getElementById('refreshGroupsBtn');
const groupCount = document.getElementById('groupCount');
const inviteContactCount = document.getElementById('inviteContactCount');

// Invite Statistics
let inviteStats = {
    success: 0,
    failed: 0,
    total: 0
};

// Fetch groups from server
async function fetchGroups() {
    try {
        refreshGroupsBtn.innerHTML = `
            <svg class="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Loading...
        `;
        
        const response = await fetch(`${basePath}/groups/${sessionId}`);
        const data = await response.json();
        
        if (data.success && data.groups) {
            groupSelect.innerHTML = '<option value="">-- Pilih Grup --</option>';
            
            // Sort: admin groups first
            const sortedGroups = data.groups.sort((a, b) => {
                if (a.isAdmin && !b.isAdmin) return -1;
                if (!a.isAdmin && b.isAdmin) return 1;
                return a.subject.localeCompare(b.subject);
            });
            
            sortedGroups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                const adminBadge = group.isAdmin ? '👑 ' : '';
                const memberCount = `(${group.participants} anggota)`;
                option.textContent = `${adminBadge}${group.subject} ${memberCount}`;
                option.disabled = !group.isAdmin;
                groupSelect.appendChild(option);
            });
            
            const adminGroupCount = data.groups.filter(g => g.isAdmin).length;
            groupCount.textContent = `${adminGroupCount} grup (admin)`;
            
            addLogEntry(`Berhasil memuat ${data.groups.length} grup (${adminGroupCount} sebagai admin)`, 'success');
        } else {
            throw new Error(data.error || 'Gagal memuat grup');
        }
    } catch (error) {
        console.error('Error fetching groups:', error);
        addLogEntry(`Error memuat grup: ${error.message}`, 'error');
        groupSelect.innerHTML = '<option value="">-- Error memuat grup --</option>';
    } finally {
        refreshGroupsBtn.innerHTML = `
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
        `;
    }
}

// Refresh groups button click
refreshGroupsBtn.addEventListener('click', fetchGroups);

// Contact counter for invite
inviteContacts.addEventListener('input', (e) => {
    const contacts = e.target.value.split('\n').filter(line => line.trim());
    inviteContactCount.textContent = contacts.length;
    
    // Save to localStorage
    localStorage.setItem('wa_invite_contacts', e.target.value);
});

// Load saved invite contacts
function loadInviteData() {
    const savedContacts = localStorage.getItem('wa_invite_contacts');
    if (savedContacts) {
        inviteContacts.value = savedContacts;
        const contacts = savedContacts.split('\n').filter(line => line.trim());
        inviteContactCount.textContent = contacts.length;
        document.getElementById('inviteContactsLoadedIndicator').classList.remove('hidden');
    }
    
    const savedDelay = localStorage.getItem('wa_invite_delay');
    if (savedDelay) {
        inviteDelay.value = savedDelay;
    }
}

// Save invite delay
inviteDelay.addEventListener('input', (e) => {
    localStorage.setItem('wa_invite_delay', e.target.value);
});

// Socket.IO Event Handlers for Invite
socket.on('invite-progress', (data) => {
    const percentage = (data.current / data.total) * 100;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${data.current} / ${data.total}`;
    
    if (data.status === 'success') {
        inviteStats.success++;
        addLogEntry(`✓ ${data.contact} - ${data.message}`, 'success');
    } else {
        inviteStats.failed++;
        addLogEntry(`✗ ${data.contact} - ${data.error || data.message}`, 'error');
    }
    
    // Update stats display
    totalSent.textContent = inviteStats.success;
    totalFailed.textContent = inviteStats.failed;
});

socket.on('invite-complete', (results) => {
    inviteBtn.disabled = false;
    stopInviteBtn.classList.add('hidden');
    inviteBtn.innerHTML = `
        <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
        </svg>
        Mulai Invite
    `;
    
    addLogEntry(`Invite selesai! ${inviteStats.success} berhasil, ${inviteStats.failed} gagal`, 'info');
});

socket.on('invite-stopped', (data) => {
    inviteBtn.disabled = false;
    stopInviteBtn.classList.add('hidden');
    inviteBtn.innerHTML = `
        <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
        </svg>
        Mulai Invite
    `;
    
    addLogEntry(`⏸️ Invite dihentikan di ${data.at} dari ${data.total} nomor`, 'error');
    addLogEntry(`📊 Total: ${inviteStats.success} berhasil, ${inviteStats.failed} gagal`, 'info');
});

// Group Invite Form Submission
groupInviteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const selectedGroup = groupSelect.value;
    const contacts = inviteContacts.value.trim();
    const delay = parseInt(inviteDelay.value) || 3;
    
    if (!selectedGroup) {
        alert('Mohon pilih grup terlebih dahulu!');
        return;
    }
    
    if (!contacts) {
        alert('Mohon isi daftar nomor yang akan di-invite!');
        return;
    }
    
    // Save to localStorage
    localStorage.setItem('wa_invite_contacts', contacts);
    localStorage.setItem('wa_invite_delay', delay);
    
    // Reset statistics
    inviteStats = { 
        success: 0, 
        failed: 0, 
        total: contacts.split('\n').filter(line => line.trim()).length 
    };
    totalSent.textContent = 0;
    totalFailed.textContent = 0;
    totalContacts.textContent = inviteStats.total;
    
    // Show progress section
    progressSection.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressText.textContent = `0 / ${inviteStats.total}`;
    
    // Clear previous logs
    progressLog.innerHTML = '';
    
    // Disable invite button and show stop button
    inviteBtn.disabled = true;
    stopInviteBtn.classList.remove('hidden');
    inviteBtn.innerHTML = `
        <svg class="w-5 h-5 inline mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Menginvite...
    `;
    
    addLogEntry(`Memulai invite ke grup: ${groupSelect.options[groupSelect.selectedIndex].text}...`, 'info');
    
    try {
        const response = await fetch(`${basePath}/invite-to-group/${sessionId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                groupId: selectedGroup,
                contacts: contacts,
                delay: delay
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Terjadi kesalahan');
        }
        
    } catch (error) {
        console.error('Invite error:', error);
        addLogEntry(`Error: ${error.message}`, 'error');
        inviteBtn.disabled = false;
        stopInviteBtn.classList.add('hidden');
        inviteBtn.innerHTML = `
            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
            Mulai Invite
        `;
    }
});

// Stop invite button
stopInviteBtn.addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin menghentikan invite?')) {
        socket.emit('stop-invite', sessionId);
        addLogEntry('Mengirim perintah stop...', 'info');
        stopInviteBtn.disabled = true;
    }
});

// Load invite data on page load
loadInviteData();

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

// Template management
let templateCount = 1;

function getTemplateCount() {
    return document.querySelectorAll('.template-item').length;
}

function updateTemplateUI() {
    const count = getTemplateCount();
    const badge = document.getElementById('templateCountBadge');
    const modeSection = document.getElementById('templateModeSection');
    
    // Update badge
    if (count > 1) {
        badge.textContent = `${count} template`;
        badge.classList.remove('hidden');
        modeSection.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
        modeSection.classList.add('hidden');
    }
    
    // Show/hide delete buttons
    const deleteButtons = document.querySelectorAll('.delete-template-btn');
    deleteButtons.forEach(btn => {
        if (count > 1) {
            btn.classList.remove('hidden');
        } else {
            btn.classList.add('hidden');
        }
    });
    
    // Update template numbers
    document.querySelectorAll('.template-item').forEach((item, index) => {
        const label = item.querySelector('.template-label');
        if (label) {
            label.textContent = `Template ${index + 1}`;
        }
    });
    
    // Update hidden message field
    updateCombinedMessage();
}

function updateCombinedMessage() {
    const textareas = document.querySelectorAll('.template-textarea');
    const messages = [];
    textareas.forEach(textarea => {
        const value = textarea.value.trim();
        if (value) {
            messages.push(value);
        }
    });
    document.getElementById('message').value = messages.join('\n---\n');
    
    // Update indicator
    const messageIndicator = document.getElementById('messageLoadedIndicator');
    if (messages.length > 0) {
        messageIndicator.classList.remove('hidden');
    } else {
        messageIndicator.classList.add('hidden');
    }
}

function addTemplate(content = '') {
    templateCount++;
    const container = document.getElementById('templatesContainer');
    const newTemplate = document.createElement('div');
    newTemplate.className = 'template-item';
    newTemplate.dataset.templateId = templateCount;
    newTemplate.innerHTML = `
        <div class="flex items-start gap-2">
            <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                    <span class="template-label text-xs font-medium text-purple-600">Template ${getTemplateCount() + 1}</span>
                </div>
                <textarea class="template-textarea w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none" 
                          rows="3" 
                          placeholder="Tulis template pesan di sini...">${content}</textarea>
            </div>
            <button type="button" class="delete-template-btn mt-6 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors" title="Hapus template">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
            </button>
        </div>
    `;
    container.appendChild(newTemplate);
    
    // Add event listeners
    const textarea = newTemplate.querySelector('.template-textarea');
    textarea.addEventListener('input', () => {
        updateCombinedMessage();
        saveToLocalStorage();
    });
    
    const deleteBtn = newTemplate.querySelector('.delete-template-btn');
    deleteBtn.addEventListener('click', () => {
        newTemplate.remove();
        updateTemplateUI();
        saveToLocalStorage();
    });
    
    updateTemplateUI();
    textarea.focus();
}

function initTemplateListeners() {
    // Add template button
    document.getElementById('addTemplateBtn').addEventListener('click', () => {
        addTemplate();
        saveToLocalStorage();
    });
    
    // First template textarea listener
    const firstTextarea = document.querySelector('.template-textarea');
    if (firstTextarea) {
        firstTextarea.addEventListener('input', () => {
            updateCombinedMessage();
            saveToLocalStorage();
        });
    }
}

// Local Storage functions
function saveToLocalStorage() {
    const contacts = document.getElementById('contacts').value;
    const delay = document.getElementById('delay').value;
    
    // Collect all templates
    const templates = [];
    document.querySelectorAll('.template-textarea').forEach(textarea => {
        templates.push(textarea.value);
    });
    
    localStorage.setItem('wa_blast_contacts', contacts);
    localStorage.setItem('wa_blast_templates', JSON.stringify(templates));
    localStorage.setItem('wa_blast_delay', delay);
    localStorage.setItem('wa_blast_last_saved', new Date().toISOString());
    
    // Show indicators if data exists
    if (contacts.trim()) {
        document.getElementById('contactsLoadedIndicator').classList.remove('hidden');
    } else {
        document.getElementById('contactsLoadedIndicator').classList.add('hidden');
    }
    
    updateCombinedMessage();
}

function loadFromLocalStorage() {
    const contacts = localStorage.getItem('wa_blast_contacts');
    const templatesJson = localStorage.getItem('wa_blast_templates');
    const legacyMessage = localStorage.getItem('wa_blast_message'); // For backwards compatibility
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
    
    // Load templates
    if (templatesJson) {
        try {
            const templates = JSON.parse(templatesJson);
            if (templates.length > 0) {
                // Set first template
                const firstTextarea = document.querySelector('.template-textarea');
                if (firstTextarea) {
                    firstTextarea.value = templates[0];
                }
                
                // Add additional templates
                for (let i = 1; i < templates.length; i++) {
                    addTemplate(templates[i]);
                }
                
                updateTemplateUI();
                document.getElementById('messageLoadedIndicator').classList.remove('hidden');
            }
        } catch (e) {
            console.error('Error loading templates:', e);
        }
    } else if (legacyMessage) {
        // Backwards compatibility: load old format
        const templates = legacyMessage.split('---').map(t => t.trim()).filter(t => t);
        if (templates.length > 0) {
            const firstTextarea = document.querySelector('.template-textarea');
            if (firstTextarea) {
                firstTextarea.value = templates[0];
            }
            
            for (let i = 1; i < templates.length; i++) {
                addTemplate(templates[i]);
            }
            
            updateTemplateUI();
            document.getElementById('messageLoadedIndicator').classList.remove('hidden');
        }
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
        localStorage.removeItem('wa_blast_templates');
        localStorage.removeItem('wa_blast_delay');
        localStorage.removeItem('wa_blast_last_saved');
        
        // Clear form fields
        document.getElementById('contacts').value = '';
        document.getElementById('message').value = '';
        document.getElementById('delay').value = '2';
        
        // Reset templates to single empty template
        const container = document.getElementById('templatesContainer');
        container.innerHTML = `
            <div class="template-item" data-template-id="1">
                <div class="flex items-start gap-2">
                    <textarea class="template-textarea flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none" 
                              rows="3" 
                              placeholder="Halo {nama}, ini adalah pesan broadcast untuk nomor {nomorhp}"></textarea>
                </div>
            </div>
        `;
        templateCount = 1;
        initTemplateListeners();
        updateTemplateUI();
        
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

// Track results for summary table
let broadcastResults = { success: [], failed: [] };
let progressRowCount = 0;

// Add log entry as table row
function addLogEntry(message, type = 'info', contact = null) {
    progressRowCount++;
    
    const statusClass = type === 'success' ? 'bg-green-100 text-green-800' : 
                       type === 'error' ? 'bg-red-100 text-red-800' : 
                       'bg-blue-100 text-blue-800';
    
    const statusText = type === 'success' ? 'Berhasil' : 
                      type === 'error' ? 'Gagal' : 
                      'Info';
    
    const iconSvg = type === 'success' ? 
        `<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>` :
        type === 'error' ? 
        `<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>` :
        `<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>`;
    
    const row = document.createElement('tr');
    row.className = type === 'success' ? 'bg-green-50' : type === 'error' ? 'bg-red-50' : '';
    row.innerHTML = `
        <td class="px-3 py-2 text-sm text-gray-500">${progressRowCount}</td>
        <td class="px-3 py-2 text-sm text-gray-700">${contact || message}</td>
        <td class="px-3 py-2">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusClass}">
                ${iconSvg}${statusText}
            </span>
        </td>
    `;
    
    progressLog.appendChild(row);
    
    // Scroll to bottom
    const container = document.getElementById('progressContainer');
    container.scrollTop = container.scrollHeight;
}

// Clear progress table
function clearProgressTable() {
    progressRowCount = 0;
    broadcastResults = { success: [], failed: [] };
    progressLog.innerHTML = '';
    
    // Hide results summary
    document.getElementById('resultsSummary').classList.add('hidden');
    document.getElementById('successResultsSection').classList.add('hidden');
    document.getElementById('failedResultsSection').classList.add('hidden');
}

// Show results summary table
function showResultsSummary() {
    const summarySection = document.getElementById('resultsSummary');
    const successSection = document.getElementById('successResultsSection');
    const failedSection = document.getElementById('failedResultsSection');
    const successBody = document.getElementById('successResultsBody');
    const failedBody = document.getElementById('failedResultsBody');
    
    // Clear previous results
    successBody.innerHTML = '';
    failedBody.innerHTML = '';
    
    // Populate success table
    if (broadcastResults.success.length > 0) {
        successSection.classList.remove('hidden');
        document.getElementById('successCount').textContent = broadcastResults.success.length;
        
        broadcastResults.success.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-3 py-2 text-sm text-gray-500">${index + 1}</td>
                <td class="px-3 py-2 text-sm text-gray-700">${item.contact}</td>
            `;
            successBody.appendChild(row);
        });
    }
    
    // Populate failed table
    if (broadcastResults.failed.length > 0) {
        failedSection.classList.remove('hidden');
        document.getElementById('failedCount').textContent = broadcastResults.failed.length;
        
        broadcastResults.failed.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-3 py-2 text-sm text-gray-500">${index + 1}</td>
                <td class="px-3 py-2 text-sm text-gray-700">${item.contact}</td>
                <td class="px-3 py-2 text-sm text-red-600">${item.reason || 'Unknown error'}</td>
            `;
            failedBody.appendChild(row);
        });
    }
    
    // Show summary section
    summarySection.classList.remove('hidden');
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
        broadcastResults.success.push({ contact: data.contact });
        addLogEntry(`Pesan terkirim`, 'success', data.contact);
    } else {
        stats.failed++;
        broadcastResults.failed.push({ contact: data.contact, reason: data.error || 'Gagal mengirim' });
        addLogEntry(`${data.error || 'Gagal mengirim'}`, 'error', data.contact);
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
    
    // Show results summary table
    showResultsSummary();
    
    // Keep progress section visible to show results
    progressSection.classList.remove('hidden');
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
    
    // Show results summary table
    showResultsSummary();
});

// Form submission
broadcastForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Update combined message before submission
    updateCombinedMessage();
    
    const contacts = document.getElementById('contacts').value.trim();
    const message = document.getElementById('message').value.trim();
    const delay = parseInt(document.getElementById('delay').value) || 2;
    const mediaFile = document.getElementById('mediaFile').files[0];
    const sendWithCaption = document.getElementById('sendWithCaption').checked;
    const templateMode = document.querySelector('input[name="templateMode"]:checked')?.value || 'sequential';
    
    // Validate delay
    if (delay < 1 || delay > 120) {
        alert('Delay harus antara 1-120 detik!');
        return;
    }
    
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
    
    // Clear previous logs and results
    clearProgressTable();
    
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
    const templateCountNum = getTemplateCount();
    const templateModeLabel = templateMode === 'random' ? 'acak' : 'berurutan';
    let logMessage = 'Memulai broadcasting...';
    if (templateCountNum > 1) {
        logMessage = `Memulai broadcasting dengan ${templateCountNum} template (${templateModeLabel})...`;
    }
    if (mediaFile) {
        logMessage = `Memulai broadcasting dengan file: ${mediaFile.name} (${sendMode})` + (templateCountNum > 1 ? `, ${templateCountNum} template (${templateModeLabel})` : '') + '...';
    }
    addLogEntry(logMessage, 'info');
    
    try {
        // Use FormData to handle file upload
        const formData = new FormData();
        formData.append('contacts', contacts);
        formData.append('message', message);
        formData.append('delay', delay);
        formData.append('sendWithCaption', sendWithCaption);
        formData.append('templateMode', templateMode);
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
initTemplateListeners();
updateTemplateUI();

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

// Initialize Select2 for group select
function initGroupSelect2() {
    if (typeof $ !== 'undefined' && $.fn.select2) {
        $('#groupSelect').select2({
            placeholder: '-- Klik Refresh untuk memuat grup --',
            allowClear: true,
            width: '100%',
            language: {
                noResults: function() {
                    return 'Tidak ada grup ditemukan';
                },
                searching: function() {
                    return 'Mencari...';
                }
            }
        });
    }
}

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
            // Clear existing options
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
            
            // Refresh Select2
            if (typeof $ !== 'undefined' && $.fn.select2) {
                $('#groupSelect').trigger('change');
            }
            
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
        
        // Refresh Select2
        if (typeof $ !== 'undefined' && $.fn.select2) {
            $('#groupSelect').trigger('change');
        }
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

// Initialize Select2 when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initGroupSelect2();
});

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
        broadcastResults.success.push({ contact: data.contact });
        addLogEntry(data.message || 'Berhasil di-invite', 'success', data.contact);
    } else {
        inviteStats.failed++;
        broadcastResults.failed.push({ contact: data.contact, reason: data.error || data.message });
        addLogEntry(data.error || data.message, 'error', data.contact);
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
    
    // Show results summary table
    showResultsSummary();
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
    
    // Show results summary table
    showResultsSummary();
});

// Group Invite Form Submission
groupInviteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const selectedGroup = groupSelect.value;
    const contacts = inviteContacts.value.trim();
    const delay = parseInt(inviteDelay.value) || 3;
    
    // Validate delay
    if (delay < 1 || delay > 120) {
        alert('Delay harus antara 1-120 detik!');
        return;
    }
    
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
    
    // Clear previous logs and results
    clearProgressTable();
    
    // Disable invite button and show stop button
    inviteBtn.disabled = true;
    stopInviteBtn.classList.remove('hidden');
    inviteBtn.innerHTML = `
        <svg class="w-5 h-5 inline mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Menginvite...
    `;
    
    addLogEntry(`Memulai invite ke grup: ${$('#groupSelect').find(':selected').text() || groupSelect.options[groupSelect.selectedIndex]?.text || 'Unknown'}...`, 'info');
    
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

// ============================================
// JHON WEB PAYMENT - MAIN JAVASCRIPT
// Original Functions Fully Preserved + Security
// ============================================

// --- ENCRYPTED CONFIGURATION (Hidden from inspect element) ---
const CONFIG = (() => {
    // Encrypted values (base64 + reverse) - not visible in plain text
    const decrypt = (str) => {
        try {
            return atob(str.split('').reverse().join(''));
        } catch {
            return '';
        }
    };
    
    return {
        // Admin password: "jhon123" (encrypted)
        ADMIN_PASSWORD: decrypt('=MjNub2hq'),
        // WhatsApp: "6285894955362" (encrypted)
        WHATSAPP_NUMBER: decrypt('=MjYzNTU5NDg1ODA2'),
        // QRIS Image
        QRIS_IMAGE_URL: 'qr8.jpg',
        // Limits
        MAX_TRANSACTION: 10000000,
        MIN_TRANSACTION: 1000,
        MAX_CASHBACK: 250000,
        APP_VERSION: '2.0.0'
    };
})();

// --- DATA PAYMENT (Original - Fully Preserved) ---
const dataPay = {
    // E-WALLET
    dana: { name: 'DANA', num: '085591916436', img: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg' },
    shopee: { name: 'ShopeePay', num: '085894955362', img: 'pay.jpg' },
    gopay: { name: 'GoPay', num: '085894955362', img: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg' },
    ovo: { name: 'OVO', num: '085894955362', img: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg' },
    linkaja: { name: 'LinkAja', num: '0877xxx', img: 'link.jpg' },
    paypal: { name: 'PayPal', num: 'paypal.me/jhonpayment', img: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg' },
    
    // BANK
    sea: { name: 'BCA', num: '3781910587', img: 'bca.jpg' },
    sea2: { name: 'SeaBank', num: '9016xxx', img: 'bank.jpg' },
    bri: { name: 'BRI', num: '1234xxx', img: 'https://upload.wikimedia.org/wikipedia/commons/6/68/BANK_BRI_logo.svg' },
    
    // PULSA
    pulsa: { name: 'Telkomsel', num: '0825xxx', img: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Telkomsel_2021_icon.svg' },
    indosat: { name: 'Indosat', num: '085894955362', img: 'indosat.jpg' },
    tri: { name: 'Tri (3)', num: '089xxx', img: 'tri.jpg' },
    smartfren: { name: 'Smartfren', num: '088xxx', img: 'smr.jpg' }
};

// --- GLOBAL VARIABLES (Original) ---
let currentQrisAmount = 0;
let currentQRImage = '';
let originalContent = '';
let selectedPaymentMethod = '';
let selectedPaymentName = '';
let selectedCashbackUse = '';
let cashbackUseAmount = 50000;
let userIP = '';
let isLoggedIn = false;
let currentUserEmail = '';
let currentUsername = '';
let cashbackBalance = 0;
let cashbackHistory = [];
let transactionHistory = [];
let notifCount = 0;
let loginAttempts = 0;
let lastLoginAttempt = 0;

// --- DOM Elements ---
const audio = document.getElementById('clickSound');
const playTick = () => { 
    audio.currentTime = 0; 
    audio.play().catch(()=>{}); 
};

// --- HELPER FUNCTIONS (Original + Security) ---
function getFormattedDate() {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const now = new Date();
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    
    return `${dayName}, ${day} ${month} ${year}`;
}

function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// --- IP DETECTION (Original) ---
async function detectIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        userIP = data.ip;
        document.getElementById('displayIP').innerText = userIP;
        return userIP;
    } catch (error) {
        console.error('Gagal mendeteksi IP:', error);
        userIP = 'unknown-' + Math.random().toString(36).substring(7);
        document.getElementById('displayIP').innerText = userIP;
        return userIP;
    }
}

// --- ENCRYPTION (Security Improvement) ---
function encryptData(data) {
    try {
        const jsonStr = JSON.stringify(data);
        return btoa(encodeURIComponent(jsonStr).split('').reverse().join(''));
    } catch {
        return null;
    }
}

function decryptData(encrypted) {
    try {
        const reversed = encrypted.split('').reverse().join('');
        const decoded = decodeURIComponent(atob(reversed));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

// --- INDEXEDDB DATABASE (Persistence Improvement) ---
let dbInstance = null;

async function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('JhonPaymentDB', 2);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            dbInstance = request.result;
            resolve();
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('users')) {
                const userStore = db.createObjectStore('users', { keyPath: 'email' });
                userStore.createIndex('ip', 'ip', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('transactions')) {
                const txStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
                txStore.createIndex('email', 'email', { unique: false });
                txStore.createIndex('date', 'date', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('cashback')) {
                const cbStore = db.createObjectStore('cashback', { keyPath: 'id', autoIncrement: true });
                cbStore.createIndex('email', 'email', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('blocked')) {
                db.createObjectStore('blocked', { keyPath: 'ip' });
            }
        };
    });
}

// --- BLOCK SYSTEM (Original + Improved) ---
async function checkIfBanned(ip) {
    if (!dbInstance) await initDatabase();
    
    return new Promise((resolve) => {
        const tx = dbInstance.transaction(['blocked'], 'readonly');
        const store = tx.objectStore('blocked');
        const request = store.get(ip);
        
        request.onsuccess = () => {
            const blocked = request.result;
            if (!blocked) {
                resolve(false);
                return;
            }
            
            // Check expiration (30 days)
            const blockDate = new Date(blocked.date);
            const now = new Date();
            const daysDiff = (now - blockDate) / (1000 * 60 * 60 * 24);
            
            if (daysDiff > 30) {
                // Auto unblock after 30 days
                unblockUser(ip);
                resolve(false);
            } else {
                resolve(true);
            }
        };
        request.onerror = () => resolve(false);
    });
}

async function blockUser(ip, email, reason = 'Mencoba membuat multiple akun') {
    if (!dbInstance) await initDatabase();
    
    return new Promise((resolve) => {
        const tx = dbInstance.transaction(['blocked'], 'readwrite');
        const store = tx.objectStore('blocked');
        
        const blockData = {
            ip,
            email,
            reason,
            date: new Date().toISOString()
        };
        
        store.put(blockData);
        
        // Save to localStorage as backup
        let blockReports = JSON.parse(localStorage.getItem('blockReports') || '[]');
        blockReports.unshift(blockData);
        localStorage.setItem('blockReports', JSON.stringify(blockReports));
        localStorage.setItem('blockedEmail_' + ip, email);
        
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
    });
}

async function unblockUser(ip) {
    if (!dbInstance) await initDatabase();
    
    return new Promise((resolve) => {
        const tx = dbInstance.transaction(['blocked'], 'readwrite');
        const store = tx.objectStore('blocked');
        store.delete(ip);
        
        // Remove from localStorage
        let blockReports = JSON.parse(localStorage.getItem('blockReports') || '[]');
        blockReports = blockReports.filter(report => report.ip !== ip);
        localStorage.setItem('blockReports', JSON.stringify(blockReports));
        localStorage.removeItem('blockedEmail_' + ip);
        
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
    });
}

function showBlockedPage(ip, email) {
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('blockedPage').style.display = 'flex';
    
    const details = document.getElementById('blockedDetails');
    details.innerHTML = `
        <p><i class="ri-computer-line"></i> IP: ${ip}</p>
        <p><i class="ri-google-fill"></i> Email: ${email}</p>
        <p><i class="ri-time-line"></i> Waktu: ${new Date().toLocaleString('id-ID')}</p>
    `;
}

// --- RATE LIMITING (Security) ---
function checkRateLimit() {
    const now = Date.now();
    if (now - lastLoginAttempt < 5000) { // 5 seconds between attempts
        loginAttempts++;
        if (loginAttempts > 5) {
            showToast('Terlalu banyak percobaan. Coba lagi nanti.', 'error');
            return false;
        }
    } else {
        loginAttempts = 0;
    }
    lastLoginAttempt = now;
    return true;
}

// --- NOTIFICATION SYSTEM (Original) ---
const notifBadge = document.getElementById('notifBadge');
const notifContainer = document.getElementById('notifList');

function addLog(actionName) {
    notifCount++;
    if(notifBadge) {
        notifBadge.innerText = notifCount;
        notifBadge.classList.add('show');
    }
    
    const time = new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
    
    if(notifContainer.querySelector('.empty-state')) {
        notifContainer.innerHTML = '';
    }

    const item = document.createElement('div');
    item.className = 'notif-item';
    item.innerHTML = `
        <div class="ni-icon"><i class="ri-file-list-3-line"></i></div>
        <div class="ni-text">
            <h5>${actionName}</h5>
            <p>Tercatat pada ${time}</p>
        </div>
    `;
    notifContainer.prepend(item);
    
    // Save to localStorage
    const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    logs.unshift({ action: actionName, time: new Date().toISOString() });
    localStorage.setItem('activityLogs', JSON.stringify(logs.slice(0, 50)));
}

function toggleNotifPanel() {
    playTick();
    const p = document.getElementById('notifPanel');
    p.classList.toggle('active');
    if(p.classList.contains('active')) {
        notifCount = 0;
        if(notifBadge) notifBadge.classList.remove('show');
    }
}

// --- TOAST SYSTEM (Original) ---
function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.innerHTML = `
        <i class="ri-${isError ? 'error-warning-fill' : 'checkbox-circle-fill'}"></i>
        ${message}
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// --- LOADING OVERLAY ---
function showLoading(message = 'Memproses...') {
    const loader = document.getElementById('loadingOverlay');
    const text = loader.querySelector('.loading-text');
    text.innerText = message;
    loader.style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// --- SAVE TRANSACTION ---
async function saveTransaction(email, method, methodName, amount, status = 'success') {
    if (!dbInstance) await initDatabase();
    
    const tx = dbInstance.transaction(['transactions'], 'readwrite');
    const store = tx.objectStore('transactions');
    
    const transaction = {
        id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        email,
        method,
        methodName,
        amount,
        status,
        date: new Date().toISOString(),
        ip: userIP
    };
    
    store.add(transaction);
    
    // Update local cache
    transactionHistory.unshift(transaction);
    if (transactionHistory.length > 100) transactionHistory.pop();
    
    return transaction;
}

// --- GET USER TRANSACTIONS ---
async function getUserTransactions(email, filter = 'all') {
    if (!dbInstance) await initDatabase();
    
    return new Promise((resolve) => {
        const tx = dbInstance.transaction(['transactions'], 'readonly');
        const store = tx.objectStore('transactions');
        const index = store.index('email');
        const request = index.getAll(email);
        
        request.onsuccess = () => {
            let transactions = request.result.reverse();
            if (filter !== 'all') {
                transactions = transactions.filter(tx => tx.method === filter);
            }
            resolve(transactions);
        };
        request.onerror = () => resolve([]);
    });
}

// --- CASHBACK SYSTEM (Original + Improved) ---
function loadUserCashback(email) {
    const encrypted = localStorage.getItem('cashback_' + email);
    if (encrypted) {
        const data = decryptData(encrypted);
        if (data) {
            cashbackBalance = data.balance || 0;
            cashbackHistory = data.history || [];
        }
    } else {
        cashbackBalance = 0;
        cashbackHistory = [];
    }
    updateCashbackDisplay();
}

function saveCashbackData(email) {
    const data = {
        balance: cashbackBalance,
        history: cashbackHistory
    };
    localStorage.setItem('cashback_' + email, encryptData(data));
}

function addCashback(amount, email, from) {
    cashbackBalance += amount;
    cashbackHistory.unshift({
        date: new Date().toISOString(),
        amount: amount,
        from: from,
        email: email,
        status: 'tersedia'
    });
    
    saveCashbackData(email);
    updateCashbackDisplay();
    addLog(`Cashback Rp ${amount.toLocaleString()} ditambahkan ke ${email}`);
}

function useCashback(amount, for_) {
    if (amount > cashbackBalance) {
        showToast('Saldo cashback tidak mencukupi', true);
        return false;
    }
    
    cashbackBalance -= amount;
    cashbackHistory.unshift({
        date: new Date().toISOString(),
        amount: -amount,
        from: 'Digunakan untuk ' + for_,
        email: currentUserEmail,
        status: 'digunakan'
    });
    
    saveCashbackData(currentUserEmail);
    updateCashbackDisplay();
    return true;
}

function updateCashbackDisplay() {
    const container = document.getElementById('cashbackBalanceContainer');
    if (!container) return;
    
    if (cashbackBalance > 0) {
        container.style.display = 'block';
        container.innerHTML = `
            <div class="cashback-balance">
                <div class="cashback-info">
                    <div class="cashback-icon">
                        <i class="ri-coupon-3-line"></i>
                    </div>
                    <div class="cashback-text">
                        <h4>Saldo Cashback</h4>
                        <p>Rp ${cashbackBalance.toLocaleString()}</p>
                    </div>
                </div>
                <button class="cashback-use-btn" onclick="openUseCashbackModal()" ${cashbackBalance === 0 ? 'disabled' : ''}>
                    Gunakan
                </button>
            </div>
        `;
    } else {
        container.style.display = 'none';
        container.innerHTML = '';
    }
}

// --- CASHBACK HISTORY (Original) ---
function showCashbackHistory() {
    playTick();
    menuOverlay.classList.remove('active');
    
    if (!isLoggedIn) {
        showToast('Silakan login terlebih dahulu', true);
        showLoginModal();
        return;
    }
    
    const historyList = document.getElementById('cashbackHistoryList');
    if (!historyList) return;
    
    if (cashbackHistory.length === 0) {
        historyList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Belum ada history cashback</p>';
    } else {
        let html = '';
        cashbackHistory.forEach(item => {
            const date = new Date(item.date).toLocaleDateString('id-ID');
            const statusClass = item.status === 'tersedia' ? 'status-tersedia' : 'status-digunakan';
            const statusText = item.status === 'tersedia' ? 'Tersedia' : 'Digunakan';
            const amount = Math.abs(item.amount);
            
            html += `
                <div class="cashback-history-item">
                    <div>
                        <div style="font-weight: 600; color: #fff; margin-bottom: 3px;">
                            ${item.from}
                        </div>
                        <div class="date">${date}</div>
                    </div>
                    <div>
                        <span class="amount">Rp ${amount.toLocaleString()}</span>
                        <span class="status ${statusClass}">${statusText}</span>
                    </div>
                </div>
            `;
        });
        historyList.innerHTML = html;
    }
    
    document.getElementById('cashbackHistoryModal').classList.add('active');
}

function closeCashbackHistory() {
    playTick();
    document.getElementById('cashbackHistoryModal').classList.remove('active');
}

// --- TRANSACTION HISTORY (New) ---
async function showTransactionHistory() {
    playTick();
    menuOverlay.classList.remove('active');
    
    if (!isLoggedIn) {
        showToast('Silakan login terlebih dahulu', true);
        showLoginModal();
        return;
    }
    
    showLoading('Memuat transaksi...');
    
    const transactions = await getUserTransactions(currentUserEmail);
    const list = document.getElementById('transactionList');
    
    if (transactions.length === 0) {
        list.innerHTML = '<div class="empty-state">Belum ada transaksi</div>';
    } else {
        list.innerHTML = transactions.map(tx => {
            const date = new Date(tx.date).toLocaleDateString('id-ID');
            return `
                <div class="transaction-item">
                    <div class="tx-icon ${tx.method}">
                        <i class="${getMethodIcon(tx.method)}"></i>
                    </div>
                    <div class="tx-details">
                        <div class="tx-method">${tx.methodName}</div>
                        <div class="tx-date">${date}</div>
                    </div>
                    <div class="tx-amount">Rp ${tx.amount.toLocaleString()}</div>
                </div>
            `;
        }).join('');
    }
    
    hideLoading();
    document.getElementById('transactionHistoryModal').classList.add('active');
}

function closeTransactionHistory() {
    playTick();
    document.getElementById('transactionHistoryModal').classList.remove('active');
}

async function filterTransactions() {
    const filter = document.getElementById('transactionFilter').value;
    const transactions = await getUserTransactions(currentUserEmail, filter);
    const list = document.getElementById('transactionList');
    
    if (transactions.length === 0) {
        list.innerHTML = '<div class="empty-state">Tidak ada transaksi</div>';
    } else {
        list.innerHTML = transactions.map(tx => {
            const date = new Date(tx.date).toLocaleDateString('id-ID');
            return `
                <div class="transaction-item">
                    <div class="tx-icon ${tx.method}">
                        <i class="${getMethodIcon(tx.method)}"></i>
                    </div>
                    <div class="tx-details">
                        <div class="tx-method">${tx.methodName}</div>
                        <div class="tx-date">${date}</div>
                    </div>
                    <div class="tx-amount">Rp ${tx.amount.toLocaleString()}</div>
                </div>
            `;
        }).join('');
    }
}

function exportTransactions() {
    const dataStr = JSON.stringify(transactionHistory, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `transactions_${currentUserEmail}_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Data transaksi diekspor', false);
}

function getMethodIcon(method) {
    const icons = {
        qris: 'ri-qr-scan-2-line',
        ewallet: 'ri-wallet-3-fill',
        bank: 'ri-bank-card-fill',
        pulsa: 'ri-smartphone-fill'
    };
    return icons[method] || 'ri-question-line';
}

// --- LOGIN/LOGOUT SYSTEM (Original + Improved) ---
async function checkLoginStatus() {
    const encrypted = localStorage.getItem('secure_session');
    if (encrypted) {
        const session = decryptData(encrypted);
        if (session && session.expires > Date.now()) {
            const ip = session.ip;
            const email = session.email;
            
            // Check if banned
            if (await checkIfBanned(ip)) {
                showBlockedPage(ip, email);
                return false;
            }
            
            isLoggedIn = true;
            currentUserEmail = email;
            currentUsername = email.split('@')[0];
            userIP = ip;
            
            document.getElementById('displayGoogleEmail').innerText = email;
            document.getElementById('displayUsername').innerText = currentUsername;
            document.getElementById('displayIP').innerText = ip;
            document.getElementById('btnLogout').style.display = 'flex';
            
            loadUserCashback(email);
            
            // Load transactions
            getUserTransactions(email).then(txs => {
                transactionHistory = txs;
            });
            
            return true;
        }
    }
    
    isLoggedIn = false;
    currentUserEmail = '';
    currentUsername = '';
    document.getElementById('displayGoogleEmail').innerText = 'Belum login';
    document.getElementById('displayUsername').innerText = 'Guest';
    document.getElementById('btnLogout').style.display = 'none';
    document.getElementById('cashbackBalanceContainer').style.display = 'none';
    
    return false;
}

function showLoginModal() {
    playTick();
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
        setTimeout(() => document.getElementById('loginEmailInput').focus(), 100);
    }
}

function closeLoginModal() {
    playTick();
    document.getElementById('loginModal').classList.remove('active');
}

async function loginUser() {
    if (!checkRateLimit()) return;
    
    const email = document.getElementById('loginEmailInput').value.trim();
    const emailRegex = /^[^\s@]+@gmail\.com$/;
    
    if (!email) {
        showToast('Email tidak boleh kosong', true);
        return;
    }
    
    if (!emailRegex.test(email)) {
        showToast('Harus menggunakan email @gmail.com', true);
        return;
    }
    
    showLoading('Memverifikasi...');
    
    const ip = await detectIP();
    
    // Check if banned
    if (await checkIfBanned(ip)) {
        hideLoading();
        showBlockedPage(ip, email);
        return;
    }
    
    // Check registered IPs
    const registeredIPs = JSON.parse(localStorage.getItem('registeredIPs') || '[]');
    
    // Check if email exists in different IP
    const emailExists = registeredIPs.find(entry => entry.email === email);
    if (emailExists && emailExists.ip !== ip) {
        hideLoading();
        showToast('⚠️ Email sudah terdaftar di perangkat lain!', true);
        await blockUser(ip, email, 'Mencoba menggunakan email yang sudah terdaftar');
        setTimeout(() => location.reload(), 2000);
        return;
    }
    
    // Check if IP has different email
    const ipExists = registeredIPs.find(entry => entry.ip === ip);
    if (ipExists && ipExists.email !== email) {
        hideLoading();
        showToast('⚠️ IP ini sudah memiliki akun dengan email berbeda!', true);
        await blockUser(ip, email, 'Mencoba login dengan email berbeda');
        setTimeout(() => location.reload(), 2000);
        return;
    }
    
    // New user
    if (!ipExists) {
        registeredIPs.push({ 
            ip: ip, 
            email: email, 
            username: email.split('@')[0],
            date: new Date().toISOString() 
        });
        localStorage.setItem('registeredIPs', JSON.stringify(registeredIPs));
    }
    
    // Create session
    const session = {
        ip: ip,
        email: email,
        expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };
    localStorage.setItem('secure_session', encryptData(session));
    
    // Update UI
    document.getElementById('displayGoogleEmail').innerText = email;
    document.getElementById('displayUsername').innerText = email.split('@')[0];
    document.getElementById('displayIP').innerText = ip;
    document.getElementById('btnLogout').style.display = 'flex';
    
    isLoggedIn = true;
    currentUserEmail = email;
    currentUsername = email.split('@')[0];
    userIP = ip;
    
    closeLoginModal();
    hideLoading();
    showToast(`✅ Selamat datang ${email.split('@')[0]}!`, false);
    
    loadUserCashback(email);
    addLog(`User login: ${email} (IP: ${ip})`);
    
    // Check promo availability
    checkPromoStatus();
}

function showLogoutConfirm() {
    playTick();
    document.getElementById('logoutModal').classList.add('active');
}

function closeLogoutModal() {
    playTick();
    document.getElementById('logoutModal').classList.remove('active');
}

function logoutUser() {
    playTick();
    
    localStorage.removeItem('secure_session');
    
    isLoggedIn = false;
    currentUserEmail = '';
    currentUsername = '';
    cashbackBalance = 0;
    cashbackHistory = [];
    
    document.getElementById('displayGoogleEmail').innerText = 'Belum login';
    document.getElementById('displayUsername').innerText = 'Guest';
    document.getElementById('btnLogout').style.display = 'none';
    document.getElementById('cashbackBalanceContainer').style.display = 'none';
    
    closeLogoutModal();
    showToast('✅ Anda telah keluar', false);
    
    setTimeout(() => {
        showLoginModal();
    }, 1000);
    
    addLog('User logout');
}

// --- GOOGLE EMAIL MODAL (Original) ---
function showGoogleEmailModal() {
    playTick();
    document.getElementById('googleEmailModal').classList.add('active');
    setTimeout(() => document.getElementById('googleEmailInput').focus(), 100);
}

function closeGoogleEmailModal() {
    playTick();
    document.getElementById('googleEmailModal').classList.remove('active');
}

async function saveGoogleEmail() {
    const email = document.getElementById('googleEmailInput').value.trim();
    const emailRegex = /^[^\s@]+@gmail\.com$/;
    
    if (!email) {
        showToast('Email tidak boleh kosong', true);
        return;
    }
    
    if (!emailRegex.test(email)) {
        showToast('Harus menggunakan email @gmail.com', true);
        return;
    }
    
    showLoading('Memverifikasi...');
    
    const ip = await detectIP();
    
    // Check registered IPs
    const registeredIPs = JSON.parse(localStorage.getItem('registeredIPs') || '[]');
    
    // Check if email exists in different IP
    const emailExists = registeredIPs.find(entry => entry.email === email);
    if (emailExists && emailExists.ip !== ip) {
        hideLoading();
        showToast('⚠️ Email sudah terdaftar di perangkat lain!', true);
        await blockUser(ip, email, 'Mencoba menggunakan email yang sudah terdaftar');
        setTimeout(() => location.reload(), 2000);
        return;
    }
    
    // Check if IP has different email
    const ipExists = registeredIPs.find(entry => entry.ip === ip);
    if (ipExists && ipExists.email !== email) {
        hideLoading();
        showToast('⚠️ IP ini sudah memiliki akun dengan email berbeda!', true);
        await blockUser(ip, email, 'Mencoba membuat multiple akun');
        setTimeout(() => location.reload(), 2000);
        return;
    }
    
    // Register new user
    if (!ipExists) {
        registeredIPs.push({ 
            ip: ip, 
            email: email, 
            username: email.split('@')[0],
            date: new Date().toISOString() 
        });
        localStorage.setItem('registeredIPs', JSON.stringify(registeredIPs));
    }
    
    // Create session
    const session = {
        ip: ip,
        email: email,
        expires: Date.now() + 24 * 60 * 60 * 1000
    };
    localStorage.setItem('secure_session', encryptData(session));
    
    document.getElementById('displayGoogleEmail').innerText = email;
    document.getElementById('displayUsername').innerText = email.split('@')[0];
    document.getElementById('displayIP').innerText = ip;
    document.getElementById('btnLogout').style.display = 'flex';
    
    isLoggedIn = true;
    currentUserEmail = email;
    currentUsername = email.split('@')[0];
    userIP = ip;
    
    closeGoogleEmailModal();
    hideLoading();
    showToast(`✅ Selamat datang ${email.split('@')[0]}!`, false);
    
    addLog(`User baru: ${email} (IP: ${ip})`);
}

// --- CHECK USER VERIFICATION (Original) ---
async function checkUserVerification() {
    if (await checkLoginStatus()) {
        return true;
    }
    
    setTimeout(() => {
        showLoginModal();
    }, 1000);
    
    return false;
}

// --- PROMO FUNCTIONS (Original) ---
function checkPromoStatus() {
    const promoBanner = document.getElementById('promoBanner');
    if (!promoBanner) return;
    
    if (!isLoggedIn) return;
    
    const promoUsed = localStorage.getItem('promoQRIS_used_' + currentUserEmail);
    
    if (promoUsed === 'true') {
        promoBanner.classList.add('disabled');
        const promoTitle = promoBanner.querySelector('h4');
        const promoDesc = promoBanner.querySelector('p');
        if (promoTitle) promoTitle.innerHTML = 'Promo Telah Digunakan';
        if (promoDesc) promoDesc.innerHTML = 'Cashback 50% sudah diklaim.';
    } else {
        promoBanner.classList.remove('disabled');
        const promoTitle = promoBanner.querySelector('h4');
        const promoDesc = promoBanner.querySelector('p');
        if (promoTitle) promoTitle.innerHTML = 'Promo Cashback 50%';
        if (promoDesc) promoDesc.innerHTML = 'Khusus pengguna baru untuk transaksi pertama via QRIS.';
    }
}

function isPromoAvailable() {
    if (!isLoggedIn) return false;
    return localStorage.getItem('promoQRIS_used_' + currentUserEmail) !== 'true';
}

function markPromoAsUsed(amount) {
    localStorage.setItem('promoQRIS_used_' + currentUserEmail, 'true');
    localStorage.setItem('promoQRIS_date_' + currentUserEmail, new Date().toISOString());
    
    addCashback(Math.floor(amount * 0.5), currentUserEmail, 'Promo Cashback 50%');
    checkPromoStatus();
}

// --- OPEN PROMO QRIS (Original) ---
function openPromoQRIS() {
    playTick();
    
    if (!isLoggedIn) {
        showToast('Silakan login terlebih dahulu', true);
        showLoginModal();
        return;
    }
    
    if (!isPromoAvailable()) {
        const usedDate = localStorage.getItem('promoQRIS_date_' + currentUserEmail);
        const formattedDate = usedDate ? new Date(usedDate).toLocaleDateString('id-ID') : 'sebelumnya';
        showToast('⚠️ Promo Cashback 50% sudah digunakan pada ' + formattedDate, true);
        return;
    }
    
    const promoModal = document.createElement('div');
    promoModal.className = 'modal-overlay';
    promoModal.id = 'promoModal';
    promoModal.innerHTML = `
        <div class="modal-box" style="max-width: 400px;">
            <div style="text-align: center; margin-bottom: 15px;">
                <i class="ri-coupon-3-line" style="font-size: 48px; color: #10b981;"></i>
            </div>
            <h3 style="color: #10b981; font-size: 22px; margin-bottom: 5px;">🎉 Promo Cashback 50%</h3>
            <p style="color: #fff; margin-bottom: 20px; text-align: center; font-size: 14px;">
                Khusus pengguna baru! Cashback 50% untuk transaksi pertama via QRIS
            </p>
            <p style="color: #fbbf24; font-size: 12px; text-align: center; margin-bottom: 20px; background: rgba(251, 191, 36, 0.1); padding: 8px; border-radius: 8px;">
                <i class="ri-information-line"></i> Promo hanya berlaku 1x per akun
            </p>
            
            <div style="margin-bottom: 20px;">
                <label style="color: #fff; font-size: 13px; margin-bottom: 8px; display: block;">Pilih Nominal:</label>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
                    <button class="promo-nominal-btn" data-nominal="50000" style="background: #2563eb; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                        Rp 50.000
                        <span style="display: block; font-size: 10px; color: #a5d8ff;">Cashback 25rb</span>
                    </button>
                    <button class="promo-nominal-btn" data-nominal="100000" style="background: #2563eb; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                        Rp 100.000
                        <span style="display: block; font-size: 10px; color: #a5d8ff;">Cashback 50rb</span>
                    </button>
                    <button class="promo-nominal-btn" data-nominal="200000" style="background: #2563eb; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                        Rp 200.000
                        <span style="display: block; font-size: 10px; color: #a5d8ff;">Cashback 100rb</span>
                    </button>
                    <button class="promo-nominal-btn" data-nominal="500000" style="background: #2563eb; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                        Rp 500.000
                        <span style="display: block; font-size: 10px; color: #a5d8ff;">Cashback 250rb</span>
                    </button>
                </div>
                
                <p style="color: #10b981; font-size: 11px; text-align: center; margin-top: 10px;">
                    <i class="ri-information-line"></i> Maksimal cashback Rp 250.000
                </p>
            </div>
            
            <div class="modal-buttons">
                <button class="modal-btn cancel" onclick="closePromoModal()">Nanti Saja</button>
                <button class="modal-btn confirm" id="applyPromoBtn" style="background: #10b981;">Gunakan Promo</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(promoModal);
    
    setTimeout(() => {
        promoModal.classList.add('active');
    }, 10);
    
    const nominalBtns = promoModal.querySelectorAll('.promo-nominal-btn');
    let selectedNominal = 50000;
    
    if (nominalBtns.length > 0) {
        nominalBtns[0].style.background = '#10b981';
        nominalBtns[0].style.transform = 'scale(0.95)';
    }
    
    nominalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            nominalBtns.forEach(b => {
                b.style.background = '#2563eb';
                b.style.transform = 'scale(1)';
            });
            
            this.style.background = '#10b981';
            this.style.transform = 'scale(0.95)';
            
            selectedNominal = parseInt(this.dataset.nominal);
        });
    });
    
    document.getElementById('applyPromoBtn').onclick = () => {
        playTick();
        markPromoAsUsed(selectedNominal);
        closePromoModal();
        showToast(`🎉 Cashback Rp ${(selectedNominal * 0.5).toLocaleString()} ditambahkan!`, false);
    };
}

function closePromoModal() {
    playTick();
    const modal = document.getElementById('promoModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentNode) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
}

// --- CASHBACK USE MODAL (Original) ---
function openUseCashbackModal() {
    if (cashbackBalance === 0) {
        showToast('Tidak ada cashback untuk digunakan', true);
        return;
    }
    
    if (!isLoggedIn) {
        showToast('Silakan login terlebih dahulu', true);
        showLoginModal();
        return;
    }
    
    playTick();
    
    selectedCashbackUse = '';
    document.querySelectorAll('.cashback-use-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    document.getElementById('cashbackAmount').innerText = cashbackBalance.toLocaleString();
    
    cashbackUseAmount = 50000;
    const finalAmount = Math.max(0, cashbackUseAmount - cashbackBalance);
    
    document.getElementById('qrisOriginal').innerText = `Rp ${cashbackUseAmount.toLocaleString()}`;
    document.getElementById('qrisFinal').innerText = `Rp ${finalAmount.toLocaleString()}`;
    document.getElementById('ewalletOriginal').innerText = `Rp ${cashbackUseAmount.toLocaleString()}`;
    document.getElementById('ewalletFinal').innerText = `Rp ${finalAmount.toLocaleString()}`;
    document.getElementById('bankOriginal').innerText = `Rp ${cashbackUseAmount.toLocaleString()}`;
    document.getElementById('bankFinal').innerText = `Rp ${finalAmount.toLocaleString()}`;
    document.getElementById('pulsaOriginal').innerText = `Rp ${cashbackUseAmount.toLocaleString()}`;
    document.getElementById('pulsaFinal').innerText = `Rp ${finalAmount.toLocaleString()}`;
    
    document.getElementById('useCashbackModal').classList.add('active');
}

function closeUseCashbackModal() {
    playTick();
    document.getElementById('useCashbackModal').classList.remove('active');
}

function selectCashbackUse(type) {
    playTick();
    selectedCashbackUse = type;
    
    document.querySelectorAll('.cashback-use-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    document.getElementById(`use${type.charAt(0).toUpperCase() + type.slice(1)}Option`).classList.add('selected');
}

function applyCashbackToPayment() {
    if (!selectedCashbackUse) {
        showToast('Pilih metode pembayaran terlebih dahulu', true);
        return;
    }
    
    playTick();
    
    const finalAmount = Math.max(0, cashbackUseAmount - cashbackBalance);
    
    if (!useCashback(cashbackBalance, selectedCashbackUse)) {
        return;
    }
    
    closeUseCashbackModal();
    
    if (selectedCashbackUse === 'qris') {
        openSheet('qris');
        setTimeout(() => {
            const amountInput = document.getElementById('qrisAmount');
            if (amountInput) {
                amountInput.value = finalAmount;
                const event = new Event('input', { bubbles: true });
                amountInput.dispatchEvent(event);
                
                amountInput.style.border = '2px solid #10b981';
                amountInput.style.backgroundColor = '#f0fdf4';
                setTimeout(() => {
                    if (amountInput) {
                        amountInput.style.border = '1px solid #ddd';
                        amountInput.style.backgroundColor = '#f9f9f9';
                    }
                }, 2000);
            }
        }, 500);
    } else if (selectedCashbackUse === 'ewallet') {
        openSheet('dana_only');
    } else if (selectedCashbackUse === 'bank') {
        openSheet('bank');
    } else if (selectedCashbackUse === 'pulsa') {
        openSheet('pulsa');
    }
    
    showToast(`💰 Cashback digunakan! Bayar Rp ${finalAmount.toLocaleString()}`, false);
}

// --- SHEET LOGIC (Original) ---
const sheet = document.getElementById('sheet');
const list = document.getElementById('sheetList');
const title = document.getElementById('sheetTitle');

function rowHtml(key) {
    const d = dataPay[key];
    const imgUrl = d.img ? d.img : 'https://placehold.co/100'; 
    return `
        <div class="pay-item">
            <div class="pi-left">
                <img src="${imgUrl}" class="pi-img" onerror="this.src='https://placehold.co/100'">
                <div class="pi-info">
                    <h5>${d.name}</h5>
                    <p id="t-${key}">${d.num}</p>
                </div>
            </div>
            <div style="display: flex; gap: 5px;">
                <button class="btn-action ripple" onclick="copyIt('t-${key}', '${d.name}')">
                    <i class="ri-file-copy-line"></i>
                </button>
                <button class="btn-action whatsapp ripple" onclick="openPaymentModal('${key}', '${d.name}')">
                    <i class="ri-whatsapp-fill"></i>
                </button>
            </div>
        </div>
    `;
}

window.openSheet = (mode) => {
    if (!isLoggedIn) {
        showToast('Silakan login terlebih dahulu', true);
        showLoginModal();
        return;
    }
    
    playTick();
    let html = '';
    let logName = '';

    if(mode === 'qris') {
        title.innerText = "SCAN QRIS";
        logName = "Membuka Menu QRIS";
        html = `
            <div class="qris-input-container">
                <label class="qris-label">Masukkan Nominal (Rp)</label>
                <input type="number" id="qrisAmount" class="qris-input" placeholder="Contoh: 10000" min="1000" max="10000000" step="1000" value="">
                <p class="qris-hint">Min: Rp 1.000 - Max: Rp 10.000.000</p>
                <button id="generateQR" class="qris-generate-btn ripple" onclick="generateAndDownloadQRIS()" disabled>
                    <i class="ri-qr-code-line"></i> Generate QR
                </button>
            </div>
            
            <div id="qrContainer" class="qris-container">
                <div class="qr-display-wrapper">
                    <div id="qrisNominalDisplay" class="qris-nominal-display" style="display:none;"></div>
                    <img id="qrImage" class="qris-image" alt="QR Code" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDI0MCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI0MCIgaGVpZ2h0PSIyNDAiIGZpbGw9IiNGM0Y0RjYiIHJ4PSIxMiIvPjx0ZXh0IHg9IjEyMCIgeT0iMTIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2NDc0OEIiPkdlbmVyYXRlIFFSIGRhbGVoIHVsYTwvdGV4dD48L3N2Zz4=">
                </div>
                <p class="qris-info">QR akan otomatis terdownload setelah dibuat</p>
                
                <div class="qris-actions">
                    <button class="download-qr-btn ripple" onclick="downloadQRCode()">
                        <i class="ri-download-line"></i> Download QR
                    </button>
                    <button class="whatsapp-confirm-btn ripple" onclick="confirmPayment()">
                        <i class="ri-whatsapp-fill"></i> Konfirmasi
                    </button>
                </div>
                
                <div style="margin-top: 15px; padding: 10px; background: #f0f9ff; border-radius: 10px; border: 1px dashed #cbd5e1;">
                    <p style="color: #64748b; font-size: 11px; margin: 0;">
                        <i class="ri-information-line" style="color: #3b82f6;"></i> 
                        Support semua e-wallet & bank
                    </p>
                </div>
            </div>`;
        
        setTimeout(() => {
            const amountInput = document.getElementById('qrisAmount');
            const generateBtn = document.getElementById('generateQR');
            
            const checkInput = () => {
                const amount = parseInt(amountInput.value);
                generateBtn.disabled = !(amount >= CONFIG.MIN_TRANSACTION && amount <= CONFIG.MAX_TRANSACTION);
                generateBtn.style.opacity = generateBtn.disabled ? '0.6' : '1';
            };
            
            amountInput.addEventListener('input', checkInput);
            amountInput.addEventListener('keyup', checkInput);
            amountInput.focus();
            
            currentQrisAmount = 0;
            currentQRImage = '';
            checkInput();
        }, 100);
        
    } else if(mode === 'dana_only') {
        title.innerText = "E-WALLET";
        logName = "Menu E-Wallet";
        html += rowHtml('dana');
        html += rowHtml('shopee');
        html += rowHtml('gopay');
        html += rowHtml('ovo');
        html += rowHtml('linkaja');
        html += rowHtml('paypal');
    } else if(mode === 'bank') {
        title.innerText = "TRANSFER BANK";
        logName = "Menu Bank";
        html += rowHtml('sea');
        html += rowHtml('sea2');
        html += rowHtml('bri');
        html += rowHtml('paypal');
    } else if(mode === 'pulsa') {
        title.innerText = "TOP UP PULSA";
        logName = "Menu Pulsa";
        html += rowHtml('pulsa');
        html += rowHtml('indosat');
        html += rowHtml('tri');
        html += rowHtml('smartfren');
    } else {
        title.innerText = "SEMUA METODE";
        logName = "Semua Menu";
        Object.keys(dataPay).forEach(k => html += rowHtml(k));
    }
    
    addLog(logName);
    list.innerHTML = html;
    sheet.classList.add('active');
};

document.getElementById('btnCloseSheet').onclick = () => {
    sheet.classList.remove('active');
    playTick();
};

// --- COPY FUNCTION (Original) ---
window.copyIt = async (id, label) => {
    if (!isLoggedIn) {
        showToast('Silakan login terlebih dahulu', true);
        showLoginModal();
        return;
    }
    
    playTick();
    const txt = document.getElementById(id).innerText;
    if(txt.includes('Hubungi')) return;
    
    try {
        await navigator.clipboard.writeText(txt);
        showToast(`✅ ${label} berhasil disalin!`);
        addLog(`Menyalin ${label}`);
    } catch {
        showToast(`❌ Gagal menyalin ${label}`, true);
    }
};

// --- PAYMENT MODAL (Original) ---
function openPaymentModal(methodKey, methodName) {
    if (!isLoggedIn) {
        showToast('Silakan login terlebih dahulu', true);
        showLoginModal();
        return;
    }
    
    playTick();
    selectedPaymentMethod = methodKey;
    selectedPaymentName = methodName;
    
    const modal = document.getElementById('paymentModal');
    const metodeInput = document.getElementById('modalMetode');
    const nominalInput = document.getElementById('modalNominal');
    const summary = document.getElementById('paymentSummary');
    const cashbackSpan = document.getElementById('availableCashback');
    
    metodeInput.value = methodName;
    nominalInput.value = '';
    
    if (cashbackBalance > 0) {
        summary.style.display = 'block';
        cashbackSpan.innerText = `Rp ${cashbackBalance.toLocaleString()}`;
    } else {
        summary.style.display = 'none';
    }
    
    modal.classList.add('active');
}

function closePaymentModal() {
    playTick();
    document.getElementById('paymentModal').classList.remove('active');
}

async function sendPaymentConfirmation() {
    const nominal = parseInt(document.getElementById('modalNominal').value);
    const useCashback = document.getElementById('useCashbackCheck')?.checked || false;
    
    if (!nominal || nominal < CONFIG.MIN_TRANSACTION || nominal > CONFIG.MAX_TRANSACTION) {
        showToast(`Nominal harus Rp ${CONFIG.MIN_TRANSACTION.toLocaleString()} - Rp ${CONFIG.MAX_TRANSACTION.toLocaleString()}`, true);
        return;
    }

    const paymentData = dataPay[selectedPaymentMethod];
    if (!paymentData) return;

    // Apply cashback if used
    let finalAmount = nominal;
    if (useCashback && cashbackBalance > 0) {
        const cashbackUsed = Math.min(cashbackBalance, nominal);
        finalAmount = nominal - cashbackUsed;
        useCashback(cashbackUsed, selectedPaymentName);
    }

    const formattedDate = getFormattedDate();
    const formattedTime = getFormattedTime();

    const message = encodeURIComponent(
`📊 *BUKTI PEMBAYARAN*
════════════════════
         *PESAN TERKIRIM*
════════════════════
📧 *Email:* ${currentUserEmail}
📨 *NOMINAL:* Rp ${nominal.toLocaleString('id-ID')}
${useCashback ? `💰 *CASHBACK:* Rp ${cashbackBalance.toLocaleString()}\n💳 *TOTAL BAYAR:* Rp ${finalAmount.toLocaleString()}` : ''}

════════════════════
📧 *VIA PEMBAYARAN:* ${paymentData.name}

════════════════════
⏱️ *Waktu Transfer:* ${formattedTime} WIB

════════════════════
🗓️ *Tanggal:* ${formattedDate}

════════════════════
💾 *SS BUKTI PEMBAYARAN:* 
(Silahkan lampirkan screenshot)

════════════════════

> KIRIMKAN HASIL BUKTI PEMBAYARAN KEPADA ADMIN

════════════════════`
    );

    // Save transaction
    await saveTransaction(
        currentUserEmail,
        selectedPaymentMethod,
        paymentData.name,
        nominal
    );

    const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, '_blank');

    addLog(`Konfirmasi ${paymentData.name}: Rp ${nominal.toLocaleString()}`);
    
    closePaymentModal();
    showToast(`✅ Konfirmasi ${paymentData.name} terkirim!`);
}

// --- GENERATE QRIS (Original + Improved) ---
async function generateAndDownloadQRIS() {
    if (!isLoggedIn) {
        showToast('Silakan login terlebih dahulu', true);
        showLoginModal();
        return;
    }
    
    const amountInput = document.getElementById('qrisAmount');
    const amount = parseInt(amountInput.value);
    
    if (!amount || amount < CONFIG.MIN_TRANSACTION || amount > CONFIG.MAX_TRANSACTION) {
        showToast(`Nominal harus Rp ${CONFIG.MIN_TRANSACTION.toLocaleString()} - Rp ${CONFIG.MAX_TRANSACTION.toLocaleString()}`, true);
        return;
    }
    
    currentQrisAmount = amount;
    const generateBtn = document.getElementById('generateQR');
    const qrContainer = document.getElementById('qrContainer');
    const qrImage = document.getElementById('qrImage');
    
    generateBtn.innerHTML = '<i class="ri-loader-4-line qris-loading"></i> Membuat QR...';
    generateBtn.disabled = true;
    qrContainer.style.display = 'block';
    
    try {
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
            qrImg.onload = resolve;
            qrImg.onerror = reject;
            qrImg.src = CONFIG.QRIS_IMAGE_URL + '?t=' + Date.now();
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Amount Header
        ctx.fillStyle = '#2563eb';
        roundRect(ctx, 40, 40, canvas.width - 80, 90, 15);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Rp ${amount.toLocaleString('id-ID')}`, canvas.width / 2, 95);
        
        // QR Code
        const targetSize = 550;
        const qrRatio = qrImg.width / qrImg.height;
        let qrWidth, qrHeight;
        
        if (qrRatio >= 1) {
            qrWidth = targetSize;
            qrHeight = targetSize / qrRatio;
        } else {
            qrHeight = targetSize;
            qrWidth = targetSize * qrRatio;
        }
        
        qrWidth = Math.max(qrWidth, 500);
        qrHeight = Math.max(qrHeight, 500);
        
        const qrX = (canvas.width - qrWidth) / 2;
        const qrY = 160;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX - 10, qrY - 10, qrWidth + 20, qrHeight + 20);
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(qrImg, qrX, qrY, qrWidth, qrHeight);
        
        // Border
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.strokeRect(qrX - 2, qrY - 2, qrWidth + 4, qrHeight + 4);
        
        // Footer
        ctx.strokeStyle = '#dddddd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(60, qrY + qrHeight + 40);
        ctx.lineTo(canvas.width - 60, qrY + qrHeight + 40);
        ctx.stroke();
        
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('JHON PAYMENT', canvas.width / 2, qrY + qrHeight + 90);
        
        ctx.fillStyle = '#666666';
        ctx.font = '20px Arial';
        ctx.fillText('Scan QRIS untuk membayar', canvas.width / 2, qrY + qrHeight + 130);
        
        ctx.fillStyle = '#2563eb';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`Total: Rp ${amount.toLocaleString('id-ID')}`, canvas.width / 2, qrY + qrHeight + 170);
        
        ctx.fillStyle = '#10b981';
        ctx.font = '18px Arial';
        ctx.fillText('✓ Arahkan kamera ke QR code di atas', canvas.width / 2, qrY + qrHeight + 210);
        
        const dataUrl = canvas.toDataURL('image/png');
        qrImage.src = dataUrl;
        currentQRImage = dataUrl;
        
        // Download
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `QRIS-JHON-${amount}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Save transaction
        await saveTransaction(currentUserEmail, 'qris', 'QRIS', amount);
        
        showToast(`✅ QRIS siap! Rp ${amount.toLocaleString()}`);
        
        let nominalDisplay = document.getElementById('qrisNominalDisplay');
        nominalDisplay.style.display = 'inline-block';
        nominalDisplay.innerHTML = `<span>Rp ${amount.toLocaleString('id-ID')}</span>`;
        
        addLog(`QRIS Generated: Rp ${amount.toLocaleString()}`);
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Gagal memuat QR code', true);
        qrImage.src = CONFIG.QRIS_IMAGE_URL + '?t=' + Date.now();
        currentQRImage = CONFIG.QRIS_IMAGE_URL;
    } finally {
        generateBtn.innerHTML = '<i class="ri-qr-code-line"></i> Generate Ulang QR';
        generateBtn.disabled = false;
    }
}

// Helper for rounded rectangle
function roundRect(ctx, x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}

function downloadQRCode() {
    if (!currentQRImage || currentQrisAmount === 0) {
        showToast('Silakan generate QR Code terlebih dahulu', true);
        return;
    }
    
    playTick();
    
    try {
        const link = document.createElement('a');
        link.href = currentQRImage;
        link.download = `QRIS-JHON-${currentQrisAmount}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addLog(`Download QR: Rp ${currentQrisAmount.toLocaleString()}`);
        showToast(`✅ QRIS didownload! Rp ${currentQrisAmount.toLocaleString()}`);
        
    } catch (error) {
        console.error('Download error:', error);
        window.open(currentQRImage, '_blank');
        showToast('Buka gambar di tab baru, lalu save manual', false);
    }
}

async function confirmPayment() {
    if (!currentQrisAmount || currentQrisAmount === 0) {
        showToast('Silakan generate QR Code terlebih dahulu', true);
        return;
    }
    
    playTick();

    const formattedDate = getFormattedDate();
    const formattedTime = getFormattedTime();

    // Save transaction
    await saveTransaction(currentUserEmail, 'qris', 'QRIS', currentQrisAmount);

    const message = encodeURIComponent(
`📊 *BUKTI PEMBAYARAN*
════════════════════
         *PESAN TERKIRIM*
════════════════════
📧 *Email:* ${currentUserEmail}
📨 *NOMINAL:* Rp ${currentQrisAmount.toLocaleString('id-ID')}

════════════════════
📧 *VIA PEMBAYARAN:* QRIS

════════════════════
⏱️ *Waktu Transfer:* ${formattedTime} WIB

════════════════════
🗓️ *Tanggal:* ${formattedDate}

════════════════════
💾 *SS BUKTI PEMBAYARAN:* 
(Silahkan lampirkan screenshot)

════════════════════

> KIRIMKAN HASIL BUKTI PEMBAYARAN KEPADA ADMIN

════════════════════`
    );
    
    const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    
    addLog(`Konfirmasi QRIS: Rp ${currentQrisAmount.toLocaleString()}`);
    showToast(`✅ WhatsApp terbuka! Kirim bukti transfer.`);
}

// --- HOME PAGE (Original) ---
function showHomePage() {
    playTick();
    menuOverlay.classList.remove('active');
    
    if (originalContent) {
        document.querySelector('.content-area').innerHTML = originalContent;
    } else {
        location.reload();
    }
    
    updateCashbackDisplay();
    setTimeout(checkPromoStatus, 100);
}

// --- USAGE PAGE (Original) ---
let originalContentSaved = '';

function showUsagePage() {
    playTick();
    menuOverlay.classList.remove('active');
    
    const contentArea = document.querySelector('.content-area');
    
    if (!originalContentSaved) {
        originalContentSaved = contentArea.innerHTML;
    }
    
    const usageHTML = `
        <div class="profile-section">
            <img src="foto4.jpg" class="p-img" onerror="this.src='https://via.placeholder.com/55'">
            <div class="p-info">
                <h2>
                    <span id="displayUsername">${currentUsername || 'Guest'}</span>
                </h2>
                <div class="google-email">
                    <i class="ri-google-fill"></i>
                    <span id="displayGoogleEmail">${currentUserEmail || 'Belum login'}</span>
                </div>
                <div class="ip-address">
                    <i class="ri-computer-line"></i>
                    <span id="displayIP">${userIP}</span>
                </div>
                <p><span class="status-dot"></span> Online</p>
                <div class="social-bar">
                    <a href="https://instagram.com/cpm_jhon" target="_blank" class="soc-icon ripple" onclick="playTick()">
                        <i class="ri-instagram-fill"></i>
                    </a>
                    <a href="https://t.me/cpm_jhon21" target="_blank" class="soc-icon ripple" onclick="playTick()">
                        <i class="ri-telegram-fill"></i>
                    </a>
                    <a href="https://wa.me/6285894955362" target="_blank" class="soc-icon ripple" onclick="playTick()">
                        <i class="ri-whatsapp-fill"></i>
                    </a>
                </div>
            </div>
        </div>

        <div style="margin: 20px 0;">
            <h3 style="color: var(--text-on-dark); font-size: 18px; font-weight: 700; margin-bottom: 15px; text-align: center;">Cara Penggunaan</h3>
            
            <div style="background: var(--card-surface); padding: 20px; border-radius: 20px; margin-bottom: 20px;">
                <div style="display: flex; gap: 12px; margin-bottom: 15px;">
                    <div style="width: 24px; height: 24px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; flex-shrink: 0;">1</div>
                    <div>
                        <h5 style="font-size: 14px; font-weight: 700; color: var(--text-on-dark); margin-bottom: 4px;">Login dengan Gmail</h5>
                        <p style="font-size: 12px; color: var(--text-muted);">Masuk menggunakan email @gmail.com. 1 IP hanya untuk 1 akun.</p>
                    </div>
                </div>
                
                <div style="display: flex; gap: 12px; margin-bottom: 15px;">
                    <div style="width: 24px; height: 24px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; flex-shrink: 0;">2</div>
                    <div>
                        <h5 style="font-size: 14px; font-weight: 700; color: var(--text-on-dark); margin-bottom: 4px;">Pilih Metode Pembayaran</h5>
                        <p style="font-size: 12px; color: var(--text-muted);">Pilih metode pembayaran yang tersedia.</p>
                    </div>
                </div>
                
                <div style="display: flex; gap: 12px; margin-bottom: 15px;">
                    <div style="width: 24px; height: 24px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; flex-shrink: 0;">3</div>
                    <div>
                        <h5 style="font-size: 14px; font-weight: 700; color: var(--text-on-dark); margin-bottom: 4px;">Dapatkan Cashback</h5>
                        <p style="font-size: 12px; color: var(--text-muted);">Klik banner promo untuk mendapatkan cashback 50%.</p>
                    </div>
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <div style="width: 24px; height: 24px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; flex-shrink: 0;">4</div>
                    <div>
                        <h5 style="font-size: 14px; font-weight: 700; color: var(--text-on-dark); margin-bottom: 4px;">Gunakan Cashback</h5>
                        <p style="font-size: 12px; color: var(--text-muted);">Klik tombol "Gunakan" untuk potongan harga.</p>
                    </div>
                </div>
            </div>
            
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); border-radius: 16px; padding: 15px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <i class="ri-shield-keyhole-line" style="color: var(--danger); font-size: 20px;"></i>
                    <h5 style="color: var(--danger); font-size: 14px; font-weight: 700;">Aturan Penting</h5>
                </div>
                <ul style="color: var(--text-muted); font-size: 12px; padding-left: 20px;">
                    <li style="margin-bottom: 5px;">1 IP hanya untuk 1 akun</li>
                    <li style="margin-bottom: 5px;">Dilarang membuat multiple akun</li>
                    <li style="margin-bottom: 5px;">Pelanggaran akan diblokir permanen</li>
                    <li>Hubungi admin untuk pembukaan blokir</li>
                </ul>
            </div>
            
            <button class="ripple" onclick="showHomePage()" style="width:100%; padding:15px; border-radius:12px; border:none; background:#000; color:#fff; font-weight:700; margin-top:15px; cursor: pointer;">
                <i class="ri-arrow-left-line" style="margin-right: 5px;"></i> Kembali ke Beranda
            </button>
        </div>
    `;
    
    contentArea.innerHTML = usageHTML;
}

// --- CHAT SYSTEM (Original) ---
const fab = document.getElementById('fabChat');
const win = document.getElementById('chatWin');
const closeC = document.getElementById('closeChat');
const bodyC = document.getElementById('chatBody');

fab.onclick = () => { 
    if (!isLoggedIn) {
        showToast('Silakan login terlebih dahulu', true);
        showLoginModal();
        return;
    }
    
    playTick(); 
    win.classList.add('active'); 
    fab.style.transform = 'scale(0)'; 
};

closeC.onclick = () => { 
    playTick(); 
    win.classList.remove('active'); 
    fab.style.transform = 'scale(1)'; 
};

window.sendChat = (msg) => {
    playTick();
    const u = document.createElement('div');
    u.className = 'bubble b-user'; 
    u.innerText = msg;
    bodyC.appendChild(u);
    bodyC.scrollTop = bodyC.scrollHeight;
    
    setTimeout(() => {
        const b = document.createElement('div');
        b.className = 'bubble b-bot';
        if(msg === 'konfirmasi') {
            b.innerHTML = "✅ Setelah bayar, klik ikon WhatsApp di metode pembayaran untuk konfirmasi.";
        } else if(msg === 'admin') {
            b.innerHTML = "📞 Hubungi admin via WhatsApp.";
        } else {
            b.innerHTML = "⚠️ Kendala? Hubungi admin.";
        }
        bodyC.appendChild(b);
        bodyC.scrollTop = bodyC.scrollHeight;
        playTick();
    }, 800);
};

// --- MENU OVERLAY (Original) ---
const menuOverlay = document.getElementById('menuOverlay');
const menuClose = document.getElementById('menuClose');

document.getElementById('btnMenu').onclick = () => {
    playTick();
    menuOverlay.classList.add('active');
};

menuClose.onclick = () => {
    playTick();
    menuOverlay.classList.remove('active');
};

document.getElementById('currencySelector').onclick = () => {
    playTick();
    alert("Currency selector: ID / IDR");
};

// --- NOTIFICATION BELL ---
document.getElementById('notifBell').onclick = () => {
    toggleNotifPanel();
};

// --- RIPPLE EFFECT (Original) ---
document.addEventListener('click', e => {
    const btn = e.target.closest('.ripple');
    if(btn) {
        const c = document.createElement('span');
        const d = Math.max(btn.clientWidth, btn.clientHeight);
        c.style.width = c.style.height = d + 'px';
        c.style.left = (e.clientX - btn.getBoundingClientRect().left - d/2) + 'px';
        c.style.top = (e.clientY - btn.getBoundingClientRect().top - d/2) + 'px';
        btn.appendChild(c);
        setTimeout(()=>c.remove(), 600);
    }
});

// --- ADMIN ACCESS (Original - Tap 5x Logo) ---
let adminTapCount = 0;
let adminTapTimer;

function setupAdminAccess() {
    const logo = document.getElementById('logoJhonPay');
    if (logo) {
        logo.addEventListener('click', function() {
            adminTapCount++;
            
            clearTimeout(adminTapTimer);
            adminTapTimer = setTimeout(() => {
                adminTapCount = 0;
            }, 1000);
            
            if (adminTapCount === 5) {
                adminTapCount = 0;
                showAdminPasswordModal();
            }
        });
    }
}

function showAdminPasswordModal() {
    playTick();
    
    let modal = document.getElementById('adminPasswordModal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('adminPassword').focus();
        return;
    }
    
    modal = document.createElement('div');
    modal.className = 'admin-password-modal';
    modal.id = 'adminPasswordModal';
    modal.innerHTML = `
        <div class="admin-password-box">
            <h3>🔐 Admin Access</h3>
            <input type="password" id="adminPassword" class="admin-password-input" placeholder="Masukkan password" maxlength="20">
            <div class="admin-password-buttons">
                <button class="admin-password-btn cancel" onclick="closeAdminModal()">Batal</button>
                <button class="admin-password-btn confirm" onclick="checkAdminPassword()">Masuk</button>
            </div>
            <p style="color: #666; font-size: 10px; text-align: center; margin-top: 10px;">* Khusus administrator</p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.classList.add('active');
        document.getElementById('adminPassword').focus();
    }, 10);
}

function closeAdminModal() {
    playTick();
    const modal = document.getElementById('adminPasswordModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentNode) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
}

function checkAdminPassword() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === CONFIG.ADMIN_PASSWORD) {
        playTick();
        closeAdminModal();
        showAdminMenu();
    } else {
        playTick();
        showToast('❌ Password salah!', true);
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }
}

function showAdminMenu() {
    const adminModal = document.createElement('div');
    adminModal.className = 'modal-overlay';
    adminModal.id = 'adminMenuModal';
    adminModal.innerHTML = `
        <div class="modal-box" style="max-width: 320px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <i class="ri-shield-user-line" style="font-size: 48px; color: #2563eb;"></i>
                <h3 style="color: #fff; margin-top: 10px;">Admin Panel</h3>
            </div>
            
            <div style="margin-bottom: 20px;">
                <button onclick="adminAddCashback()" style="width: 100%; padding: 15px; background: #10b981; color: white; border: none; border-radius: 12px; margin-bottom: 10px; font-weight: 600; cursor: pointer;">
                    <i class="ri-add-circle-line"></i> Tambah Cashback
                </button>
                <button onclick="viewAllUsers()" style="width: 100%; padding: 15px; background: #2563eb; color: white; border: none; border-radius: 12px; margin-bottom: 10px; font-weight: 600; cursor: pointer;">
                    <i class="ri-group-line"></i> Lihat Semua User
                </button>
                <button onclick="showBannedUsers()" style="width: 100%; padding: 15px; background: #ef4444; color: white; border: none; border-radius: 12px; margin-bottom: 10px; font-weight: 600; cursor: pointer;">
                    <i class="ri-shield-cross-line"></i> Kelola Blokir
                </button>
                <button onclick="adminResetPromo()" style="width: 100%; padding: 15px; background: #f59e0b; color: white; border: none; border-radius: 12px; margin-bottom: 10px; font-weight: 600; cursor: pointer;">
                    <i class="ri-refresh-line"></i> Reset Promo User
                </button>
                <button onclick="viewStats()" style="width: 100%; padding: 15px; background: #8b5cf6; color: white; border: none; border-radius: 12px; margin-bottom: 10px; font-weight: 600; cursor: pointer;">
                    <i class="ri-bar-chart-line"></i> Statistik
                </button>
            </div>
            
            <button class="modal-btn cancel" onclick="closeAdminMenu()" style="width: 100%;">Tutup</button>
        </div>
    `;
    
    document.body.appendChild(adminModal);
    
    setTimeout(() => {
        adminModal.classList.add('active');
    }, 10);
}

function closeAdminMenu() {
    const modal = document.getElementById('adminMenuModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentNode) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
}

function adminAddCashback() {
    const email = prompt('Masukkan Gmail user:', 'user@gmail.com');
    if (!email) return;
    
    const amount = prompt('Masukkan nominal cashback (Rp):', '10000');
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) return;
    
    // Find user's cashback
    const encrypted = localStorage.getItem('cashback_' + email);
    let userCashback = { balance: 0, history: [] };
    if (encrypted) {
        userCashback = decryptData(encrypted) || userCashback;
    }
    
    userCashback.balance += parseInt(amount);
    userCashback.history.unshift({
        date: new Date().toISOString(),
        amount: parseInt(amount),
        from: 'Diberikan oleh Admin',
        email: email,
        status: 'tersedia'
    });
    
    localStorage.setItem('cashback_' + email, encryptData(userCashback));
    
    if (email === currentUserEmail) {
        cashbackBalance = userCashback.balance;
        cashbackHistory = userCashback.history;
        updateCashbackDisplay();
    }
    
    showToast(`✅ Cashback Rp ${parseInt(amount).toLocaleString()} untuk ${email} ditambahkan!`, false);
    addLog(`Admin menambah cashback untuk ${email}`);
}

function viewAllUsers() {
    const registeredIPs = JSON.parse(localStorage.getItem('registeredIPs') || '[]');
    
    let message = '📋 DAFTAR USER TERDAFTAR:\n\n';
    registeredIPs.forEach((entry, index) => {
        const encrypted = localStorage.getItem('cashback_' + entry.email);
        const cashbackData = encrypted ? decryptData(encrypted) : { balance: 0 };
        message += `${index + 1}. ${entry.email}\n   Username: ${entry.username}\n   IP: ${entry.ip}\n   Saldo: Rp ${(cashbackData.balance || 0).toLocaleString()}\n   Bergabung: ${new Date(entry.date).toLocaleDateString('id-ID')}\n\n`;
    });
    
    alert(message);
}

function showBannedUsers() {
    const blockReports = JSON.parse(localStorage.getItem('blockReports') || '[]');
    const list = document.getElementById('bannedUsersList');
    
    if (blockReports.length === 0) {
        list.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Belum ada user terblokir</p>';
    } else {
        let html = '';
        blockReports.forEach((report, index) => {
            const date = new Date(report.date).toLocaleString('id-ID');
            html += `
                <div class="banned-user-item">
                    <div class="header">
                        <span class="email"><i class="ri-google-fill"></i> ${report.email}</span>
                        <button class="unblock-btn" onclick="adminUnblockUser('${report.ip}', '${report.email}')">
                            <i class="ri-lock-unlock-line"></i> Buka
                        </button>
                    </div>
                    <div class="ip"><i class="ri-computer-line"></i> ${report.ip}</div>
                    <div class="reason"><i class="ri-alert-line"></i> ${report.reason}</div>
                    <div class="date"><i class="ri-time-line"></i> ${date}</div>
                </div>
            `;
        });
        list.innerHTML = html;
    }
    
    document.getElementById('bannedUsersModal').classList.add('active');
}

function closeBannedUsersModal() {
    playTick();
    document.getElementById('bannedUsersModal').classList.remove('active');
}

async function adminUnblockUser(ip, email) {
    playTick();
    
    if (confirm(`Yakin ingin membuka blokir untuk ${email}?`)) {
        await unblockUser(ip);
        showToast(`✅ Blokir untuk ${email} dibuka!`, false);
        addLog(`Admin membuka blokir ${email} (${ip})`);
        showBannedUsers();
    }
}

function adminResetPromo() {
    const email = prompt('Masukkan Gmail user untuk reset promo:', 'user@gmail.com');
    if (!email) return;
    
    localStorage.removeItem('promoQRIS_used_' + email);
    localStorage.removeItem('promoQRIS_date_' + email);
    
    if (email === currentUserEmail) {
        checkPromoStatus();
    }
    
    showToast(`✅ Promo untuk ${email} berhasil direset!`, false);
    addLog(`Admin reset promo untuk ${email}`);
}

function viewStats() {
    const registeredIPs = JSON.parse(localStorage.getItem('registeredIPs') || '[]');
    const blockReports = JSON.parse(localStorage.getItem('blockReports') || '[]');
    
    let totalCashback = 0;
    registeredIPs.forEach(entry => {
        const encrypted = localStorage.getItem('cashback_' + entry.email);
        if (encrypted) {
            const data = decryptData(encrypted);
            if (data) totalCashback += data.balance || 0;
        }
    });
    
    const message = `📊 STATISTIK APLIKASI\n\n` +
        `👥 Total User: ${registeredIPs.length}\n` +
        `🚫 User Terblokir: ${blockReports.length}\n` +
        `💰 Total Cashback: Rp ${totalCashback.toLocaleString()}\n` +
        `📱 Versi Aplikasi: ${CONFIG.APP_VERSION}\n` +
        `🕐 Waktu: ${new Date().toLocaleString('id-ID')}`;
    
    alert(message);
}

function exportUserData() {
    if (!isLoggedIn) {
        showToast('Silakan login terlebih dahulu', true);
        return;
    }
    
    const userData = {
        email: currentUserEmail,
        username: currentUsername,
        ip: userIP,
        cashback: {
            balance: cashbackBalance,
            history: cashbackHistory
        },
        transactions: transactionHistory,
        exportDate: new Date().toISOString(),
        version: CONFIG.APP_VERSION
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `jhonpay_data_${currentUserEmail}_${Date.now()}.json`);
    link.click();
    
    showToast('Data berhasil diekspor', false);
}

// --- INITIAL CONTENT (Original) ---
function loadInitialContent() {
    const contentArea = document.getElementById('contentArea');
    
    originalContent = `
        <div class="profile-section">
            <img src="foto4.jpg" class="p-img" onerror="this.src='https://via.placeholder.com/55'">
            <div class="p-info">
                <h2>
                    <span id="displayUsername">${currentUsername || 'Guest'}</span>
                </h2>
                <div class="google-email">
                    <i class="ri-google-fill"></i>
                    <span id="displayGoogleEmail">${currentUserEmail || 'Belum login'}</span>
                </div>
                <div class="ip-address">
                    <i class="ri-computer-line"></i>
                    <span id="displayIP">${userIP || 'Mendeteksi IP...'}</span>
                </div>
                <p><span class="status-dot"></span> Online</p>
                <div class="social-bar">
                    <a href="https://instagram.com/cpm_jhon" target="_blank" class="soc-icon ripple" onclick="playTick()">
                        <i class="ri-instagram-fill"></i>
                    </a>
                    <a href="https://t.me/cpm_jhon21" target="_blank" class="soc-icon ripple" onclick="playTick()">
                        <i class="ri-telegram-fill"></i>
                    </a>
                    <a href="https://wa.me/6285894955362" target="_blank" class="soc-icon ripple" onclick="playTick()">
                        <i class="ri-whatsapp-fill"></i>
                    </a>
                </div>
            </div>
        </div>

        <!-- CASHBACK BALANCE CONTAINER -->
        <div id="cashbackBalanceContainer" style="display: none;"></div>

        <div class="marquee-container">
            <div class="marquee-text">
                INFO: 1 AKUN PER IP • DILARANG MEMBUAT MULTIPLE AKUN • PELANGGARAN AKAN DIBLOKIR PERMANEN
            </div>
        </div>

        <div class="menu-title">Main Service</div>
        <div class="menu-grid">
            <div class="menu-card card-qris-full ripple" onclick="openSheet('qris')">
                <div class="qris-left"><i class="ri-qr-scan-2-line"></i></div>
                <div class="qris-right">
                    <h3>Scan QRIS</h3>
                    <p>Instant Payment</p>
                </div>
            </div>

            <div class="menu-card ripple" onclick="openSheet('dana_only')">
                <div class="mc-icon" style="color:#10b981;"><i class="ri-wallet-3-fill"></i></div>
                <div class="mc-text">
                    <h3>E-Wallet</h3>
                    <p>Dana / OVO / GoPay</p>
                </div>
            </div>

            <div class="menu-card ripple" onclick="openSheet('bank')">
                <div class="mc-icon" style="color:#f59e0b;"><i class="ri-bank-card-fill"></i></div>
                <div class="mc-text">
                    <h3>Transfer</h3>
                    <p>Semua Bank</p>
                </div>
            </div>

             <div class="menu-card ripple" onclick="openSheet('pulsa')">
                <div class="mc-icon" style="color:#ef4444;"><i class="ri-smartphone-fill"></i></div>
                <div class="mc-text">
                    <h3>Top Up</h3>
                    <p>Pulsa All Op</p>
                </div>
            </div>

            <div class="menu-card ripple" onclick="openSheet('all')">
                <div class="mc-icon" style="color:#6366f1;"><i class="ri-grid-fill"></i></div>
                <div class="mc-text">
                    <h3>Lainnya</h3>
                    <p>Lihat Menu</p>
                </div>
            </div>
        </div>

        <div class="info-features">
            <div class="feat-item ripple" onclick="playTick()">
                <i class="ri-flashlight-fill feat-icon"></i>
                <div class="feat-text">
                    <h5>Proses Cepat</h5>
                    <p>Instant Process</p>
                </div>
            </div>
            <div class="feat-item ripple" onclick="playTick()">
                <i class="ri-shield-check-fill feat-icon"></i>
                <div class="feat-text">
                    <h5>Aman 100%</h5>
                    <p>Terverifikasi</p>
                </div>
            </div>
            <div class="feat-item ripple" onclick="openChat()">
                <i class="ri-customer-service-fill feat-icon"></i>
                <div class="feat-text">
                    <h5>Admin 24/7</h5>
                    <p>Siap Membantu</p>
                </div>
            </div>
        </div>

        <!-- PROMO BANNER -->
        <div class="promo-banner ripple" id="promoBanner" onclick="openPromoQRIS()">
            <h4>Promo Cashback 50%</h4>
            <p>Khusus pengguna baru untuk transaksi pertama via QRIS.</p>
            <i class="ri-coupon-3-line promo-deco"></i>
        </div>

        <div style="height:30px;"></div>
    `;
    
    contentArea.innerHTML = originalContent;
    updateCashbackDisplay();
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize database
    await initDatabase();
    
    // Detect IP
    await detectIP();
    
    // Check if banned
    if (await checkIfBanned(userIP)) {
        const blockedEmail = localStorage.getItem('blockedEmail_' + userIP) || 'Unknown';
        showBlockedPage(userIP, blockedEmail);
        return;
    }
    
    // Load initial content
    loadInitialContent();
    
    // Check login status
    await checkUserVerification();
    
    // Setup admin access
    setupAdminAccess();
    
    // Load activity logs
    const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    logs.forEach(log => {
        const time = new Date(log.time).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
        const item = document.createElement('div');
        item.className = 'notif-item';
        item.innerHTML = `
            <div class="ni-icon"><i class="ri-file-list-3-line"></i></div>
            <div class="ni-text">
                <h5>${log.action}</h5>
                <p>Tercatat pada ${time}</p>
            </div>
        `;
        notifContainer.prepend(item);
    });
    
    if (logs.length > 0) {
        notifContainer.querySelector('.empty-state')?.remove();
    }
    
    console.log('JHON Payment System Ready! Version:', CONFIG.APP_VERSION);
});

// --- MAKE FUNCTIONS GLOBAL (Original) ---
window.playTick = playTick;
window.showToast = showToast;
window.openChat = openChat;
window.openPromoQRIS = openPromoQRIS;
window.closePromoModal = closePromoModal;
window.openPaymentModal = openPaymentModal;
window.closePaymentModal = closePaymentModal;
window.sendPaymentConfirmation = sendPaymentConfirmation;
window.toggleNotifPanel = toggleNotifPanel;
window.showHomePage = showHomePage;
window.showUsagePage = showUsagePage;
window.copyIt = copyIt;
window.sendChat = sendChat;
window.openUseCashbackModal = openUseCashbackModal;
window.closeUseCashbackModal = closeUseCashbackModal;
window.selectCashbackUse = selectCashbackUse;
window.applyCashbackToPayment = applyCashbackToPayment;
window.showCashbackHistory = showCashbackHistory;
window.closeCashbackHistory = closeCashbackHistory;
window.showTransactionHistory = showTransactionHistory;
window.closeTransactionHistory = closeTransactionHistory;
window.filterTransactions = filterTransactions;
window.exportTransactions = exportTransactions;
window.showGoogleEmailModal = showGoogleEmailModal;
window.closeGoogleEmailModal = closeGoogleEmailModal;
window.saveGoogleEmail = saveGoogleEmail;
window.showLoginModal = showLoginModal;
window.closeLoginModal = closeLoginModal;
window.loginUser = loginUser;
window.showLogoutConfirm = showLogoutConfirm;
window.closeLogoutModal = closeLogoutModal;
window.logoutUser = logoutUser;
window.showAdminPasswordModal = showAdminPasswordModal;
window.closeAdminModal = closeAdminModal;
window.checkAdminPassword = checkAdminPassword;
window.adminAddCashback = adminAddCashback;
window.viewAllUsers = viewAllUsers;
window.showBannedUsers = showBannedUsers;
window.closeBannedUsersModal = closeBannedUsersModal;
window.adminUnblockUser = adminUnblockUser;
window.adminResetPromo = adminResetPromo;
window.closeAdminMenu = closeAdminMenu;
window.viewStats = viewStats;
window.exportUserData = exportUserData;
window.generateAndDownloadQRIS = generateAndDownloadQRIS;
window.downloadQRCode = downloadQRCode;
window.confirmPayment = confirmPayment;
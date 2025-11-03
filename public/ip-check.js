// ========================================
// IP-BASED ACCESS CONTROL
// ========================================

const ADMIN_IPS = [
    '127.0.0.1',           // localhost
    '::1',                 // localhost IPv6
    '78.83.50.152',        // Admin IP 1
    '185.53.231.240',      // Admin IP 2
];

let userIP = null;
let isAdmin = false;

// Get user's IP address
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        userIP = data.ip;
        console.log('Detected IP:', userIP);
        return userIP;
    } catch (error) {
        console.error('Failed to get IP:', error);
        // Fallback - assume localhost if fetch fails
        userIP = '127.0.0.1';
        return userIP;
    }
}

// Check if current IP is admin
async function checkAdminAccess() {
    if (!userIP) {
        await getUserIP();
    }
    
    isAdmin = ADMIN_IPS.includes(userIP);
    console.log('Admin access:', isAdmin);
    
    return isAdmin;
}

// Hide debug features for non-admins
async function initAccessControl() {
    await checkAdminAccess();
    
    if (!isAdmin) {
        // Hide debug toggle button
        const debugToggle = document.querySelector('[onclick*="toggleDebug"]');
        if (debugToggle) {
            debugToggle.style.display = 'none';
        }
        
        // Hide debug info div
        const debugInfo = document.getElementById('debugInfo');
        if (debugInfo) {
            debugInfo.style.display = 'none';
        }
        
        // Disable console logging for non-admins
        console.log = function() {};
        console.debug = function() {};
    }
}

// Block test pages for non-admins
async function blockTestPage() {
    await checkAdminAccess();
    
    if (!isAdmin) {
        document.body.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background: #0a0e27;
                color: white;
                font-family: Arial, sans-serif;
                text-align: center;
                flex-direction: column;
            ">
                <h1 style="font-size: 3em; margin-bottom: 20px;">🔒</h1>
                <h2>Access Denied</h2>
                <p style="color: #b8c5d6; margin: 20px 0;">
                    This page is restricted to administrators only.
                </p>
                <a href="index.html" style="
                    background: #667eea;
                    color: white;
                    padding: 15px 30px;
                    border-radius: 10px;
                    text-decoration: none;
                    margin-top: 20px;
                ">Go to Home</a>
            </div>
        `;
        
        // Stop all scripts
        throw new Error('Access Denied');
    }
}

// Export functions
window.accessControl = {
    checkAdminAccess,
    initAccessControl,
    blockTestPage,
    isAdmin: () => isAdmin,
    getUserIP: () => userIP
};

// ========================================
// ADMIN HEADER - Common for all admin pages
// ========================================
// This script provides:
// 1. IP-based access control
// 2. Navigation menu
// 3. Wallet connection
// ========================================

const ADMIN_IPS = [
    '127.0.0.1',           // localhost
    '::1',                 // localhost IPv6  
    '78.83.50.152',        // Admin IP 1
    '185.53.231.240',      // Admin IP 2
];

let userIP = null;
let isAdmin = false;

// ========================================
// IP CHECK & REDIRECT
// ========================================
async function checkAdminIP() {
    console.log('🔍 Checking admin access...');
    
    try {
        // Get user's IP
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        userIP = data.ip;
        
        console.log('Detected IP:', userIP);
        
        // Check if IP is in admin list
        isAdmin = ADMIN_IPS.includes(userIP);
        
        if (isAdmin) {
            console.log('✅ Admin IP detected - Access granted');
            return true;
        } else {
            console.log('❌ Non-admin IP detected - Redirecting...');
            
            // Redirect to root index.html (which will handle routing)
            window.location.href = '../index.html';
            
            // Stop execution
            throw new Error('Access Denied - Redirecting');
        }
        
    } catch (error) {
        if (error.message === 'Access Denied - Redirecting') {
            throw error;
        }
        
        console.error('IP check failed:', error);
        
        // Fallback: If IP check fails, assume localhost (for development)
        // But still be cautious
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';
        
        if (isLocalhost) {
            console.log('⚠️ IP check failed but localhost detected - Allowing access');
            isAdmin = true;
            return true;
        } else {
            console.log('❌ IP check failed and not localhost - Redirecting');
            window.location.href = '../index.html';
            throw new Error('Access Denied - Redirecting');
        }
    }
}

// ========================================
// NAVIGATION MENU INJECTION
// ========================================
function injectNavigationMenu() {
    console.log('📋 Injecting navigation menu...');
    
    const nav = document.createElement('nav');
    nav.style.cssText = `
        background: #1a1f3a;
        padding: 20px;
        text-align: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        position: sticky;
        top: 0;
        z-index: 1000;
    `;
    
    // Get current page name
    const currentPage = window.location.pathname.split('/').pop();
    
    // Navigation links
    const links = [
        { href: 'index.html', text: '📊 Dashboard', page: 'index.html' },
        { href: 'queue-management.html', text: '📋 Queue', page: 'queue-management.html' },
        { href: 'aaa-add-liquidity.html', text: '💧 Add Liquidity', page: 'aaa-add-liquidity.html' },
        { href: 'bbb-send-tokens-to-donor.html', text: '📤 Send Tokens', page: 'bbb-send-tokens-to-donor.html' },
        { href: 'ggg-mint-and-send.html', text: '🏭 Mint & Send', page: 'ggg-mint-and-send.html' },
        { href: 'vvv-mint-new-AMS.html', text: '⚡ Mint New', page: 'vvv-mint-new-AMS.html' },
        { href: 'burn-tokens.html', text: '🔥 Burn', page: 'burn-tokens.html' },
        { href: 'transfer-history.html', text: '📜 Transfers', page: 'transfer-history.html' },
        { href: 'trading-history.html', text: '📈 Trading', page: 'trading-history.html' },
        { href: '../public/contact.html', text: '📞 Contact', page: 'contact' },
        { href: '../public/index.html', text: '🏠 Public Site', page: 'public' }
    ];
    
    // Create links
    links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.text;
        a.style.cssText = `
            color: ${currentPage === link.page ? '#ffc107' : '#667eea'};
            text-decoration: none;
            margin: 0 10px;
            font-size: 0.95em;
            transition: color 0.3s;
            font-weight: ${currentPage === link.page ? 'bold' : 'normal'};
        `;
        
        a.addEventListener('mouseenter', () => {
            if (currentPage !== link.page) {
                a.style.color = '#ffc107';
            }
        });
        
        a.addEventListener('mouseleave', () => {
            if (currentPage !== link.page) {
                a.style.color = '#667eea';
            }
        });
        
        nav.appendChild(a);
    });
    
    // Insert at the top of body
    if (document.body.firstChild) {
        document.body.insertBefore(nav, document.body.firstChild);
    } else {
        document.body.appendChild(nav);
    }
    
    console.log('✅ Navigation menu injected');
}

// ========================================
// ADMIN INFO BANNER
// ========================================
function injectAdminBanner() {
    console.log('📢 Injecting admin banner...');
    
    const banner = document.createElement('div');
    banner.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 10px 20px;
        text-align: center;
        font-size: 0.9em;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    
    banner.innerHTML = `
        <span style="margin-right: 20px;">🔐 Admin Mode</span>
        <span style="margin-right: 20px;">📍 IP: ${userIP || 'localhost'}</span>
        <span style="margin-right: 20px;">👤 Status: <strong>ADMIN</strong></span>
        <span style="cursor: pointer; text-decoration: underline;" onclick="if(confirm('Logout and return to public site?')) window.location.href='../index.html'">🚪 Logout</span>
    `;
    
    // Insert after nav or at top
    const nav = document.querySelector('nav');
    if (nav && nav.nextSibling) {
        document.body.insertBefore(banner, nav.nextSibling);
    } else if (document.body.firstChild) {
        document.body.insertBefore(banner, document.body.firstChild);
    } else {
        document.body.appendChild(banner);
    }
    
    console.log('✅ Admin banner injected');
}

// ========================================
// WALLET HELPER INTEGRATION
// ========================================
function loadWalletHelper() {
    console.log('🦊 Loading wallet helper...');
    
    // Check if wallet-helper.js is already loaded
    if (window.walletHelper) {
        console.log('✅ Wallet helper already loaded');
        return;
    }
    
    // Load wallet-helper.js dynamically
    const script = document.createElement('script');
    script.src = 'wallet-helper.js';
    script.onload = () => {
        console.log('✅ Wallet helper loaded');
    };
    script.onerror = () => {
        console.warn('⚠️ Wallet helper not found (optional)');
    };
    
    document.head.appendChild(script);
}

// ========================================
// MAIN INITIALIZATION
// ========================================
async function initAdminPage() {
    console.log('🚀 Initializing admin page...');
    
    try {
        // Step 1: Check admin IP (will redirect if not admin)
        await checkAdminIP();
        
        // Step 2: Inject navigation menu
        injectNavigationMenu();
        
        // Step 3: Inject admin banner
        injectAdminBanner();
        
        // Step 4: Load wallet helper (optional)
        loadWalletHelper();
        
        console.log('✅ Admin page initialized successfully');
        
        return true;
        
    } catch (error) {
        if (error.message.includes('Access Denied')) {
            // Redirect is already happening, just stop execution
            return false;
        }
        
        console.error('❌ Admin page initialization failed:', error);
        return false;
    }
}

// ========================================
// AUTO-INIT ON PAGE LOAD
// ========================================
// Run immediately when script loads
(async function() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdminPage);
    } else {
        await initAdminPage();
    }
})();

// Export for manual use if needed
window.adminHeader = {
    checkAdminIP,
    injectNavigationMenu,
    injectAdminBanner,
    isAdmin: () => isAdmin,
    getUserIP: () => userIP
};

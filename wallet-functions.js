// Insert these functions before the showStatus function in connect.html

// ========================================
// TRUST WALLET
// ========================================
async function connectTrustWallet() {
    updateDebug('🛡️ Connecting to Trust Wallet...');
    
    if (typeof window.ethereum !== 'undefined') {
        updateDebug('✅ Ethereum provider found');
        if (window.ethereum.isTrust) {
            updateDebug('✅ Trust Wallet detected!');
        }
        await connectWallet('Trust Wallet');
    } else {
        showStatus('❌ Trust Wallet не е открит!', 'error');
        if (confirm('Trust Wallet не е открит.\n\nИскаш ли да го свалиш?')) {
            window.open('https://trustwallet.com/download', '_blank');
        }
    }
}

// ========================================
// BINANCE WALLET
// ========================================
async function connectBinanceWallet() {
    updateDebug('🔶 Connecting to Binance Wallet...');
    
    if (typeof window.BinanceChain !== 'undefined') {
        try {
            const accounts = await window.BinanceChain.request({ method: 'eth_requestAccounts' });
            web3 = new Web3(window.BinanceChain);
            account = accounts[0];
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('walletAddress', account);
            localStorage.setItem('walletType', 'Binance Wallet');
            showStatus(`✅ Свързан с Binance Wallet!`, 'connected');
        } catch (error) {
            showStatus('❌ Грешка: ' + error.message, 'error');
        }
    } else if (typeof window.ethereum !== 'undefined') {
        await connectWallet('Binance Wallet');
    } else {
        if (confirm('Binance Wallet не е открит.\n\nСвали го?')) {
            window.open('https://www.binance.com/en/wallet-direct', '_blank');
        }
    }
}

// ========================================
// COINBASE WALLET
// ========================================
async function connectCoinbaseWallet() {
    updateDebug('🔵 Connecting to Coinbase Wallet...');
    if (typeof window.ethereum !== 'undefined') {
        await connectWallet('Coinbase Wallet');
    } else {
        if (confirm('Coinbase Wallet не е открит.\n\nСвали го?')) {
            window.open('https://www.coinbase.com/wallet/downloads', '_blank');
        }
    }
}

// ========================================
// WALLETCONNECT
// ========================================
async function connectWalletConnect() {
    alert('WalletConnect идва скоро!\n\nЗасега използвай MetaMask, Trust, Binance или Coinbase Wallet.');
}

// ========================================
// UNIVERSAL CONNECT
// ========================================
async function connectWallet(walletName) {
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        web3 = new Web3(window.ethereum);
        account = accounts[0];
        
        const chainId = await web3.eth.getChainId();
        if (chainId !== 56 && chainId !== 97) {
            const switchToTestnet = confirm('Не си на BSC!\n\nOK за Testnet, Cancel за Mainnet');
            const targetChainId = switchToTestnet ? '0x61' : '0x38';
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: targetChainId }],
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    const networkParams = switchToTestnet ? {
                        chainId: '0x61',
                        chainName: 'BSC Testnet',
                        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                        rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                        blockExplorerUrls: ['https://testnet.bscscan.com']
                    } : {
                        chainId: '0x38',
                        chainName: 'BSC Mainnet',
                        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                        rpcUrls: ['https://bsc-dataseed.binance.org/'],
                        blockExplorerUrls: ['https://bscscan.com']
                    };
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [networkParams]
                    });
                }
            }
        }
        
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', account);
        localStorage.setItem('walletType', walletName);
        
        showStatus(`✅ Свързан с ${walletName}!\n${account.substring(0, 10)}...`, 'connected');
        
    } catch (error) {
        showStatus('❌ Грешка: ' + error.message, 'error');
    }
}

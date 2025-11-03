// ========================================
// WALLET HELPER - Use in all admin pages
// ========================================

let web3;
let userAccount;
let provider;

// Enhanced wallet detection
async function initWallet() {
    console.log('🔍 Checking for wallet...');
    
    // Check multiple providers
    const hasEthereum = typeof window.ethereum !== 'undefined';
    const hasMetaMask = window.ethereum && window.ethereum.isMetaMask;
    const hasTrust = window.ethereum && window.ethereum.isTrust;
    const hasBinance = typeof window.BinanceChain !== 'undefined';
    const hasCoinbase = window.ethereum && window.ethereum.isCoinbaseWallet;
    
    console.log('Ethereum provider:', hasEthereum);
    console.log('MetaMask:', hasMetaMask);
    console.log('Trust Wallet:', hasTrust);
    console.log('Binance Wallet:', hasBinance);
    console.log('Coinbase Wallet:', hasCoinbase);
    
    // Try to connect
    if (hasEthereum) {
        try {
            console.log('📡 Requesting accounts...');
            
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts returned');
            }
            
            web3 = new Web3(window.ethereum);
            userAccount = accounts[0];
            provider = window.ethereum;
            
            console.log('✅ Connected:', userAccount);
            
            // Check network
            const chainId = await web3.eth.getChainId();
            console.log('Chain ID:', chainId);
            
            // Network check (56 = BSC Mainnet, 97 = BSC Testnet)
            if (chainId !== 56 && chainId !== 97) {
                console.warn('⚠️ Not on BSC network!');
                
                const switchToTestnet = confirm(
                    '⚠️ Не си на BNB Smart Chain!\n\n' +
                    'Натисни OK за BSC Testnet\n' +
                    'Натисни Cancel за BSC Mainnet'
                );
                
                try {
                    const targetChainId = switchToTestnet ? '0x61' : '0x38';
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: targetChainId }],
                    });
                    console.log('✅ Network switched');
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        // Try to add network
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
                        console.log('✅ Network added');
                    }
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Connection error:', error);
            
            if (error.code === 4001) {
                alert('⚠️ Отказа свързването с wallet!');
            } else if (error.code === -32002) {
                alert('⚠️ Вече има pending request. Провери wallet прозореца!');
            } else {
                alert('⚠️ Грешка при свързване: ' + error.message);
            }
            
            return false;
        }
    } else if (hasBinance) {
        // Try Binance Wallet
        try {
            const accounts = await window.BinanceChain.request({ 
                method: 'eth_requestAccounts' 
            });
            web3 = new Web3(window.BinanceChain);
            userAccount = accounts[0];
            provider = window.BinanceChain;
            console.log('✅ Connected with Binance Wallet:', userAccount);
            return true;
        } catch (error) {
            console.error('❌ Binance Wallet error:', error);
            alert('⚠️ Грешка при свързване с Binance Wallet: ' + error.message);
            return false;
        }
    } else {
        console.error('❌ No wallet provider found');
        
        const install = confirm(
            '⚠️ Не е открит crypto wallet!\n\n' +
            'Трябва да инсталираш MetaMask, Trust Wallet или друг wallet.\n\n' +
            'Натисни OK за да отвориш MetaMask download страницата.'
        );
        
        if (install) {
            window.open('https://metamask.io/download/', '_blank');
        }
        
        return false;
    }
}

// Listen for account changes
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', function (accounts) {
        if (accounts.length > 0) {
            userAccount = accounts[0];
            console.log('🔄 Account changed:', userAccount);
            window.location.reload();
        } else {
            console.log('🔌 Wallet disconnected');
            alert('⚠️ Wallet е disconnected! Презареждаме страницата...');
            window.location.reload();
        }
    });
    
    window.ethereum.on('chainChanged', function (chainId) {
        console.log('🔄 Chain changed:', chainId);
        window.location.reload();
    });
}

// Export for use in other scripts
window.walletHelper = {
    init: initWallet,
    getWeb3: () => web3,
    getAccount: () => userAccount,
    getProvider: () => provider
};

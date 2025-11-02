// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @title Anti-Mafia-Sponsorship Token - UPDATED with Price Check
contract AntiMafiaSponsorshipToken {
    // ... (same as before до calculateTimeout)
    
    // ==================== PANCAKESWAP INTEGRATION ====================
    address public pancakeswapPair; // Трябва да се set след добавяне на ликвидност
    uint256 public initialPrice; // Начална цена (set при първата ликвидност)
    
    function setPancakeswapPair(address _pair) external onlyOwner {
        require(pancakeswapPair == address(0), "Already set");
        pancakeswapPair = _pair;
    }
    
    function setInitialPrice(uint256 _price) external onlyOwner {
        require(initialPrice == 0, "Already set");
        initialPrice = _price;
    }
    
    // ==================== UPDATED TIMEOUT CALCULATION ====================
    function calculateTimeout() public view returns (uint256) {
        uint256 pendingCount = 0;
        for (uint256 i = 0; i < donationQueue.length; i++) {
            if (!donationQueue[i].processed) pendingCount++;
        }
        
        // Check queue length
        if (pendingCount > 1000) {
            return 30 minutes;
        }
        
        // Check price (if pair is set)
        if (pancakeswapPair != address(0) && initialPrice > 0) {
            uint256 currentPrice = getCurrentPrice();
            
            // If price is 100x higher → 30 minutes
            if (currentPrice >= initialPrice * 100) {
                return 30 minutes;
            }
        }
        
        return 12 hours;
    }
    
    function getCurrentPrice() public view returns (uint256) {
        if (pancakeswapPair == address(0)) return 0;
        
        // Get reserves from PancakeSwap pair
        (uint112 reserve0, uint112 reserve1,) = IPancakePair(pancakeswapPair).getReserves();
        
        // Calculate price (assuming token0 is AMS, token1 is BNB)
        // Price = reserve1 / reserve0 = BNB per AMS
        if (reserve0 == 0) return 0;
        
        return (uint256(reserve1) * 1e18) / uint256(reserve0);
    }
    
    // ... (rest of contract)
}

// Interface for PancakeSwap Pair
interface IPancakePair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
}

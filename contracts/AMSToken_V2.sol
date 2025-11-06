// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title AMSToken_V2 - Example Future Upgrade
 * @notice This shows how to add new features while maintaining compatibility
 * @dev CRITICAL: Storage layout MUST match V1 exactly, new variables go at the end!
 */
contract AMSToken_V2 {
    // ==================== PROXY STORAGE (Slots 0-5) ====================
    // NEVER MODIFY THESE!
    address private _proxyImplementation;
    address private _proxyAdmin;
    address private _proxyPendingAdmin;
    uint256 private _proxyUpgradeTimelock;
    address private _proxyPendingImpl;
    uint256 private _proxyPendingTime;
    
    // ==================== V1 TOKEN STORAGE (Slots 6-30) ====================
    // MUST MATCH V1 EXACTLY - DO NOT REORDER!
    
    string private _name;
    string private _symbol;
    uint256 public totalSupply;
    uint256 public totalBurned;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    address public owner;
    uint256 public deploymentTime;
    bool public paused;
    uint256 public constant OWNER_TRADING_START = 11;
    uint256 public constant OWNER_TRADING_END = 12;
    uint256 public constant TIMEZONE_OFFSET = 2 hours;
    uint256 public ownerDailyTrades;
    uint256 public lastOwnerTradeDay;
    uint256 public lastOwnerTransferTime;
    uint256 public ownerTransferTimeout;
    mapping(address => uint256) public lastSellTime;
    mapping(address => uint256) public weeklyTokensSold;
    uint256 public sellTax;
    QueuedDonation[] public donationQueue;
    uint256 public lastProcessedTime;
    uint256 public lastBurnTime;
    address public pancakeswapPair;
    uint256 public initialPrice;
    
    // ==================== NEW V2 STORAGE (Starts at Slot 31) ====================
    // NEW FEATURES CAN GO HERE!
    
    // Slot 31: Anti-bot protection
    mapping(address => uint256) public lastTransferTime;
    
    // Slot 32: Anti-bot delay
    uint256 public antiBot Delay;
    
    // Slot 33: Blacklist
    mapping(address => bool) public blacklisted;
    
    // Slot 34: Max transaction amount
    uint256 public maxTransactionAmount;
    
    // Slot 35: Fee distribution
    address public marketingWallet;
    
    // Slot 36: Marketing fee
    uint256 public marketingFee;
    
    // Slot 37: Reflection rewards
    bool public reflectionsEnabled;
    
    // Slot 38: Total reflections
    uint256 public totalReflections;
    
    // Slot 39: Version
    uint256 public version;
    
    // ==================== STRUCTS ====================
    struct QueuedDonation {
        address donor;
        uint256 bnbAmount;
        uint256 tokensToReceive;
        uint256 timestamp;
        bool processed;
    }
    
    // ==================== CONSTANTS ====================
    uint8 public constant decimals = 18;
    uint256 public constant MAX_OWNER_TRADES_PER_DAY = 10;
    uint256 public constant OWNER_TRADE_LIMIT = 1000 * 10**18;
    uint256 public constant FIRST_MONTH_LOCK = 30 days;
    uint256 public constant FIRST_UNLOCK = 24 * 30 days;
    uint256 public constant SECOND_UNLOCK = 48 * 30 days;
    uint256 public constant THIRD_UNLOCK = 72 * 30 days;
    uint256 public constant SELL_LIMIT_PER_WEEK = 1000 * 10**18;
    uint256 public constant WEEK_DURATION = 7 days;
    uint256 public constant BURN_PERIOD = 60 days;
    uint256 public constant BURN_PERCENTAGE = 5;
    
    // ==================== NEW EVENTS ====================
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner_, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 amount, string reason);
    event Burn(uint256 amount);
    event Blacklisted(address indexed account, bool status);
    event AntiBotEnabled(uint256 delay);
    event MaxTransactionUpdated(uint256 maxAmount);
    event ReflectionDistributed(uint256 amount);
    
    // ==================== MODIFIERS ====================
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }
    
    modifier notBlacklisted(address account) {
        require(!blacklisted[account], "Blacklisted");
        _;
    }
    
    // ==================== V2 INITIALIZER ====================
    
    /**
     * @notice Initialize V2 features (called once after upgrade)
     */
    function initializeV2() external onlyOwner {
        require(version == 0, "V2 already initialized");
        
        version = 2;
        antiBotDelay = 3 seconds;
        maxTransactionAmount = 100000 * 10**18; // 100k AMS
        marketingFee = 1; // 0.01%
        reflectionsEnabled = false;
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    function name() external view returns (string memory) {
        return _name;
    }
    
    function symbol() external view returns (string memory) {
        return _symbol;
    }
    
    function getVersion() external view returns (string memory) {
        return "v2.0.0";
    }
    
    // ==================== CORE ERC20 (Enhanced) ====================
    
    function transfer(address to, uint256 amount) 
        external 
        whenNotPaused 
        notBlacklisted(msg.sender) 
        notBlacklisted(to) 
        returns (bool) 
    {
        require(to != address(0), "Transfer to zero address");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        require(amount <= maxTransactionAmount, "Exceeds max transaction");
        
        // Anti-bot check
        if (antiBotDelay > 0) {
            require(
                block.timestamp >= lastTransferTime[msg.sender] + antiBotDelay,
                "Anti-bot delay"
            );
            lastTransferTime[msg.sender] = block.timestamp;
        }
        
        // Owner trading restrictions
        if (msg.sender == owner) {
            require(_canOwnerTrade(), "Outside trading window");
            require(amount <= OWNER_TRADE_LIMIT, "Exceeds trade limit");
            _trackOwnerTrade();
        }
        
        // Calculate fees
        uint256 sellTaxAmount = 0;
        uint256 marketingFeeAmount = 0;
        
        if (_isSellToLP(msg.sender, to)) {
            sellTaxAmount = (amount * sellTax) / 10000;
            marketingFeeAmount = (amount * marketingFee) / 10000;
        }
        
        uint256 totalFees = sellTaxAmount + marketingFeeAmount;
        uint256 amountAfterFees = amount - totalFees;
        
        // Transfer
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amountAfterFees;
        
        // Distribute fees
        if (sellTaxAmount > 0) {
            balanceOf[owner] += sellTaxAmount;
            emit Transfer(msg.sender, owner, sellTaxAmount);
        }
        
        if (marketingFeeAmount > 0 && marketingWallet != address(0)) {
            balanceOf[marketingWallet] += marketingFeeAmount;
            emit Transfer(msg.sender, marketingWallet, marketingFeeAmount);
        }
        
        // Reflections (if enabled)
        if (reflectionsEnabled && totalFees > 0) {
            _distributeReflections(totalFees / 2);
        }
        
        emit Transfer(msg.sender, to, amountAfterFees);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) 
        external 
        whenNotPaused 
        notBlacklisted(from)
        notBlacklisted(to)
        returns (bool) 
    {
        require(to != address(0), "Transfer to zero address");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        require(amount <= maxTransactionAmount, "Exceeds max transaction");
        
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    // ==================== V2 NEW FEATURES ====================
    
    /**
     * @notice Blacklist an address
     */
    function setBlacklist(address account, bool status) external onlyOwner {
        blacklisted[account] = status;
        emit Blacklisted(account, status);
    }
    
    /**
     * @notice Batch blacklist
     */
    function batchBlacklist(address[] calldata accounts, bool status) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            blacklisted[accounts[i]] = status;
            emit Blacklisted(accounts[i], status);
        }
    }
    
    /**
     * @notice Set anti-bot delay
     */
    function setAntiBotDelay(uint256 delay) external onlyOwner {
        require(delay <= 60, "Delay too long");
        antiBotDelay = delay;
        emit AntiBotEnabled(delay);
    }
    
    /**
     * @notice Set max transaction amount
     */
    function setMaxTransaction(uint256 maxAmount) external onlyOwner {
        require(maxAmount >= 1000 * 10**18, "Too low");
        maxTransactionAmount = maxAmount;
        emit MaxTransactionUpdated(maxAmount);
    }
    
    /**
     * @notice Set marketing wallet
     */
    function setMarketingWallet(address wallet) external onlyOwner {
        require(wallet != address(0), "Invalid wallet");
        marketingWallet = wallet;
    }
    
    /**
     * @notice Set marketing fee
     */
    function setMarketingFee(uint256 fee) external onlyOwner {
        require(fee <= 500, "Fee too high"); // Max 5%
        marketingFee = fee;
    }
    
    /**
     * @notice Enable/disable reflections
     */
    function setReflections(bool enabled) external onlyOwner {
        reflectionsEnabled = enabled;
    }
    
    /**
     * @notice Distribute reflections to holders
     */
    function _distributeReflections(uint256 amount) internal {
        totalReflections += amount;
        emit ReflectionDistributed(amount);
        // Actual distribution logic would go here
    }
    
    // ==================== V1 FUNCTIONS (Unchanged) ====================
    
    function mint(address to, uint256 amount, string memory reason) external onlyOwner {
        require(to != address(0), "Mint to zero address");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Mint(to, amount, reason);
        emit Transfer(address(0), to, amount);
    }
    
    function burn() external onlyOwner {
        require(block.timestamp >= lastBurnTime + BURN_PERIOD, "Burn period not reached");
        uint256 burnAmount = (totalSupply * BURN_PERCENTAGE) / 100;
        require(balanceOf[owner] >= burnAmount, "Insufficient balance");
        
        balanceOf[owner] -= burnAmount;
        totalSupply -= burnAmount;
        totalBurned += burnAmount;
        lastBurnTime = block.timestamp;
        
        emit Burn(burnAmount);
        emit Transfer(owner, address(0), burnAmount);
    }
    
    function pause() external onlyOwner {
        paused = true;
    }
    
    function unpause() external onlyOwner {
        paused = false;
    }
    
    function addToQueue(address donor, uint256 bnbAmount, uint256 tokensToReceive) 
        external onlyOwner {
        donationQueue.push(QueuedDonation({
            donor: donor,
            bnbAmount: bnbAmount,
            tokensToReceive: tokensToReceive,
            timestamp: block.timestamp,
            processed: false
        }));
    }
    
    function processQueue() external onlyOwner {
        require(
            block.timestamp >= lastOwnerTransferTime + ownerTransferTimeout,
            "Timeout not met"
        );
        
        for (uint256 i = 0; i < donationQueue.length; i++) {
            if (!donationQueue[i].processed) {
                QueuedDonation storage donation = donationQueue[i];
                require(balanceOf[owner] >= donation.tokensToReceive, "Insufficient balance");
                
                balanceOf[owner] -= donation.tokensToReceive;
                balanceOf[donation.donor] += donation.tokensToReceive;
                donation.processed = true;
                
                emit Transfer(owner, donation.donor, donation.tokensToReceive);
            }
        }
        
        lastOwnerTransferTime = block.timestamp;
        lastProcessedTime = block.timestamp;
    }
    
    function getQueueLength() external view returns (uint256) {
        return donationQueue.length;
    }
    
    function rescueTokens(address token, address to, uint256 amount) external onlyOwner {
        require(token != address(this), "Cannot rescue AMS");
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Rescue failed");
    }
    
    function rescueBNB(address payable to) external onlyOwner {
        to.transfer(address(this).balance);
    }
    
    function setPancakeswapPair(address _pair) external onlyOwner {
        require(pancakeswapPair == address(0), "Already set");
        pancakeswapPair = _pair;
    }
    
    function setInitialPrice(uint256 _price) external onlyOwner {
        require(initialPrice == 0, "Already set");
        initialPrice = _price;
    }
    
    function setSellTax(uint256 _tax) external onlyOwner {
        require(_tax <= 1000, "Tax too high");
        sellTax = _tax;
    }
    
    // ==================== INTERNAL HELPERS ====================
    
    function _canOwnerTrade() internal view returns (bool) {
        uint256 currentHour = ((block.timestamp + TIMEZONE_OFFSET) % 1 days) / 1 hours;
        return currentHour >= OWNER_TRADING_START && currentHour < OWNER_TRADING_END;
    }
    
    function _trackOwnerTrade() internal {
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay != lastOwnerTradeDay) {
            ownerDailyTrades = 0;
            lastOwnerTradeDay = currentDay;
        }
        ownerDailyTrades++;
        require(ownerDailyTrades <= MAX_OWNER_TRADES_PER_DAY, "Daily limit");
    }
    
    function _isSellToLP(address from, address to) internal view returns (bool) {
        return to == pancakeswapPair && from != owner;
    }
    
    receive() external payable {}
}

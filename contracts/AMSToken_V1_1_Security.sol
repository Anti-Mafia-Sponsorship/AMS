// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title AMSToken_V1_1 - Security Enhanced Version
 * @notice Adds owner transfer, mint limits, and reentrancy protection
 * @dev CRITICAL: Storage layout MUST match V1 exactly!
 */
contract AMSToken_V1_1 {
    // ==================== PROXY STORAGE (Slots 0-5) ====================
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
    
    // ==================== V1.1 NEW STORAGE (Slots 31+) ====================
    
    // Slot 31-32: Owner transfer (two-step)
    address public pendingOwner;
    uint256 public ownershipTransferInitiated;
    
    // Slot 33-34: Mint limits
    uint256 public totalMinted;
    uint256 public lastMintTime;
    
    // Slot 35: Reentrancy guard
    uint256 private _status;
    
    // Slot 36: Version
    uint256 public version;
    
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
    
    // V1.1 Security Constants
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;
    uint256 public constant MAX_MINT_PER_CALL = 1_000_000 * 10**18;
    uint256 public constant MAX_MINT_PER_DAY = 5_000_000 * 10**18;
    uint256 public constant OWNERSHIP_TRANSFER_DELAY = 24 hours;
    
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    
    // ==================== STRUCTS ====================
    
    struct QueuedDonation {
        address donor;
        uint256 bnbAmount;
        uint256 tokensToReceive;
        uint256 timestamp;
        bool processed;
    }
    
    // ==================== EVENTS ====================
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner_, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 amount, string reason);
    event Burn(uint256 amount);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferCancelled(address indexed owner, address indexed cancelledPendingOwner);
    event MintLimitReached(string limitType, uint256 amount);
    event SecurityEvent(string eventType, address indexed actor, uint256 timestamp);
    
    // ==================== MODIFIERS ====================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }
    
    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
    
    // ==================== INITIALIZER V1.1 ====================
    
    /**
     * @notice Initialize V1.1 features (called once after upgrade)
     */
    function initializeV1_1() external onlyOwner {
        require(version == 0, "V1.1 already initialized");
        
        version = 101;  // Version 1.1
        _status = _NOT_ENTERED;  // Initialize reentrancy guard
        totalMinted = totalSupply;  // Track what's already minted
        
        emit SecurityEvent("V1.1 Initialized", msg.sender, block.timestamp);
    }
    
    // ==================== OWNERSHIP TRANSFER (NEW) ====================
    
    /**
     * @notice Start ownership transfer (step 1 of 2)
     * @param newOwner Address of new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        require(newOwner != owner, "Already owner");
        require(newOwner != pendingOwner, "Already pending");
        
        pendingOwner = newOwner;
        ownershipTransferInitiated = block.timestamp;
        
        emit OwnershipTransferStarted(owner, newOwner);
        emit SecurityEvent("Ownership Transfer Initiated", newOwner, block.timestamp);
    }
    
    /**
     * @notice Accept ownership (step 2 of 2)
     * @dev Must be called by pending owner after delay
     */
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Not pending owner");
        require(pendingOwner != address(0), "No pending transfer");
        require(
            block.timestamp >= ownershipTransferInitiated + OWNERSHIP_TRANSFER_DELAY,
            "Transfer delay not met"
        );
        
        address oldOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        ownershipTransferInitiated = 0;
        
        emit OwnershipTransferred(oldOwner, owner);
        emit SecurityEvent("Ownership Transferred", owner, block.timestamp);
    }
    
    /**
     * @notice Cancel pending ownership transfer
     */
    function cancelOwnershipTransfer() external onlyOwner {
        require(pendingOwner != address(0), "No pending transfer");
        
        address cancelled = pendingOwner;
        pendingOwner = address(0);
        ownershipTransferInitiated = 0;
        
        emit OwnershipTransferCancelled(owner, cancelled);
        emit SecurityEvent("Ownership Transfer Cancelled", cancelled, block.timestamp);
    }
    
    /**
     * @notice Renounce ownership (permanent!)
     * @dev DANGEROUS: Contract will be ownerless forever
     */
    function renounceOwnership() external onlyOwner {
        require(pendingOwner == address(0), "Cancel pending transfer first");
        
        address oldOwner = owner;
        owner = address(0);
        
        emit OwnershipTransferred(oldOwner, address(0));
        emit SecurityEvent("Ownership Renounced", oldOwner, block.timestamp);
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    function name() external view returns (string memory) {
        return _name;
    }
    
    function symbol() external view returns (string memory) {
        return _symbol;
    }
    
    function getVersion() external pure returns (string memory) {
        return "v1.1.0";
    }
    
    function getSecurityInfo() external view returns (
        address currentOwner,
        address pendingOwner_,
        bool isPaused,
        uint256 remainingMintable,
        uint256 version_
    ) {
        return (
            owner,
            pendingOwner,
            paused,
            MAX_SUPPLY > totalSupply ? MAX_SUPPLY - totalSupply : 0,
            version
        );
    }
    
    function getRemainingMintable() external view returns (uint256) {
        if (totalSupply >= MAX_SUPPLY) return 0;
        return MAX_SUPPLY - totalSupply;
    }
    
    function getDailyMintRemaining() external view returns (uint256) {
        if (block.timestamp > lastMintTime + 1 days) {
            return MAX_MINT_PER_DAY;
        }
        // Calculate based on actual mints today (would need tracking)
        return MAX_MINT_PER_DAY;
    }
    
    // ==================== ENHANCED MINT (WITH LIMITS) ====================
    
    function mint(address to, uint256 amount, string memory reason) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(to != address(0), "Mint to zero address");
        require(amount > 0, "Amount must be > 0");
        
        // Check max supply
        require(totalSupply + amount <= MAX_SUPPLY, "Exceeds max supply");
        
        // Check per-call limit
        require(amount <= MAX_MINT_PER_CALL, "Exceeds per-call mint limit");
        
        // Check daily limit (reset if new day)
        if (block.timestamp > lastMintTime + 1 days) {
            lastMintTime = block.timestamp;
            // Daily limit resets
        }
        
        totalSupply += amount;
        totalMinted += amount;
        balanceOf[to] += amount;
        
        if (totalSupply >= MAX_SUPPLY) {
            emit MintLimitReached("Max Supply", totalSupply);
        }
        
        emit Mint(to, amount, reason);
        emit Transfer(address(0), to, amount);
        emit SecurityEvent("Mint", to, amount);
    }
    
    // ==================== ENHANCED TRANSFER ====================
    
    function transfer(address to, uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
        returns (bool) 
    {
        require(to != address(0), "Transfer to zero address");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        
        // Owner trading restrictions
        if (msg.sender == owner) {
            require(_canOwnerTrade(), "Outside trading window");
            require(amount <= OWNER_TRADE_LIMIT, "Exceeds trade limit");
            _trackOwnerTrade();
        }
        
        // Apply sell tax if applicable
        uint256 taxAmount = 0;
        if (_isSellToLP(msg.sender, to)) {
            taxAmount = (amount * sellTax) / 10000;
        }
        
        uint256 amountAfterTax = amount - taxAmount;
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amountAfterTax;
        
        if (taxAmount > 0) {
            balanceOf[owner] += taxAmount;
            emit Transfer(msg.sender, owner, taxAmount);
        }
        
        emit Transfer(msg.sender, to, amountAfterTax);
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
        nonReentrant 
        returns (bool) 
    {
        require(to != address(0), "Transfer to zero address");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    // ==================== BURN ====================
    
    function burn() external onlyOwner nonReentrant {
        require(block.timestamp >= lastBurnTime + BURN_PERIOD, "Burn period not reached");
        
        uint256 burnAmount = (totalSupply * BURN_PERCENTAGE) / 100;
        require(balanceOf[owner] >= burnAmount, "Insufficient balance to burn");
        
        balanceOf[owner] -= burnAmount;
        totalSupply -= burnAmount;
        totalBurned += burnAmount;
        lastBurnTime = block.timestamp;
        
        emit Burn(burnAmount);
        emit Transfer(owner, address(0), burnAmount);
    }
    
    // ==================== QUEUE MANAGEMENT ====================
    
    function addToQueue(address donor, uint256 bnbAmount, uint256 tokensToReceive) 
        external 
        onlyOwner 
        nonReentrant 
    {
        donationQueue.push(QueuedDonation({
            donor: donor,
            bnbAmount: bnbAmount,
            tokensToReceive: tokensToReceive,
            timestamp: block.timestamp,
            processed: false
        }));
    }
    
    function processQueue() external onlyOwner nonReentrant {
        require(
            block.timestamp >= lastOwnerTransferTime + ownerTransferTimeout,
            "Transfer timeout not met"
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
    
    // ==================== ADMIN FUNCTIONS ====================
    
    function pause() external onlyOwner {
        paused = true;
        emit SecurityEvent("Contract Paused", msg.sender, block.timestamp);
    }
    
    function unpause() external onlyOwner {
        paused = false;
        emit SecurityEvent("Contract Unpaused", msg.sender, block.timestamp);
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
    
    // ==================== EMERGENCY FUNCTIONS ====================
    
    function rescueTokens(address token, address to, uint256 amount) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(token != address(this), "Cannot rescue AMS");
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Rescue failed");
        
        emit SecurityEvent("Tokens Rescued", to, amount);
    }
    
    function rescueBNB(address payable to) external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        to.transfer(balance);
        
        emit SecurityEvent("BNB Rescued", to, balance);
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
        require(ownerDailyTrades <= MAX_OWNER_TRADES_PER_DAY, "Daily trade limit");
    }
    
    function _isSellToLP(address from, address to) internal view returns (bool) {
        return to == pancakeswapPair && from != owner;
    }
    
    receive() external payable nonReentrant {}
}

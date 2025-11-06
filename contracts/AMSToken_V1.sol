// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title AMSToken_V1 - Implementation (Upgradeable)
 * @notice This is the LOGIC contract - accessed through Proxy
 * @dev CRITICAL: Storage layout must match proxy and never change order!
 */
contract AMSToken_V1 {
    // ==================== PROXY STORAGE (Slots 0-5) ====================
    // NEVER MODIFY THESE - They belong to proxy!
    address private _proxyImplementation;  // Slot 0
    address private _proxyAdmin;           // Slot 1
    address private _proxyPendingAdmin;    // Slot 2
    uint256 private _proxyUpgradeTimelock; // Slot 3
    address private _proxyPendingImpl;     // Slot 4
    uint256 private _proxyPendingTime;     // Slot 5
    
    // ==================== TOKEN STORAGE (Starts at Slot 6) ====================
    
    // Slot 6-7: Token info
    string private _name;
    string private _symbol;
    
    // Slot 8-9: Supply
    uint256 public totalSupply;
    uint256 public totalBurned;
    
    // Slot 10: Balances
    mapping(address => uint256) public balanceOf;
    
    // Slot 11: Allowances
    mapping(address => mapping(address => uint256)) public allowance;
    
    // Slot 12-13: Governance
    address public owner;
    uint256 public deploymentTime;
    
    // Slot 14: Trading control
    bool public paused;
    
    // Slot 15-19: Owner trading window
    uint256 public constant OWNER_TRADING_START = 11;
    uint256 public constant OWNER_TRADING_END = 12;
    uint256 public constant TIMEZONE_OFFSET = 2 hours;
    uint256 public ownerDailyTrades;
    uint256 public lastOwnerTradeDay;
    
    // Slot 20-22: Owner transfer
    uint256 public lastOwnerTransferTime;
    uint256 public ownerTransferTimeout;
    
    // Slot 23-24: Sell limits
    mapping(address => uint256) public lastSellTime;
    mapping(address => uint256) public weeklyTokensSold;
    
    // Slot 25: Sell tax
    uint256 public sellTax;
    
    // Slot 26: Queue
    QueuedDonation[] public donationQueue;
    
    // Slot 27: Last processed
    uint256 public lastProcessedTime;
    
    // Slot 28: Burn tracking
    uint256 public lastBurnTime;
    
    // Slot 29: PancakeSwap
    address public pancakeswapPair;
    
    // Slot 30: Initial price
    uint256 public initialPrice;
    
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
    
    // ==================== EVENTS ====================
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner_, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 amount, string reason);
    event Burn(uint256 amount);
    event DonationReceived(address indexed donor, uint256 bnbAmount, uint256 tokensQueued);
    event DonationProcessed(address indexed donor, uint256 tokens);
    event OwnerTradeExecuted(uint256 amount, uint256 tradesRemaining);
    event LiquidityAdded(uint256 bnbAmount, uint256 amsAmount);
    
    // ==================== MODIFIERS ====================
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }
    
    // ==================== INITIALIZER (replaces constructor) ====================
    
    /**
     * @notice Initialize the contract (called once after deployment)
     * @dev This replaces the constructor for upgradeable contracts
     */
    function initialize() external {
        require(owner == address(0), "Already initialized");
        
        _name = "Anti-Mafia-Sponsorship";
        _symbol = "AMS";
        
        owner = msg.sender;
        deploymentTime = block.timestamp;
        lastBurnTime = block.timestamp;
        lastProcessedTime = block.timestamp;
        ownerTransferTimeout = 12 hours;
        sellTax = 2; // 0.02%
        
        totalSupply = 40_000_000 * 10**18;
        balanceOf[msg.sender] = totalSupply;
        
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    function name() external view returns (string memory) {
        return _name;
    }
    
    function symbol() external view returns (string memory) {
        return _symbol;
    }
    
    // ==================== CORE ERC20 FUNCTIONS ====================
    
    function transfer(address to, uint256 amount) external whenNotPaused returns (bool) {
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
            balanceOf[owner] += taxAmount; // Tax goes to owner
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
        external whenNotPaused returns (bool) {
        require(to != address(0), "Transfer to zero address");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    // ==================== MINT & BURN ====================
    
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
        external onlyOwner {
        donationQueue.push(QueuedDonation({
            donor: donor,
            bnbAmount: bnbAmount,
            tokensToReceive: tokensToReceive,
            timestamp: block.timestamp,
            processed: false
        }));
        
        emit DonationReceived(donor, bnbAmount, tokensToReceive);
    }
    
    function processQueue() external onlyOwner {
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
                
                emit DonationProcessed(donation.donor, donation.tokensToReceive);
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
    }
    
    function unpause() external onlyOwner {
        paused = false;
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
        require(_tax <= 1000, "Tax too high"); // Max 10%
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
        require(ownerDailyTrades <= MAX_OWNER_TRADES_PER_DAY, "Daily trade limit");
    }
    
    function _isSellToLP(address from, address to) internal view returns (bool) {
        return to == pancakeswapPair && from != owner;
    }
    
    // ==================== EMERGENCY FUNCTIONS ====================
    
    /**
     * @notice Rescue accidentally sent tokens (NOT AMS)
     */
    function rescueTokens(address token, address to, uint256 amount) 
        external onlyOwner {
        require(token != address(this), "Cannot rescue AMS");
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Rescue failed");
    }
    
    /**
     * @notice Rescue accidentally sent BNB
     */
    function rescueBNB(address payable to) external onlyOwner {
        to.transfer(address(this).balance);
    }
    
    // ==================== RECEIVE BNB ====================
    receive() external payable {}
}

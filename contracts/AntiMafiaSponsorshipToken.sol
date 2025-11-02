// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @title Anti-Mafia-Sponsorship Token (AMS) - Final Corrected Version
/// @notice Token s korektna logika za transfer, trading, i owner controls
contract AntiMafiaSponsorshipToken {
    // ==================== TOKEN INFO ====================
    string public constant name = "Anti-Mafia-Sponsorship";
    string public constant symbol = "AMS";
    uint8 public constant decimals = 18;
    
    uint256 public totalSupply;
    uint256 public constant INITIAL_SUPPLY = 40_000_000 * 10**18;
    
    // ==================== BALANCES ====================
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    // ==================== GOVERNANCE ====================
    address public immutable owner;
    uint256 public immutable deploymentTime;
    
    // ==================== OWNER TRADING WINDOW ====================
    uint256 public constant OWNER_TRADING_START = 11; // 11:00 AM
    uint256 public constant OWNER_TRADING_END = 12;   // 12:00 PM
    uint256 public constant TIMEZONE_OFFSET = 2 hours; // UTC+2 Bulgaria
    
    uint256 public ownerDailyTrades;
    uint256 public lastOwnerTradeDay;
    uint256 public constant MAX_OWNER_TRADES_PER_DAY = 10;
    uint256 public constant OWNER_TRADE_LIMIT = 1000 * 10**18;
    
    // ==================== OWNER TRANSFER ====================
    uint256 public lastOwnerTransferTime;
    uint256 public ownerTransferTimeout = 12 hours; // Dynamic
    
    // ==================== TRADING CONTROL ====================
    bool public paused = false;
    
    uint256 public constant FIRST_MONTH_LOCK = 30 days;
    uint256 public constant FIRST_UNLOCK = 24 * 30 days; // 2 years
    uint256 public constant SECOND_UNLOCK = 48 * 30 days; // 4 years
    uint256 public constant THIRD_UNLOCK = 72 * 30 days; // 6 years
    
    // ==================== SELL LIMITS ====================
    mapping(address => uint256) public lastSellTime;
    mapping(address => uint256) public weeklyTokensSold;
    uint256 public constant SELL_LIMIT_PER_WEEK = 1000 * 10**18;
    uint256 public constant WEEK_DURATION = 7 days;
    
    uint256 public sellTax = 2; // 0.02% = 2 basis points / 10000
    
    // ==================== DONATION QUEUE ====================
    struct QueuedDonation {
        address donor;
        uint256 bnbAmount;
        uint256 tokensToReceive;
        uint256 timestamp;
        bool processed;
    }
    
    QueuedDonation[] public donationQueue;
    uint256 public lastProcessedTime;
    
    // ==================== BURN ====================
    uint256 public lastBurnTime;
    uint256 public constant BURN_PERIOD = 60 days; // 2 months
    uint256 public constant BURN_PERCENTAGE = 5;
    uint256 public totalBurned;
    
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
    
    // ==================== CONSTRUCTOR ====================
    constructor() {
        owner = msg.sender;
        deploymentTime = block.timestamp;
        lastBurnTime = block.timestamp;
        lastProcessedTime = block.timestamp;
        
        totalSupply = INITIAL_SUPPLY;
        balanceOf[msg.sender] = INITIAL_SUPPLY;
        
        emit Transfer(address(0), msg.sender, INITIAL_SUPPLY);
    }
    
    // ==================== HELPER FUNCTIONS ====================
    
    function isOwnerTradingWindow() public view returns (bool) {
        uint256 currentHour = ((block.timestamp + TIMEZONE_OFFSET) / 1 hours) % 24;
        return (currentHour >= OWNER_TRADING_START && currentHour < OWNER_TRADING_END);
    }
    
    function isUnlockPeriod() public view returns (bool) {
        uint256 timeSinceDeploy = block.timestamp - deploymentTime;
        
        if (timeSinceDeploy < FIRST_UNLOCK) return false;
        
        if (timeSinceDeploy >= FIRST_UNLOCK && timeSinceDeploy < FIRST_UNLOCK + 60 days) {
            return true; // 2 months unlock
        }
        
        if (timeSinceDeploy < SECOND_UNLOCK) return false;
        
        if (timeSinceDeploy >= SECOND_UNLOCK && timeSinceDeploy < SECOND_UNLOCK + 120 days) {
            return true; // 4 months unlock
        }
        
        if (timeSinceDeploy < THIRD_UNLOCK) return false;
        
        if (timeSinceDeploy >= THIRD_UNLOCK && timeSinceDeploy < THIRD_UNLOCK + 180 days) {
            return true; // 6 months unlock
        }
        
        uint256 monthsSinceDeploy = timeSinceDeploy / 30 days;
        return (monthsSinceDeploy % 2 == 1); // Odd months after 78 months
    }
    
    function calculateTimeout() public view returns (uint256) {
        uint256 pendingCount = 0;
        for (uint256 i = 0; i < donationQueue.length; i++) {
            if (!donationQueue[i].processed) pendingCount++;
        }
        
        if (pendingCount > 1000) {
            return 30 minutes;
        }
        
        return 12 hours;
    }
    
    // ==================== TRANSFER (OWNER VINAGI, OSTATNALITE V UNLOCK) ====================
    
    function transfer(address to, uint256 value) public whenNotPaused returns (bool) {
        require(to != address(0), "Zero address");
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        
        if (msg.sender == owner) {
            // OWNER moze VINAGI da prava transfer (za daritel)
            require(value <= OWNER_TRADE_LIMIT, "Max 1000 AMS");
            require(
                block.timestamp >= lastOwnerTransferTime + ownerTransferTimeout,
                "Transfer timeout"
            );
            
            lastOwnerTransferTime = block.timestamp;
            ownerTransferTimeout = calculateTimeout();
            
        } else {
            // Ostatnalite SAMO v unlock period
            require(isUnlockPeriod(), "Trading disabled for non-owners");
            _checkSellLimit(msg.sender, value);
        }
        
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    // ==================== TRANSFERFROM (ZA SWAP-OVE NA PANCAKESWAP) ====================
    
    function transferFrom(address from, address to, uint256 value) public whenNotPaused returns (bool) {
        require(to != address(0), "Zero address");
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Allowance exceeded");
        
        if (from == owner) {
            // OWNER prodava na PancakeSwap (11:00-12:00)
            require(
                block.timestamp >= deploymentTime + FIRST_MONTH_LOCK,
                "First month locked"
            );
            require(isOwnerTradingWindow(), "Outside trading window");
            require(value <= OWNER_TRADE_LIMIT, "Max 1000 AMS");
            
            uint256 currentDay = (block.timestamp + TIMEZONE_OFFSET) / 1 days;
            if (currentDay > lastOwnerTradeDay) {
                ownerDailyTrades = 0;
                lastOwnerTradeDay = currentDay;
            }
            
            require(ownerDailyTrades < MAX_OWNER_TRADES_PER_DAY, "Daily limit reached");
            ownerDailyTrades++;
            
            emit OwnerTradeExecuted(value, MAX_OWNER_TRADES_PER_DAY - ownerDailyTrades);
            
        } else {
            // Ostatnalite prodavat SAMO v unlock period
            require(isUnlockPeriod(), "Trading disabled for non-owners");
            _checkSellLimit(from, value);
            
            uint256 taxAmount = (value * sellTax) / 10000;
            if (taxAmount > 0) {
                balanceOf[owner] += taxAmount;
                value -= taxAmount;
                emit Transfer(from, owner, taxAmount);
            }
        }
        
        allowance[from][msg.sender] -= value;
        balanceOf[from] -= value;
        balanceOf[to] += value;
        
        emit Transfer(from, to, value);
        return true;
    }
    
    function _checkSellLimit(address seller, uint256 amount) internal {
        uint256 weekStart = (block.timestamp / WEEK_DURATION) * WEEK_DURATION;
        uint256 lastWeekStart = (lastSellTime[seller] / WEEK_DURATION) * WEEK_DURATION;
        
        if (weekStart > lastWeekStart) {
            weeklyTokensSold[seller] = 0;
        }
        
        require(
            weeklyTokensSold[seller] + amount <= SELL_LIMIT_PER_WEEK,
            "Weekly sell limit exceeded"
        );
        
        weeklyTokensSold[seller] += amount;
        lastSellTime[seller] = block.timestamp;
    }
    
    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    // ==================== DONATION SYSTEM ====================
    
    receive() external payable whenNotPaused {
        require(msg.value >= 0.001 ether, "Min 0.001 BNB");
        
        uint256 rewardTokens = (msg.value * 1000 * 10**18) / 1 ether;
        
        donationQueue.push(QueuedDonation({
            donor: msg.sender,
            bnbAmount: msg.value,
            tokensToReceive: rewardTokens,
            timestamp: block.timestamp,
            processed: false
        }));
        
        emit DonationReceived(msg.sender, msg.value, rewardTokens);
    }
    
    // ==================== INTERFACE METHODS (ZA WEB PANEL) ====================
    
    /// @notice BBB: Izprati rezervirani tokeni na daritel
    function CPanelSendTokensToDonor(address donor, uint256 amount) external onlyOwner returns (bool) {
        require(donor != address(0), "Zero address");
        require(amount <= OWNER_TRADE_LIMIT, "Max 1000 AMS");
        require(balanceOf[owner] >= amount, "Insufficient balance");
        require(
            block.timestamp >= lastOwnerTransferTime + ownerTransferTimeout,
            "Transfer timeout"
        );
        
        lastOwnerTransferTime = block.timestamp;
        ownerTransferTimeout = calculateTimeout();
        
        balanceOf[owner] -= amount;
        balanceOf[donor] += amount;
        
        emit Transfer(owner, donor, amount);
        return true;
    }
    
    /// @notice GGG: Mint novi tokeni i izprati na daritel (BEZ likvidnost)
    function CPanelMintAndSendToDonor(address donor, uint256 amount) external onlyOwner returns (bool) {
        require(donor != address(0), "Zero address");
        require(amount <= OWNER_TRADE_LIMIT, "Max 1000 AMS");
        require(
            block.timestamp >= lastOwnerTransferTime + ownerTransferTimeout,
            "Transfer timeout"
        );
        
        lastOwnerTransferTime = block.timestamp;
        ownerTransferTimeout = calculateTimeout();
        
        totalSupply += amount;
        balanceOf[donor] += amount;
        
        emit Mint(donor, amount, "Direct mint to donor");
        emit Transfer(address(0), donor, amount);
        return true;
    }
    
    /// @notice VVV: Mint novi tokeni (za dobavyane v likvidnost)
    function CPanelMintForLiquidity(uint256 amount) external onlyOwner returns (bool) {
        require(amount <= 1_000_000 * 10**18, "Max 1M per mint");
        
        totalSupply += amount;
        balanceOf[owner] += amount;
        
        emit Mint(owner, amount, "Minted for liquidity addition");
        emit Transfer(address(0), owner, amount);
        return true;
    }
    
    /// @notice AAA: Dummy function - realnoto dobavyane stava na PancakeSwap
    /// @dev Web panel shte izvika PancakeSwap Router direktno
    function CPanelRecordLiquidityAddition(uint256 bnbAmount, uint256 amsAmount) external onlyOwner {
        emit LiquidityAdded(bnbAmount, amsAmount);
    }
    
    /// @notice Obrabotva donation queue (1 na put)
    function CPanelProcessDonationQueue() external onlyOwner {
        uint256 timeout = calculateTimeout();
        require(block.timestamp >= lastProcessedTime + timeout, "Timeout active");
        
        for (uint256 i = 0; i < donationQueue.length; i++) {
            if (!donationQueue[i].processed) {
                QueuedDonation storage donation = donationQueue[i];
                
                require(balanceOf[owner] >= donation.tokensToReceive, "Insufficient balance");
                
                balanceOf[owner] -= donation.tokensToReceive;
                balanceOf[donation.donor] += donation.tokensToReceive;
                donation.processed = true;
                lastProcessedTime = block.timestamp;
                
                emit Transfer(owner, donation.donor, donation.tokensToReceive);
                emit DonationProcessed(donation.donor, donation.tokensToReceive);
                
                break;
            }
        }
    }
    
    /// @notice Scheduled burn (5% na 2 meseca)
    function CPanelScheduledBurn() external onlyOwner {
        require(block.timestamp >= lastBurnTime + BURN_PERIOD, "Too early for burn");
        
        uint256 burnAmount = (totalSupply * BURN_PERCENTAGE) / 100;
        require(balanceOf[owner] >= burnAmount, "Insufficient balance");
        
        balanceOf[owner] -= burnAmount;
        totalSupply -= burnAmount;
        totalBurned += burnAmount;
        lastBurnTime = block.timestamp;
        
        emit Burn(burnAmount);
        emit Transfer(owner, address(0), burnAmount);
    }
    
    /// @notice Manual burn (owner moze da izgari proizvolno kolichestvo)
    function CPanelManualBurn(uint256 amount) external onlyOwner {
        require(balanceOf[owner] >= amount, "Insufficient balance");
        
        balanceOf[owner] -= amount;
        totalSupply -= amount;
        totalBurned += amount;
        
        emit Burn(amount);
        emit Transfer(owner, address(0), amount);
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    function withdrawBNB(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient BNB");
        payable(owner).transfer(amount);
    }
    
    function withdrawAllBNB() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No BNB");
        payable(owner).transfer(balance);
    }
    
    function setSellTax(uint256 newTax) external onlyOwner {
        require(newTax <= 100, "Max 1%");
        sellTax = newTax;
    }
    
    function pause() external onlyOwner {
        paused = true;
    }
    
    function unpause() external onlyOwner {
        paused = false;
    }
    
    function updateTransferTimeout() external onlyOwner {
        ownerTransferTimeout = calculateTimeout();
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    function getQueueLength() external view returns (uint256) {
        uint256 pending = 0;
        for (uint256 i = 0; i < donationQueue.length; i++) {
            if (!donationQueue[i].processed) pending++;
        }
        return pending;
    }
    
    function getOwnerTradingInfo() external view returns (
        bool inWindow,
        uint256 tradesRemaining,
        uint256 nextWindowIn
    ) {
        bool canTrade = isOwnerTradingWindow();
        uint256 remaining = 0;
        
        if (canTrade) {
            uint256 currentDay = (block.timestamp + TIMEZONE_OFFSET) / 1 days;
            if (currentDay > lastOwnerTradeDay) {
                remaining = MAX_OWNER_TRADES_PER_DAY;
            } else {
                remaining = MAX_OWNER_TRADES_PER_DAY - ownerDailyTrades;
            }
        }
        
        uint256 currentHour = ((block.timestamp + TIMEZONE_OFFSET) / 1 hours) % 24;
        uint256 nextWindow = 0;
        
        if (currentHour < OWNER_TRADING_START) {
            nextWindow = (OWNER_TRADING_START - currentHour) * 1 hours;
        } else if (currentHour >= OWNER_TRADING_END) {
            nextWindow = (24 - currentHour + OWNER_TRADING_START) * 1 hours;
        }
        
        return (canTrade, remaining, nextWindow);
    }
    
    function getStats() external view returns (
        uint256 _totalSupply,
        uint256 _totalBurned,
        uint256 _queueLength,
        uint256 _currentTimeout,
        bool _unlockActive
    ) {
        return (
            totalSupply,
            totalBurned,
            this.getQueueLength(),
            calculateTimeout(),
            isUnlockPeriod()
        );
    }
    
    function getTimeUntilNextBurn() external view returns (uint256) {
        if (block.timestamp >= lastBurnTime + BURN_PERIOD) return 0;
        return (lastBurnTime + BURN_PERIOD) - block.timestamp;
    }
}
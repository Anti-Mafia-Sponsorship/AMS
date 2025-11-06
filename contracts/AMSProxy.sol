// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title AMSProxy - Upgradeable Proxy for AMS Token
 * @notice This proxy allows upgrading the implementation while keeping the same address
 * @dev Uses transparent proxy pattern with admin controls
 */
contract AMSProxy {
    // ==================== STORAGE ====================
    // CRITICAL: Storage slots must NEVER change position!
    
    // Slot 0: Implementation address (the actual token logic)
    address private _implementation;
    
    // Slot 1: Admin address (who can upgrade)
    address private _admin;
    
    // Slot 2: Pending admin for 2-step transfer
    address private _pendingAdmin;
    
    // Slot 3: Upgrade timelock (48 hours minimum before upgrade)
    uint256 private _upgradeTimelock;
    
    // Slot 4: Pending implementation
    address private _pendingImplementation;
    
    // Slot 5: Pending upgrade timestamp
    uint256 private _pendingUpgradeTime;
    
    // ==================== CONSTANTS ====================
    uint256 public constant UPGRADE_DELAY = 48 hours;
    
    // ==================== EVENTS ====================
    event Upgraded(address indexed previousImplementation, address indexed newImplementation);
    event AdminChanged(address indexed previousAdmin, address indexed newAdmin);
    event UpgradeProposed(address indexed newImplementation, uint256 upgradeTime);
    event UpgradeCancelled(address indexed implementation);
    
    // ==================== CONSTRUCTOR ====================
    constructor(address implementation_, address admin_) {
        require(implementation_ != address(0), "Invalid implementation");
        require(admin_ != address(0), "Invalid admin");
        
        _implementation = implementation_;
        _admin = admin_;
        
        emit Upgraded(address(0), implementation_);
        emit AdminChanged(address(0), admin_);
    }
    
    // ==================== MODIFIERS ====================
    modifier onlyAdmin() {
        require(msg.sender == _admin, "Only admin");
        _;
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    /**
     * @notice Propose a new implementation (step 1 of upgrade)
     * @param newImplementation Address of new implementation contract
     */
    function proposeUpgrade(address newImplementation) external onlyAdmin {
        require(newImplementation != address(0), "Invalid implementation");
        require(newImplementation != _implementation, "Same implementation");
        require(_pendingImplementation == address(0), "Upgrade already pending");
        
        _pendingImplementation = newImplementation;
        _pendingUpgradeTime = block.timestamp + UPGRADE_DELAY;
        
        emit UpgradeProposed(newImplementation, _pendingUpgradeTime);
    }
    
    /**
     * @notice Execute pending upgrade (step 2, after timelock)
     */
    function executeUpgrade() external onlyAdmin {
        require(_pendingImplementation != address(0), "No pending upgrade");
        require(block.timestamp >= _pendingUpgradeTime, "Timelock not expired");
        
        address oldImplementation = _implementation;
        _implementation = _pendingImplementation;
        
        // Clear pending
        _pendingImplementation = address(0);
        _pendingUpgradeTime = 0;
        
        emit Upgraded(oldImplementation, _implementation);
    }
    
    /**
     * @notice Cancel pending upgrade
     */
    function cancelUpgrade() external onlyAdmin {
        require(_pendingImplementation != address(0), "No pending upgrade");
        
        address cancelled = _pendingImplementation;
        _pendingImplementation = address(0);
        _pendingUpgradeTime = 0;
        
        emit UpgradeCancelled(cancelled);
    }
    
    /**
     * @notice Transfer admin role (step 1)
     * @param newAdmin Address of new admin
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin");
        _pendingAdmin = newAdmin;
    }
    
    /**
     * @notice Accept admin role (step 2)
     */
    function acceptAdmin() external {
        require(msg.sender == _pendingAdmin, "Not pending admin");
        
        address oldAdmin = _admin;
        _admin = _pendingAdmin;
        _pendingAdmin = address(0);
        
        emit AdminChanged(oldAdmin, _admin);
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    function implementation() external view returns (address) {
        return _implementation;
    }
    
    function admin() external view returns (address) {
        return _admin;
    }
    
    function pendingAdmin() external view returns (address) {
        return _pendingAdmin;
    }
    
    function pendingImplementation() external view returns (address) {
        return _pendingImplementation;
    }
    
    function pendingUpgradeTime() external view returns (uint256) {
        return _pendingUpgradeTime;
    }
    
    function upgradeTimeRemaining() external view returns (uint256) {
        if (_pendingUpgradeTime == 0) return 0;
        if (block.timestamp >= _pendingUpgradeTime) return 0;
        return _pendingUpgradeTime - block.timestamp;
    }
    
    // ==================== PROXY LOGIC ====================
    
    /**
     * @notice Fallback function - delegates all calls to implementation
     */
    fallback() external payable {
        _delegate(_implementation);
    }
    
    /**
     * @notice Receive function for BNB transfers
     */
    receive() external payable {
        _delegate(_implementation);
    }
    
    /**
     * @dev Delegates the current call to implementation
     */
    function _delegate(address impl) internal {
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code.
            calldatacopy(0, 0, calldatasize())
            
            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            
            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())
            
            switch result
            // delegatecall returns 0 on error.
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }
}

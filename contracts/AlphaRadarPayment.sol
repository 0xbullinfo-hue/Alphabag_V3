// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AlphaRadarPayment
 * @dev Simplified payment gateway for Alpha Radar project boosts using USDT.
 * All payments are forwarded to a central admin treasury.
 */

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract AlphaRadarPayment {
    address public owner;
    address public treasury;
    IERC20 public usdt;

    event BoostPurchased(address indexed founder, uint256 amount, uint8 tier, string projectName);
    event treasuryUpdated(address indexed newTreasury);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _usdt, address _treasury) {
        owner = msg.sender;
        usdt = IERC20(_usdt);
        treasury = _treasury;
    }

    function setTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid address");
        treasury = _newTreasury;
        emit treasuryUpdated(_newTreasury);
    }

    /**
     * @dev Process a USDT payment for a project boost.
     * @param _amount The amount of USDT to transfer.
     * @param _tier The boost tier (x2, x5, x10).
     * @param _projectName The name of the project being boosted.
     */
    function purchaseBoost(uint256 _amount, uint8 _tier, string calldata _projectName) external {
        require(_amount > 0, "Amount must be > 0");
        
        // Transfer USDT from the founder directly to the admin treasury
        bool success = usdt.transferFrom(msg.sender, treasury, _amount);
        require(success, "USDT transfer failed. Ensure allowance is set.");

        emit BoostPurchased(msg.sender, _amount, _tier, _projectName);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
}

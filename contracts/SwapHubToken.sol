// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SwapHubToken
 * @dev ERC20 Token with minting and burning capabilities for SwapHub DEX
 * @notice This token can be used as a base for creating trading pairs
 */
contract SwapHubToken is ERC20, ERC20Burnable, Ownable {
    uint8 private _decimals;
    
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    /**
     * @dev Constructor to initialize the token
     * @param name_ Token name
     * @param symbol_ Token symbol
     * @param decimals_ Number of decimals
     * @param initialSupply Initial supply to mint to deployer
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        _decimals = decimals_;
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply * 10 ** decimals_);
        }
    }

    /**
     * @dev Returns the number of decimals used
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mints new tokens to the specified address
     * @param to Address to receive tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Allows anyone to mint tokens (faucet functionality for testing)
     * @param amount Amount of tokens to mint (max 10,000 per call)
     */
    function faucet(uint256 amount) public {
        require(amount <= 10000 * 10 ** _decimals, "Max 10,000 tokens per faucet call");
        _mint(msg.sender, amount);
        emit TokensMinted(msg.sender, amount);
    }

    /**
     * @dev Burns tokens from the caller's balance
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) public virtual override {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }
}

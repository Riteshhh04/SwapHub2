// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title SwapHubLP
 * @dev Liquidity Provider token for SwapHub pools
 * @notice LP tokens represent a user's share of the liquidity pool
 */
contract SwapHubLP is ERC20, ERC20Burnable {
    address public pool;
    
    modifier onlyPool() {
        require(msg.sender == pool, "Only pool can mint/burn");
        _;
    }

    /**
     * @dev Constructor
     * @param name_ LP Token name (e.g., "SwapHub ETH-USDC LP")
     * @param symbol_ LP Token symbol (e.g., "SH-ETH-USDC-LP")
     */
    constructor(
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) {
        pool = msg.sender;
    }

    /**
     * @dev Mints LP tokens to liquidity provider
     * @param to Address to receive LP tokens
     * @param amount Amount of LP tokens to mint
     */
    function mint(address to, uint256 amount) external onlyPool {
        _mint(to, amount);
    }

    /**
     * @dev Burns LP tokens when removing liquidity
     * @param from Address to burn LP tokens from
     * @param amount Amount of LP tokens to burn
     */
    function burnFrom(address from, uint256 amount) public override onlyPool {
        _burn(from, amount);
    }
}

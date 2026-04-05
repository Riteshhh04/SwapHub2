// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SwapHubPool.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SwapHubFactory
 * @dev Factory contract for creating and managing SwapHub liquidity pools
 * @notice Deploy this contract first, then use it to create trading pairs
 */
contract SwapHubFactory is Ownable {
    // Mapping from token pair to pool address
    mapping(address => mapping(address => address)) public getPool;
    
    // Array of all pools
    address[] public allPools;
    
    // Fee recipient for protocol fees (if implemented)
    address public feeRecipient;
    
    // Events
    event PoolCreated(
        address indexed token0,
        address indexed token1,
        address pool,
        uint256 poolCount
    );
    event FeeRecipientUpdated(address indexed newRecipient);

    constructor() Ownable(msg.sender) {
        feeRecipient = msg.sender;
    }

    /**
     * @dev Creates a new liquidity pool for a token pair
     * @param tokenA Address of first token
     * @param tokenB Address of second token
     * @return pool Address of the created pool
     */
    function createPool(
        address tokenA,
        address tokenB
    ) external returns (address pool) {
        require(tokenA != tokenB, "Identical tokens");
        require(tokenA != address(0) && tokenB != address(0), "Zero address");
        
        // Sort tokens to ensure consistent ordering
        (address token0, address token1) = tokenA < tokenB 
            ? (tokenA, tokenB) 
            : (tokenB, tokenA);
        
        require(getPool[token0][token1] == address(0), "Pool already exists");

        // Get token symbols for LP token naming
        string memory symbol0 = _getSymbol(token0);
        string memory symbol1 = _getSymbol(token1);
        
        string memory lpName = string(abi.encodePacked("SwapHub ", symbol0, "-", symbol1, " LP"));
        string memory lpSymbol = string(abi.encodePacked("SH-", symbol0, "-", symbol1));

        // Deploy new pool
        SwapHubPool newPool = new SwapHubPool(
            token0,
            token1,
            lpName,
            lpSymbol
        );
        
        pool = address(newPool);
        
        // Store pool address (both directions for easy lookup)
        getPool[token0][token1] = pool;
        getPool[token1][token0] = pool;
        allPools.push(pool);

        emit PoolCreated(token0, token1, pool, allPools.length);
    }

    /**
     * @dev Returns the total number of pools
     */
    function allPoolsLength() external view returns (uint256) {
        return allPools.length;
    }

    /**
     * @dev Returns all pool addresses
     */
    function getAllPools() external view returns (address[] memory) {
        return allPools;
    }

    /**
     * @dev Get pool info by index
     * @param index Pool index
     */
    function getPoolByIndex(uint256 index) external view returns (
        address pool,
        address token0,
        address token1,
        uint256 reserve0,
        uint256 reserve1
    ) {
        require(index < allPools.length, "Index out of bounds");
        pool = allPools[index];
        SwapHubPool poolContract = SwapHubPool(pool);
        (token0, token1, reserve0, reserve1, , ) = poolContract.getPoolInfo();
    }

    /**
     * @dev Update fee recipient
     * @param _feeRecipient New fee recipient address
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Zero address");
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(_feeRecipient);
    }

    /**
     * @dev Get token symbol safely
     */
    function _getSymbol(address token) internal view returns (string memory) {
        // Try to get symbol, fallback to shortened address if it fails
        try IERC20Metadata(token).symbol() returns (string memory symbol) {
            return symbol;
        } catch {
            return _toHexString(token);
        }
    }

    /**
     * @dev Convert address to short hex string
     */
    function _toHexString(address addr) internal pure returns (string memory) {
        bytes memory buffer = new bytes(6);
        bytes memory hexChars = "0123456789abcdef";
        uint160 value = uint160(addr);
        for (uint256 i = 5; i > 1; i--) {
            buffer[i] = hexChars[value & 0xf];
            value >>= 4;
        }
        buffer[0] = "0";
        buffer[1] = "x";
        return string(buffer);
    }
}

/**
 * @dev Interface for ERC20 metadata
 */
interface IERC20Metadata {
    function symbol() external view returns (string memory);
}

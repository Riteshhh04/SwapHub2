// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SwapHubFactory.sol";
import "./SwapHubPool.sol";

/**
 * @title SwapHubRouter
 * @dev Router contract for interacting with SwapHub pools
 * @notice Use this contract for swaps and liquidity operations with ETH support
 */
contract SwapHubRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    SwapHubFactory public immutable factory;
    address public immutable WETH;

    // Events
    event SwapExecuted(
        address indexed user,
        address[] path,
        uint256 amountIn,
        uint256 amountOut
    );

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "Transaction expired");
        _;
    }

    /**
     * @dev Constructor
     * @param _factory SwapHubFactory address
     * @param _WETH Wrapped ETH address
     */
    constructor(address _factory, address _WETH) {
        factory = SwapHubFactory(_factory);
        WETH = _WETH;
    }

    /**
     * @dev Receive ETH (for WETH unwrapping)
     */
    receive() external payable {}

    /**
     * @dev Swap exact tokens for tokens
     * @param amountIn Exact input amount
     * @param amountOutMin Minimum output amount
     * @param path Array of token addresses (swap route)
     * @param to Recipient address
     * @param deadline Transaction deadline
     * @return amounts Array of amounts at each step
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) nonReentrant returns (uint256[] memory amounts) {
        require(path.length >= 2, "Invalid path");
        
        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Insufficient output");

        // Transfer input tokens from user to first pool
        address pool = factory.getPool(path[0], path[1]);
        require(pool != address(0), "Pool not found");
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Execute swaps
        _swap(amounts, path, to);

        emit SwapExecuted(msg.sender, path, amountIn, amounts[amounts.length - 1]);
    }

    /**
     * @dev Swap tokens for exact tokens
     * @param amountOut Exact output amount desired
     * @param amountInMax Maximum input amount
     * @param path Array of token addresses
     * @param to Recipient address
     * @param deadline Transaction deadline
     * @return amounts Array of amounts at each step
     */
    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) nonReentrant returns (uint256[] memory amounts) {
        require(path.length >= 2, "Invalid path");
        
        amounts = getAmountsIn(amountOut, path);
        require(amounts[0] <= amountInMax, "Excessive input");

        // Transfer input tokens
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amounts[0]);
        
        // Execute swaps
        _swap(amounts, path, to);

        emit SwapExecuted(msg.sender, path, amounts[0], amountOut);
    }

    /**
     * @dev Add liquidity to a pool
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param amountADesired Desired amount of token A
     * @param amountBDesired Desired amount of token B
     * @param amountAMin Minimum amount of token A
     * @param amountBMin Minimum amount of token B
     * @param to LP token recipient
     * @param deadline Transaction deadline
     * @return amountA Actual amount of token A
     * @return amountB Actual amount of token B
     * @return liquidity LP tokens minted
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external ensure(deadline) nonReentrant returns (
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    ) {
        address pool = factory.getPool(tokenA, tokenB);
        if (pool == address(0)) {
            pool = factory.createPool(tokenA, tokenB);
        }

        // Transfer tokens to this contract first
        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountADesired);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountBDesired);

        // Approve pool to spend tokens
        IERC20(tokenA).approve(pool, amountADesired);
        IERC20(tokenB).approve(pool, amountBDesired);

        // Determine order based on pool's token ordering
        SwapHubPool poolContract = SwapHubPool(pool);
        address token0 = address(poolContract.token0());
        
        if (tokenA == token0) {
            (amountA, amountB, liquidity) = poolContract.addLiquidity(
                amountADesired,
                amountBDesired,
                amountAMin,
                amountBMin
            );
        } else {
            (amountB, amountA, liquidity) = poolContract.addLiquidity(
                amountBDesired,
                amountADesired,
                amountBMin,
                amountAMin
            );
        }

        // Transfer LP tokens to recipient
        IERC20(address(poolContract.lpToken())).safeTransfer(to, liquidity);

        // Refund excess tokens
        uint256 refundA = amountADesired - amountA;
        uint256 refundB = amountBDesired - amountB;
        if (refundA > 0) IERC20(tokenA).safeTransfer(msg.sender, refundA);
        if (refundB > 0) IERC20(tokenB).safeTransfer(msg.sender, refundB);
    }

    /**
     * @dev Remove liquidity from a pool
     * @param tokenA First token address
     * @param tokenB Second token address
     * @param liquidity LP tokens to burn
     * @param amountAMin Minimum amount of token A
     * @param amountBMin Minimum amount of token B
     * @param to Token recipient
     * @param deadline Transaction deadline
     * @return amountA Amount of token A received
     * @return amountB Amount of token B received
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external ensure(deadline) nonReentrant returns (uint256 amountA, uint256 amountB) {
        address pool = factory.getPool(tokenA, tokenB);
        require(pool != address(0), "Pool not found");

        SwapHubPool poolContract = SwapHubPool(pool);
        
        // Transfer LP tokens to this contract
        IERC20(address(poolContract.lpToken())).safeTransferFrom(msg.sender, address(this), liquidity);
        
        // Approve pool to burn LP tokens
        IERC20(address(poolContract.lpToken())).approve(pool, liquidity);

        // Determine order
        address token0 = address(poolContract.token0());
        
        uint256 amount0;
        uint256 amount1;
        
        if (tokenA == token0) {
            (amount0, amount1) = poolContract.removeLiquidity(liquidity, amountAMin, amountBMin);
            amountA = amount0;
            amountB = amount1;
        } else {
            (amount0, amount1) = poolContract.removeLiquidity(liquidity, amountBMin, amountAMin);
            amountA = amount1;
            amountB = amount0;
        }

        // Transfer tokens to recipient
        IERC20(tokenA).safeTransfer(to, amountA);
        IERC20(tokenB).safeTransfer(to, amountB);
    }

    /**
     * @dev Get expected output amounts for a swap path
     * @param amountIn Input amount
     * @param path Token path
     * @return amounts Output amounts at each step
     */
    function getAmountsOut(
        uint256 amountIn,
        address[] memory path
    ) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, "Invalid path");
        
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        
        for (uint256 i = 0; i < path.length - 1; i++) {
            address pool = factory.getPool(path[i], path[i + 1]);
            require(pool != address(0), "Pool not found");
            
            amounts[i + 1] = SwapHubPool(pool).getAmountOut(path[i], amounts[i]);
        }
    }

    /**
     * @dev Get required input amounts for a swap path
     * @param amountOut Desired output amount
     * @param path Token path
     * @return amounts Required amounts at each step
     */
    function getAmountsIn(
        uint256 amountOut,
        address[] memory path
    ) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, "Invalid path");
        
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;
        
        for (uint256 i = path.length - 1; i > 0; i--) {
            address pool = factory.getPool(path[i - 1], path[i]);
            require(pool != address(0), "Pool not found");
            
            amounts[i - 1] = SwapHubPool(pool).getAmountIn(path[i], amounts[i]);
        }
    }

    /**
     * @dev Execute swaps through the path
     */
    function _swap(
        uint256[] memory amounts,
        address[] memory path,
        address to
    ) internal {
        for (uint256 i = 0; i < path.length - 1; i++) {
            address pool = factory.getPool(path[i], path[i + 1]);
            
            // Approve pool to spend input tokens
            IERC20(path[i]).approve(pool, amounts[i]);
            
            // Determine recipient
            address recipient = i < path.length - 2 ? address(this) : to;
            
            // Execute swap
            SwapHubPool(pool).swap(path[i], amounts[i], amounts[i + 1]);
            
            // If not last swap, the output stays in this contract for next swap
            if (recipient != address(this)) {
                IERC20(path[i + 1]).safeTransfer(recipient, amounts[i + 1]);
            }
        }
    }

    /**
     * @dev Quote for adding liquidity
     * @param tokenA First token
     * @param tokenB Second token
     * @param amountADesired Desired amount A
     * @return amountB Optimal amount B
     */
    function quote(
        address tokenA,
        address tokenB,
        uint256 amountADesired
    ) external view returns (uint256 amountB) {
        address pool = factory.getPool(tokenA, tokenB);
        if (pool == address(0)) {
            return 0; // Pool doesn't exist
        }
        
        SwapHubPool poolContract = SwapHubPool(pool);
        (,, uint256 reserve0, uint256 reserve1,,) = poolContract.getPoolInfo();
        
        address token0 = address(poolContract.token0());
        
        if (reserve0 == 0 || reserve1 == 0) {
            return 0; // Empty pool
        }
        
        if (tokenA == token0) {
            amountB = (amountADesired * reserve1) / reserve0;
        } else {
            amountB = (amountADesired * reserve0) / reserve1;
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SwapHubLP.sol";

/**
 * @title SwapHubPool
 * @dev AMM (Automated Market Maker) liquidity pool for token swaps
 * @notice Implements constant product formula (x * y = k) for pricing
 */
contract SwapHubPool is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Pool tokens
    IERC20 public immutable token0;
    IERC20 public immutable token1;
    SwapHubLP public immutable lpToken;

    // Pool reserves
    uint256 public reserve0;
    uint256 public reserve1;

    // Fee configuration (0.3% = 30 basis points)
    uint256 public constant FEE_NUMERATOR = 3;
    uint256 public constant FEE_DENOMINATOR = 1000;

    // Minimum liquidity to prevent division by zero attacks
    uint256 public constant MINIMUM_LIQUIDITY = 1000;

    // Factory address
    address public immutable factory;

    // Events
    event LiquidityAdded(
        address indexed provider,
        uint256 amount0,
        uint256 amount1,
        uint256 lpTokensMinted
    );
    event LiquidityRemoved(
        address indexed provider,
        uint256 amount0,
        uint256 amount1,
        uint256 lpTokensBurned
    );
    event Swap(
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    event Sync(uint256 reserve0, uint256 reserve1);

    /**
     * @dev Constructor
     * @param _token0 Address of first token
     * @param _token1 Address of second token
     * @param _name LP token name
     * @param _symbol LP token symbol
     */
    constructor(
        address _token0,
        address _token1,
        string memory _name,
        string memory _symbol
    ) {
        require(_token0 != address(0) && _token1 != address(0), "Invalid token address");
        require(_token0 != _token1, "Identical tokens");
        
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
        factory = msg.sender;
        
        // Deploy LP token
        lpToken = new SwapHubLP(_name, _symbol);
    }

    /**
     * @dev Add liquidity to the pool
     * @param amount0Desired Amount of token0 to add
     * @param amount1Desired Amount of token1 to add
     * @param amount0Min Minimum amount of token0 (slippage protection)
     * @param amount1Min Minimum amount of token1 (slippage protection)
     * @return amount0 Actual amount of token0 added
     * @return amount1 Actual amount of token1 added
     * @return liquidity LP tokens minted
     */
    function addLiquidity(
        uint256 amount0Desired,
        uint256 amount1Desired,
        uint256 amount0Min,
        uint256 amount1Min
    ) external nonReentrant returns (uint256 amount0, uint256 amount1, uint256 liquidity) {
        // Calculate optimal amounts
        if (reserve0 == 0 && reserve1 == 0) {
            // First liquidity provision
            amount0 = amount0Desired;
            amount1 = amount1Desired;
        } else {
            // Calculate proportional amounts
            uint256 amount1Optimal = (amount0Desired * reserve1) / reserve0;
            if (amount1Optimal <= amount1Desired) {
                require(amount1Optimal >= amount1Min, "Insufficient amount1");
                amount0 = amount0Desired;
                amount1 = amount1Optimal;
            } else {
                uint256 amount0Optimal = (amount1Desired * reserve0) / reserve1;
                require(amount0Optimal <= amount0Desired, "Excessive amount0");
                require(amount0Optimal >= amount0Min, "Insufficient amount0");
                amount0 = amount0Optimal;
                amount1 = amount1Desired;
            }
        }

        // Transfer tokens to pool
        token0.safeTransferFrom(msg.sender, address(this), amount0);
        token1.safeTransferFrom(msg.sender, address(this), amount1);

        // Calculate LP tokens to mint
        uint256 totalSupply = lpToken.totalSupply();
        if (totalSupply == 0) {
            // First deposit - use geometric mean minus minimum liquidity
            liquidity = sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            // Lock minimum liquidity forever (send to zero address)
            lpToken.mint(address(0xdead), MINIMUM_LIQUIDITY);
        } else {
            // Proportional to existing liquidity
            liquidity = min(
                (amount0 * totalSupply) / reserve0,
                (amount1 * totalSupply) / reserve1
            );
        }

        require(liquidity > 0, "Insufficient liquidity minted");
        lpToken.mint(msg.sender, liquidity);

        // Update reserves
        _update();

        emit LiquidityAdded(msg.sender, amount0, amount1, liquidity);
    }

    /**
     * @dev Remove liquidity from the pool
     * @param lpAmount Amount of LP tokens to burn
     * @param amount0Min Minimum amount of token0 to receive
     * @param amount1Min Minimum amount of token1 to receive
     * @return amount0 Amount of token0 received
     * @return amount1 Amount of token1 received
     */
    function removeLiquidity(
        uint256 lpAmount,
        uint256 amount0Min,
        uint256 amount1Min
    ) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        require(lpAmount > 0, "Invalid LP amount");

        uint256 totalSupply = lpToken.totalSupply();
        
        // Calculate proportional amounts
        amount0 = (lpAmount * reserve0) / totalSupply;
        amount1 = (lpAmount * reserve1) / totalSupply;

        require(amount0 >= amount0Min, "Insufficient amount0");
        require(amount1 >= amount1Min, "Insufficient amount1");

        // Burn LP tokens
        lpToken.burnFrom(msg.sender, lpAmount);

        // Transfer tokens to user
        token0.safeTransfer(msg.sender, amount0);
        token1.safeTransfer(msg.sender, amount1);

        // Update reserves
        _update();

        emit LiquidityRemoved(msg.sender, amount0, amount1, lpAmount);
    }

    /**
     * @dev Swap tokens
     * @param tokenIn Address of input token
     * @param amountIn Amount of input tokens
     * @param amountOutMin Minimum output amount (slippage protection)
     * @return amountOut Amount of output tokens received
     */
    function swap(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin
    ) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Invalid input amount");
        require(tokenIn == address(token0) || tokenIn == address(token1), "Invalid token");

        bool isToken0 = tokenIn == address(token0);
        
        (IERC20 inputToken, IERC20 outputToken, uint256 reserveIn, uint256 reserveOut) = isToken0
            ? (token0, token1, reserve0, reserve1)
            : (token1, token0, reserve1, reserve0);

        // Transfer input tokens
        inputToken.safeTransferFrom(msg.sender, address(this), amountIn);

        // Calculate output amount with fee
        // amountOut = (amountIn * (1 - fee) * reserveOut) / (reserveIn + amountIn * (1 - fee))
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_NUMERATOR);
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * FEE_DENOMINATOR + amountInWithFee);

        require(amountOut >= amountOutMin, "Insufficient output amount");
        require(amountOut < reserveOut, "Insufficient liquidity");

        // Transfer output tokens
        outputToken.safeTransfer(msg.sender, amountOut);

        // Update reserves
        _update();

        emit Swap(msg.sender, tokenIn, address(outputToken), amountIn, amountOut);
    }

    /**
     * @dev Get the expected output amount for a swap
     * @param tokenIn Address of input token
     * @param amountIn Amount of input tokens
     * @return amountOut Expected output amount
     */
    function getAmountOut(
        address tokenIn,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        require(amountIn > 0, "Invalid input amount");
        require(tokenIn == address(token0) || tokenIn == address(token1), "Invalid token");

        bool isToken0 = tokenIn == address(token0);
        (uint256 reserveIn, uint256 reserveOut) = isToken0
            ? (reserve0, reserve1)
            : (reserve1, reserve0);

        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_NUMERATOR);
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * FEE_DENOMINATOR + amountInWithFee);
    }

    /**
     * @dev Get the required input amount for a desired output
     * @param tokenOut Address of output token
     * @param amountOut Desired output amount
     * @return amountIn Required input amount
     */
    function getAmountIn(
        address tokenOut,
        uint256 amountOut
    ) external view returns (uint256 amountIn) {
        require(amountOut > 0, "Invalid output amount");
        require(tokenOut == address(token0) || tokenOut == address(token1), "Invalid token");

        bool isToken0Out = tokenOut == address(token0);
        (uint256 reserveIn, uint256 reserveOut) = isToken0Out
            ? (reserve1, reserve0)
            : (reserve0, reserve1);

        require(amountOut < reserveOut, "Insufficient liquidity");

        // amountIn = (reserveIn * amountOut * FEE_DENOMINATOR) / ((reserveOut - amountOut) * (FEE_DENOMINATOR - FEE_NUMERATOR))
        amountIn = (reserveIn * amountOut * FEE_DENOMINATOR) / 
                   ((reserveOut - amountOut) * (FEE_DENOMINATOR - FEE_NUMERATOR)) + 1;
    }

    /**
     * @dev Get pool information
     */
    function getPoolInfo() external view returns (
        address _token0,
        address _token1,
        uint256 _reserve0,
        uint256 _reserve1,
        address _lpToken,
        uint256 _totalSupply
    ) {
        return (
            address(token0),
            address(token1),
            reserve0,
            reserve1,
            address(lpToken),
            lpToken.totalSupply()
        );
    }

    /**
     * @dev Update reserves to match actual balances
     */
    function _update() private {
        reserve0 = token0.balanceOf(address(this));
        reserve1 = token1.balanceOf(address(this));
        emit Sync(reserve0, reserve1);
    }

    /**
     * @dev Force sync reserves with actual balances
     */
    function sync() external {
        _update();
    }

    /**
     * @dev Square root function using Babylonian method
     */
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    /**
     * @dev Returns the minimum of two values
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}

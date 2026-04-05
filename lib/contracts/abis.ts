// SwapHub Smart Contract ABIs
// These ABIs are used by ethers.js to interact with the deployed contracts

export const SWAPHUB_TOKEN_ABI = [
  // ERC20 Standard
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  // SwapHub Token Specific
  "function mint(address to, uint256 amount)",
  "function faucet(uint256 amount)",
  "function burn(uint256 amount)",
  "function owner() view returns (address)",
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event TokensMinted(address indexed to, uint256 amount)",
  "event TokensBurned(address indexed from, uint256 amount)",
] as const;

export const SWAPHUB_POOL_ABI = [
  // View functions
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function lpToken() view returns (address)",
  "function reserve0() view returns (uint256)",
  "function reserve1() view returns (uint256)",
  "function factory() view returns (address)",
  "function FEE_NUMERATOR() view returns (uint256)",
  "function FEE_DENOMINATOR() view returns (uint256)",
  "function MINIMUM_LIQUIDITY() view returns (uint256)",
  "function getPoolInfo() view returns (address _token0, address _token1, uint256 _reserve0, uint256 _reserve1, address _lpToken, uint256 _totalSupply)",
  "function getAmountOut(address tokenIn, uint256 amountIn) view returns (uint256 amountOut)",
  "function getAmountIn(address tokenOut, uint256 amountOut) view returns (uint256 amountIn)",
  // State changing functions
  "function addLiquidity(uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min) returns (uint256 amount0, uint256 amount1, uint256 liquidity)",
  "function removeLiquidity(uint256 lpAmount, uint256 amount0Min, uint256 amount1Min) returns (uint256 amount0, uint256 amount1)",
  "function swap(address tokenIn, uint256 amountIn, uint256 amountOutMin) returns (uint256 amountOut)",
  "function sync()",
  // Events
  "event LiquidityAdded(address indexed provider, uint256 amount0, uint256 amount1, uint256 lpTokensMinted)",
  "event LiquidityRemoved(address indexed provider, uint256 amount0, uint256 amount1, uint256 lpTokensBurned)",
  "event Swap(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)",
  "event Sync(uint256 reserve0, uint256 reserve1)",
] as const;

export const SWAPHUB_FACTORY_ABI = [
  // View functions
  "function getPool(address tokenA, address tokenB) view returns (address pool)",
  "function allPools(uint256 index) view returns (address)",
  "function allPoolsLength() view returns (uint256)",
  "function getAllPools() view returns (address[])",
  "function getPoolByIndex(uint256 index) view returns (address pool, address token0, address token1, uint256 reserve0, uint256 reserve1)",
  "function feeRecipient() view returns (address)",
  "function owner() view returns (address)",
  // State changing functions
  "function createPool(address tokenA, address tokenB) returns (address pool)",
  "function setFeeRecipient(address _feeRecipient)",
  // Events
  "event PoolCreated(address indexed token0, address indexed token1, address pool, uint256 poolCount)",
  "event FeeRecipientUpdated(address indexed newRecipient)",
] as const;

export const SWAPHUB_ROUTER_ABI = [
  // View functions
  "function factory() view returns (address)",
  "function WETH() view returns (address)",
  "function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)",
  "function getAmountsIn(uint256 amountOut, address[] path) view returns (uint256[] amounts)",
  "function quote(address tokenA, address tokenB, uint256 amountADesired) view returns (uint256 amountB)",
  // State changing functions
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)",
  "function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) returns (uint256[] amounts)",
  "function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)",
  "function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB)",
  // Events
  "event SwapExecuted(address indexed user, address[] path, uint256 amountIn, uint256 amountOut)",
] as const;

export const SWAPHUB_LP_ABI = [
  // ERC20 Standard
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  // LP Token Specific
  "function pool() view returns (address)",
  "function mint(address to, uint256 amount)",
  "function burnFrom(address from, uint256 amount)",
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
] as const;

// ERC20 Interface ABI (for interacting with any ERC20 token)
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
] as const;

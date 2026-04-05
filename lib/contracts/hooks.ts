// React hooks for interacting with SwapHub smart contracts

import { useState, useCallback } from "react";
import { Contract, formatUnits, parseUnits, type Signer, type Provider } from "ethers";
import {
  SWAPHUB_TOKEN_ABI,
  SWAPHUB_POOL_ABI,
  SWAPHUB_FACTORY_ABI,
  SWAPHUB_ROUTER_ABI,
  ERC20_ABI,
} from "./abis";
import { getContractAddresses, type NetworkAddresses } from "./addresses";

// Types
export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
}

export interface PoolInfo {
  address: string;
  token0: string;
  token1: string;
  reserve0: string;
  reserve1: string;
  lpToken: string;
  totalSupply: string;
}

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  path: string[];
}

/**
 * Hook for interacting with ERC20 tokens
 */
export function useToken(tokenAddress: string, signer: Signer | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(() => {
    if (!signer || !tokenAddress) return null;
    return new Contract(tokenAddress, ERC20_ABI, signer);
  }, [tokenAddress, signer]);

  const getBalance = useCallback(
    async (account: string): Promise<string> => {
      const contract = getContract();
      if (!contract) return "0";
      const balance = await contract.balanceOf(account);
      const decimals = await contract.decimals();
      return formatUnits(balance, decimals);
    },
    [getContract]
  );

  const approve = useCallback(
    async (spender: string, amount: string): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const contract = getContract();
        if (!contract) throw new Error("Contract not initialized");
        const decimals = await contract.decimals();
        const tx = await contract.approve(spender, parseUnits(amount, decimals));
        await tx.wait();
        return tx.hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Approval failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  const getAllowance = useCallback(
    async (owner: string, spender: string): Promise<string> => {
      const contract = getContract();
      if (!contract) return "0";
      const allowance = await contract.allowance(owner, spender);
      const decimals = await contract.decimals();
      return formatUnits(allowance, decimals);
    },
    [getContract]
  );

  return { getBalance, approve, getAllowance, loading, error };
}

/**
 * Hook for interacting with SwapHub pools
 */
export function usePool(poolAddress: string, signer: Signer | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(() => {
    if (!signer || !poolAddress) return null;
    return new Contract(poolAddress, SWAPHUB_POOL_ABI, signer);
  }, [poolAddress, signer]);

  const getPoolInfo = useCallback(async (): Promise<PoolInfo | null> => {
    const contract = getContract();
    if (!contract) return null;
    
    const info = await contract.getPoolInfo();
    return {
      address: poolAddress,
      token0: info._token0,
      token1: info._token1,
      reserve0: formatUnits(info._reserve0, 18),
      reserve1: formatUnits(info._reserve1, 18),
      lpToken: info._lpToken,
      totalSupply: formatUnits(info._totalSupply, 18),
    };
  }, [getContract, poolAddress]);

  const getAmountOut = useCallback(
    async (tokenIn: string, amountIn: string, decimalsIn: number = 18): Promise<string> => {
      const contract = getContract();
      if (!contract) return "0";
      const amountOut = await contract.getAmountOut(tokenIn, parseUnits(amountIn, decimalsIn));
      return formatUnits(amountOut, 18);
    },
    [getContract]
  );

  const swap = useCallback(
    async (tokenIn: string, amountIn: string, amountOutMin: string, decimalsIn: number = 18): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const contract = getContract();
        if (!contract) throw new Error("Contract not initialized");
        
        const tx = await contract.swap(
          tokenIn,
          parseUnits(amountIn, decimalsIn),
          parseUnits(amountOutMin, 18)
        );
        await tx.wait();
        return tx.hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Swap failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  const addLiquidity = useCallback(
    async (
      amount0: string,
      amount1: string,
      amount0Min: string,
      amount1Min: string,
      decimals0: number = 18,
      decimals1: number = 18
    ): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const contract = getContract();
        if (!contract) throw new Error("Contract not initialized");
        
        const tx = await contract.addLiquidity(
          parseUnits(amount0, decimals0),
          parseUnits(amount1, decimals1),
          parseUnits(amount0Min, decimals0),
          parseUnits(amount1Min, decimals1)
        );
        await tx.wait();
        return tx.hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Add liquidity failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  const removeLiquidity = useCallback(
    async (lpAmount: string, amount0Min: string, amount1Min: string): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const contract = getContract();
        if (!contract) throw new Error("Contract not initialized");
        
        const tx = await contract.removeLiquidity(
          parseUnits(lpAmount, 18),
          parseUnits(amount0Min, 18),
          parseUnits(amount1Min, 18)
        );
        await tx.wait();
        return tx.hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Remove liquidity failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  return {
    getPoolInfo,
    getAmountOut,
    swap,
    addLiquidity,
    removeLiquidity,
    loading,
    error,
  };
}

/**
 * Hook for interacting with SwapHub factory
 */
export function useFactory(chainId: number, signer: Signer | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(() => {
    if (!signer) return null;
    const addresses = getContractAddresses(chainId);
    if (!addresses?.factory || addresses.factory === "0x0000000000000000000000000000000000000000") {
      return null;
    }
    return new Contract(addresses.factory, SWAPHUB_FACTORY_ABI, signer);
  }, [chainId, signer]);

  const getPool = useCallback(
    async (tokenA: string, tokenB: string): Promise<string | null> => {
      const contract = getContract();
      if (!contract) return null;
      const pool = await contract.getPool(tokenA, tokenB);
      return pool === "0x0000000000000000000000000000000000000000" ? null : pool;
    },
    [getContract]
  );

  const getAllPools = useCallback(async (): Promise<string[]> => {
    const contract = getContract();
    if (!contract) return [];
    return await contract.getAllPools();
  }, [getContract]);

  const createPool = useCallback(
    async (tokenA: string, tokenB: string): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const contract = getContract();
        if (!contract) throw new Error("Factory not initialized");
        
        const tx = await contract.createPool(tokenA, tokenB);
        const receipt = await tx.wait();
        
        // Get pool address from event
        const event = receipt.logs.find(
          (log: { fragment?: { name: string } }) => log.fragment?.name === "PoolCreated"
        );
        return event?.args?.pool || tx.hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Create pool failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  return { getPool, getAllPools, createPool, loading, error };
}

/**
 * Hook for interacting with SwapHub router
 */
export function useRouter(chainId: number, signer: Signer | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(() => {
    if (!signer) return null;
    const addresses = getContractAddresses(chainId);
    if (!addresses?.router || addresses.router === "0x0000000000000000000000000000000000000000") {
      return null;
    }
    return new Contract(addresses.router, SWAPHUB_ROUTER_ABI, signer);
  }, [chainId, signer]);

  const getAmountsOut = useCallback(
    async (amountIn: string, path: string[], decimalsIn: number = 18): Promise<string[]> => {
      const contract = getContract();
      if (!contract) return [];
      const amounts = await contract.getAmountsOut(parseUnits(amountIn, decimalsIn), path);
      return amounts.map((a: bigint) => formatUnits(a, 18));
    },
    [getContract]
  );

  const swapExactTokensForTokens = useCallback(
    async (
      amountIn: string,
      amountOutMin: string,
      path: string[],
      to: string,
      deadline: number,
      decimalsIn: number = 18
    ): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const contract = getContract();
        if (!contract) throw new Error("Router not initialized");
        
        const tx = await contract.swapExactTokensForTokens(
          parseUnits(amountIn, decimalsIn),
          parseUnits(amountOutMin, 18),
          path,
          to,
          deadline
        );
        await tx.wait();
        return tx.hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Swap failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  const addLiquidity = useCallback(
    async (
      tokenA: string,
      tokenB: string,
      amountADesired: string,
      amountBDesired: string,
      amountAMin: string,
      amountBMin: string,
      to: string,
      deadline: number,
      decimalsA: number = 18,
      decimalsB: number = 18
    ): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const contract = getContract();
        if (!contract) throw new Error("Router not initialized");
        
        const tx = await contract.addLiquidity(
          tokenA,
          tokenB,
          parseUnits(amountADesired, decimalsA),
          parseUnits(amountBDesired, decimalsB),
          parseUnits(amountAMin, decimalsA),
          parseUnits(amountBMin, decimalsB),
          to,
          deadline
        );
        await tx.wait();
        return tx.hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Add liquidity failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  return {
    getAmountsOut,
    swapExactTokensForTokens,
    addLiquidity,
    loading,
    error,
  };
}

/**
 * Hook for deploying SwapHub tokens
 */
export function useTokenDeployer(signer: Signer | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deployToken = useCallback(
    async (
      name: string,
      symbol: string,
      decimals: number,
      initialSupply: number
    ): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        if (!signer) throw new Error("Signer not available");
        
        // This would require the contract bytecode which isn't included
        // In practice, you'd compile the contract and include the bytecode
        throw new Error(
          "Token deployment requires contract bytecode. Use Hardhat or Foundry to deploy."
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Deployment failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [signer]
  );

  return { deployToken, loading, error };
}

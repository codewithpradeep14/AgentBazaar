"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";

export interface WalletState {
  address: string | null;
  chainId: number | null;
  balance: string | null;
  isConnecting: boolean;
  isHashKeyChain: boolean;
  isDemoWallet: boolean;
  connectWallet: () => Promise<void>;
  connectDemoWallet: () => void;
  disconnectWallet: () => void;
  switchToHashKeyChain: () => Promise<void>;
  signMandateAuthorization: (mandateHash: string) => Promise<string>;
}

const HSK_MAINNET_PARAMS = {
  chainId: "0xb1", // 177 in hex
  chainName: "HashKey Chain Mainnet",
  nativeCurrency: {
    name: "HashKey Token",
    symbol: "HSK",
    decimals: 18,
  },
  rpcUrls: ["https://mainnet.hsk.xyz"],
  blockExplorerUrls: ["https://hashkey.blockscout.com"],
};

const WalletContext = createContext<WalletState>({
  address: null,
  chainId: null,
  balance: null,
  isConnecting: false,
  isHashKeyChain: false,
  isDemoWallet: false,
  connectWallet: async () => {},
  connectDemoWallet: () => {},
  disconnectWallet: () => {},
  switchToHashKeyChain: async () => {},
  signMandateAuthorization: async () => "",
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isDemoWallet, setIsDemoWallet] = useState<boolean>(false);

  // Restore stored session if exists
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDemo = localStorage.getItem("agentbazaar_demo_wallet");
      if (savedDemo === "true") {
        setAddress("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
        setChainId(177);
        setBalance("25.000");
        setIsDemoWallet(true);
      }
    }
  }, []);

  const isHashKeyChain = chainId === 177 || chainId === 133;

  async function connectWallet() {
    if (typeof window === "undefined") return;
    setIsConnecting(true);

    try {
      if (!(window as any).ethereum) {
        // Fallback to Demo Wallet if no injected Web3 extension
        connectDemoWallet();
        setIsConnecting(false);
        return;
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();

      if (accounts.length > 0) {
        const userAddress = accounts[0];
        setAddress(userAddress);
        setChainId(Number(network.chainId));
        setIsDemoWallet(false);
        localStorage.removeItem("agentbazaar_demo_wallet");

        const bal = await provider.getBalance(userAddress);
        setBalance(parseFloat(ethers.formatEther(bal)).toFixed(3));
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
    } finally {
      setIsConnecting(false);
    }
  }

  function connectDemoWallet() {
    const demoAddr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    setAddress(demoAddr);
    setChainId(177);
    setBalance("25.000");
    setIsDemoWallet(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("agentbazaar_demo_wallet", "true");
    }
  }

  function disconnectWallet() {
    setAddress(null);
    setChainId(null);
    setBalance(null);
    setIsDemoWallet(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("agentbazaar_demo_wallet");
    }
  }

  async function switchToHashKeyChain() {
    if (isDemoWallet) {
      setChainId(177);
      return;
    }

    if (typeof window === "undefined" || !(window as any).ethereum) return;

    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HSK_MAINNET_PARAMS.chainId }],
      });
      setChainId(177);
    } catch (switchError: any) {
      // 4902 error code indicates the chain has not been added to MetaMask yet
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [HSK_MAINNET_PARAMS],
          });
          setChainId(177);
        } catch (addError) {
          console.error("Failed to add HashKey Chain:", addError);
        }
      }
    }
  }

  async function signMandateAuthorization(mandateHash: string): Promise<string> {
    if (isDemoWallet) {
      // Deterministic demo signature for the test account
      return `0x${"a".repeat(64)}${"b".repeat(64)}1c`;
    }

    if (typeof window === "undefined" || !(window as any).ethereum || !address) {
      throw new Error("Wallet not connected");
    }

    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const message = `AgentBazaar HSP Payment Authorization\nCart Hash: ${mandateHash}\nNetwork: HashKey Chain (177)\nAction: Authorize Settlement`;
    return await signer.signMessage(message);
  }

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        balance,
        isConnecting,
        isHashKeyChain,
        isDemoWallet,
        connectWallet,
        connectDemoWallet,
        disconnectWallet,
        switchToHashKeyChain,
        signMandateAuthorization,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}

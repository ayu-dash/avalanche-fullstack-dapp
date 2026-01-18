'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useChainId,
  useBalance,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { injected } from 'wagmi/connectors';
import CONTRACT_ADDRESS from '@/src/contracts/address';
import { getBlockchainValue, getBlockchainEvents } from '@/src/services/blockchain.service';

// ==============================
// CONFIG
// ==============================

// Avalanche Fuji Testnet Chain ID
const FUJI_CHAIN_ID = 43113;

// 👉 ABI SIMPLE STORAGE
const SIMPLE_STORAGE_ABI = [
  {
    inputs: [],
    name: 'getValue',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_value', type: 'uint256' }],
    name: 'setValue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// ==============================
// TYPES
// ==============================
interface BlockchainEvent {
  blockNumber: string;
  txHash: string;
  value: string;
}

// ==============================
// HELPER FUNCTIONS
// ==============================
const shortenAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const shortenHash = (hash: string) => {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

// Toast Component
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colorClasses = {
    success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/15 border-red-500/30 text-red-400',
    info: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
  };

  return (
    <div
      className={`fixed bottom-6 right-6 ${colorClasses[type]} border px-5 py-3 rounded-xl text-sm backdrop-blur-lg z-50 animate-slide-in`}
    >
      {message}
    </div>
  );
};

export default function Page() {
  // ==============================
  //  WALLET STATE
  // ==============================
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
    chainId: FUJI_CHAIN_ID,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // ==============================
  // LOCAL STATE
  // ==============================
  const [mounted, setMounted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [copied, setCopied] = useState(false);

  // ==============================
  // BACKEND API STATE 
  // ==============================
  const [backendValue, setBackendValue] = useState<string | null>(null);
  const [backendEvents, setBackendEvents] = useState<BlockchainEvent[]>([]);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ==============================
  // FETCH FROM BACKEND API 
  // ==============================
  const fetchBackendData = useCallback(async () => {
    setIsLoadingBackend(true);
    setBackendError(null);
    try {
      const [valueData, eventsData] = await Promise.all([
        getBlockchainValue(),
        getBlockchainEvents(),
      ]);
      setBackendValue(valueData.value?.toString() ?? valueData.toString());
      setBackendEvents(eventsData.events ?? eventsData ?? []);
    } catch (err) {
      console.error('Backend fetch error:', err);
      setBackendError(err instanceof Error ? err.message : 'Failed to fetch from backend');
    } finally {
      setIsLoadingBackend(false);
    }
  }, []);

  // Fetch backend data on mount and auto-refresh every 10 seconds
  useEffect(() => {
    if (mounted) {
      fetchBackendData();

      const interval = setInterval(() => {
        fetchBackendData();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [mounted, fetchBackendData]);

  // ==============================
  // NETWORK STATUS
  // ==============================
  const isWrongNetwork = isConnected && chainId !== FUJI_CHAIN_ID;

  const getNetworkName = () => {
    if (!isConnected) return '-';
    if (chainId === FUJI_CHAIN_ID) return 'Avalanche Fuji';
    return 'Wrong Network';
  };

  // ==============================
  // READ CONTRACT
  // ==============================
  const {
    data: value,
    isLoading: isReading,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SIMPLE_STORAGE_ABI,
    functionName: 'getValue',
  });

  // ==============================
  // WRITE CONTRACT
  // ==============================
  const {
    writeContract,
    isPending: isWriting,
    error: writeError,
    data: writeData,
  } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // Track transaction hash
  useEffect(() => {
    if (writeData) {
      setTxHash(writeData);
    }
  }, [writeData]);

  // Refresh after transaction confirmed
  useEffect(() => {
    if (isConfirmed) {
      refetch();
      fetchBackendData(); // Also refresh backend data
      setToast({ message: 'Transaction confirmed!', type: 'success' });
      setInputValue('');
      setTxHash(undefined);
    }
  }, [isConfirmed, refetch, fetchBackendData]);

  // Handle connect error
  useEffect(() => {
    if (connectError) {
      if (connectError.message.includes('User rejected')) {
        setToast({ message: 'Connection rejected by user', type: 'error' });
      } else {
        setToast({ message: `${connectError.message}`, type: 'error' });
      }
    }
  }, [connectError]);

  // Handle write error
  useEffect(() => {
    if (writeError) {
      if (writeError.message.includes('User rejected')) {
        setToast({ message: 'Transaction rejected by user', type: 'error' });
      } else if (writeError.message.includes('revert')) {
        setToast({ message: 'Transaction reverted', type: 'error' });
      } else {
        setToast({
          message: `Error: ${writeError.message.slice(0, 50)}...`,
          type: 'error',
        });
      }
    }
  }, [writeError]);

  const handleSetValue = async () => {
    if (!inputValue) {
      setToast({ message: 'Please enter a value', type: 'info' });
      return;
    }

    if (isWrongNetwork) {
      setToast({ message: 'Please switch to Avalanche Fuji', type: 'error' });
      return;
    }

    setToast({ message: 'Sending transaction...', type: 'info' });

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SIMPLE_STORAGE_ABI,
      functionName: 'setValue',
      args: [BigInt(inputValue)],
    });
  };

  const copyAddress = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setToast({ message: 'Address copied!', type: 'success' });
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address]);

  // ==============================
  // UI
  // ==============================
  return (
    <>
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0c0c1e] via-[#1a1a3e] to-[#2d1f3d] text-white p-5 font-sans">
        <div className="w-full max-w-md bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-2xl p-7">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 font-semibold">
              <span className="text-red-500 text-2xl">◆</span>
              <span>Avalanche dApp</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-xs">
              <span
                className={`w-2 h-2 rounded-full ${mounted && isConnected
                  ? isWrongNetwork
                    ? 'bg-yellow-500'
                    : 'bg-emerald-400 shadow-[0_0_8px_#00f5a0]'
                  : 'bg-gray-500'
                  }`}
              ></span>
              <span>
                {mounted && isConnected
                  ? isWrongNetwork
                    ? 'Wrong Network'
                    : 'Connected'
                  : 'Disconnected'}
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-1.5">
            Day 5 – Full Stack dApp
          </h1>
          <p className="text-center text-white/60 mb-5">
            Avalanche Fuji Testnet
          </p>

          {/* Wrong Network Warning */}
          {isWrongNetwork && (
            <div className="bg-red-500/15 border border-red-500/30 text-red-400 p-3 rounded-xl mb-4 text-sm">
              Please switch to Avalanche Fuji Testnet (Chain ID: {FUJI_CHAIN_ID})
            </div>
          )}

          {/* Connect Button */}
          {!(mounted && isConnected) ? (
            <button
              onClick={() => connect({ connector: injected() })}
              disabled={isConnecting}
              className={`w-full py-3.5 rounded-xl font-semibold mb-4 transition-all duration-200 ${isConnecting
                ? 'bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-red-400 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/40 cursor-pointer'
                }`}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <button
              onClick={() => disconnect()}
              className="text-red-400 text-sm underline py-2 hover:text-red-300 transition-colors cursor-pointer"
            >
              Disconnect
            </button>
          )}

          {/* Wallet Info Card */}
          <div className="bg-black/20 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center py-3 border-b border-white/[0.08]">
              <span className="text-white/70">Status</span>
              <span>{mounted && isConnected ? 'Connected' : 'Not Connected'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/[0.08]">
              <span className="text-white/70">Address</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  {mounted && address ? shortenAddress(address) : '-'}
                </span>
                {mounted && address && (
                  <button
                    onClick={copyAddress}
                    className="bg-white/10 border-none px-2 py-1 rounded-md text-xs text-white hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    {copied ? '✓' : 'Copy'}
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/[0.08]">
              <span className="text-white/70">Network</span>
              <span className={isWrongNetwork ? 'text-yellow-500' : 'text-emerald-400'}>
                {getNetworkName()}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-white/70">Balance</span>
              <span>
                <span className="text-cyan-400 font-semibold">
                  {balanceData?.value !== undefined
                    ? (Number(balanceData.value) / 10 ** balanceData.decimals).toFixed(4)
                    : '-'}
                </span>{' '}
                AVAX
              </span>
            </div>
          </div>

          {/* Recent Events Card */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-4">
            <div className="font-semibold text-purple-400 mb-3 pb-2 border-b border-purple-500/20 flex justify-between items-center">
              <span>Recent Events</span>
              <button
                onClick={fetchBackendData}
                disabled={isLoadingBackend}
                className="text-xs bg-purple-500/20 px-2 py-1 rounded hover:bg-purple-500/30 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoadingBackend ? '...' : '↻'}
              </button>
            </div>
            {backendError ? (
              <div className="text-red-400 text-sm py-2">{backendError}</div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-2">
                {backendEvents.length > 0 ? (
                  backendEvents.slice(0, 10).map((event, idx) => (
                    <div key={idx} className="bg-black/20 p-2 rounded text-xs">
                      <div className="flex justify-between">
                        <span className="text-white/50">Block:</span>
                        <span className="text-purple-300">{event.blockNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Tx:</span>
                        <span className="text-purple-300 font-mono">{shortenHash(event.txHash)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Value:</span>
                        <span className="text-purple-300">{event.value}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-white/50 text-xs text-center py-4">No events found</div>
                )}
              </div>
            )}
          </div>

          {/* Read Contract Card */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
            <div className="font-semibold text-red-400 mb-3 pb-2 border-b border-red-500/20">
              Contract Value (Direct Read)
            </div>
            <div className="text-4xl font-bold text-cyan-400 text-center py-4">
              {isReading ? '...' : value?.toString() ?? '-'}
            </div>
            <div className="text-center">
              <button
                onClick={() => refetch()}
                disabled={isReading}
                className="bg-transparent border border-white/20 px-4 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReading ? 'Loading...' : 'Refresh Value'}
              </button>
            </div>
          </div>

          {/* Write Contract Card */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
            <div className="font-semibold text-red-400 mb-3 pb-2 border-b border-red-500/20">
              Update Contract Value
            </div>
            <input
              type="number"
              placeholder="Enter new value"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={!(mounted && isConnected) || isWriting || isConfirming}
              className="w-full p-3 rounded-xl border border-white/20 bg-black/30 text-white text-base mb-3 outline-none focus:border-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSetValue}
              disabled={!(mounted && isConnected) || isWriting || isConfirming || isWrongNetwork}
              className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 ${!(mounted && isConnected) || isWriting || isConfirming || isWrongNetwork
                ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-400 to-cyan-600 text-[#0c0c1e] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/40 cursor-pointer'
                }`}
            >
              {isConfirming
                ? 'Confirming...'
                : isWriting
                  ? 'Signing...'
                  : 'Set Value'}
            </button>
          </div>

          {/* Chain Info */}
          <div className="text-center text-xs text-white/50 mt-4">
            Chain ID: <span className="text-cyan-400 font-mono">{chainId ?? '-'}</span>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}


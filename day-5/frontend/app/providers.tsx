"use client";

import { WagmiProvider, createConfig, http, createStorage } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const config = createConfig({
  chains: [avalancheFuji],
  transports: {
    [avalancheFuji.id]: http(),
  },
  // Enable persistence - wallet stays connected after refresh
  storage: createStorage({ storage: typeof window !== 'undefined' ? window.localStorage : undefined }),
  ssr: true, // Enable SSR support for Next.js
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

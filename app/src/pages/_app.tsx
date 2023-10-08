import "@/styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";

import type { AppProps } from "next/app";

import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { zkSyncTestnet } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { LensProvider, LensConfig, production } from "@lens-protocol/react-web";
import { bindings as wagmiBindings } from "@lens-protocol/wagmi";

const { chains, publicClient } = configureChains([zkSyncTestnet], [publicProvider()]);

const { connectors } = getDefaultWallets({
  appName: "zkSyncSSIWallet",
  projectId: "cffe9608a02c00c7947b9afd9dacbc70",
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

const lensConfig: LensConfig = {
  bindings: wagmiBindings(),
  environment: production,
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
      <LensProvider config={lensConfig}>
        <Component {...pageProps} />
        </LensProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

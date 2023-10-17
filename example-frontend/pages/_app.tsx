import "@rainbow-me/rainbowkit/styles.css";
import celoGroups from "@celo/rainbowkit-celo/lists";
import type { AppProps } from "next/app";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { polygon, polygonMumbai } from "wagmi/chains";
import "../styles/globals.css";

// Import CELO chain information
import { Alfajores, Celo } from "@celo/rainbowkit-celo/chains";

import Layout from "../components/Layout";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID as string; // get one at https://cloud.walletconnect.com/app

const { chains, provider } = configureChains(
  [Alfajores, Celo, polygonMumbai, polygon],
  [
    jsonRpcProvider({
      rpc: (chain) =>
        chain.id === 80001 || chain.id === 137
          ? { http: "https://rpc.ankr.com/polygon" }
          : { http: "https://rpc.ankr.com/celo" },
    }),
  ]
);

const connectors = celoGroups({
  chains,
  projectId,
  appName: (typeof document === "object" && document.title) || "Your App Name",
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains} coolMode={true}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default App;

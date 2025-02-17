import { FC, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Importe o CSS usando import
import "@solana/wallet-adapter-react-ui/styles.css";

export const WalletConnection: FC = () => {
  // Pode escolher 'devnet', 'testnet', ou 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet;

  // Endpoint para conexão com a Solana
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Carteiras que você quer suportar
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletMultiButton />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

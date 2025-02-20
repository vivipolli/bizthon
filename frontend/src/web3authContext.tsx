import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { Web3AuthOptions } from "@web3auth/modal";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";

const clientId =
  "BNZ3ahrG36eqnHudabgklQPBTudgIlW_kj_-N-R98cUwA0IWqcpBs5zk1-IulVt5dFhCMfKopcDLvuZm8okP4J0";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.SOLANA,
  chainId: "devnet",
  rpcTarget: "https://api.devnet.solana.com",
  displayName: "Solana Devnet",
  blockExplorerUrl: "https://explorer.solana.com/?cluster=devnet",
  ticker: "SOL",
  tickerName: "Solana",
  logo: "https://cryptologos.cc/logos/solana-sol-logo.png",
};

const privateKeyProvider = new SolanaPrivateKeyProvider({
  config: { chainConfig },
});

const web3AuthOptions: Web3AuthOptions = {
  chainConfig,
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  enableLogging: true,
  privateKeyProvider,
};

const web3AuthContextConfig = {
  web3AuthOptions,
  adapters: [],
};

export default web3AuthContextConfig;

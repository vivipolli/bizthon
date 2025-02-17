import web3AuthContextConfig from "../web3authContext";

export const switchNetwork = (network: "ethereum" | "solana") => {
  const networkConfig = web3AuthContextConfig.chainConfigs[network];
  if (!networkConfig) {
    throw new Error(`Network ${network} not configured`);
  }

  return {
    web3AuthOptions: networkConfig.options,
    adapters: networkConfig.adapters,
  };
};

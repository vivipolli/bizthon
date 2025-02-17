import { createWalletClient, custom } from "viem";
import { mainnet, polygonAmoy, sepolia } from "viem/chains";
import type { IProvider } from "@web3auth/base";

const getViewChain = (provider: IProvider) => {
  switch (provider.chainId) {
    case "1":
      return mainnet;
    case "0x13882":
      return polygonAmoy;
    case "0xaa36a7":
      return sepolia;
    default:
      return mainnet;
  }
};

const getChainId = async (provider: IProvider): Promise<any> => {
  try {
    const walletClient = createWalletClient({
      transport: custom(provider),
    });

    const address = await walletClient.getAddresses();
    console.log(address);

    const chainId = await walletClient.getChainId();
    return chainId.toString();
  } catch (error) {
    return error;
  }
};
const getAccounts = async (provider: IProvider): Promise<any> => {
  try {
    const walletClient = createWalletClient({
      chain: getViewChain(provider),
      transport: custom(provider),
    });

    const address = await walletClient.getAddresses();

    return address;
  } catch (error) {
    return error;
  }
};

export default { getChainId, getAccounts };

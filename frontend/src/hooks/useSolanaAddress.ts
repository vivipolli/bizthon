import { useState, useEffect } from "react";
import { useWeb3Auth } from "@web3auth/modal-react-hooks";

export const useSolanaAddress = () => {
  const { provider } = useWeb3Auth();
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getAddress = async () => {
    if (!provider) {
      setLoading(false);
      return;
    }

    try {
      const accounts = await provider.request({
        method: "getAccounts",
      });
      setAddress(accounts[0]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAddress();
  }, [provider]);

  return { address, loading, error, refreshAddress: getAddress };
};

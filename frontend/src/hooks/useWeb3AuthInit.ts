import { useEffect, useState } from "react";
import { Web3Auth } from "@web3auth/modal";
import web3AuthConfig from "../web3authContext";

export const useWeb3AuthInit = () => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const web3auth = new Web3Auth(web3AuthConfig.web3AuthOptions);

        // Configure adapters
        web3AuthConfig.adapters?.forEach((adapter) => {
          web3auth.configureAdapter(adapter);
        });

        await web3auth.initModal();

        setWeb3auth(web3auth);
        setInitialized(true);
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
        setError(error as Error);
      }
    };

    init();
  }, []);

  return { web3auth, initialized, error };
};

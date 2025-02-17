import { useWeb3Auth } from "@web3auth/modal-react-hooks";
import RPC from "../ethersRPC";

function Dashboard() {
  const { provider, userInfo } = useWeb3Auth();

  const getAccounts = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const address = await RPC.getAccounts(provider);
    console.log(address);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#45803B] mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => console.log(userInfo)}
          className="p-6 bg-[#45803B] text-white rounded-lg shadow-md hover:bg-[#386832] transition-colors"
        >
          <h2 className="text-xl font-semibold">Get User Info</h2>
          <p className="mt-2 text-gray-100">View user information</p>
        </button>
        <button
          onClick={getAccounts}
          className="p-6 bg-[#45803B] text-white rounded-lg shadow-md hover:bg-[#386832] transition-colors"
        >
          <h2 className="text-xl font-semibold">Get Accounts</h2>
          <p className="mt-2 text-gray-100">View connected accounts</p>
        </button>
      </div>
    </div>
  );
}

export default Dashboard;

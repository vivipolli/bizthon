import { useWeb3Auth } from "@web3auth/modal-react-hooks";

function Profile() {
  const { userInfo } = useWeb3Auth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#45803B] mb-6">Profile</h1>
      <div className="bg-[#45803B] text-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        {userInfo && (
          <div className="space-y-4">
            <div className="border-b border-[#569c49] pb-4">
              <p className="text-sm text-gray-200">Name</p>
              <p className="text-white">{userInfo.name}</p>
            </div>
            <div className="border-b border-[#569c49] pb-4">
              <p className="text-sm text-gray-200">Email</p>
              <p className="text-white">{userInfo.email}</p>
            </div>
            {/* Add more profile fields as needed */}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;

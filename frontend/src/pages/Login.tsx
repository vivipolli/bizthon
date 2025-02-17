import { useWeb3Auth } from "@web3auth/modal-react-hooks";

function Login() {
  const { connect } = useWeb3Auth();

  const handleLogin = async () => {
    await connect();
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/login-bg.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "brightness(0.7)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-black/30 p-8 rounded-xl backdrop-blur-sm">
          <div>
            <h2 className="mt-6 text-center text-4xl font-extrabold text-white">
              Welcome
            </h2>
            <p className="mt-2 text-center text-lg text-gray-200">
              Login to continue
            </p>
          </div>
          <div className="mt-8">
            <button
              onClick={handleLogin}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-[#45803B] bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 transform hover:scale-105"
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

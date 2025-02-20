import { useWeb3Auth } from "@web3auth/modal-react-hooks";
import { Link } from "react-router-dom";

function Header() {
  const { logout } = useWeb3Auth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-[#45803B] shadow-md py-4 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <nav className="space-x-6">
          <Link to="/" className="text-white hover:text-gray-200 font-medium">
            My Reservations
          </Link>
          <Link
            to="/profile"
            className="text-white hover:text-gray-200 font-medium"
          >
            Profile
          </Link>
        </nav>
        <button
          onClick={handleLogout}
          className="bg-white hover:bg-gray-100 text-[#45803B] px-4 py-2 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;

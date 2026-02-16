import { Box, Loader } from "lucide-react"; // add Loader
import Button from "./ui/Button";
import { useOutletContext } from "react-router";

const Navbar = () => {
  const { isSignedIn, signIn, signOut, userName, isAuthLoading } =
    useOutletContext<AuthContext>();

  const handleAuthClick = async () => {
    if (isSignedIn) {
      try {
        await signOut();
      } catch (error) {
        console.error(`Puter sign out failed: ${error}`);
      }
      return;
    }

    try {
      await signIn();
    } catch (error) {
      console.error(`Puter sign in failed: ${error}`);
    }
  };

  return (
    <header className="navbar">
      <div className="inner">
        <div className="left">
          <div className="brand">
            <Box className="logo" />
            <span className="name">Roominer</span>
          </div>
          <ul className="links">
            <a href="#">Products</a>
            <a href="#">Pricing</a>
            <a href="#">Community</a>
            <a href="#">Enterprise</a>
          </ul>
        </div>

        <div className="actions">
          {isAuthLoading ? (
            <Loader className="animate-spin w-5 h-5 text-gray-500" />
          ) : isSignedIn ? (
            <>
              <span className="greeting">
                {userName ? `Hi ${userName}` : "Signed in"}
              </span>
              <Button size="sm" onClick={handleAuthClick} className="btn">
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" onClick={handleAuthClick} variant="ghost">
                Log In
              </Button>
              <a href="#upload" className="cta">
                Get started
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

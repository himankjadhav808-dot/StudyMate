import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

function Layout({ email }) {
  return (
    <>
      <Navbar email={email} />
      <main className="pt-20">
        <Outlet />
      </main>
    </>
  );
}

export default Layout;

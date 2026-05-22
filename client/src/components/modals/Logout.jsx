import { useContext, useState } from "react";
import ReactDOM from "react-dom";
import AppContext from "../../contexts/AppContext";

let flag = true;

function Logout({ closeModal }) {
  const [success, setSuccess] = useState(true);
  const { setEmail, setUser, setIsVerified } = useContext(AppContext);
  const BASE_URL = import.meta.env.VITE_API_URL;

  const handleLogOut = async () => {
    if (flag) {
      await fetch(`${BASE_URL}/learner/logout`, {
        method: "GET",
        mode: "cors",
        "Content-Type": "application/json",
        credentials: "include",
      })
        .then((res) => {
          if (!res) {
            setSuccess(false);
          } else {
            setEmail(null);
            setUser(null);
            setIsVerified(false);
            closeModal();
          }
        })
        .catch((err) => console.log(err));
    }
  };

  return ReactDOM.createPortal(
    success ? (
      <>
        <div className="p-6 w-[90%] md:w-[35%] shadow-md rounded-md bg-white fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] space-y-3 z-50">
          <h3 className="text-xl font-semibold">Are you sure?</h3>
          <p className="text-sm text-slate-600">
            Do you really want to log out? Once you logout, all of your session
            will be deleted instantly.
          </p>
          <div className="flex gap-3 pt-1">
            <button
              className="flex-1 text-white bg-green-600 px-4 py-2 rounded-md font-semibold active:scale-[0.97] transition-transform"
              onClick={handleLogOut}
            >
              Yes, Logout
            </button>
            <button
              className="flex-1 text-white bg-red-500 px-4 py-2 rounded-md font-semibold active:scale-[0.97] transition-transform"
              onClick={closeModal}
            >
              Cancel
            </button>
          </div>
        </div>
        <div className="fixed left-0 right-0 top-0 bottom-0 bg-black opacity-[0.6] z-40" />
      </>
    ) : (
      <>
        <div className="p-6 w-[90%] md:w-[35%] shadow-md rounded-md bg-white fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] space-y-3 z-50">
          <h3 className="text-xl font-semibold">Failed to logout</h3>
          <p className="text-sm text-slate-600">
            Something went wrong, please try it again.
          </p>
          <div className="flex gap-3 pt-1">
            <button
              className="flex-1 text-white bg-green-600 px-6 py-2 rounded-md font-semibold active:scale-[0.97] transition-transform"
              onClick={closeModal}
            >
              OK
            </button>
          </div>
        </div>
        <div className="fixed left-0 right-0 top-0 bottom-0 bg-black opacity-[0.6] z-40" />
      </>
    ),
    document.getElementById("portal")
  );
}

export default Logout;
/* eslint-disable react/prop-types */
import { useState } from "react";
import AppContext from "./AppContext";

const AppContextProvider = ({ children }) => {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState("John Doe");
  const [load, setLoad] = useState(true);
  const [report, setReport] = useState(null);
  const [inExam, setInExam] = useState(false);
  const [option, setOption] = useState({ category: "", level: "" });
  const [isVerified, setIsVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState('user');
  const [token, setTokenState] = useState(() => localStorage.getItem('sm_token') || '');

  const setToken = (t) => {
    setTokenState(t);
    if (t) localStorage.setItem('sm_token', t);
    else localStorage.removeItem('sm_token');
  };

  return (
    <AppContext.Provider
      value={{
        email,
        setEmail,
        user,
        setUser,
        option,
        setOption,
        load,
        setLoad,
        report,
        setReport,
        inExam,
        setInExam,
        isVerified,
        setIsVerified,
        isAdmin,
        setIsAdmin,
        role,
        setRole,
        token,
        setToken,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;

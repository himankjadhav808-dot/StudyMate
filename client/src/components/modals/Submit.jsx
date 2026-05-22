import ReactDOM from "react-dom";
import QuestionContext from "../../contexts/ExamContext";
import { useContext } from "react";
import AppContext from "../../contexts/AppContext";
import { useNavigate } from "react-router-dom";

function Submit({ closeModal }) {
  const navigate = useNavigate();
  const { setReport, token } = useContext(AppContext);
  const { paper } = useContext(QuestionContext);
  const BASE_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async () => {
    await fetch(`${BASE_URL}/exam/eval`, {
      method: "POST",
      mode: "cors",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(paper),
    })
      .then((res) => res.json())
      .then((res) => {
        setReport(res.report);
        navigate("/result/progressboard");
      })
      .catch((err) => console.log(err));
  };

  return ReactDOM.createPortal(
    <>
      <div className="p-6 w-[90%] md:w-[35%] shadow-md rounded-md bg-white fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] space-y-3 z-50">
        <h3 className="text-xl font-semibold">Are you sure?</h3>
        <p className="text-sm text-slate-600">
          Do you really want to submit the paper? Once submitted, you will not
          be able to make any changes. Make sure you have reviewed all your
          questions and answers before submitting.
        </p>
        <div className="flex gap-3 pt-1">
          <button
            className="flex-1 text-white bg-green-600 px-4 py-2 rounded-md font-semibold active:scale-[0.97] transition-transform"
            onClick={handleSubmit}
          >
            Yes, Submit
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
    </>,
    document.getElementById("portal")
  );
}

export default Submit;
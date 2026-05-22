/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  useContext,
  useEffect,
  useState,
  Suspense,
  useMemo,
  useCallback,
} from "react";

import CountdownTimer from "../components/CountdownTimer";
import QestionNo from "../components/QestionNo";
const Question = React.lazy(() => import("../components/Question"));

import AppContext from "../contexts/AppContext";
import Submit from "../components/modals/Submit";
import ExamContext from "../contexts/ExamContext";


function ExamLayout() {
  const [submit, setSubmit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const { email, user, option } = useContext(AppContext);
  const { paper, setPaper, currentQuestion, setCurrentQuestion } =
    useContext(ExamContext);
   
  const BASE_URL = import.meta.env.VITE_API_URL;

 useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();

    const handleKeyDown = (e) => {
      const blockedKeys = [
        { key: "F12" },
        { key: "I", ctrlKey: true, shiftKey: true },
        { key: "C", ctrlKey: true, shiftKey: true },
        { key: "J", ctrlKey: true, shiftKey: true },
        { key: "U", ctrlKey: true },
      ];
      if (blockedKeys.some((k) =>
        Object.keys(k).every((prop) => e[prop] === k[prop])
      )) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    async function getExamPaper() {
      const joinCode = option?.joinCode;
      const aiLevelMap = {
        beginner: {
          category: "Standard",
          topic: "Beginner aptitude questions for freshers",
        },
        medium: {
          category: "Standard",
          topic: "Medium aptitude questions for regulars",
        },
        pro: {
          category: "Standard",
          topic: "Pro aptitude questions for interviews",
        },
        difficult: {
          category: "Standard",
          topic: "Pro aptitude questions for interviews",
        },
      };

      const level = option?.level || "beginner";
      const { category, topic } = aiLevelMap[level] || aiLevelMap.beginner;

      try {
        setErrorMessage(null);
        let response;
        if (joinCode) {
          response = await fetch(`${BASE_URL}/exam/qes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ joinCode: joinCode.trim() }),
          });
        } else {
          response = await fetch(
            `${BASE_URL}/api/ai?category=${encodeURIComponent(category)}&topic=${encodeURIComponent(topic)}&level=${encodeURIComponent(level)}&limit=50`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        if (!response.ok) {
          const errorText = await response.json().catch(() => ({}));
          throw new Error(errorText.error || "Failed to fetch paper");
        }

        const data = await response.json();
        const sanitizedQuestions = (data.questionSet || data || []).map((q, index) => ({
          ...q,
          questionNo: q.questionNo || index + 1,
          questionBody: q.questionBody || q.question || q.prompt || '',
          options: Array.isArray(q.options)
            ? q.options
            : Object.values(q.options || {}),
          marks: Number(q.marks) || 1,
          belongsTo: q.belongsTo || q.category || 'numerical',
        }));
        setPaper({ ...data, questionSet: sanitizedQuestions });
        setCurrentQuestion(0);
      } catch (err) {
        console.error("Failed to fetch exam paper:", err);
        setErrorMessage(err.message || "Unable to load exam paper.");
        setPaper(null);
      } finally {
        setLoading(false);
      }
    }

    getExamPaper();

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [option]);  // ← yeh closing pehle se hai

  const totalQuestions = paper?.questionSet?.length || 0;

  const questionNo = useMemo(() => {
    return Array.from({ length: totalQuestions }, (_, i) => i);
  }, [totalQuestions]);

  const handleSelectedQuestionNo = (num) => {
    setCurrentQuestion(num);
    setShowQuestionNav(false);
  };

  const handleNextQuestion = useCallback(() => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  }, [currentQuestion, totalQuestions, setCurrentQuestion]);

  const handlePrevQuestion = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  }, [currentQuestion, setCurrentQuestion]);

  const displayNumberPattern = useMemo(() => {
    return questionNo.map((num) => (
      <QestionNo
        key={num}
        number={num}
        handleQuestionNo={handleSelectedQuestionNo}
      />
    ));
  }, [questionNo]);

  return (
    <>
      <div className="w-full min-h-screen pt-16 md:pt-20 flex flex-col md:flex-row select-none bg-gray-50">
        <div className="md:hidden bg-white shadow-sm px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              className="rounded-full w-8 h-8 border-2 border-pink-500"
              src="images/student.png"
              alt="Student"
            />
            <div>
              <p className="text-sm font-medium leading-tight">{user}</p>
              <p className="text-xs text-gray-500">{email}</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            {!loading && paper ? <CountdownTimer compact initialTime={paper?.timeLimit || 25 * 60} /> : null}
            <button
              className="px-3 py-1.5 rounded-md bg-green-600 text-white text-sm font-semibold disabled:opacity-50"
              onClick={() => paper && setSubmit(true)}
              disabled={!paper || loading}
            >
              Submit
            </button>
          </div>
        </div>

        {showQuestionNav && (
          <div className="md:hidden absolute top-32 left-0 right-0 z-50 bg-white shadow-lg border-b max-h-60 overflow-y-auto">
            <div className="p-3 grid grid-cols-6 sm:grid-cols-8 gap-2">
              {displayNumberPattern}
            </div>
          </div>
        )}

        <div className="hidden md:block w-[20%] bg-slate-100 pt-8">
          <div className="w-[80%] max-h-[80vh] overflow-y-auto mx-auto border-2 border-stone-500 rounded-md mt-4 p-3 grid grid-cols-4 gap-3">
            {displayNumberPattern}
          </div>
        </div>

        <div className="flex-1 md:w-[60%] pt-4 md:pt-12 pb-20 md:pb-16 px-4 md:px-0 relative">
          <div className="mb-4 text-sm text-slate-500">
            {totalQuestions > 0
              ? `Attempt ${totalQuestions} question${totalQuestions === 1 ? '' : 's'} in this exam.`
              : 'Loading exam questions...'}
          </div>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <p className="text-xl text-gray-500">Loading questions...</p>
              </div>
            }
          >
            {loading ? (
              <p className="text-center text-xl pt-5">Loading questions...</p>
            ) : errorMessage ? (
              <p className="text-center text-xl pt-5 text-red-600">{errorMessage}</p>
            ) : totalQuestions > 0 ? (
              <Question />
            ) : (
              <p className="text-center text-xl pt-5">No paper available</p>
            )}
          </Suspense>

          <div className="fixed md:absolute bottom-0 left-0 right-0 md:left-auto md:right-auto md:w-full bg-white flex px-4 md:px-10 justify-between border-t-2 shadow-lg md:shadow-none">
            <button
              className="py-2 px-4 md:py-1 md:px-3 my-2 md:my-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 active:scale-95 transition-transform text-sm md:text-base disabled:opacity-50"
              onClick={handlePrevQuestion}
              disabled={currentQuestion === 0}
            >
              ← Prev
            </button>

            <button className="py-2 px-4 md:py-1 md:px-3 my-2 md:my-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 active:scale-95 transition-transform text-sm md:text-base">
              ⚑ Mark
            </button>

            <button
              className="py-2 px-4 md:py-1 md:px-3 my-2 md:my-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 active:scale-95 transition-transform text-sm md:text-base disabled:opacity-50"
              onClick={handleNextQuestion}
              disabled={currentQuestion === totalQuestions - 1}
            >
              Next →
            </button>
          </div>
        </div>

        <div className="hidden md:block w-[20%] bg-slate-100 pt-12">
          <div className="text-center">
            {!loading ? (paper ? <CountdownTimer initialTime={paper?.timeLimit || 25 * 60} /> : <p className="text-sm text-red-600">No exam loaded.</p>) : <p>Loading...</p>}
          </div>
          <div className="flex items-center flex-col mt-10">
            <img
              className="rounded-full w-20 border-2 border-pink-600"
              src="images/student.png"
              alt="Student"
            />
            <h4 className="text-lg font-semibold mt-2">{user}</h4>
            <p className="text-xs">{email}</p>
          </div>

          <div className="flex justify-center mt-36">
            <button
              className="px-4 py-1 rounded-md bg-green-600 text-white font-semibold active:bg-green-700 disabled:opacity-50"
              onClick={() => paper && setSubmit(true)}
              disabled={!paper || loading}
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      {showQuestionNav && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setShowQuestionNav(false)}
        />
      )}

      {paper && submit && <Submit closeModal={() => setSubmit(false)} />}
    </>
  );
}

export default ExamLayout;
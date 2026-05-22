import React, { useContext } from "react";
import ExamContext from "../contexts/ExamContext";

function Question() {
  const { currentQuestion, paper, setPaper } = useContext(ExamContext);
  const questionSet = paper?.questionSet || [];
  const question = questionSet[currentQuestion];

  if (!question) {
    return (
      <div className="px-12 py-6 text-center text-red-500">
        <p>Question not found.</p>
      </div>
    );
  }

  const options = Array.isArray(question.options)
    ? question.options
    : Object.values(question.options || {});

  const questionText = question.questionBody || question.question || question.prompt || '';
  const questionNo = question.questionNo || currentQuestion + 1;

  const handleRadioChange = (e) => {
    const selectedValue = e.target.value;

    const updatedQuestionSet = [...questionSet];
    updatedQuestionSet[currentQuestion] = {
      ...updatedQuestionSet[currentQuestion],
      selected: selectedValue,
    };

    setPaper({
      ...paper,
      questionSet: updatedQuestionSet,
    });
  };

  return (
    <div className="px-12 pb-20">
      <div>
        <h3 className="text-xl font-semibold my-2">
          Question: {questionNo}
        </h3>
      </div>

      <div>
        <p className="transition-all">{questionText}</p>
      </div>

      <div className="mt-4">
        <ul className="space-y-2">
          {options.map((option, index) => (
            <li key={index}>
              <label className="cursor-pointer flex items-center">
                <input
                  type="radio"
                  name={`question-${currentQuestion}`}
                  value={option}
                  className="text-pink-500 focus:ring-1 focus:ring-pink-500 cursor-pointer"
                  onChange={handleRadioChange}
                  checked={question.selected === option}
                />
                <span className="mx-2">{option}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Question;
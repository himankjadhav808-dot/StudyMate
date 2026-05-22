import React, { useState } from "react";

const categories = {
  Aptitude: [
    "Percentages",
    "Profit and Loss",
    "Time and Work",
    "Averages",
    "Simple Interest",
    "Compound Interest",
    "Ratio and Proportion",
    "Number Series",
  ],
  Reasoning: [
    "BloodRelations",
    "CodingDecoding",
    "OddOneOut",
    "NumberSeries",
    "WordFormation",
    "DirectionSense",
    "Calendar",
    "Mathematics",
  ],
  "Verbal Ability": [
    "Synonyms",
    "Antonyms",
    "Reading Comprehension",
    "Sentence Correction",
    "Para Jumbles",
  ],
};

export default function Practice() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const BASE_URL = import.meta.env.VITE_API_URL;
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  

  const fetchQuestions = async (topic, category) => {
    const response = await fetch(
      `${BASE_URL}/api/ai?category=${encodeURIComponent(category)}&topic=${encodeURIComponent(topic)}&limit=50`,
      {
        method: "GET",
        mode: "cors",
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to load practice questions: ${response.status} ${text}`);
    }

    const rawData = await response.json();
    const normalized = Array.isArray(rawData) ? rawData : rawData.questions || [rawData];

    if (!Array.isArray(normalized) || normalized.length === 0) {
      throw new Error("No questions returned from AI generator");
    }

    return normalized.map((q) => ({
      ...q,
      options: shuffleArray(Array.isArray(q.options) ? q.options : []),
    }));
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSelectedTopic(null);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setError(null);
  };

  const handleTopicClick = async (topic) => {
    setSelectedTopic(topic);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setError(null);
    setLoading(true);

    try {
      const newQuestions = await fetchQuestions(topic, selectedCategory);
      setQuestions(newQuestions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (option) => {
    setSelectedAnswer(option);
    const current = questions[currentIndex];
    setShowExplanation(current && option !== current.answer);
  };

  const handleNext = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setSelectedAnswer(null);
      setShowExplanation(false);
      setError(null);
      setLoading(true);

      try {
        const newQuestions = await fetchQuestions(selectedTopic, selectedCategory);
        setQuestions(newQuestions);
        setCurrentIndex(0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderCurrentQuestion = () => {
    if (error) {
      return <div className="text-red-600 p-2">{error}</div>;
    }

    if (loading) {
      return <div className="text-center py-6">Loading questions...</div>;
    }

    if (!questions.length) {
      return <div className="text-center py-6">Loading questions...</div>;
    }

    if (currentIndex >= questions.length) {
      return <div>✅ Practice complete! Select a new topic to continue.</div>;
    }

    const q = questions[currentIndex];
    if (!q || !Array.isArray(q.options)) {
      return <div>Invalid question format.</div>;
    }

    return (
      <div>
        <div className="mb-4 font-bold text-base sm:text-lg">
          Q{currentIndex + 1}: {q.question}
        </div>

        <div className="flex flex-col gap-3">
          {q.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(option)}
              disabled={selectedAnswer !== null}
              className={`px-4 py-3 rounded-lg border font-semibold text-left transition ${
                selectedAnswer === option
                  ? option === q.answer
                    ? "border-green-600 bg-green-100 text-green-800"
                    : "border-red-600 bg-red-100 text-red-800"
                  : "border-blue-500 bg-white text-blue-600"
              } ${selectedAnswer === null ? "cursor-pointer" : "cursor-default"}`}
            >
              {option}
            </button>
          ))}
        </div>

        {selectedAnswer && (
          <div className="mt-4">
            {selectedAnswer === q.answer ? (
              <span className="text-green-600 font-bold">✅ Correct!</span>
            ) : (
              <span className="text-red-600 font-bold">❌ Incorrect.</span>
            )}

            {showExplanation && q.explanation && (
              <div className="mt-2 text-gray-600">
                <strong>Explanation:</strong> {q.explanation}
              </div>
            )}

            <button
              onClick={handleNext}
              className="mt-4 px-5 py-2 rounded-lg bg-blue-600 text-white font-bold"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
  <div className="min-h-screen bg-gray-100 pt-20 px-3">
    <div className="max-w-6xl mx-auto">

      {/* 🔥 MOBILE CONTROLS */}
      <div className="lg:hidden bg-white p-4 rounded-xl shadow mb-4">

        {/* Category Dropdown */}
        <select
          value={selectedCategory || ""}
          onChange={(e) => handleCategoryClick(e.target.value)}
          className="w-full p-3 mb-3 border rounded-lg"
        >
          <option value="">Select Category</option>
          {Object.keys(categories).map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>

        {/* Topic Dropdown */}
        {selectedCategory && (
          <select
            value={selectedTopic || ""}
            onChange={(e) => handleTopicClick(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            <option value="">Select Topic</option>
            {categories[selectedCategory].map((topic) => (
              <option key={topic}>{topic}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">

        {/* 🖥️ DESKTOP SIDEBAR */}
        <div className="hidden lg:block w-[280px] bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-bold mb-4">Categories</h2>

          {Object.keys(categories).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`w-full mb-2 p-3 rounded-lg text-left ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white"
                  : "border border-blue-500 text-blue-600"
              }`}
            >
              {cat}
            </button>
          ))}

          {selectedCategory && (
            <>
              <h3 className="mt-4 mb-2 font-semibold">Topics</h3>
              {categories[selectedCategory].map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleTopicClick(topic)}
                  className={`w-full mb-2 p-2 rounded-lg text-left ${
                    selectedTopic === topic
                      ? "bg-blue-600 text-white"
                      : "border border-blue-500 text-blue-600"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </>
          )}
        </div>

        {/* 📚 QUESTION AREA */}
        <div className="flex-1">
          {selectedTopic ? (
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow max-w-3xl mx-auto">
              <h3 className="mb-4 font-bold text-base sm:text-lg">
                {selectedTopic} ({selectedCategory})
              </h3>

              {renderCurrentQuestion()}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow text-center text-gray-500">
              Select category & topic to start
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}
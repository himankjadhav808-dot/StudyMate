import { useState, useContext } from 'react';
import AppContext from '../contexts/AppContext';

const TestUploadForm = () => {
  const { token } = useContext(AppContext);

  const [paperCode, setPaperCode] = useState('');
  const [paperName, setPaperName] = useState('');
  const [level, setLevel] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [questionSet, setQuestionSet] = useState([
    {
      questionNo: 1,
      questionBody: '',
      options: { A: '', B: '', C: '', D: '' },
      selected: '',
      answer: '',
      belongsTo: '',
      marks: 1,
    },
  ]);

  // Success state — holds generated sessionCode after upload
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_URL;

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questionSet];
    updated[index][field] = value;
    setQuestionSet(updated);
  };

  const handleOptionChange = (qIndex, key, value) => {
    const updated = [...questionSet];
    updated[qIndex].options[key] = value;
    setQuestionSet(updated);
  };

  const addQuestion = () => {
    setQuestionSet([
      ...questionSet,
      {
        questionNo: questionSet.length + 1,
        questionBody: '',
        options: { A: '', B: '', C: '', D: '' },
        selected: '',
        answer: '',
        belongsTo: '',
        marks: 1,
      },
    ]);
  };

  const removeQuestion = (index) => {
    if (questionSet.length === 1) return;
    const updated = questionSet
      .filter((_, i) => i !== index)
      .map((q, i) => ({ ...q, questionNo: i + 1 }));
    setQuestionSet(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setUploadResult(null);

    const payload = {
      paperCode,
      paperName,
      level,
      timeLimit: Number(timeLimit) * 60,
      totalQuestions: questionSet.length,
      questionSet,
    };

    try {
      const res = await fetch(`${BASE_URL}/api/questionset/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        setUploadResult({
          sessionCode: data.sessionCode,
          paperCode: data.paperCode,
          paperName,
        });
        // Reset the form
        setPaperCode('');
        setPaperName('');
        setLevel('');
        setTimeLimit(30);
        setQuestionSet([
          {
            questionNo: 1,
            questionBody: '',
            options: { A: '', B: '', C: '', D: '' },
            selected: '',
            answer: '',
            belongsTo: '',
            marks: 1,
          },
        ]);
      } else {
        alert(`Upload failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Upload failed due to a network error.');
    } finally {
      setUploading(false);
    }
  };

  const copyCode = () => {
    if (!uploadResult?.sessionCode) return;
    navigator.clipboard.writeText(uploadResult.sessionCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Success Banner ────────────────────────────────────────────────────────
  if (uploadResult) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center bg-slate-100 py-16 px-4">
        <div className="w-full max-w-lg bg-white rounded-[28px] shadow-2xl p-10 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-5xl">
              🎉
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">Question Set Created!</h2>
            <p className="text-slate-500 mt-1 text-sm">
              Share the session code below with your students so they can join the test.
            </p>
          </div>

          {/* Session Code Display */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-2xl p-6">
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-widest mb-2">
              Session Join Code
            </p>
            <p className="text-5xl font-extrabold tracking-[0.25em] text-teal-700 select-all font-mono">
              {uploadResult.sessionCode}
            </p>
            <p className="text-xs text-teal-600 mt-3 opacity-70">
              Paper: <span className="font-semibold">{uploadResult.paperName}</span> &nbsp;·&nbsp;
              Code: <span className="font-semibold">{uploadResult.paperCode}</span>
            </p>
          </div>

          {/* Copy Button */}
          <button
            onClick={copyCode}
            className={`w-full py-3 rounded-2xl font-semibold transition-all duration-200 ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            {copied ? '✓ Copied!' : '📋 Copy Session Code'}
          </button>

          <button
            onClick={() => setUploadResult(null)}
            className="w-full py-3 rounded-2xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition font-medium"
          >
            Create Another Question Set
          </button>
        </div>
      </div>
    );
  }

  // ── Upload Form ────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen flex justify-center items-start bg-slate-100 py-16 px-4">
      <form
        onSubmit={handleSubmit}
        className="upload-form w-full max-w-4xl bg-white rounded-[28px] shadow-2xl p-8 sm:p-10 space-y-6"
      >
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Create New Question Set</h2>
          <p className="text-slate-500 mt-1 text-sm">
            Fill in the details below. A unique session code will be automatically generated.
          </p>
        </div>

        {/* Paper details */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Paper Code *
            </label>
            <input
              className="input-field"
              type="text"
              placeholder="e.g. MATH2024"
              value={paperCode}
              onChange={(e) => setPaperCode(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Paper Name *
            </label>
            <input
              className="input-field"
              type="text"
              placeholder="e.g. Mathematics Mid-Term"
              value={paperName}
              onChange={(e) => setPaperName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Level *
            </label>
            <select
              className="input-field"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              required
            >
              <option value="">Select level…</option>
              <option value="beginner">Beginner</option>
              <option value="medium">Medium</option>
              <option value="difficult">Difficult</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Time Limit (minutes) *
            </label>
            <input
              className="input-field"
              type="number"
              placeholder="e.g. 30"
              value={timeLimit}
              min={1}
              onChange={(e) => setTimeLimit(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Session code notice */}
        <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-2xl px-5 py-3">
          <span className="text-2xl">🔑</span>
          <p className="text-sm text-teal-700">
            A unique 6-character <strong>session join code</strong> will be auto-generated when you
            save this question set. You'll see it on the next screen.
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">
            Questions ({questionSet.length})
          </h3>
          {questionSet.map((q, qIndex) => (
            <div
              key={qIndex}
              className="question-card rounded-3xl border border-slate-200 p-6 bg-slate-50 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between gap-4">
                <h4 className="text-lg font-semibold text-slate-800">Question {q.questionNo}</h4>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">Marks: {q.marks}</span>
                  {questionSet.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium transition"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <input
                className="input-field"
                type="text"
                placeholder="Question Body"
                value={q.questionBody}
                onChange={(e) => handleQuestionChange(qIndex, 'questionBody', e.target.value)}
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                {['A', 'B', 'C', 'D'].map((key) => (
                  <input
                    key={key}
                    className="input-field"
                    type="text"
                    placeholder={`Option ${key}`}
                    value={q.options[key]}
                    onChange={(e) => handleOptionChange(qIndex, key, e.target.value)}
                    required
                  />
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="input-field"
                  type="text"
                  placeholder="Correct Answer (A / B / C / D)"
                  value={q.answer}
                  onChange={(e) =>
                    handleQuestionChange(qIndex, 'answer', e.target.value.toUpperCase())
                  }
                  required
                />
                <input
                  className="input-field"
                  type="text"
                  placeholder="Belongs To (Topic)"
                  value={q.belongsTo}
                  onChange={(e) => handleQuestionChange(qIndex, 'belongsTo', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={addQuestion}
            className="btn-secondary w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 transition"
          >
            + Add Another Question
          </button>

          <button
            type="submit"
            disabled={uploading}
            className="btn-primary w-full sm:w-auto px-6 py-3 rounded-2xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition disabled:opacity-60"
          >
            {uploading ? 'Uploading…' : 'Upload Question Set'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestUploadForm;
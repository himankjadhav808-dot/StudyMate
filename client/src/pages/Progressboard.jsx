import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../contexts/AppContext";

// ── Grade colour helpers ───────────────────────────────────────────────────────
const gradeColor = (grade) => {
  const g = (grade || '').toUpperCase();
  if (g === 'A+' || g === 'A') return { bg: 'bg-green-100', text: 'text-green-700', badge: 'bg-green-500' };
  if (g === 'B') return { bg: 'bg-blue-100', text: 'text-blue-700', badge: 'bg-blue-500' };
  if (g === 'C') return { bg: 'bg-yellow-100', text: 'text-yellow-700', badge: 'bg-yellow-500' };
  return { bg: 'bg-red-100', text: 'text-red-700', badge: 'bg-red-500' };
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const levelLabel = (level) => {
  if (!level) return 'Standard';
  return level.charAt(0).toUpperCase() + level.slice(1);
};

function Progressboard() {
  const navigate = useNavigate();
  const { token } = useContext(AppContext);
  const BASE_URL = import.meta.env.VITE_API_URL;

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}/exam/results`, {
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setResults(data.results || []);
        } else {
          setError(data.message || 'Could not load results.');
        }
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalExams = results.length;
  const avgMarks = totalExams
    ? Math.round(results.reduce((s, r) => s + toNumber(r.marks), 0) / totalExams)
    : 0;
  const bestMarks = totalExams ? Math.max(...results.map(r => toNumber(r.marks))) : 0;
  const passCount = results.filter((r) => {
    const marks = toNumber(r.marks);
    const maxMarks = toNumber(r.maxMarks || r.totalQuestions);
    return maxMarks > 0 ? marks / maxMarks >= 0.4 : false;
  }).length;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading your progress...</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center pt-24 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">Something went wrong</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="w-full py-2 rounded-lg bg-teal-700 text-white font-semibold">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (totalExams === 0) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center pt-24 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm w-full">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-slate-700 mb-2">No Progress Yet</h2>
          <p className="text-slate-500 text-sm mb-6">
            Complete an exam first to see your progress report here.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pt-24 pb-12 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-700">Your Progress</h1>
            <p className="text-slate-500 text-sm mt-1">All your exam results with date, newest first</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="hidden sm:inline text-sm text-teal-700 font-semibold hover:underline"
          >
            ← Dashboard
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Exams', value: totalExams, icon: '🗂️', color: 'bg-indigo-50 text-indigo-700' },
            { label: 'Avg. Marks', value: avgMarks, icon: '📈', color: 'bg-teal-50 text-teal-700' },
            { label: 'Best Score', value: bestMarks, icon: '🏆', color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Passed', value: `${passCount}/${totalExams}`, icon: '✅', color: 'bg-green-50 text-green-700' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`rounded-xl shadow p-4 text-center border border-gray-100 ${color}`}>
              <div className="text-2xl mb-1">{icon}</div>
              <p className="text-xs font-medium uppercase tracking-wide opacity-70 mb-1">{label}</p>
              <p className="text-xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* Results list */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-700 border-b pb-2">Exam History</h2>

          {results.map((r, idx) => {
            const colors = gradeColor(r.grade);
            const total = toNumber(r.maxMarks) || toNumber(r.totalQuestions) || 0;
            const marks = toNumber(r.marks);
            const pct = total > 0 ? Math.round((marks / total) * 100) : 0;
            const skipped = toNumber(r.unattempt ?? r.unattempted);
            const isLatest = idx === 0;

            return (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:shadow-md transition-shadow"
              >
                {/* Top row: date + grade badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-700">
                        📅 {formatDate(r.takenAt)}
                      </p>
                      {isLatest && (
                        <span className="text-xs font-semibold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                          Latest
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Level: {levelLabel(r.level)} &nbsp;|&nbsp; {r.paperName || 'Standard Exam'}
                    </p>
                  </div>
                  <span className={`text-white text-sm font-bold px-3 py-1 rounded-full flex-shrink-0 ${colors.badge}`}>
                    {r.grade}
                  </span>
                </div>

                {/* Score + progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span className="font-medium text-slate-600">
                    Score: {marks}/{total > 0 ? total : '?'}
                  </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${colors.badge}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {[
                    { label: 'Correct', value: toNumber(r.correct), color: 'text-green-600' },
                    { label: 'Wrong', value: toNumber(r.wrong), color: 'text-red-500' },
                    { label: 'Attempted', value: toNumber(r.attempt), color: 'text-blue-600' },
                    { label: 'Skipped', value: skipped, color: 'text-gray-500' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-gray-50 rounded-lg py-1.5">
                      <p className={`font-bold text-base ${color}`}>{value}</p>
                      <p className="text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Category breakdown */}
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-4 gap-2 text-center text-xs text-slate-500">
                  {[
                    { label: 'Numerical', value: r.numerical ?? 0 },
                    { label: 'Verbal', value: r.varbal ?? r.verbal ?? 0 },
                    { label: 'Reasoning', value: r.reasoning ?? 0 },
                    { label: 'General', value: r.genaral ?? r.general ?? 0 },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="font-semibold text-slate-600">{value ?? 0}</p>
                      <p>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/result')}
            className="px-6 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold transition-colors"
          >
            View Last Result
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 rounded-lg border-2 border-teal-700 text-teal-700 hover:bg-teal-50 font-semibold transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default Progressboard;
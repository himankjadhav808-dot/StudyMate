import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppContext from '../contexts/AppContext';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, BarElement, ArcElement,
  CategoryScale, LinearScale, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Title, Tooltip, Legend, Filler);

// ── Grade colour helper ───────────────────────────────────────────────────────
const gradeColor = (grade) => {
  const g = (grade || '').toUpperCase();
  if (g === 'A+' || g === 'A') return 'text-green-600';
  if (g === 'B') return 'text-blue-600';
  if (g === 'C') return 'text-yellow-600';
  return 'text-red-500';
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

function Result() {
  const { report, setReport } = useContext(AppContext);
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_URL;

  // ── Fetch last result from server on mount (handles page refresh) ──────────
  useEffect(() => {
    if (!report) {
      fetch(`${BASE_URL}/exam/results`, { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.results?.length > 0) {
            setReport(data.results[0]); // newest first
          }
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── No result yet ──────────────────────────────────────────────────────────
  if (!report) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center pt-24 px-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm w-full">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-slate-700 mb-2">No Result Yet</h2>
          <p className="text-slate-500 text-sm mb-6">
            You haven&apos;t taken any exam yet. Complete an exam to see your result here.
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

  const marks = toNumber(report.marks);
  const grade = report.grade;
  const correct = toNumber(report.correct);
  const wrong = toNumber(report.wrong);
  const attempt = toNumber(report.attempt);
  const unattempt = toNumber(report.unattempt ?? report.unattempted);
  const numerical = toNumber(report.numerical);
  const verbal = toNumber(report.varbal ?? report.verbal);
  const reasoning = toNumber(report.reasoning);
  const general = toNumber(report.genaral ?? report.general);
  const takenAt = report.takenAt;
  const total = toNumber(report.maxMarks || report.totalQuestions) || 50;
  const percentage = total ? Math.round((marks / total) * 100) : 0;
  const hasCategoryData = numerical + verbal + reasoning + general > 0;

  const barData = {
    labels: ['Correct', 'Wrong', 'Attempted', 'Unattempted'],
    datasets: [{
      label: 'Questions',
      data: [correct, wrong, attempt, unattempt],
      backgroundColor: ['rgba(34,197,94,0.7)', 'rgba(239,68,68,0.7)', 'rgba(59,130,246,0.7)', 'rgba(156,163,175,0.7)'],
      borderRadius: 6,
    }],
  };

  const doughnutData = {
    labels: ['Numerical', 'Verbal', 'Reasoning', 'General'],
    datasets: [{
      data: [numerical, verbal, reasoning, general],
      backgroundColor: ['#059bff', '#ffc846', '#eb4034', '#fe6434'],
      borderWidth: 2,
    }],
  };

  const chartOptions = { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } };

  return (
    <div className="w-full min-h-screen pt-24 pb-12 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-700">Your Last Exam Result</h1>
          <p className="text-slate-500 text-sm mt-1">Showing only your latest exam result.</p>
          {takenAt && (
            <p className="text-slate-500 text-sm mt-1">
              📅 Taken on{' '}
              {new Date(takenAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Score', value: `${marks} / ${total}`, color: 'bg-teal-50 text-teal-700' },
            { label: 'Grade', value: grade, color: `bg-white ${gradeColor(grade)}` },
            { label: 'Percentage', value: `${percentage}%`, color: 'bg-blue-50 text-blue-700' },
            { label: 'Correct', value: correct, color: 'bg-green-50 text-green-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl shadow p-4 text-center ${color} border border-gray-100`}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* Attempt breakdown */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Attempted', value: attempt, bg: 'bg-blue-100 text-blue-700' },
            { label: 'Wrong', value: wrong, bg: 'bg-red-100 text-red-700' },
            { label: 'Unattempted', value: unattempt, bg: 'bg-gray-100 text-gray-600' },
          ].map(({ label, value, bg }) => (
            <div key={label} className={`rounded-xl p-4 text-center ${bg}`}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-slate-700 mb-4 text-center">Question Breakdown</h3>
            <Bar data={barData} options={chartOptions} />
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-slate-700 mb-4 text-center">Category-wise Marks</h3>
            {hasCategoryData ? (
              <Doughnut data={doughnutData} options={chartOptions} />
            ) : (
              <div className="flex h-64 items-center justify-center text-slate-500 text-sm bg-slate-50 rounded-lg">
                No category marks to display yet.
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/result/progressboard')}
            className="px-6 py-2 rounded-lg border-2 border-teal-700 text-teal-700 hover:bg-teal-50 font-semibold transition-colors"
          >
            View All Results
          </button>
        </div>
      </div>
    </div>
  );
}

export default Result;

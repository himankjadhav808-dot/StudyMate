import { useState, useEffect, useContext } from 'react';
import AppContext from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

// ── Tab IDs ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',   label: '📊 Overview'    },
  { id: 'approvals',  label: '✅ Approvals'   },
  { id: 'users',      label: '👥 Users'       },
  { id: 'leaderboard',label: '🏆 Leaderboard' },
  { id: 'questions',  label: '📝 Questions'   },
];

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border-l-4 ${color} p-5 flex items-center gap-4`}>
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ───────────────────────────────────────────────────────
const AdminApprovalDashboard = () => {
  const { email, role } = useContext(AppContext);
  const navigate = useNavigate();
  const isSuperAdmin = email === 'studymate809@gmail.com';

  const [activeTab, setActiveTab] = useState('overview');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [leaderboard, setLeaderboard]         = useState([]);
  const [users, setUsers]                     = useState([]);
  const [questions, setQuestions]             = useState({ aptitude: [], reasoning: [], general: [] });
  const [sessions, setSessions]               = useState([]);
  const [expandedSessions, setExpandedSessions] = useState([]);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editForm, setEditForm]               = useState({ paperCode: '', paperName: '', level: '', timeLimit: '' });
  const [sessionActionLoading, setSessionActionLoading] = useState(false);
  const [topN, setTopN]                       = useState(5);
  const [shareEmail, setShareEmail]           = useState('');
  const [loading, setLoading]                 = useState(true);
  const [toast, setToast]                     = useState('');

  const BASE = import.meta.env.VITE_API_URL;

  // Guard — only admin can be here
  useEffect(() => {
    if (role !== 'admin') navigate('/dashboard');
  }, [role, navigate]);

  // Load all data in parallel
  useEffect(() => {
    const load = async () => {
      try {
        const [prRes, lbRes, uRes, qRes, sRes] = await Promise.all([
          fetch(`${BASE}/api/admin/requests`,    { credentials: 'include' }),
          fetch(`${BASE}/api/admin/leaderboard`, { credentials: 'include' }),
          fetch(`${BASE}/api/admin/users`,       { credentials: 'include' }),
          fetch(`${BASE}/api/admin/questions`,   { credentials: 'include' }),
          fetch(`${BASE}/api/admin/sessions`,    { credentials: 'include' }),
        ]);
        const [pr, lb, us, qs, ss] = await Promise.all([
          prRes.json(), lbRes.json(), uRes.json(), qRes.json(), sRes.json(),
        ]);
        if (pr.success) setPendingRequests(pr.requests);
        if (lb.success) setLeaderboard(lb.leaderboard);
        if (us.success) setUsers(us.users);
        if (qs.success) setQuestions(qs.questions);
        if (ss.success) setSessions(ss.sessions || []);
      } catch (err) {
        console.error('Admin load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [BASE]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const toggleSessionView = (sessionId) => {
    setExpandedSessions((prev) =>
      prev.includes(sessionId) ? prev.filter(id => id !== sessionId) : [...prev, sessionId]
    );
  };

  const openSessionEditor = (session) => {
    setEditingSessionId(session._id);
    setEditForm({
      paperCode: session.paperCode || '',
      paperName: session.paperName || '',
      level: session.level || '',
      timeLimit: session.timeLimit ? session.timeLimit / 60 : '',
    });
    setExpandedSessions((prev) => prev.includes(session._id) ? prev : [...prev, session._id]);
  };

  const closeSessionEditor = () => {
    setEditingSessionId(null);
    setEditForm({ paperCode: '', paperName: '', level: '', timeLimit: '' });
  };

  const handleEditSessionChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveSessionEdit = async (sessionId) => {
    setSessionActionLoading(true);
    try {
      const res = await fetch(`${BASE}/api/admin/sessions/${sessionId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.map((session) => session._id === sessionId ? data.session : session));
        showToast('Session updated successfully');
        closeSessionEditor();
      } else {
        showToast('❌ ' + (data.message || 'Unable to update session')); 
      }
    } catch (err) {
      console.error('Session update error:', err);
      showToast('❌ Network error while updating session');
    } finally {
      setSessionActionLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Delete this session permanently?')) return;
    setSessionActionLoading(true);
    try {
      const res = await fetch(`${BASE}/api/admin/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.filter((session) => session._id !== sessionId));
        showToast('Session deleted successfully');
      } else {
        showToast('❌ ' + (data.message || 'Unable to delete session'));
      }
    } catch (err) {
      console.error('Session delete error:', err);
      showToast('❌ Network error while deleting session');
    } finally {
      setSessionActionLoading(false);
    }
  };

  const handleToggleBlock = async (userId, blocked) => {
    try {
      const action = blocked ? 'unblock' : 'block';
      const res = await fetch(`${BASE}/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((user) => user._id === userId ? { ...user, blocked: !blocked } : user));
        showToast(data.message);
      } else {
        showToast('❌ ' + (data.message || 'Unable to update user status'));
      }
    } catch (err) {
      console.error('Block toggle error:', err);
      showToast('❌ Network error while updating user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      const res = await fetch(`${BASE}/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((user) => user._id !== userId));
        showToast('User deleted successfully');
      } else {
        showToast('❌ ' + (data.message || 'Unable to delete user'));
      }
    } catch (err) {
      console.error('User delete error:', err);
      showToast('❌ Network error while deleting user');
    }
  };

  const handleApprove = async (userId) => {
    try {
      const res  = await fetch(`${BASE}/api/admin/approve/${userId}`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setPendingRequests(p => p.filter(r => r._id !== userId));
        showToast('✅ Admin approved successfully!');
      } else showToast('❌ ' + (data.message || 'Error approving admin'));
    } catch { showToast('❌ Network error'); }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Reject this admin request?')) return;
    try {
      const res  = await fetch(`${BASE}/api/admin/reject/${userId}`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setPendingRequests(p => p.filter(r => r._id !== userId));
        showToast('🗑️ Request rejected');
      } else showToast('❌ ' + (data.message || 'Error'));
    } catch { showToast('❌ Network error'); }
  };

  const handleShare = async () => {
    if (!shareEmail) return showToast('❌ Enter recipient email first');
    try {
      const res  = await fetch(`${BASE}/api/admin/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topN, email: shareEmail }),
      });
      const data = await res.json();
      showToast(data.success ? '✅ ' + data.message : '❌ ' + data.message);
    } catch { showToast('❌ Network error'); }
  };

  const verifiedUsers    = users.filter(u => u.verified);
  const totalExams       = users.reduce((acc, u) => acc + (u.results?.length || 0), 0);
  const totalQuestions   = (questions.aptitude?.length || 0) + (questions.reasoning?.length || 0) + (questions.general?.length || 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading Admin Dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-gray-800 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-bounce">
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Logged in as <span className="font-semibold text-teal-700">{email}</span></p>
          </div>
          {pendingRequests.length > 0 && (
            <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
              {pendingRequests.length} Pending
            </span>
          )}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 flex-wrap mb-8 border-b border-gray-200 pb-2">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === t.id
                  ? 'bg-teal-700 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-teal-50 hover:text-teal-700 border border-gray-200'
              }`}
            >
              {t.label}
              {t.id === 'approvals' && pendingRequests.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5">{pendingRequests.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW TAB ════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard icon="👥" label="Total Users"        value={users.length}        color="border-teal-500"  />
            <StatCard icon="✅" label="Verified Users"     value={verifiedUsers.length} color="border-green-500" />
            <StatCard icon="📝" label="Total Exams Taken"  value={totalExams}           color="border-blue-500"  />
            <StatCard icon="⏳" label="Pending Approvals"  value={pendingRequests.length} color="border-orange-500"/>
            <StatCard icon="🏅" label="Top Score"          value={leaderboard[0]?.maxMarks ?? 0} color="border-yellow-500"/>
          </div>
        )}

        {/* ══ APPROVALS TAB ═══════════════════════════════════════════════════ */}
        {activeTab === 'approvals' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Pending Admin Requests</h2>
            {pendingRequests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <p className="text-gray-500 text-lg font-medium">No pending requests</p>
                <p className="text-gray-400 text-sm mt-1">All admin requests have been reviewed.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-teal-600 text-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Requested At</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-800">{req.fname} {req.lname}</td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{req.email}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{new Date(req.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-center space-x-2">
                          <button onClick={() => handleApprove(req._id)}
                            className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors">
                            Approve
                          </button>
                          <button onClick={() => handleReject(req._id)}
                            className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors">
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ USERS TAB ═══════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">All Users <span className="text-gray-400 text-base font-normal">({users.length})</span></h2>
            <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">#</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold">Verified</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold">Role</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold">Exams</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u, i) => (
                    <tr key={u._id || i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-gray-400 text-sm">{i + 1}</td>
                      <td className="px-6 py-3 font-medium text-gray-800">{u.fname} {u.lname}</td>
                      <td className="px-6 py-3 text-gray-600 text-sm">{u.email}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.verified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {u.verified ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'admin_pending' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center text-gray-600 text-sm">{u.results?.length || 0}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {u.blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center space-x-2">
                        {isSuperAdmin ? (
                          u.email === 'studymate809@gmail.com' ? (
                            <span className="text-xs font-semibold text-slate-500">Super Admin</span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleToggleBlock(u._id, u.blocked)}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${u.blocked ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
                              >
                                {u.blocked ? 'Unblock' : 'Block'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u._id)}
                                className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900"
                              >
                                Delete
                              </button>
                            </>
                          )
                        ) : (
                          <span className="text-xs text-gray-500">No actions</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-sm">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ LEADERBOARD TAB ═════════════════════════════════════════════════ */}
        {activeTab === 'leaderboard' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-gray-800">🏆 Leaderboard</h2>
              {/* Share controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={topN}
                  onChange={e => setTopN(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                </select>
                <input
                  type="email"
                  placeholder="Recipient email"
                  value={shareEmail}
                  onChange={e => setShareEmail(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-52"
                />
                <button onClick={handleShare}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg transition-colors">
                  Share via Email
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-yellow-500 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Rank</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold">Best Score</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold">Exams</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaderboard.map((u, i) => (
                    <tr key={i} className={`hover:bg-yellow-50 transition-colors ${i < 3 ? 'font-semibold' : ''}`}>
                      <td className="px-6 py-3 text-lg">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </td>
                      <td className="px-6 py-3 text-gray-800">{u.name}</td>
                      <td className="px-6 py-3 text-gray-600 text-sm">{u.email}</td>
                      <td className="px-6 py-3 text-center">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-sm font-bold">{u.maxMarks}</span>
                      </td>
                      <td className="px-6 py-3 text-center text-gray-600 text-sm">{u.exams}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ QUESTIONS TAB ═══════════════════════════════════════════════════ */}
        {activeTab === 'questions' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Question Sessions</h2>
                <p className="text-gray-500 text-sm mt-1">Manage all admin-created sessions in one place.</p>
              </div>
              <button
                onClick={() => window.location.assign('/upload')}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
              >
                Create New Session
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm p-12 text-center border border-dashed border-gray-300">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-lg font-semibold text-gray-700">No sessions created yet.</p>
                <p className="text-gray-500 mt-2">Use the button above to create a new question session.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sessions.map((session) => {
                  const isExpanded = expandedSessions.includes(session._id);
                  const isEditing = editingSessionId === session._id;
                  const questionCount = session.questionSet?.length ?? session.totalQuestions ?? 0;

                  return (
                    <div key={session._id} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="px-6 py-5 md:px-8 md:py-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-teal-700 uppercase tracking-wide">Session</p>
                          <h3 className="text-2xl font-semibold text-gray-900 truncate">{session.paperName || 'Untitled Session'}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Created {new Date(session.createdAt).toLocaleDateString()} · {questionCount} questions
                          </p>
                          <p className="text-sm text-gray-500 mt-1">Code: <span className="font-medium text-gray-800">{session.paperCode || 'N/A'}</span></p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => toggleSessionView(session._id)}
                            className="px-4 py-2 bg-slate-100 text-slate-800 rounded-2xl hover:bg-slate-200 transition"
                          >
                            {isExpanded ? 'Hide Session' : 'View Session'}
                          </button>
                          {email === 'studymate809@gmail.com' && (
                            <>
                              <button
                                onClick={() => openSessionEditor(session)}
                                className="px-4 py-2 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 transition"
                              >
                                Edit Session
                              </button>
                              <button
                                onClick={() => handleDeleteSession(session._id)}
                                disabled={sessionActionLoading}
                                className="px-4 py-2 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition disabled:opacity-50"
                              >
                                Delete Session
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="border-t border-gray-200 bg-slate-50 px-6 py-5 md:px-8 md:py-6">
                          <h4 className="text-lg font-semibold text-gray-800 mb-3">Edit session details</h4>
                          <div className="grid gap-4 lg:grid-cols-4">
                            <input
                              type="text"
                              value={editForm.paperCode}
                              onChange={(e) => handleEditSessionChange('paperCode', e.target.value)}
                              placeholder="Session Code"
                              className="input-field"
                            />
                            <input
                              type="text"
                              value={editForm.paperName}
                              onChange={(e) => handleEditSessionChange('paperName', e.target.value)}
                              placeholder="Session Name"
                              className="input-field"
                            />
                            <input
                              type="text"
                              value={editForm.level}
                              onChange={(e) => handleEditSessionChange('level', e.target.value)}
                              placeholder="Level"
                              className="input-field"
                            />
                            <input
                              type="number"
                              min="1"
                              value={editForm.timeLimit}
                              onChange={(e) => handleEditSessionChange('timeLimit', e.target.value)}
                              placeholder="Time limit (minutes)"
                              className="input-field"
                            />
                          </div>
                          <div className="flex flex-wrap gap-3 mt-4">
                            <button
                              onClick={() => saveSessionEdit(session._id)}
                              disabled={sessionActionLoading}
                              className="px-5 py-2 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 transition disabled:opacity-50"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={closeSessionEditor}
                              className="px-5 py-2 bg-white text-slate-700 border border-slate-300 rounded-2xl hover:bg-slate-100 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-slate-50 px-6 py-5 md:px-8 md:py-6">
                          <div className="grid gap-4 lg:grid-cols-4 mb-6">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500">Level</p>
                              <p className="mt-1 font-medium text-gray-800">{session.level || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500">Join Code</p>
                              <p className="mt-1 font-medium text-gray-800">{session.paperCode || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500">Time Limit</p>
                              <p className="mt-1 font-medium text-gray-800">{session.timeLimit ? `${Math.round(session.timeLimit / 60)} min` : 'Not set'}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500">Created</p>
                              <p className="mt-1 font-medium text-gray-800">{new Date(session.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-slate-100">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">#</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Question</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Answer</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Topic</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 bg-white">
                                {session.questionSet?.map((question, idx) => (
                                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                    <td className="px-4 py-3 text-sm text-gray-600">{question.questionNo || idx + 1}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{question.questionBody}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-teal-700">{question.answer}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{question.belongsTo || 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApprovalDashboard;

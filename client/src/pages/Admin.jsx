import { useState, useEffect, useContext } from 'react';
import AppContext from '../contexts/AppContext';

const Admin = () => {
  const { isVerified, role, isAdmin, email, token } = useContext(AppContext);
  const isSuperAdmin = email === 'studymate809@gmail.com';
  const [leaderboard, setLeaderboard] = useState([]);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState({ aptitude: [], reasoning: [], general: [] });
  const [sessions, setSessions] = useState([]);
  const [expandedSessions, setExpandedSessions] = useState([]);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editForm, setEditForm] = useState({ paperCode: '', paperName: '', level: '', timeLimit: '' });
  const [sessionActionLoading, setSessionActionLoading] = useState(false);
  const [topN, setTopN] = useState(5);
  const [shareEmail, setShareEmail] = useState('');
  const [contacts, setContacts] = useState([]);
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserActivity, setSelectedUserActivity] = useState(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState(null);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);

  // ── Session Results ────────────────────────────────────────────────────────
  // Map of sessionCode -> { loading, data, error }
  const [sessionResults, setSessionResults] = useState({});
  const [openResultSessionId, setOpenResultSessionId] = useState(null);

  useEffect(() => {
    if (!isVerified || !isAdmin) return;
    fetchData();
  }, [isVerified, isAdmin]);

  const fetchData = async () => {
    const safeJson = async (res) => {
      try { return await res.json(); } catch { return {}; }
    };
    const authHeaders = {
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    };
    try {
      const [lbRes, userRes, qRes, sRes, cRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/leaderboard`, authHeaders),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, authHeaders),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/questions`, authHeaders),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/sessions`, authHeaders),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/contacts`, authHeaders),
      ]);
      const [lb, us, qs, ss, cs] = await Promise.all([
        safeJson(lbRes),
        safeJson(userRes),
        safeJson(qRes),
        safeJson(sRes),
        safeJson(cRes),
      ]);
      if (lb.success) setLeaderboard(lb.leaderboard);
      if (us.success) setUsers(us.users);
      if (qs.success) setQuestions(qs.questions);
      if (ss.success) setSessions(ss.sessions || []);
      if (cs.success) setContacts(cs.contacts || []);
      else console.warn('Contacts fetch failed:', cs);
    } catch (err) {
      console.error('fetchData error:', err);
    }
  };

  const toggleSessionView = (sessionId) => {
    setExpandedSessions((prev) =>
      prev.includes(sessionId) ? prev.filter(id => id !== sessionId) : [...prev, sessionId]
    );
  };

  /** Fetch students who completed a specific session */
  const fetchSessionResults = async (session) => {
    const sessionCode = session.sessionCode;
    if (!sessionCode) return;

    // Toggle off if already open
    if (openResultSessionId === session._id) {
      setOpenResultSessionId(null);
      return;
    }

    setOpenResultSessionId(session._id);
    setSessionResults((prev) => ({ ...prev, [sessionCode]: { loading: true, data: null, error: null } }));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/sessions/${sessionCode}/results`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setSessionResults((prev) => ({ ...prev, [sessionCode]: { loading: false, data, error: null } }));
      } else {
        setSessionResults((prev) => ({ ...prev, [sessionCode]: { loading: false, data: null, error: data.message || 'Failed to load results.' } }));
      }
    } catch (err) {
      setSessionResults((prev) => ({ ...prev, [sessionCode]: { loading: false, data: null, error: 'Network error.' } }));
    }
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/sessions/${sessionId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.map((session) => session._id === sessionId ? data.session : session));
        alert('Session updated successfully');
        closeSessionEditor();
      } else {
        alert('Error: ' + (data.message || 'Unable to update session'));
      }
    } catch (err) {
      console.error('Session update error:', err);
      alert('Network error while updating session');
    } finally {
      setSessionActionLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Delete this session permanently?')) return;
    setSessionActionLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.filter((session) => session._id !== sessionId));
        alert('Session deleted successfully');
      } else {
        alert('Error: ' + (data.message || 'Unable to delete session'));
      }
    } catch (err) {
      console.error('Session delete error:', err);
      alert('Network error while deleting session');
    } finally {
      setSessionActionLoading(false);
    }
  };

  const handleToggleBlock = async (userId, blocked) => {
    try {
      const action = blocked ? 'unblock' : 'block';
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((user) => user._id === userId ? { ...user, blocked: !blocked } : user));
        alert(data.message);
      } else {
        alert('Error: ' + (data.message || 'Unable to update user status'));
      }
    } catch (err) {
      console.error('Block toggle error:', err);
      alert('Network error while updating user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((user) => user._id !== userId));
        alert('User deleted successfully');
      } else {
        alert('Error: ' + (data.message || 'Unable to delete user'));
      }
    } catch (err) {
      console.error('User delete error:', err);
      alert('Network error while deleting user');
    }
  };

  const handleShare = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topN, email: shareEmail })
      });
      const data = await res.json();
      alert(data.message);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateContactStatus = async (contactId, status) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setContacts((prev) => prev.map((item) => item._id === contactId ? data.contact : item));
      } else {
        alert(data.message || 'Unable to update contact status');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while updating contact status');
    }
  };

  const fetchUserActivity = async (userEmail) => {
    try {
      const user = users.find(u => u.email === userEmail);
      if (!user) return;
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${user._id}/results`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setSelectedUserActivity({ ...data.user, results: data.results });
        setActivityModalOpen(true);
      } else {
        alert('Error fetching user activity: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error fetching user activity:', err);
      alert('Network error while fetching user activity.');
    }
  };

  const fetchLeaderboardUserBestTest = async (userEmail) => {
    try {
      const user = users.find(u => u.email === userEmail);
      if (!user) return;
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${user._id}/results`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        const results = data.results;
        if (results && results.length > 0) {
          const bestResult = results.reduce((best, current) => 
            (current.marks || 0) > (best.marks || 0) ? current : best
          );
          await fetchQuestionSet(bestResult.paperCode);
        } else {
          alert('This user has no test results yet.');
        }
      } else {
        alert('Error fetching user results: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error fetching user results:', err);
      alert('Network error while fetching user results.');
    }
  };

  const fetchQuestionSet = async (paperCode) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/questions/${paperCode}`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setSelectedQuestionSet(data.questionSet);
        setQuestionModalOpen(true);
      } else {
        alert('Error fetching question set: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error fetching question set:', err);
      alert('Network error while fetching question set.');
    }
  };

  const aptitudeCount = questions.aptitude ? questions.aptitude.length : 0;
  const reasoningCount = questions.reasoning ? questions.reasoning.length : 0;
  const generalCount = questions.general ? questions.general.length : 0;

  if (!isVerified || !isAdmin) return <div>Access denied.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Admin Panel</h1>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('leaderboard')} 
            className={`px-6 py-3 font-semibold rounded-t-lg transition-all duration-300 ${
              activeTab === 'leaderboard'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📊 Leaderboard
          </button>
          <button 
            onClick={() => setActiveTab('users')} 
            className={`px-6 py-3 font-semibold rounded-t-lg transition-all duration-300 ${
              activeTab === 'users'
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            👥 Users
          </button>
          <button 
            onClick={() => setActiveTab('contacts')} 
            className={`px-6 py-3 font-semibold rounded-t-lg transition-all duration-300 ${
              activeTab === 'contacts'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            ✉️ Contacts
          </button>
          <button 
            onClick={() => setActiveTab('questions')} 
            className={`px-6 py-3 font-semibold rounded-t-lg transition-all duration-300 ${
              activeTab === 'questions'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            ❓ Questions
          </button>
        </div>

      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-lg shadow-lg p-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">🏆 Leaderboard</h2>
            <input 
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50 border-b-2 border-blue-500">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-12">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Max Marks</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Exams</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard
                  .filter(user => 
                    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((user, i) => (
                  <tr 
                    key={i}
                    onClick={() => fetchUserActivity(user.email)}
                    className={`border-b transition-colors duration-200 cursor-pointer ${
                      i % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-100'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-bold text-blue-600">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i+1}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-center font-semibold text-green-600">{user.maxMarks}</td>
                    <td className="px-6 py-4 text-sm text-center font-semibold text-blue-600">{user.exams}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Share Section */}
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📧 Share Leaderboard</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <select 
                value={topN} 
                onChange={(e) => setTopN(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
              </select>
              <input 
                type="email" 
                placeholder="Recipient Email" 
                value={shareEmail} 
                onChange={(e) => setShareEmail(e.target.value)} 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button 
                onClick={handleShare} 
                className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors duration-300 shadow-md hover:shadow-lg whitespace-nowrap"
              >
                📤 Share
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow-lg p-6 overflow-hidden">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">👥 Users Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-green-50 border-b-2 border-green-500">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Verified</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Admin</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr 
                    key={i}
                    className={`border-b transition-colors duration-200 ${
                      i % 2 === 0 ? 'bg-white hover:bg-green-50' : 'bg-gray-50 hover:bg-green-100'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{user.fname} {user.lname}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.verified 
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-yellow-200 text-yellow-800'
                      }`}>
                        {user.verified ? '✓ Yes' : '⏳ No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin' 
                          ? 'bg-blue-200 text-blue-800' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? '👑 Admin' : user.role === 'admin_pending' ? 'Pending' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.blocked ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                      }`}>
                        {user.blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      {isSuperAdmin ? (
                        user.email === 'studymate809@gmail.com' ? (
                          <span className="text-xs text-slate-500 font-semibold">Super Admin</span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleToggleBlock(user._id, user.blocked)}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                                user.blocked ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'
                              }`}
                            >
                              {user.blocked ? 'Unblock' : 'Block'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
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
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="bg-white rounded-lg shadow-lg p-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">✉️ Contact Messages</h2>
              <p className="text-gray-600 text-sm mt-1">View user-submitted messages and update their status.</p>
            </div>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition"
            >
              🔄 Refresh
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="bg-orange-50 rounded-3xl p-12 text-center border border-orange-200">
              <p className="text-xl font-semibold text-orange-700">No contact messages yet.</p>
              <p className="text-gray-600 mt-2">Messages from users will appear here once submitted.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-orange-50 border-b-2 border-orange-500">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">From</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Subject</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Message</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Created</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact, idx) => (
                    <tr
                      key={contact._id}
                      className={`border-b transition-colors duration-200 ${idx % 2 === 0 ? 'bg-white hover:bg-orange-50' : 'bg-gray-50 hover:bg-orange-100'}`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{contact.name || contact.sender}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{contact.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{contact.subject}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xl break-words">{contact.message}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          contact.status === 'resolved' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          {contact.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(contact.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button
                          onClick={() => handleUpdateContactStatus(contact._id, contact.status === 'resolved' ? 'reviewed' : 'resolved')}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                            contact.status === 'resolved' ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {contact.status === 'resolved' ? 'Mark Reviewed' : 'Mark Resolved'}
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

      {activeTab === 'questions' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Question Sessions</h2>
              <p className="text-gray-600 text-sm mt-1">Manage all admin-created sessions</p>
            </div>
            <button
              onClick={() => window.location.assign('/upload')}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              Create New Session
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl shadow-sm p-12 text-center border border-dashed border-purple-300">
              <div className="text-4xl mb-4">🎓</div>
              <p className="text-lg font-semibold text-gray-700">No sessions created yet.</p>
              <p className="text-gray-600 mt-2">Use the button above to create a new question session.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sessions.map((session) => {
                const isExpanded = expandedSessions.includes(session._id);
                const isEditing = editingSessionId === session._id;
                const questionCount = session.questionSet?.length ?? session.totalQuestions ?? 0;

                return (
                  <div key={session._id} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-5 md:px-8 md:py-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4 bg-gradient-to-r from-purple-50 to-white">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Session</p>
                        <h3 className="text-2xl font-semibold text-gray-900 truncate">{session.paperName || 'Untitled Session'}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Created {new Date(session.createdAt).toLocaleDateString()} · {questionCount} questions
                        </p>
                        <div className="flex flex-wrap gap-4 mt-2">
                          <span className="text-sm text-gray-600">
                            Paper Code: <span className="font-semibold text-gray-800">{session.paperCode || 'N/A'}</span>
                          </span>
                          {session.sessionCode && (
                            <span className="inline-flex items-center gap-1.5 text-sm">
                              <span className="text-gray-600">Join Code:</span>
                              <span className="font-mono font-bold tracking-widest text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                                {session.sessionCode}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => toggleSessionView(session._id)}
                          className="px-4 py-2 bg-slate-100 text-slate-800 rounded-2xl hover:bg-slate-200 transition text-sm font-medium"
                        >
                          {isExpanded ? 'Hide Questions' : 'View Questions'}
                        </button>
                        {session.sessionCode && (
                          <button
                            onClick={() => fetchSessionResults(session)}
                            className={`px-4 py-2 rounded-2xl transition text-sm font-medium ${
                              openResultSessionId === session._id
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                            }`}
                          >
                            {openResultSessionId === session._id ? 'Hide Results' : '👥 View Results'}
                          </button>
                        )}
                        {email === 'studymate809@gmail.com' && (
                          <>
                            <button
                              onClick={() => openSessionEditor(session)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSession(session._id)}
                              disabled={sessionActionLoading}
                              className="px-4 py-2 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition text-sm font-medium disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ── Student Results Panel ─────────────────────────────── */}
                    {openResultSessionId === session._id && (() => {
                      const rc = sessionResults[session.sessionCode];
                      return (
                        <div className="border-t border-indigo-100 bg-indigo-50 px-6 py-5 md:px-8 md:py-6">
                          <h4 className="text-lg font-bold text-indigo-800 mb-4">👥 Students Who Completed This Test</h4>
                          {!rc || rc.loading ? (
                            <div className="flex items-center gap-3 text-indigo-600">
                              <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                              <span className="text-sm">Loading results…</span>
                            </div>
                          ) : rc.error ? (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
                              ⚠️ {rc.error}
                            </div>
                          ) : rc.data?.students?.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-indigo-300 p-8 text-center">
                              <div className="text-3xl mb-2">📭</div>
                              <p className="text-indigo-700 font-semibold">No students have completed this test yet.</p>
                              <p className="text-sm text-gray-500 mt-1">Share the join code <span className="font-mono font-bold text-teal-700">{session.sessionCode}</span> with your students.</p>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-indigo-600 mb-3 font-medium">
                                {rc.data.totalCompleted} student{rc.data.totalCompleted !== 1 ? 's' : ''} completed this test
                              </p>
                              <div className="overflow-x-auto rounded-2xl border border-indigo-100 bg-white">
                                <table className="min-w-full divide-y divide-gray-100">
                                  <thead className="bg-indigo-600 text-white">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">#</th>
                                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Name</th>
                                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Email</th>
                                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">Score</th>
                                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">Correct</th>
                                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">Wrong</th>
                                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">Grade</th>
                                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Taken At</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {rc.data.students.map((student, idx) => (
                                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-indigo-50' : 'bg-indigo-50/50 hover:bg-indigo-100/60'}>
                                        <td className="px-4 py-3 text-sm font-bold text-indigo-500">{idx + 1}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{student.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                                        <td className="px-4 py-3 text-center">
                                          <span className="font-bold text-teal-700">{student.marks}</span>
                                          <span className="text-gray-400 text-xs">/{student.maxMarks}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">{student.correct}</td>
                                        <td className="px-4 py-3 text-center text-sm font-semibold text-red-500">{student.wrong}</td>
                                        <td className="px-4 py-3 text-center">
                                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            student.grade === 'A' || student.grade === 'A+'
                                              ? 'bg-green-100 text-green-700'
                                              : student.grade === 'B'
                                              ? 'bg-blue-100 text-blue-700'
                                              : student.grade === 'C'
                                              ? 'bg-yellow-100 text-yellow-700'
                                              : 'bg-red-100 text-red-700'
                                          }`}>{student.grade}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                          {student.takenAt ? new Date(student.takenAt).toLocaleString() : 'N/A'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}

                    {isEditing && (
                      <div className="border-t border-gray-200 bg-slate-50 px-6 py-5 md:px-8 md:py-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Edit session details</h4>
                        <div className="grid gap-4 lg:grid-cols-4">
                          <input
                            type="text"
                            value={editForm.paperCode}
                            onChange={(e) => handleEditSessionChange('paperCode', e.target.value)}
                            placeholder="Session Code"
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={editForm.paperName}
                            onChange={(e) => handleEditSessionChange('paperName', e.target.value)}
                            placeholder="Session Name"
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={editForm.level}
                            onChange={(e) => handleEditSessionChange('level', e.target.value)}
                            placeholder="Level"
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="number"
                            min="1"
                            value={editForm.timeLimit}
                            onChange={(e) => handleEditSessionChange('timeLimit', e.target.value)}
                            placeholder="Time limit (minutes)"
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex flex-wrap gap-3 mt-4">
                          <button
                            onClick={() => saveSessionEdit(session._id)}
                            disabled={sessionActionLoading}
                            className="px-5 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition disabled:opacity-50"
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
                            <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Level</p>
                            <p className="mt-1 font-medium text-gray-800">{session.level || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Join Code</p>
                            <p className="mt-1 font-medium text-gray-800">{session.paperCode || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Time Limit</p>
                            <p className="mt-1 font-medium text-gray-800">{session.timeLimit ? `${Math.round(session.timeLimit / 60)} min` : 'Not set'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Created</p>
                            <p className="mt-1 font-medium text-gray-800">{new Date(session.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-slate-100">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">#</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Question</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Answer</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Topic</th>
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

      {/* User Activity Modal */}
      {activityModalOpen && selectedUserActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">📊 User Activity</h3>
              <button
                onClick={() => setActivityModalOpen(false)}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">{selectedUserActivity.name}</h4>
                <p className="text-gray-600">{selectedUserActivity.email}</p>
              </div>
              
              {selectedUserActivity.results && selectedUserActivity.results.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Test Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Paper Code</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Score</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Max Marks</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Grade</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUserActivity.results
                        .sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt))
                        .map((result, i) => (
                        <tr 
                          key={i}
                          onClick={() => fetchQuestionSet(result.paperCode)}
                          className={`border-b transition-colors duration-200 cursor-pointer ${
                            i % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-100'
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">{result.paperName || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{result.paperCode || 'N/A'}</td>
                          <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">{result.marks || 0}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{result.maxMarks || 0}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              result.grade === 'A' || result.grade === 'A+' ? 'bg-green-200 text-green-800' :
                              result.grade === 'B' || result.grade === 'B+' ? 'bg-blue-200 text-blue-800' :
                              result.grade === 'C' || result.grade === 'C+' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-red-200 text-red-800'
                            }`}>
                              {result.grade || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {result.takenAt ? new Date(result.takenAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-600">No test results found for this user.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Test Questions Modal */}
      {questionModalOpen && selectedQuestionSet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">📝 Test Questions</h3>
                <p className="text-purple-100 text-sm">{selectedQuestionSet.paperName} ({selectedQuestionSet.paperCode})</p>
              </div>
              <button
                onClick={() => setQuestionModalOpen(false)}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-600">
                <span><strong>Total Questions:</strong> {selectedQuestionSet.questionSet?.length || 0}</span>
                <span><strong>Level:</strong> {selectedQuestionSet.level || 'N/A'}</span>
                <span><strong>Time Limit:</strong> {selectedQuestionSet.timeLimit ? `${Math.round(selectedQuestionSet.timeLimit / 60)} min` : 'N/A'}</span>
              </div>
              
              {selectedQuestionSet.questionSet && selectedQuestionSet.questionSet.length > 0 ? (
                <div className="space-y-6">
                  {selectedQuestionSet.questionSet.map((question, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">Q{i + 1}</span>
                        <p className="text-gray-800 font-medium flex-1">{question.questionBody}</p>
                      </div>
                      
                      {question.options && Object.keys(question.options).length > 0 && (
                        <div className="ml-8 space-y-2">
                          {Object.entries(question.options).map(([key, value]) => (
                            <div 
                              key={key}
                              className={`flex items-center gap-2 p-2 rounded ${
                                question.answer === value 
                                  ? 'bg-green-100 border border-green-300' 
                                  : 'bg-white border border-gray-200'
                              }`}
                            >
                              <span className="font-semibold text-gray-700 w-6">{key}.</span>
                              <span className={question.answer === value ? 'text-green-800 font-medium' : 'text-gray-700'}>
                                {value}
                                {question.answer === value && <span className="ml-2 text-green-600 text-sm font-bold">(✓ Correct)</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.marks && (
                        <div className="ml-8 mt-2 text-sm text-gray-500">
                          Marks: {question.marks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-600">No questions found for this test.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default Admin;
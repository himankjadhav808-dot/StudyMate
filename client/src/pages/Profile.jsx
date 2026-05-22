import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AppContext from '../contexts/AppContext';

function Profile() {
  const navigate = useNavigate();
  const { email, setEmail, setIsVerified, setIsAdmin, setRole, setUser } = useContext(AppContext);
  const [profile, setProfile] = useState({ fname: '', lname: '', email: '' });
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/login');
      return;
    }

    const loadProfile = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success) {
          setProfile({ fname: data.user.fname || '', lname: data.user.lname || '', email: data.user.email || '' });
        } else {
          setStatus(data.message || 'Unable to load profile.');
        }
      } catch (err) {
        console.error('Profile load error:', err);
        setStatus('Network error while loading profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [email, navigate]);

  const updateProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fname: profile.fname, lname: profile.lname, password: password || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('Profile updated successfully.');
        setUser(data.user.name);
      } else {
        setStatus(data.message || 'Unable to update profile.');
      }
    } catch (err) {
      console.error('Profile save error:', err);
      setStatus('Network error while saving profile.');
    } finally {
      setSaving(false);
      setPassword('');
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    setDeleting(true);
    setStatus('Deleting your account...');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        await fetch(`${import.meta.env.VITE_API_URL}/learner/logout`, { credentials: 'include' });
        setEmail('');
        setIsVerified(false);
        setIsAdmin(false);
        setRole('user');
        setUser('');
        navigate('/login');
      } else {
        setStatus(data.message || 'Unable to delete account.');
      }
    } catch (err) {
      console.error('Delete account error:', err);
      setStatus('Network error while deleting account.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
              <p className="text-sm text-slate-500 mt-2">
                Update your name, password, or delete your account permanently.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Logged in as</p>
              <p className="font-semibold text-slate-800">{email}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin h-10 w-10 rounded-full border-4 border-slate-300 border-t-teal-600" />
            </div>
          ) : (
            <form onSubmit={updateProfile} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  First Name
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={profile.fname}
                    onChange={(e) => setProfile((prev) => ({ ...prev, fname: e.target.value }))}
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Last Name
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={profile.lname}
                    onChange={(e) => setProfile((prev) => ({ ...prev, lname: e.target.value }))}
                    required
                  />
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">New Password</label>
                <input
                  type="password"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                />
                <p className="text-xs text-slate-500">Enter a new password only if you want to change it.</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"> 
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-2xl bg-teal-600 px-6 py-3 text-white font-semibold hover:bg-teal-700 transition disabled:opacity-70"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
                <button
                  type="button"
                  onClick={deleteAccount}
                  disabled={deleting}
                  className="inline-flex items-center justify-center rounded-2xl bg-red-500 px-6 py-3 text-white font-semibold hover:bg-red-600 transition disabled:opacity-70"
                >
                  {deleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>

              {status && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {status}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;

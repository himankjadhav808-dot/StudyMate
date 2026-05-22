import { useContext, useState } from 'react';
import AppContext from '../contexts/AppContext';

function ContactPage() {
  const { token } = useContext(AppContext);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setStatus('Please enter both a subject and a message.');
      setIsError(true);
      return;
    }

    setSending(true);
    setStatus('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('✅ Your message has been sent. The admin team will respond shortly.');
        setIsError(false);
        setSubject('');
        setMessage('');
      } else {
        setStatus(`❌ ${data.message || 'Unable to send message.'}`);
        setIsError(true);
      }
    } catch {
      setStatus('❌ Network error. Please try again.');
      setIsError(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Contact Admin</h1>
          <p className="text-gray-500 mt-2">
            Have a question or issue? Send a message to the StudyMate admin team.
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 flex flex-col gap-5"
        >
          {/* Subject */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-subject" className="text-sm font-semibold text-gray-700">
              Subject
            </label>
            <input
              id="contact-subject"
              type="text"
              placeholder="e.g. Issue with my exam result"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              required
            />
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-message" className="text-sm font-semibold text-gray-700">
              Message
            </label>
            <textarea
              id="contact-message"
              rows={6}
              placeholder="Describe your issue or question in detail..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              required
            />
          </div>

          {/* Status */}
          {status && (
            <p className={`text-sm font-medium ${isError ? 'text-red-600' : 'text-teal-700'}`}>
              {status}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={sending}
            className="w-full py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending…' : 'Send Message'}
          </button>
        </form>

        {/* Info note */}
        <p className="text-center text-xs text-gray-400 mt-5">
          Messages are saved to the admin panel and you may receive a reply via email.
        </p>
      </div>
    </div>
  );
}

export default ContactPage;

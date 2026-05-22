import { useContext } from 'react';
import AppContext from '../contexts/AppContext';

const AdminPending = () => {
  const { email } = useContext(AppContext);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="text-6xl text-teal-600 mb-4">⏳</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Waiting for Approval</h1>
        </div>

        <div className="bg-teal-50 border-l-4 border-teal-600 p-4 mb-6">
          <p className="text-gray-700 text-sm">
            Your admin request is pending approval from the super administrator. 
            You will be notified once your request is reviewed.
          </p>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Email:</strong> {email}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Status:</strong> <span className="text-yellow-600 font-semibold">Pending</span>
          </p>
        </div>

        <div className="text-sm text-gray-500">
          <p>Check back soon for updates. You can close this browser tab.</p>
        </div>

        <a 
          href="/" 
          className="inline-block mt-6 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default AdminPending;

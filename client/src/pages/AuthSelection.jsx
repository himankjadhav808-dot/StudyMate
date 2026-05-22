import { useNavigate } from 'react-router-dom';

const AuthSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome to StudyMate</h1>
          <p className="text-xl text-gray-600">Choose your account type</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* User Account */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-8 text-white">
              <div className="text-5xl mb-4">👤</div>
              <h2 className="text-2xl font-bold mb-2">Student Account</h2>
              <p className="text-teal-100">Take exams, track progress, and learn</p>
            </div>
            <div className="p-6">
              <ul className="text-gray-700 space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-teal-600 mr-2">✓</span>
                  <span>Practice and take exams</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 mr-2">✓</span>
                  <span>View performance analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 mr-2">✓</span>
                  <span>Track learning progress</span>
                </li>
              </ul>
              <button
                onClick={() => navigate('/login?type=user')}
                className="w-full mb-3 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold"
              >
                Login as Student
              </button>
              <button
                onClick={() => navigate('/signup?type=user')}
                className="w-full px-4 py-2 bg-teal-100 text-teal-600 rounded-lg hover:bg-teal-200 transition-colors font-semibold"
              >
                Sign Up as Student
              </button>
            </div>
          </div>

          {/* Admin Account */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-8 text-white">
              <div className="text-5xl mb-4">👨‍💼</div>
              <h2 className="text-2xl font-bold mb-2">Admin Account</h2>
              <p className="text-purple-100">Manage exams and users</p>
            </div>
            <div className="p-6">
              <ul className="text-gray-700 space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>Manage exams and questions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>View student leaderboards</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <span>Share top performers</span>
                </li>
              </ul>
              <p className="text-sm text-gray-600 mb-3">
                <strong>Note:</strong> Admin access requires approval from super administrator.
              </p>
              <button
                onClick={() => navigate('/login?type=admin')}
                className="w-full mb-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                Login as Admin
              </button>
              <button
                onClick={() => navigate('/signup?type=admin')}
                className="w-full px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors font-semibold"
              >
                Request Admin Access
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-gray-600">
          <p>Already have an account? <a href="/login" className="text-teal-600 hover:underline font-semibold">Login</a></p>
        </div>
      </div>
    </div>
  );
};

export default AuthSelection;

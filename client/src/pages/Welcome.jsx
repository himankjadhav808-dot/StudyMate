/**
 *  This is welcome page. User will see this page whenever they enter in our website.
 */
import { useNavigate } from 'react-router-dom'
import BarLoader from '../components/BarLoader'
import { useContext } from 'react'
import AppContext from '../contexts/AppContext'


function Welcome() {
  const navigate = useNavigate()
  const {email} = useContext(AppContext)

  const handleNavigate = () => {
    if (email) {
      navigate('/dashboard')
    } 
  }
  const handleNavigatep = () => {
    if (email) {
      navigate('/practice')
    } else {
      navigate('/login')
    } 
  }
return (
    <>
      {/* Hero section */}
      <div className="min-h-screen flex flex-col md:flex-row items-center justify-center gap-10 px-6 pt-20 pb-12">

        {/* Illustration — desktop only */}
        <div className="hidden md:flex justify-center items-center w-full md:w-1/2">
          <img
            className="w-[380px] lg:w-[480px] drop-shadow-sm"
            src="/images/education_imageHD.png"
            alt="student illustration"
          />
        </div>

        {/* Welcome card */}
        <div className="w-full md:w-1/2 flex justify-center">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl px-8 py-10 shadow-sm">

            <h2 className="text-3xl md:text-4xl font-semibold text-center text-slate-700 mb-3">
              Welcome 👋
            </h2>

            <p className="text-base text-center text-slate-500 leading-relaxed">
              Hi there! Welcome to{" "}
              <span className="font-semibold text-pink-500">StudyMate</span>.
              Practice and enhance your aptitude skills on our platform —
              completely free of cost!
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
              <button
                className="flex-1 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-medium text-sm transition-colors"
                type="button"
                onClick={handleNavigatep}
              >
                Start Practice
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl border-2 border-pink-500 text-pink-500 hover:bg-pink-50 font-medium text-sm transition-colors"
                type="button"
                onClick={handleNavigate}
              >
                Start Test
              </button>
            </div>

          </div>
        </div>

      </div>

      <BarLoader />
    </>
  )
}

export default Welcome
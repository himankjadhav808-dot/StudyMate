import { useContext, useState } from "react"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import LogError from "../errors/LogError"
import { Oval } from "react-loader-spinner"

import AppContext from "../contexts/AppContext"

function Login() {
    const navigate = useNavigate()
    const [isError, setIsError] = useState(false)
    const [formInput, setFormInput] = useState({email: '', password: ''})
    const [disable, setDisable] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [contactEmail, setContactEmail] = useState('')
    const [searchParams, setSearchParams] = useSearchParams()
    const [localAccountType, setLocalAccountType] = useState(searchParams.get('type') || 'user')
    const { setEmail, setUser, setIsVerified, setRole, setIsAdmin, setToken } = useContext(AppContext)
    const BASE_URL = import.meta.env.VITE_API_URL

    const handleAccountTypeChange = (type) => {
        setLocalAccountType(type)
        setSearchParams({ type })
    }

    const handleInputChange = ({ target: { name, value } }) => {
        setFormInput({ ...formInput, [name]: value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setDisable(true)
        setIsError(false)
        setErrorMsg('')

        try {
            const res = await fetch(`${BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ ...formInput, loginType: localAccountType }),
            })
            const data = await res.json()

            if (data.success) {
                setEmail(data.user.email)
                setUser(data.user.name)
                setIsVerified(true)
                setRole(data.user.role || 'user')
                setIsAdmin(data.user.role === 'admin')
                setToken(data.token || '')
                navigate('/dashboard')
            } else {
                const blockedMessage = data.message?.toLowerCase().includes('blocked')
                setErrorMsg(data.message || 'Login failed.')
                setContactEmail(blockedMessage ? 'studymate809@gmail.com' : '')
                setIsError(true)
                setDisable(false)
            }
        } catch {
            setErrorMsg('Network error. Please try again.')
            setContactEmail('')
            setIsError(true)
            setDisable(false)
        }
    }

   return (
    <>
        {/* Full page centered layout */}
        <div className="min-h-screen flex flex-col md:flex-row items-center justify-center gap-8 px-4 pt-20 pb-10">
            
            {/* Illustration - only on md+ */}
            <div className="hidden md:flex justify-center items-center w-full md:w-1/2">
                <img 
                    className="w-[400px] lg:w-[500px]" 
                    src="/images/Creative thinking-bro.png" 
                    alt="student illustration" 
                />
            </div>

            {/* Login form */}
            <div className="w-full md:w-1/2 flex justify-center items-center">
                <form 
                    className="w-full max-w-sm"
                    action={`${BASE_URL}/login`} 
                    method="post" 
                    onSubmit={handleSubmit}
                >
                    <fieldset className="border-2 rounded-xl border-gray-300 w-full p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <legend className="px-4 py-1 border border-gray-300 rounded-lg font-semibold text-gray-700">
                                {localAccountType === 'admin' ? 'Admin Login' : 'Student Login'}
                            </legend>
                            {/* Account Type Toggle */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleAccountTypeChange('user')}
                                    className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                                        localAccountType === 'user'
                                            ? 'bg-teal-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAccountTypeChange('admin')}
                                    className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                                        localAccountType === 'admin'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    Admin
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-1 mt-2">
                            <label className="text-slate-600 font-semibold text-sm" htmlFor="email">
                                Email ID
                            </label>
                            <input 
                                className="w-full border border-stone-300 rounded-lg p-2 text-sm
                                           focus:outline focus:outline-2 focus:outline-teal-700 focus:border-none" 
                                type="email" name="email" id="email" 
                                required 
                                value={formInput?.email} 
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="flex flex-col space-y-1 mt-4">
                            <label className="text-slate-600 font-semibold text-sm" htmlFor="password">
                                Password
                            </label>
                            <input 
                                className="w-full border border-stone-300 rounded-lg p-2 text-sm
                                           focus:outline focus:outline-2 focus:outline-teal-700 focus:border-none" 
                                type="password" name="password" id="password" 
                                required 
                                value={formInput?.password} 
                                onChange={handleInputChange}
                            />
                        </div>

                        <button 
                            className="w-full mt-6 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 
                                       text-white font-semibold text-base transition-colors
                                       disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center" 
                            type="submit" 
                            disabled={disable}
                        >
                            {!disable ? "LogIn" : (
                                <Oval
                                    height={22} width={22}
                                    color="#fff" secondaryColor="#efefef"
                                    strokeWidth={5} strokeWidthSecondary={8}
                                    visible={true} ariaLabel="oval-loading"
                                />
                            )}
                        </button>

                        {/* Forgot password + Signup links */}
                        <div className="flex justify-between items-center mt-3">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-teal-700 font-semibold hover:underline"
                            >
                                Forgot Password?
                            </Link>
                            <Link
                                to={`/signup?type=${localAccountType}`}
                                className="text-sm text-slate-500 hover:text-teal-700 hover:underline"
                            >
                                Create account
                            </Link>
                        </div>

                        {/* Learn more link */}
                        <p className="text-center text-xs text-slate-400 mt-3">
                            <Link to="/auth-select" className="text-slate-500 hover:text-teal-700 hover:underline">
                                Learn more about accounts
                            </Link>
                        </p>
                    </fieldset>
                </form>
            </div>
        </div>

        <LogError open={isError} close={() => setIsError(false)} message={errorMsg} contactEmail={contactEmail} />
    </>
)
}

export default Login
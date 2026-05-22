/* eslint-disable react/prop-types */
import { useState, useContext } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import SingleInput from '../components/SingleInput'
import AppContext from '../contexts/AppContext'
import { Oval } from 'react-loader-spinner'
import SignError from '../errors/SignError'

function Signup() {
    const [disable, setDisable] = useState(false)
    const [isError, setIsError] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [formInput, setFormInput] = useState({ fname: '', lname: '', email: '', password: '' })
    const [searchParams, setSearchParams] = useSearchParams()
    const [localAccountType, setLocalAccountType] = useState(searchParams.get('type') || 'user')

    const BASE_URL = import.meta.env.VITE_API_URL
    const navigate = useNavigate()
    const { setEmail, setUser } = useContext(AppContext)
    const accountType = localAccountType

    const handleAccountTypeChange = (type) => {
        setLocalAccountType(type)
        setSearchParams({ type })
    }

    const handleInputChange = (e) => {
        setFormInput({ ...formInput, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setDisable(true)
        setIsError(false)

        try {
            const endpoint = accountType === 'admin' ? '/signup/admin' : '/signup/user'
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formInput),
            })

            const data = await response.json()

            if (data.success) {
                setEmail(data.email)
                setUser(formInput.fname + ' ' + formInput.lname)
                setFormInput({ fname: '', lname: '', email: '', password: '' })
                navigate('/verify')
            } else {
                setErrorMsg(data.message || 'Signup failed. Please try again.')
                setIsError(true)
                setDisable(false)
            }
        } catch {
            setErrorMsg('Network error. Please check your connection.')
            setIsError(true)
            setDisable(false)
        }
    }

    return (
        <>
            <div className="min-h-screen flex flex-col md:flex-row items-center justify-center gap-8 px-4 pt-20 pb-10">

                {/* Illustration */}
                <div className="hidden md:flex justify-center items-center w-full md:w-1/2">
                    <img
                        className="w-[400px] lg:w-[500px]"
                        src="/images/Imagination-cuate.png"
                        alt="student illustration"
                    />
                </div>

                {/* Signup form */}
                <div className="w-full md:w-1/2 flex justify-center items-center">
                    <form className="w-full max-w-sm" onSubmit={handleSubmit}>
                        <fieldset className="border-2 rounded-xl border-gray-300 w-full p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <legend className="px-4 py-1 border border-gray-300 rounded-lg font-semibold text-gray-700">
                                    {accountType === 'admin' ? 'Request Admin Access' : 'Student SignUp'}
                                </legend>
                                {/* Account Type Toggle */}
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleAccountTypeChange('user')}
                                        className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                                            accountType === 'user'
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
                                            accountType === 'admin'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        Admin
                                    </button>
                                </div>
                            </div>

                            {/* First + Last name */}
                            <div className="flex flex-col space-y-3 mt-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                                <div className="w-full sm:w-1/2">
                                    <SingleInput fieldName="fname" fieldType="text" fieldLabel="First Name"
                                        inputChange={handleInputChange} inputValue={formInput.fname} />
                                </div>
                                <div className="w-full sm:w-1/2">
                                    <SingleInput fieldName="lname" fieldType="text" fieldLabel="Last Name"
                                        inputChange={handleInputChange} inputValue={formInput.lname} />
                                </div>
                            </div>

                            <div className="mt-4">
                                <SingleInput fieldName="email" fieldType="email" fieldLabel="Email ID"
                                    pholder="@gmail.com" require={true}
                                    inputChange={handleInputChange} inputValue={formInput.email} />
                            </div>

                            <div className="mt-4">
                                <SingleInput fieldName="password" fieldType="password" fieldLabel="Password"
                                    pholder="Min 6 characters" require={true}
                                    inputChange={handleInputChange} inputValue={formInput.password} />
                            </div>

                            {accountType === 'admin' && (
                                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded text-sm text-purple-700">
                                    ℹ️ Your admin request will be sent for approval by the super administrator.
                                </div>
                            )}

                            <button
                                className="w-full mt-6 py-2 rounded-lg bg-teal-700 hover:bg-teal-800
                                           text-white font-semibold text-base transition-colors
                                           disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center"
                                type="submit"
                                disabled={disable}
                            >
                                {!disable ? 'SignUp' : (
                                    <Oval height={22} width={22} color="#fff" secondaryColor="#efefef"
                                        strokeWidth={5} strokeWidthSecondary={8} visible={true} ariaLabel="loading" />
                                )}
                            </button>

                            {/* Login link */}
                            <p className="text-center text-sm text-slate-500 mt-4">
                                Already have an account?{' '}
                                <Link to="/login" className="text-teal-700 font-semibold hover:underline">Login</Link>
                            </p>

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

            <SignError openModal={isError} closeModal={() => setIsError(false)} message={errorMsg} />
        </>
    )
}

export default Signup
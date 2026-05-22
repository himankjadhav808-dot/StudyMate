/* eslint-disable react/prop-types */
import { useContext, useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import AppContext from "../contexts/AppContext"
import { Oval } from "react-loader-spinner"

function Verification() {
    const [otpInput, setOtpInput] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { email, setIsVerified } = useContext(AppContext)
    const [success, setSuccess] = useState(false)
    const navigate = useNavigate()
    const BASE_URL = import.meta.env.VITE_API_URL

    useEffect(() => {
        if (!email) navigate('/login')
    }, [email, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await fetch(`${BASE_URL}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpInput }),
            })

            const data = await response.json()

            if (data.success) {
                setIsVerified(false)  // will be set properly after login with JWT
                setSuccess(true)
                setTimeout(() => navigate('/login'), 2000)
            } else {
                setError(data.message || 'Invalid or expired OTP. Please try again.')
                setLoading(false)
            }
        } catch {
            setError('Network error. Please try again.')
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="grid place-items-center w-full mt-[100px] px-4">
                <div className="flex flex-col items-center bg-teal-50 py-8 px-9 rounded-lg w-full max-w-sm shadow-md space-y-4 border border-teal-200">
                    <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-teal-700" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-teal-700">Email Verified!</h2>
                    <p className="text-sm text-slate-600 text-center">Your account is now active. Redirecting to login...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="grid place-items-center w-full mt-[100px] px-4">
            <form
                className="flex flex-col bg-slate-100 py-6 px-9 rounded-lg w-full max-w-sm shadow-md space-y-4"
                onSubmit={handleSubmit}
            >
                <h2 className="text-center font-bold text-2xl text-slate-700">Verify Email</h2>
                <p className="text-sm text-center text-slate-600">
                    We sent a 6-digit code to{' '}
                    <span className="text-pink-500 font-semibold">{email}</span>
                </p>

                <input
                    type="text"
                    maxLength={6}
                    className="border-b-2 border-x-0 border-t-0 bg-slate-100 focus:ring-0 focus:border-pink-500
                               text-center p-1 w-[60%] mx-auto font-semibold text-slate-600 placeholder:font-normal text-lg tracking-widest"
                    placeholder="------"
                    onChange={(e) => setOtpInput(e.target.value)}
                    value={otpInput}
                    required
                />

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <div className="flex items-center justify-center">
                    <button
                        type="submit"
                        disabled={loading}
                        className="my-2 bg-pink-500 hover:bg-pink-600 px-6 py-2 text-white font-semibold
                                   rounded-md active:bg-pink-600 disabled:opacity-60 disabled:cursor-not-allowed
                                   flex items-center justify-center gap-2 transition-colors"
                    >
                        {loading ? (
                            <Oval height={20} width={20} color="#fff" secondaryColor="#efefef"
                                strokeWidth={5} strokeWidthSecondary={8} visible={true} ariaLabel="loading" />
                        ) : 'Verify'}
                    </button>
                </div>

                <p className="text-center text-xs text-slate-500">
                    Wrong email?{' '}
                    <Link to="/signup" className="text-teal-700 font-semibold hover:underline">Go back</Link>
                </p>
            </form>
        </div>
    )
}

export default Verification
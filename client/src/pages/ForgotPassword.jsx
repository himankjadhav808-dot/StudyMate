import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Oval } from 'react-loader-spinner'

// ── Step components ────────────────────────────────────────────────────────────

function StepEmail({ onNext }) {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const BASE_URL = import.meta.env.VITE_API_URL

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            const data = await res.json()
            if (data.success) {
                onNext(email)
            } else {
                setError(data.message || 'Something went wrong.')
            }
        } catch {
            setError('Network error. Please try again.')
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-slate-700 text-center">Forgot Password</h2>
            <p className="text-sm text-slate-500 text-center">
                Enter your registered email address. We&apos;ll send you a 6-digit OTP.
            </p>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-600" htmlFor="fp-email">Email Address</label>
                <input
                    id="fp-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="border border-stone-300 rounded-lg p-2 text-sm
                               focus:outline focus:outline-2 focus:outline-teal-700 focus:border-none"
                />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold
                           text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                           flex justify-center items-center"
            >
                {loading
                    ? <Oval height={22} width={22} color="#fff" secondaryColor="#efefef" strokeWidth={5} strokeWidthSecondary={8} visible ariaLabel="loading" />
                    : 'Send OTP'}
            </button>

            <p className="text-center text-sm text-slate-500">
                Remembered it?{' '}
                <Link to="/login" className="text-teal-700 font-semibold hover:underline">Login</Link>
            </p>
        </form>
    )
}

function StepOTP({ email, onNext, onBack }) {
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [resendLoading, setResendLoading] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)
    const BASE_URL = import.meta.env.VITE_API_URL

    // Countdown timer for resend cooldown
    useEffect(() => {
        if (resendCooldown <= 0) return
        const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
        return () => clearTimeout(t)
    }, [resendCooldown])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
            })
            const data = await res.json()
            if (data.success) {
                onNext(otp.trim())
            } else {
                setError(data.message || 'Invalid or expired OTP.')
            }
        } catch {
            setError('Network error. Please try again.')
        }
        setLoading(false)
    }

    const handleResend = async () => {
        setResendLoading(true)
        setError('')
        try {
            await fetch(`${BASE_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            })
            setResendCooldown(30)
            setOtp('')
        } catch {
            setError('Failed to resend. Please try again.')
        }
        setResendLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-slate-700 text-center">Enter OTP</h2>
            <p className="text-sm text-slate-500 text-center">
                A 6-digit code was sent to{' '}
                <span className="text-pink-500 font-semibold">{email}</span>
            </p>
            <p className="text-xs text-slate-400 text-center">Check your spam folder if you don&apos;t see it.</p>

            <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="------"
                className="border border-stone-300 rounded-lg p-2 text-center text-xl font-bold tracking-widest
                           focus:outline focus:outline-2 focus:outline-teal-700 focus:border-none"
            />

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
                type="submit"
                disabled={loading || otp.trim().length !== 6}
                className="w-full py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold
                           text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                           flex justify-center items-center"
            >
                {loading
                    ? <Oval height={22} width={22} color="#fff" secondaryColor="#efefef" strokeWidth={5} strokeWidthSecondary={8} visible ariaLabel="loading" />
                    : 'Verify OTP'}
            </button>

            <div className="flex justify-between items-center">
                <button type="button" onClick={onBack}
                    className="text-sm text-slate-500 hover:text-teal-700 text-center hover:underline">
                    ← Change email
                </button>
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || resendCooldown > 0}
                    className="text-sm text-teal-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resendLoading ? 'Sending…' : 'Resend OTP'}
                </button>
            </div>
        </form>
    )
}

function StepReset({ email, otp, onSuccess }) {
    const [newPassword, setNewPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPass, setShowPass] = useState(false)
    const BASE_URL = import.meta.env.VITE_API_URL

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.')
            return
        }
        if (newPassword !== confirm) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), otp: otp.trim(), newPassword }),
            })
            const data = await res.json()
            if (data.success) {
                onSuccess()
            } else {
                setError(data.message || 'Failed to reset password.')
            }
        } catch {
            setError('Network error. Please try again.')
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-slate-700 text-center">New Password</h2>
            <p className="text-sm text-slate-500 text-center">
                Set a new password for <span className="text-pink-500 font-semibold">{email}</span>
            </p>

            <div className="flex flex-col gap-1 relative">
                <label className="text-sm font-semibold text-slate-600">New Password</label>
                <div className="relative">
                    <input
                        type={showPass ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full border border-stone-300 rounded-lg p-2 text-sm pr-10
                                   focus:outline focus:outline-2 focus:outline-teal-700 focus:border-none"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-700 text-xs"
                    >
                        {showPass ? 'Hide' : 'Show'}
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-600">Confirm Password</label>
                <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    className="border border-stone-300 rounded-lg p-2 text-sm
                               focus:outline focus:outline-2 focus:outline-teal-700 focus:border-none"
                />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold
                           text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                           flex justify-center items-center"
            >
                {loading
                    ? <Oval height={22} width={22} color="#fff" secondaryColor="#efefef" strokeWidth={5} strokeWidthSecondary={8} visible ariaLabel="loading" />
                    : 'Reset Password'}
            </button>
        </form>
    )
}

function StepSuccess() {
    return (
        <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-teal-700" fill="none" stroke="currentColor" strokeWidth={2.5}
                    viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-700 text-center">Password Reset!</h2>
            <p className="text-sm text-slate-500 text-center">
                Your password has been updated successfully. You can now log in with your new password.
            </p>
            <Link
                to="/login"
                className="w-full py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold
                           text-base transition-colors text-center"
            >
                Go to Login
            </Link>
        </div>
    )
}

// ── Main ForgotPassword Page ──────────────────────────────────────────────────
function ForgotPassword() {
    const [step, setStep] = useState(1)   // 1 = email, 2 = otp, 3 = new password, 4 = success
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const navigate = useNavigate()

    // Step progress indicators
    const steps = ['Email', 'OTP', 'Password']

    return (
        <div className="min-h-screen flex flex-col md:flex-row items-center justify-center gap-8 px-4 pt-20 pb-10">

            {/* Illustration */}
            <div className="hidden md:flex justify-center items-center w-full md:w-1/2">
                <img
                    className="w-[380px] lg:w-[450px]"
                    src="/images/Forgot password-bro.png"
                    alt="forgot password illustration"
                    onError={(e) => { e.target.style.display = 'none' }}
                />
            </div>

            {/* Card */}
            <div className="w-full md:w-1/2 flex justify-center items-center">
                <div className="w-full max-w-sm">
                    <fieldset className="border-2 rounded-xl border-gray-300 w-full p-6 shadow-sm">
                        <legend className="px-4 py-1 border border-gray-300 rounded-lg font-semibold text-gray-700">
                            Reset Password
                        </legend>

                        {/* Step indicator (only for steps 1-3) */}
                        {step < 4 && (
                            <div className="flex items-center justify-between mb-6">
                                {steps.map((label, i) => (
                                    <div key={label} className="flex items-center gap-1 flex-1">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                                            ${i + 1 < step ? 'bg-teal-700 text-white' :
                                              i + 1 === step ? 'bg-teal-700 text-white ring-2 ring-teal-300' :
                                              'bg-gray-200 text-gray-500'}`}>
                                            {i + 1 < step ? '✓' : i + 1}
                                        </div>
                                        <span className={`text-xs hidden sm:inline ${i + 1 === step ? 'text-teal-700 font-semibold' : 'text-gray-400'}`}>
                                            {label}
                                        </span>
                                        {i < steps.length - 1 && (
                                            <div className={`flex-1 h-0.5 mx-1 ${i + 1 < step ? 'bg-teal-700' : 'bg-gray-200'}`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {step === 1 && (
                            <StepEmail onNext={(em) => { setEmail(em); setStep(2) }} />
                        )}
                        {step === 2 && (
                            <StepOTP
                                email={email}
                                onNext={(o) => { setOtp(o); setStep(3) }}
                                onBack={() => setStep(1)}
                            />
                        )}
                        {step === 3 && (
                            <StepReset
                                email={email}
                                otp={otp}
                                onSuccess={() => setStep(4)}
                            />
                        )}
                        {step === 4 && <StepSuccess navigate={navigate} />}
                    </fieldset>
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword

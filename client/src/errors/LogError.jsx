/* eslint-disable react/prop-types */
import ReactDom from "react-dom"

function LogError({ open, close, message, contactEmail }) {
    if (!open) return null

    const isBlockedMessage = message?.toLowerCase().includes('blocked')
    const contactLink = contactEmail ? `mailto:${contactEmail}` : null

    return ReactDom.createPortal(
        <>
            <div style={{
                backgroundColor: 'rgba(0,0,0,.6)',
                position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, zIndex: 10
            }} onClick={close} />

            <div className="w-[90%] md:w-[40%] bg-white rounded-md p-6 fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-30 space-y-2">
                <div className="relative">
                    <h3 className="text-center text-xl md:text-2xl font-semibold">
                        <span className="text-red-500">Failed</span> to login!
                    </h3>
                    <i className="fa-solid fa-rectangle-xmark cursor-pointer active:scale-[0.9]"
                        style={{ color: '#ff1a1a', position: 'absolute', top: '0', fontSize: '24px', right: '0' }}
                        onClick={close} />
                </div>
                <p className="text-center text-sm text-slate-600 w-[90%] md:w-[75%] mx-auto">
                    {message || 'Invalid credentials. Please check your email and password and try again.'}
                </p>
                {isBlockedMessage && contactLink && (
                    <div className="text-center mt-2">
                        <p className="text-xs text-slate-500 mb-2">
                            Need help? Contact the super admin directly.
                        </p>
                        <a
                            href={contactLink}
                            className="inline-block text-sm font-semibold text-teal-700 hover:text-teal-900 underline"
                        >
                            Email super admin
                        </a>
                    </div>
                )}
                <img src="/images/log_err.png" alt="log-error-img" className="w-[65%] mx-auto" />
                <div className="flex flex-col gap-3 justify-center">
                    <button
                        className="bg-teal-700 py-2 px-4 text-white font-semibold rounded-md active:scale-[0.9] w-full md:w-auto"
                        onClick={close}
                    >
                        Try Again
                    </button>
                    {isBlockedMessage && contactLink && (
                        <a
                            href={contactLink}
                            className="bg-slate-800 py-2 px-4 text-white font-semibold rounded-md active:scale-[0.9] w-full md:w-auto text-center"
                        >
                            Contact Super Admin
                        </a>
                    )}
                </div>
            </div>
        </>,
        document.getElementById('portal')
    )
}

export default LogError

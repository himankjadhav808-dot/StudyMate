/* eslint-disable react/prop-types */
import ReactDom from "react-dom"

function SignError({ openModal, closeModal, message }) {
    if (!openModal) return null

    return ReactDom.createPortal(
        <>
            <div style={{
                backgroundColor: 'rgba(0,0,0,.6)',
                position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, zIndex: 10
            }} onClick={closeModal} />

            <div className="w-[90%] md:w-[40%] bg-white rounded-md p-6 fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-30 space-y-2">
                <div className="relative">
                    <h3 className="text-center text-xl md:text-2xl font-semibold">
                        <span className="text-red-500">Signup Failed</span>
                    </h3>
                    <i className="fa-solid fa-rectangle-xmark cursor-pointer active:scale-[0.9]"
                        style={{ color: '#ff1a1a', position: 'absolute', top: '0', fontSize: '24px', right: '0' }}
                        onClick={closeModal} />
                </div>
                <p className="text-center text-sm text-slate-600 w-[90%] md:w-[75%] mx-auto">
                    {message || 'Something went wrong. Please check your details and try again.'}
                </p>
                <img src="/images/sign_error.png" alt="error" className="w-[65%] mx-auto" />
                <div className="flex justify-center">
                    <button
                        className="bg-teal-700 py-2 px-4 text-white font-semibold rounded-md active:scale-[0.9] w-full md:w-auto"
                        onClick={closeModal}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </>,
        document.getElementById('portal')
    )
}

export default SignError
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useContext, useEffect, useState } from "react"
import { NavLink } from "react-router-dom"
import Logout from "./modals/Logout"
import AppContext from "../contexts/AppContext"

function Navbar({ email }) {
    const [isOpen, setIsOpen] = useState(false)
    const [openModal, setOpenModal] = useState(false)
    const { inExam, isVerified, isAdmin, role } = useContext(AppContext)

    // Kahi bhi touch/click kare toh menu auto-close
    useEffect(() => {
        if (!isOpen) return
        const handler = () => setIsOpen(false)
        document.addEventListener('mousedown', handler)
        document.addEventListener('touchstart', handler)
        return () => {
            document.removeEventListener('mousedown', handler)
            document.removeEventListener('touchstart', handler)
        }
    }, [isOpen])

    const navLinkClass = ({ isActive }) =>
        `block py-2 px-3 rounded-md text-sm transition-colors
         ${isActive ? 'bg-teal-600 font-semibold' : 'hover:bg-teal-600/60'}`

    const desktopLinkClass = ({ isActive }) =>
        `text-sm transition-colors hover:underline ${isActive ? 'font-bold' : ''}`

    return (
        <>
            <nav
                className="fixed w-full z-10 bg-teal-700 text-white shadow-md"
                onMouseDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
            >
                {/* Top bar — logo + hamburger */}
                <div className="flex items-center justify-between px-5 py-3">
                    <h2 className="font-semibold text-2xl lg:text-3xl font-cursive tracking-wide">
                        StudyMate
                    </h2>

                    {/* Hamburger / X button — mobile only */}
                    <button
                        className="md:hidden p-2 rounded-md hover:bg-teal-600 transition-colors"
                        onClick={() => setIsOpen(prev => !prev)}
                        aria-label="Toggle menu"
                    >
                        <div className="w-5 flex flex-col gap-1">
                            <span className={`block h-0.5 bg-white rounded transition-all duration-300 origin-left
                                ${isOpen ? 'rotate-45 translate-y-[1px]' : ''}`} />
                            <span className={`block h-0.5 bg-white rounded transition-all duration-300
                                ${isOpen ? 'opacity-0 -translate-x-2' : ''}`} />
                            <span className={`block h-0.5 bg-white rounded transition-all duration-300 origin-left
                                ${isOpen ? '-rotate-45 -translate-y-[1px]' : ''}`} />
                        </div>
                    </button>

                    {/* Desktop links */}
                    <div className="hidden md:flex items-center gap-8">
                        {!inExam ? (
                            <>
                                <NavLink className={desktopLinkClass} to='/'>Home</NavLink>
                                <NavLink className={desktopLinkClass} to='about'>About</NavLink>
                                {!isVerified ? (
                                    <>
                                        <NavLink className={desktopLinkClass} to='login'>Log In</NavLink>
                                        <NavLink className={desktopLinkClass} to='signup'>Sign Up</NavLink>
                                    </>
                                ) : (
                                    <>
                                        <NavLink className={desktopLinkClass} to='dashboard'>Dashboard</NavLink>
                                        <NavLink className={desktopLinkClass} to='profile'>Profile</NavLink>
                                        {!isAdmin && (
                                            <NavLink className={desktopLinkClass} to='contact'>Contact</NavLink>
                                        )}
                                        {isAdmin && <NavLink className={desktopLinkClass} to='admin'>Admin</NavLink>}
                                        <button
                                            className="text-sm hover:underline cursor-pointer"
                                            onClick={() => setOpenModal(true)}
                                        >
                                            Logout
                                        </button>
                                    </>
                                )}
                            </>
                        ) : (
                            <h3 className="font-cursive text-lg">You are in the exam room</h3>
                        )}
                    </div>
                </div>

                {/* Mobile dropdown — smooth slide */}
                <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out
                    ${isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-4 pb-4 border-t border-teal-600">
                        {!inExam ? (
                            <ul className="flex flex-col gap-1 mt-3">
                                <li>
                                    <NavLink className={navLinkClass} to='/' onClick={() => setIsOpen(false)}>
                                        Home
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink className={navLinkClass} to='about' onClick={() => setIsOpen(false)}>
                                        About
                                    </NavLink>
                                </li>
                                {!isVerified ? (
                                    <>
                                        <li>
                                            <NavLink className={navLinkClass} to='login' onClick={() => setIsOpen(false)}>
                                                Log In
                                            </NavLink>
                                        </li>
                                        <li>
                                            <NavLink className={navLinkClass} to='signup' onClick={() => setIsOpen(false)}>
                                                Sign Up
                                            </NavLink>
                                        </li>
                                    </>
                                ) : (
                                    <>
                                        <li>
                                            <NavLink className={navLinkClass} to='dashboard' onClick={() => setIsOpen(false)}>
                                                Dashboard
                                            </NavLink>
                                        </li>
                                        <li>
                                            <NavLink className={navLinkClass} to='profile' onClick={() => setIsOpen(false)}>
                                                Profile
                                            </NavLink>
                                        </li>
                                        {!isAdmin && (
                                            <li>
                                                <NavLink className={navLinkClass} to='contact' onClick={() => setIsOpen(false)}>
                                                    Contact
                                                </NavLink>
                                            </li>
                                        )}
                                        {role === 'admin' && (
                                            <li>
                                                <NavLink className={navLinkClass} to='admin' onClick={() => setIsOpen(false)}>
                                                    Admin Panel
                                                </NavLink>
                                            </li>
                                        )}
                                        <li>
                                            <button
                                                className="w-full text-left py-2 px-3 rounded-md text-sm hover:bg-teal-600/60 transition-colors"
                                                onClick={() => { setIsOpen(false); setOpenModal(true) }}
                                            >
                                                Logout
                                            </button>
                                        </li>
                                    </>
                                )}
                            </ul>
                        ) : (
                            <p className="text-center py-3 font-cursive text-lg">You are in the exam room</p>
                        )}
                    </div>
                </div>
            </nav>

            {openModal && <Logout closeModal={() => setOpenModal(false)} />}
        </>
    )
}

export default Navbar
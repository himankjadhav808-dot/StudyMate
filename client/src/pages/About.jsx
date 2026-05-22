function About() {
  return (
    <div className="min-h-screen w-full bg-sky-50 flex flex-col items-center justify-center px-4 py-24">
      
      {/* About card */}
      <div className="w-full max-w-2xl bg-white py-10 px-8 rounded-2xl shadow-md">
        <h1 className="text-center text-3xl font-bold text-teal-700 mb-4">About Us</h1>
        <p className="text-center text-gray-600 leading-relaxed text-sm md:text-base">
          Welcome to <span className="font-semibold text-teal-700">StudyMate</span>, where we're dedicated to honing your
          aptitude reasoning skills. Our platform offers an authentic exam-like experience, 
          ensuring you're not only knowledgeable but also well-prepared for time-bound assessments.
          Our user-friendly interface and skill-level categorized questions cater to beginners,
          intermediates, and pros. We present questions in Multiple Choice Question format, 
          mirroring real exam styles. To maintain integrity, our platform employs an AI camera 
          system that detects violations during exams. The included timer adds realistic pressure, 
          automatically submitting your paper if time runs out — preparing you for real exam 
          conditions. Join StudyMate and embark on a journey towards aptitude excellence.
        </p>
      </div>

      {/* Features highlight */}
      <div className="w-full max-w-2xl mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: "fa-clock", title: "Timed Exams", desc: "Real exam pressure with auto-submit" },
          { icon: "fa-layer-group", title: "Skill Levels", desc: "Beginner, Intermediate & Pro" },
          { icon: "fa-shield-halved", title: "AI Proctoring", desc: "Violation detection during exams" },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-white rounded-xl shadow-sm p-5 flex flex-col items-center text-center gap-2">
            <i className={`fa-solid ${icon} text-teal-600 text-2xl`}></i>
            <h3 className="font-semibold text-gray-700">{title}</h3>
            <p className="text-xs text-gray-500">{desc}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

export default About;
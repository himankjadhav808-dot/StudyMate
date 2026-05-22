# StudyMate Project
## Description
StudyMate is a comprehensive educational platform designed to facilitate learning through various features including user authentication, administrative management, aptitude tests, AI-powered questions, and progress tracking.
## Technologies Used
### Backend (StudyMate/server)
*   **Node.js**: JavaScript runtime environment.
*   **Express.js**: Web application framework for Node.js.
*   **MongoDB**: NoSQL database for data storage (inferred from `.json` files and common MERN/MEVN stack practices).
*   **JWT**: For authentication and authorization.
*   **Nodemailer**: For email services.
### Frontend (StudyMate/client)
*   **React**: JavaScript library for building user interfaces.
*   **Vite**: Fast frontend build tool.
*   **Tailwind CSS**: Utility-first CSS framework.
*   **React Router**: For client-side routing.
## Features
### User Management
*   User Registration and Login
*   Password Reset
*   Admin Approval Dashboard for new users
*   Role-Based Access Control (RBAC)
### Learning & Assessment
*   Aptitude Tests
*   Reasoning Questions
*   AI-Powered Question Generation
*   Progress Tracking and Dashboards
*   Skill Tests
### Content & Resources
*   Course Content Display
*   Notifications
*   Contact and Support Forms
## Setup Instructions
### Prerequisites
*   Node.js (LTS version recommended)
*   MongoDB instance (local or cloud-based)
### Backend Setup
1.  Navigate to the `StudyMate/server` directory:
    ```bash
    cd StudyMate/server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `StudyMate/server` directory and configure environment variables (e.g., `MONGODB_URI`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`). Refer to `.env.example` if available or create one based on the application's needs.
4.  Run the server:
    ```bash
    npm start
    ```
    The server will typically run on `http://localhost:3000`.
### Frontend Setup
1.  Navigate to the `StudyMate/client` directory:
    ```bash
    cd StudyMate/client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The client application will typically run on `http://localhost:5173`.
## Usage
1.  Access the frontend application in your browser (e.g., `http://localhost:5173`).
2.  Register a new user account or log in if you already have one.
3.  Explore the dashboard, take aptitude and skill tests, and access learning content.
4.  Administrators can manage users and content through their dedicated dashboard.
## Contribution
Contributions are welcome! Please fork the repository and submit pull requests.

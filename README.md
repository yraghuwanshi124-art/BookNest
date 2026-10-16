# BookNest — MERN Book Review App

## 📚 Project Overview
BookNest is a book review web application built using the MERN stack. Users can register, log in, browse books, and share their thoughts through ratings and reviews.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT and bcryptjs

## ✨ Features
- User registration and login
- Password hashing
- JWT-based authentication
- Add books with categories
- Browse and view book details
- Ratings and book reviews
- Responsive user interface

*Note: Update this list to match the features that are actually implemented in your deployed project.*

## 🌐 Live Demo
- **Frontend:** [PASTE YOUR VERCEL FRONTEND URL]
- **Backend:** https://booknest-bakend.onrender.com/
- **GitHub Repository:** [PASTE YOUR PUBLIC GITHUB REPOSITORY URL]

## ⚙️ Local Setup

### Prerequisites
- Node.js and npm
- MongoDB database
- Git

### 1. Clone the repository
```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd YOUR_PROJECT_FOLDER
```

### 2. Install dependencies
Open the frontend and backend folders in separate terminals and run:

```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the backend folder and configure the required variables using `.env.example` as a guide.

Never commit real database credentials, JWT secrets, or other private keys.

### 4. Start the backend
```bash
npm run dev
```

### 5. Start the frontend
Run the frontend's development command from its folder:

```bash
npm run dev
```

Open the local URL shown in the terminal.

## 🧪 Security Testing

Run these tests against your own application and update the results honestly.

| Test | Expected Result | Actual Result |
|---|---|---|
| Add a book without a token | 401 Unauthorized | Pending |
| Submit a review without a token | 401 Unauthorized | Pending |
| Edit another user's book | 403 Forbidden | Pending |
| Edit or delete another user's review | 403 Forbidden | Pending |
| Submit a rating of 0 or 6 | 400 Bad Request | Pending |

Replace **Pending** with **Pass** or **Fail** only after testing.

## 🖼️ Screenshots
Add screenshots of the following pages to a `screenshots` folder and update the paths:

- Home page
- Login and registration pages
- Book details and reviews
- Add book page

## 🔐 Demo Account
Create a dedicated test account for reviewers.

- **Email:** [YOUR TEST ACCOUNT EMAIL]
- **Password:** [SET A TEST PASSWORD AND SHARE IT PRIVATELY WITH YOUR MENTOR]

Do not include personal account credentials or production secrets in this repository.

## 👨‍💻 Author
**Yash Raghuwanshi**

Built as a MERN stack internship assignment.

# 🎓 CampusPass — Anti-Proxy QR Gate Security & Automated Attendance Portal

**CampusPass** is a full-stack, role-based campus access management system built with **React (Vite)**, **Node.js/Express**, and **MySQL**. It eliminates manual gate registers, prevents QR code sharing/proxy entries, enables visual face verification at security checkpoints, and automates daily campus attendance for faculty.

---

## ✨ Key Features

* **🔐 Multi-Role Authentication & Google OAuth 2.0:** Seamless login via **Google OAuth 2.0** or JWT-secured credentials across four distinct portals: **Student**, **Security Guard**, **Teacher/Faculty**, and **Administrator**.
* **⚡ Instant Auto-Approved Single-Use QR Passes:** Students generate time-bound Entry/Exit digital QR passes (`CP-XXXXXXXX`) immediately without administrative bottlenecks.
* **🚨 Anti-Proxy Duplicate Scan Prevention:** Each QR pass is strictly single-use. Once scanned at the gate, it is deactivated in MySQL—blocking any second person attempting to reuse a screenshotted or forwarded QR code.
* **🪪 Gate Face-Match Verification:** Scanning a student's QR code pulls their registered **profile photo, Roll Number, Course, Branch, and Section** from the campus database so security personnel can verify identity before granting entry.
* **📊 Automated Gate Attendance & Bunk Audit (Teacher Portal):** Every verified gate entry automatically logs the student as **Present** for that date. Faculty can filter records by **Course, Branch, Section, and Date** to cross-check gate entry against classroom attendance.

---

## 🛠️ Tech Stack

* **Frontend:** React 18, Vite, React Router, Axios, `html5-qrcode`
* **Backend:** Node.js, Express.js, Passport.js (Google OAuth 2.0), JSON Web Tokens (JWT), `bcryptjs`, `qrcode`
* **Database:** MySQL 8.0 (`mysql2`)

---

## 🚀 Local Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com<your-username>/CampusPass.git
   cd CampusPass
   ```

2. **Install dependencies (Root, Client, and Server):**
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   cd ..
   ```

3. **Configure MySQL Database:**
   Import `database/schema.sql` and `database/upgrade_v2.sql` into your local MySQL server (`accessflow` database).

4. **Set Environment Variables:**
   Copy `server/.env.example` to `server/.env` and update your credentials:
   ```env
   PORT=5000
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=http://localhost:5173
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=accessflow
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   ```

5. **Run the Application:**
   ```bash
   npm run dev
   ```
   * **Frontend:** `http://localhost:5173`
   * **Backend API:** `http://localhost:5000`

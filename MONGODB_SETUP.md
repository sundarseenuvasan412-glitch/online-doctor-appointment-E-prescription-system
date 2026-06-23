# Backend & MongoDB Setup — Step by Step

Follow these steps to run the CareConnect backend with MongoDB.

---

## Step 1: Install backend dependencies

Open a terminal in the project folder and go to the backend:

```bash
cd backend
npm install
```

---

## Step 2: Choose how to run MongoDB

You can use **MongoDB locally** or **MongoDB Atlas** (cloud, free tier).

### Option A — MongoDB on your computer (localhost)

1. **Install MongoDB Community**
   - Windows: https://www.mongodb.com/try/download/community  
     - Choose **Windows** → **msi** → install.  
     - During setup, you can leave “Install MongoDB as a Service” checked so it starts with Windows.
   - Or use **MongoDB Compass** (includes a local server in some installers): https://www.mongodb.com/try/download/compass

2. **Start MongoDB** (if not installed as a service)
   - Windows: Open “Services” and start **MongoDB**, or run:
     ```bash
     "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath C:\data\db
     ```
     (Create `C:\data\db` if needed; adjust path if your MongoDB version is different.)

3. **Connection string**
   - Use: `mongodb://localhost:27017`  
   - No username/password needed for local install.

---

### Option B — MongoDB Atlas (cloud, free)

1. **Create an account**
   - Go to https://www.mongodb.com/cloud/atlas and sign up (free).

2. **Create a cluster**
   - Click **“Build a Database”** → choose **FREE** (M0).
   - Pick a cloud provider and region (e.g. AWS, closest to you).
   - Cluster name can stay default (e.g. `Cluster0`) → **Create**.

3. **Create a database user**
   - Under **Security → Database Access → Add New Database User**.
   - Choose **Password**; set username (e.g. `careconnect`) and a strong password (save it).
   - Role: **Atlas Admin** (or **Read and write to any database**).
   - Click **Add User**.

4. **Allow network access**
   - **Security → Network Access → Add IP Address**.
   - For development: **“Allow Access from Anywhere”** (0.0.0.0/0).
   - Confirm.

5. **Get connection string**
   - **Database → Connect → Connect your application**.
   - Driver: **Node.js**.
   - Copy the URI. It looks like:
     ```
     mongodb+srv://careconnect:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your database user password (special chars may need URL encoding).

6. **Use this as `MONGO_URI`** in the next step (full string, including `mongodb+srv://...`).

---

## Step 3: Create the `.env` file

1. In the **backend** folder, copy the example env file:

   **Windows (PowerShell):**
   ```powershell
   Copy-Item .env.example .env
   ```

   **Or manually:** duplicate `.env.example` and name the copy `.env`.

2. Open **`.env`** and set at least these:

   **If using local MongoDB (Option A):**
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017
   MONGO_DB_NAME=online_appointment
   JWT_SECRET=super_secret_jwt_key_change_me
   CLIENT_URL=http://localhost:5173
   ```

   **If using Atlas (Option B):**
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://careconnect:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   MONGO_DB_NAME=online_appointment
   JWT_SECRET=super_secret_jwt_key_change_me
   CLIENT_URL=http://localhost:5173
   ```

   - Replace `YOUR_PASSWORD` and the cluster host with your Atlas URI.
   - Use a long random string for `JWT_SECRET` in production.

---

## Step 4: (Optional) Seed the database

This creates an admin, a patient, and a doctor so you can log in and test:

```bash
npm run seed
```

You should see something like:

```
MongoDB connected: ...
Seeded users and doctors:
{ admin: { email: 'admin@hospital.com', password: 'Admin@123' }, ... }
```

**Test accounts:**

| Role    | Email              | Password   |
|---------|--------------------|------------|
| Admin   | admin@hospital.com | Admin@123  |
| Patient | patient@example.com | Patient@123 |
| Doctor  | doctor@example.com | Doctor@123  |

---

## Step 5: Start the backend server

From the **backend** folder:

```bash
npm run dev
```

You should see:

```
Server running on port 5000
MongoDB connected: ...
```

- API: **http://localhost:5000**
- Health check: **http://localhost:5000/api/health** (should return `{"status":"ok"}`).

---

## Step 6: Run the frontend (if not already)

In a **second** terminal, from the project root:

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173**, then:

- Register a new patient, or
- Log in as **patient@example.com** / **Patient@123** (after seeding).

You can then book appointments; doctors will receive real-time updates when logged in.

---

## Quick reference

| Step | Command / action |
|------|-------------------|
| 1    | `cd backend` → `npm install` |
| 2    | Install MongoDB locally **or** create Atlas cluster + user + URI |
| 3    | Copy `.env.example` to `.env` and set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` |
| 4    | `npm run seed` (optional) |
| 5    | `npm run dev` (backend) |
| 6    | In another terminal: `cd frontend` → `npm run dev` (frontend) |

---

## Troubleshooting

- **“MongoDB connection error”**  
  - Local: ensure MongoDB is running (service or `mongod`).  
  - Atlas: check URI (password, no `<`/`>`), IP allowlist, and user.

- **“Cannot GET /api/…”**  
  - Use **http://localhost:5000/api/health** (with `/api`). Frontend uses `VITE_API_URL` or defaults to `http://localhost:5000/api`.

- **CORS errors in browser**  
  - In `.env`, set `CLIENT_URL=http://localhost:5173` (or the port your frontend uses).

- **No doctors in “Book appointment”**  
  - Run `npm run seed` to create the sample doctor, or add doctors via the admin flow.

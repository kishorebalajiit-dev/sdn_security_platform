# SecureNet AI Cybersecurity Platform UI

This project is a sophisticated UI for a Cybersecurity Platform, featuring AI-driven threat detection, real-time traffic monitoring, blockchain-based audit trails, and SDN integration.

## Project Structure

```
.
├── backend/                  # Flask backend for API, AI engine, and data services
├── src/                      # React frontend source code
├── ...other files...
```

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

-   [Node.js](https://nodejs.org/en/) (LTS version recommended)
-   [pnpm](https://pnpm.io/installation) (for frontend package management)
-   [Python 3.9+](https://www.python.org/downloads/)
-   [Docker](https://www.docker.com/get-started) (for running the full stack with services like Postgres, Ryu, Mininet)
-   [Npcap](https://nmap.org/npcap/dist/npcap-1.79.exe) (Windows) or libpcap-dev (Linux) for traffic monitoring with Scapy.

    -   **Windows:** Download and install Npcap from the official website. Ensure "Install Npcap in WinPcap API-compatible Mode" and "Support raw 802.11 traffic (and monitor mode) for wireless adapters" are checked during installation.
    -   **Linux (Debian/Ubuntu):** `sudo apt-get install libpcap-dev`

### 1. Environment Variables (.env)

Create a `.env` file in the project root based on `.env.example`. Replace placeholder values (like Supabase keys) with your actual credentials.

```
# Example .env content
SECRET_KEY=securenet-dev-secret-change-in-production
JWT_SECRET_KEY=securenet-jwt-secret-change-in-production
JWT_ACCESS_MINUTES=480

# Supabase PostgreSQL — kishorebalajiit-dev's Projects
DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@db.YOUR_SUPABASE_HOST.supabase.co:5432/postgres
SUPABASE_URL=https://YOUR_SUPABASE_HOST.supabase.co
SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SECRET_KEY
SUPABASE_SSL=1

AUTO_CREATE_TABLES=1
SEED_DATABASE=1
RATELIMIT_STORAGE_URI=memory://

# Frontend
VITE_API_BASE_URL=http://localhost:5000/api/v1
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Blockchain / SDN (optional)
GANACHE_URL=http://127.0.0.1:7545
RYU_CONTROLLER_URL=http://127.0.0.1:8080
```

### 2. Backend Setup

The backend handles the API, AI engine, database interactions, and real-time traffic monitoring.

```bash
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create and run database migrations
# IMPORTANT: These steps might require running your terminal as Administrator
# if you encounter permission issues or "No such host is known" errors if your DNS
# resolver needs admin privileges.
set FLASK_APP=wsgi.py  # For Windows. For Linux/macOS: export FLASK_APP=wsgi.py
python -m flask db init # Only if migrations folder doesn't exist
python -m flask db migrate -m "Initial migration"
python -m flask db upgrade

# Run the Flask application with SocketIO
# NOTE: The traffic monitoring feature requires `sudo` or administrator privileges
# on some systems to capture raw network packets using Scapy.
# You MUST run your terminal as Administrator (Windows)
# or use `sudo -E` (Linux/macOS) to run this command if you encounter permission errors.
python wsgi.py
```

### 3. Frontend Setup

The frontend is a React application that consumes the backend API and WebSocket stream.

```bash
# Navigate to the project root directory
cd ..

# Install pnpm dependencies (ensure pnpm is installed globally: npm install -g pnpm)
pnpm install

# Start the React development server
pnpm run dev
```

### 4. Docker Compose (Optional - Full Stack Deployment)

For a complete environment including PostgreSQL, Ryu Controller, and Mininet (for network simulation), use Docker Compose.

```bash
# Ensure you are in the project root directory
docker-compose up --build
```

**Note on Traffic Monitoring:** When running with Docker Compose, the `mininet` service will attempt to run `topology.py` within its container. The `backend` service, which performs the actual traffic monitoring, will attempt to monitor its host's network interface. Ensure your host environment has `Npcap` (Windows) or `libpcap-dev` (Linux) installed for `scapy` to function correctly.

## Frontend UI Components

-   `TrafficMonitoring.tsx`: Real-time network traffic visualization.
-   `AIThreatDetection.tsx`: Displays AI-driven threat analysis.
-   `BlockchainAudit.tsx`: Auditing and verification of blockchain transactions.
-   `AlertsCenter.tsx`: Centralized view for security alerts.
-   `DeviceManagement.tsx`: Manages network devices.
-   `NetworkTopology.tsx`: Visualizes network infrastructure.
-   `Reports.tsx`: Generates security reports.
-   `Settings.tsx`: Platform configuration.
-   `UserManagement.tsx`: User and role management.

## License

This project is provided for development and demonstration purposes.

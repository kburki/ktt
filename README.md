# KTOO Time Tracker

A personal time tracking web application for KTOO Public Media staff to log and analyze how time is spent across different roles and responsibilities.

## Features

- **Real-time timer** - Start/stop tracking with automatic time calculation
- **Draft entries** - Edit times, categories, and notes before saving
- **Multi-user support** - Each team member has their own user profile (browser-based)
- **Analytics** - View time allocation with pie charts and daily breakdown charts
- **Category management** - Create, edit, and customize tracking categories
- **CSV export** - Download time entries for external analysis
- **Responsive design** - Works on desktop and mobile browsers

## Tech Stack

- React 18
- Tailwind CSS
- Lucide React icons
- Browser localStorage for persistence

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm
- Password configuration file (see Setup section below)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kburki/ktt.git
cd ktt
```

2. Install dependencies:
```bash
npm install
```

### Setup

1. Create a password config directory:
```bash
mkdir -p ~/config/ktt-config
```

2. Create `~/config/ktt-config/password.json`:
```json
{
  "password": "your-secure-password-here"
}
```

3. Create `.env.local` in the ktt project root:
```
KTT_CONFIG_PATH=~/config/ktt-config/password.json
```

4. Build and start:
```bash
npm run build
npm install -g pm2
pm2 start "npx serve -s build -l 3000"
```

5. Access at [http://localhost:3000](http://localhost:3000) (or your server IP:3000)

## Usage

1. Select or create your user profile
2. Choose a category from the timer dropdown
3. Click "Start" to begin tracking
4. Click "Stop" when you switch tasks - creates a draft entry
5. Edit draft entries (times, category, notes) as needed
6. Click "Save All Drafts" to commit to your log
7. View analytics and export data as needed

## Data Storage

All data is stored locally in your browser's localStorage. Each user's data is separate and persists across browser sessions.

## Security Note

When deployed with a password login, ensure the password configuration file is stored outside the application directory and not committed to version control.

## Contributing

For KTOO team members - please create a branch for any feature additions or bug fixes.

## License

Internal use only - KTOO Public Media
# Getting Started with Everyst

**Welcome to Everyst!** This beginner-friendly guide will walk you through everything you need to know to get up and running with Everyst, your all-in-one network discovery and management tool.

> **NOTE**: Everyst is currently in **Alpha 1.0** stage. Features and installation procedures may change in future releases.

## What You'll Learn In This Guide

- What Everyst does and how it can help you
- How to set up Everyst on your computer
- How to use Everyst for the first time
- Common questions and troubleshooting tips

## What You'll Need Before Starting

Don't worry if you don't have everything yet - we'll help you get set up!

### On Your Computer

| Requirement | Description | How to Check | How to Install |
|-------------|-------------|------------|---------------|
| **Linux Operating System** | Everyst runs on Linux | Type `uname -a` in terminal | Windows users: [Install WSL2](https://docs.microsoft.com/en-us/windows/wsl/install) |
| **Python 3.10+** | Powers the backend | Type `python --version` | [Download Python](https://www.python.org/downloads/) |
| **Node.js 18.0+** | Powers the frontend | Type `node --version` | [Download Node.js](https://nodejs.org/) |
| **npm** | Installs JavaScript packages | Type `npm --version` | Comes with Node.js |
| **curl** | Downloads files | Type `curl --version` | Most Linux has this pre-installed |

**You'll also need**:

- Network interface (your regular WiFi or Ethernet connection)
- Administrator/sudo access on your computer

### For Viewing the Application

- Any modern web browser (Chrome, Firefox, Safari, or Edge)
- Screen with at least 1280×720 resolution

## Installation Made Easy

I've prepared two ways to install Everyst - choose the one that works best for you:

### Option 1: Easy Automatic Setup (Recommended for Beginners)

This is the simplest way to get started with Everyst. The setup script does all the hard work for you!

1. **Get the Everyst code on your computer**:

   Open your terminal and type:

   ```bash
   git clone https://github.com/Jordonh18/Everyst.git
   cd Everyst
   ```

   What this does: Downloads all the Everyst files to your computer and moves you into that folder

2. **Run the setup helper**:

   ```bash
   ./setup-dev.sh
   ```

   What this does:
   
   - Sets up all the technical environments needed
   - Installs all required software components
   - Creates necessary files and databases
   - Configures everything for first use
   
   This may take a few minutes. You'll see text scrolling as it works!

3. **Activate the special Python environment**:

   ```bash
   source venv/bin/activate
   ```

   What this does: Switches to a special isolated environment where Everyst can run safely
   
   Success looks like: You'll see `(venv)` appear at the beginning of your terminal line

4. **Start Everyst**:

   ```bash
   sudo npm run dev
   ```

   What this does: Starts both the backend server (data processing) and frontend (what you'll see in your browser)
   
   Note: You might be asked for your password because network scanning requires administrative access

5. **Open Everyst in your browser**:

   - Go to: `https://localhost:5173` in your web browser
   
   Your browser will show a security warning about the certificate - this is normal during development.
   
   - In Chrome: Click "Advanced" and then "Proceed to localhost"
   - In Firefox: Click "Advanced" and then "Accept the Risk and Continue"
   - In Safari: Click "Show Details" and then "visit this website"
   - In Edge: Click "Details" and then "Go on to the webpage"

### Option 2: Manual Installation (For Advanced Users)

If you prefer more control over the installation process:

1. **Get the Everyst code**:

   ```bash
   git clone https://github.com/Jordonh18/Everyst.git
   cd Everyst
   ```

2. **Set up the Python environment**:

   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Prepare the database**:

   ```bash
   cd backend
   python manage.py migrate
   python manage.py createsuperuser   # Follow the prompts to create an admin account
   cd ..
   ```

4. **Install frontend components**:

   ```bash
   npm install
   ```

5. **Start the development server**:

   ```bash
   sudo npm run dev
   ```

6. Access at `https://localhost:5173` (frontend) and `https://localhost:8000/api` (backend API)

## Pro Tips

- Having permission errors? Make sure you're using `sudo` when starting the server
- Installation stuck? Check your internet connection - the setup needs to download packages
- Get a "port in use" error? Another application might be using port 5173 or 8000. Try closing other applications or check running processes

## First Run Setup: Your First Adventure with Everyst

When you first open Everyst in your browser, you'll be guided through a simple setup process. Here's what to expect:

### Create Your Admin Account

You'll create your first user account, which will have full access to all Everyst features:

- **Username**: Choose something you'll remember (e.g., "admin" or your name)
- **Email**: Your email address for notifications and password recovery
- **Password**: Create a strong password (mix of letters, numbers, and symbols)
- **Name**: Your first and last name

This account will be the "Owner" with complete control over your Everyst installation.


### Environment Settings

For custom environment settings (like database connections or API keys):

1. Create your settings file by copying the example:

   ```bash
   cp .env.example .env
   ```

2. Edit the file with your favorite text editor:

   ```bash
   nano .env
   ```

3. Save the changes and restart Everyst for them to take effect.

Need more detailed information? Check out the [Complete User Guide] for in-depth documentation.

## Common Questions & Troubleshooting

### "I can't connect to the Everyst interface"

- Check that the server is running (you should see activity in your terminal)
- Make sure you're using `https://` not `http://` in your browser
- Try accessing `https://localhost:5173` directly

### "The installation script failed"

- Make sure you have the latest versions of Python and Node.js
- Check your internet connection - the script needs to download packages
- Try running the installation again with `sudo ./setup-dev.sh`

### "I'm getting permission errors"

- Make sure you're using `sudo` when starting the server
- Check that your user account has administrator privileges

## Join Our Community

Everyst has a friendly community of users and developers ready to help!

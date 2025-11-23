# MrX Colab Agent - Complete Deployment Guide

## 📋 Overview

This guide will help you deploy the MrX Colab Agent step-by-step, even if you're not technical. Follow each section carefully.

---

## ✅ Prerequisites (What You Need)

Before starting, gather these items:

1. **Google Account** - For Google Colab (free)
2. **GitHub Account** - For storing your Android projects
3. **Cloudflare Account** - For your backend (free)
4. **GitHub Personal Access Token** - For repository access
5. **Optional: OpenAI API Key** - If you want to use ChatGPT (paid)

---

## 🚀 Step-by-Step Deployment

### Step 1: Create GitHub Personal Access Token

1. Go to GitHub.com and log in
2. Click your profile picture (top right) → **Settings**
3. Scroll down to **Developer settings** (bottom left)
4. Click **Personal access tokens** → **Tokens (classic)**
5. Click **Generate new token** → **Generate new token (classic)**
6. Give it a name: "MrX Colab Agent"
7. Set expiration: **No expiration** (or choose your preference)
8. Check these permissions:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
9. Click **Generate token**
10. **IMPORTANT**: Copy the token immediately (it starts with `ghp_...`)
    - Save it somewhere safe - you'll never see it again!

---

### Step 2: Get Your Backend URL

1. Log into your Cloudflare account
2. Go to **Workers & Pages**
3. Find your MrX backend deployment
4. Copy the URL (looks like: `https://your-app.pages.dev`)
5. Save this URL - you'll need it in Step 4

---

### Step 3: Open Google Colab

1. Go to [colab.research.google.com](https://colab.research.google.com)
2. Sign in with your Google account
3. Click **File** → **New notebook**
4. You now have a blank Colab notebook

---

### Step 4: Upload Code to Colab

**Option A: Upload Files Directly**

1. In Colab, click the folder icon (📁) on the left sidebar
2. Click the upload button
3. Upload ALL Python files from the project:
   - All files from `config/` folder
   - All files from `core/` folder
   - All files from `utils/` folder
   - All files from `storage/` folder
   - All files from `parsers/` folder
   - All files from `chunking/` folder
   - All files from `embeddings/` folder
   - All files from `vector/` folder
   - All files from `git/` folder
   - All files from `llm/` folder
   - All files from `build/` folder

**Option B: Clone from GitHub (if you uploaded code there)**

1. Create a new cell in Colab
2. Paste this code:
```python
!git clone https://github.com/YOUR-USERNAME/mrx-colab-agent.git
import sys
sys.path.append('/content/mrx-colab-agent')
```
3. Replace `YOUR-USERNAME` with your GitHub username
4. Run the cell

---

### Step 5: Copy the Main Notebook

1. Copy ALL the code from `main.ipynb` (the artifact I created above)
2. Paste it into your Colab notebook
3. The notebook has 6 cells - keep them in order

---

### Step 6: Configure Your Credentials

Find **Cell 2** in the notebook (labeled "Setup and Configuration")

Replace these values:

```python
# YOUR BACKEND URL (from Step 2)
BACKEND_URL = "https://your-app.pages.dev"  # ← Change this

# UNIQUE ID FOR THIS COLAB
COLAB_ID = "colab-001"  # ← You can keep this or change it

# SECRET FOR JOB CLAIMING (get this from your Cloudflare backend)
CLAIM_SECRET = "your-claim-secret"  # ← Change this
```

---

### Step 7: Add Your GitHub Token

**Method 1: Using Colab Secrets (Recommended - More Secure)**

1. Click the key icon (🔑) on the left sidebar
2. Click **Add new secret**
3. Name: `GITHUB_PAT`
4. Value: Paste your GitHub token from Step 1
5. Toggle the switch to allow notebook access

Then in Cell 2, uncomment this line:
```python
from google.colab import userdata
os.environ["GITHUB_PAT"] = userdata.get('GITHUB_PAT')
```

**Method 2: Direct Input (Easier but Less Secure)**

In Cell 2, uncomment and fill in this line:
```python
os.environ["GITHUB_PAT"] = "ghp_your_token_here"  # ← Paste your token
```

---

### Step 8: (Optional) Add LLM Configuration

**If using OpenAI:**

In Cell 2, uncomment and add your key:
```python
os.environ["OPENAI_API_KEY"] = "sk-your-openai-key"
```

**If using a custom LLM endpoint:**

In Cell 2, uncomment and configure:
```python
os.environ["CUSTOM_LLM_ENDPOINT"] = "https://your-llm-api.com/v1/chat/completions"
os.environ["CUSTOM_LLM_KEY"] = "your-api-key"
```

---

### Step 9: Run the Agent

Now you're ready to start!

1. **Run Cell 1** (Install Dependencies)
   - Click the play button or press `Shift+Enter`
   - Wait 2-3 minutes for installation
   - You should see "✓ Dependencies installed"

2. **Run Cell 2** (Configuration)
   - Should see "✓ Configuration set"

3. **Run Cell 3** (Import Modules)
   - Should see "✓ Modules imported"

4. **Run Cell 4** (Initialize Agent)
   - This authenticates with your backend
   - Should see "✅ Agent is ready!"
   - If you see errors, check your credentials

5. **Run Cell 5** (Load Job Logic)
   - Should see "✓ Job execution logic loaded"

6. **Run Cell 6** (Start Agent)
   - This starts the main loop
   - You'll see: "Starting agent... (Press Stop button to halt)"
   - The agent is now running and polling for jobs!

---

## 🔍 How to Verify It's Working

### Check 1: Console Output
You should see logs like:
```
INFO - Starting job polling loop (interval: 30s)
DEBUG - No jobs available, waiting...
```

### Check 2: Backend Connection
The agent polls your backend every 30 seconds. Check your Cloudflare logs to see the requests.

### Check 3: Test with a Job
From your frontend dashboard, create a test job. You should see:
```
INFO - Claimed job: job_12345
INFO - Executing job: job_12345 (type: build-only)
```

---

## ⚙️ Configuration Options

### Changing Poll Interval

In Cell 2, add:
```python
os.environ["POLL_INTERVAL"] = "60"  # Poll every 60 seconds instead of 30
```

### Changing Embedding Model

In Cell 2, add:
```python
# Options: "mini" (default, fastest), "bge-small", "bge-base", "mpnet"
os.environ["DEFAULT_EMBEDDING_MODEL"] = "bge-small"
```

### Adjusting Build Timeout

In Cell 2, add:
```python
os.environ["GRADLE_TIMEOUT"] = "900"  # 15 minutes instead of 10
```

---

## 🐛 Troubleshooting

### Problem: "Authentication failed"
**Solution:**
- Check your `BACKEND_URL` is correct
- Verify `CLAIM_SECRET` matches your backend configuration
- Make sure your backend is running

### Problem: "GitHub PAT not available"
**Solution:**
- Verify you added the token correctly in Step 7
- Check the token hasn't expired
- Ensure token has `repo` permissions

### Problem: "Failed to load embedding model"
**Solution:**
- This is a large download (400MB+)
- Check your internet connection
- Wait a few minutes and retry
- The model caches after first download

### Problem: "Colab disconnected"
**Solution:**
- Colab free tier disconnects after inactivity
- You need to keep the browser tab open
- Consider Colab Pro for longer runtimes
- The agent will auto-reconnect when you restart

### Problem: "No jobs available"
**Solution:**
- This is normal - it means no work to do
- Create a job from your frontend dashboard
- The agent checks every 30 seconds

---

## 📊 Monitoring Your Agent

### Check Agent Status

Add this cell anywhere in your notebook:
```python
# Check agent status
print(f"Backend: {settings.BACKEND_URL}")
print(f"Colab ID: {settings.COLAB_ID}")
print(f"GitHub PAT: {'✓ Set' if secret_manager.get_github_pat() else '✗ Missing'}")
print(f"LLM Configured: {'✓ Yes' if secret_manager.get_llm_config()['endpoint'] or secret_manager.get_llm_config()['openai_key'] else '✗ No'}")
```

### View Recent Logs

Add this cell:
```python
# Show last 10 log entries
logs = logger.get_buffer()
for log in logs[-10:]:
    print(f"{log['timestamp']} [{log['level']}] {log['message']}")
```

---

## 🔒 Security Best Practices

1. **Never commit secrets to GitHub**
   - Use Colab Secrets for sensitive data
   - Don't share your notebook with secrets

2. **Rotate tokens regularly**
   - Generate new GitHub PAT every few months
   - Update in Colab Secrets

3. **Use environment variables**
   - Don't hardcode secrets in code
   - Use the configuration methods shown above

4. **Monitor usage**
   - Check your LLM API usage if using OpenAI
   - Monitor GitHub API rate limits

---

## 📞 Getting Help

### Where to Look

1. **Check the logs**: Most errors are explained in the console output
2. **Review this guide**: Re-read the step that's causing issues
3. **Backend logs**: Check your Cloudflare Pages logs
4. **GitHub repository**: Ensure your repos are accessible

### Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Invalid claim secret" | Wrong secret in config | Check backend settings |
| "Repository not found" | Can't access GitHub repo | Verify PAT permissions |
| "Model not loaded" | Embedding model failed | Check internet, retry |
| "Build timeout" | Gradle took too long | Increase timeout setting |

---

## 🎉 Success Checklist

- ✅ Colab notebook is running
- ✅ Sees "Agent is ready!" message
- ✅ Polling loop is active
- ✅ No authentication errors
- ✅ Can claim jobs from backend
- ✅ Successfully builds Android projects
- ✅ Uploads APKs to Google Drive (if configured)

---

## 💡 Tips for Best Performance

1. **Keep Colab tab open**: Prevents disconnection
2. **Use Colab Pro**: Longer runtime, better GPUs
3. **Start with small projects**: Test with simple Android apps first
4. **Monitor costs**: If using paid LLM APIs
5. **Regular updates**: Pull latest code periodically

---

## 📝 Summary

You now have:
- ✅ A working Colab agent
- ✅ Connected to your backend
- ✅ Ready to build Android apps
- ✅ Integrated with GitHub
- ✅ AI-powered code generation

The agent will:
1. Poll your backend every 30 seconds
2. Claim available jobs
3. Clone Android projects from GitHub
4. Parse and index code with FAISS
5. Generate code patches with AI
6. Build APKs with Gradle
7. Upload artifacts to Google Drive
8. Stream logs to your dashboard

**Your MrX App Builder platform is now fully operational! 🚀**
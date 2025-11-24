# 🚀 MrX App Builder Platform - Backend

The coordination layer for AI-assisted Android app development. Built on Cloudflare Pages Functions with Workers KV storage.

## 📖 What Is This?

This backend is the **control center** of the MrX App Builder Platform. It:
- ✅ Manages projects, chats, and messages
- ✅ Coordinates jobs between Dashboard and Google Colab
- ✅ Stores metadata in Workers KV (free tier)
- ✅ Securely handles GitHub tokens and API keys
- ✅ Streams build logs in real-time
- ✅ Tracks APK artifacts in Google Drive

**100% Free Tier** - No credit card required!

---

## 🏗️ Architecture Overview

```
┌─────────────┐
│  Dashboard  │ ← User interacts here
│  (Website)  │
└──────┬──────┘
       │ HTTPS (JWT Auth)
       ↓
┌─────────────────────────────┐
│   Backend (You Are Here)    │
│  Cloudflare Pages Functions │
│  + Workers KV Storage       │
└──────┬──────────────┬───────┘
       │              │
       │ Jobs Queue   │ Logs/Metadata
       ↓              ↓
┌─────────────┐  ┌──────────┐
│Google Colab │  │ KV Store │
│(Heavy Work) │  │(Database)│
└──────┬──────┘  └──────────┘
       │
       ↓
┌─────────────┐  ┌──────────┐
│   GitHub    │  │  Drive   │
│(Code Repo)  │  │ (APKs)   │
└─────────────┘  └──────────┘
```

### Data Flow Example
1. **User** types message in Dashboard
2. **Dashboard** → Backend: `POST /api/projects/weather-app/chats/chat_1/messages`
3. **Backend** stores message in KV, creates job
4. **Colab** polls: `POST /api/jobs/claim`
5. **Backend** returns job to Colab
6. **Colab** gets secrets: `GET /api/admin/secrets/weather-app?type=github`
7. **Colab** processes job (builds APK, writes code)
8. **Colab** updates: `PATCH /api/jobs/{jobId}` with state="completed"
9. **Dashboard** polls: `GET /api/jobs/{jobId}/logs` to show progress
10. **User** sees results!

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Cloudflare account (free)
- GitHub account (free)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd mrx-backend
npm install
```

### 2. Configure wrangler.toml
```toml
name = "mrx-backend"
compatibility_date = "2025-11-22"

[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_NAMESPACE_ID"  # Get from Cloudflare dashboard

[vars]
DASHBOARD_URL = "https://your-dashboard.pages.dev"
```

### 3. Create KV Namespace
```bash
wrangler kv:namespace create KV
# Copy the ID and paste it in wrangler.toml
```

### 4. Set Secrets
```bash
# Generate random 32-char strings for these:
wrangler pages secret put SESSION_SECRET
wrangler pages secret put ENCRYPTION_KEY
wrangler pages secret put ADMIN_API_KEY

# Get GitHub token from: github.com/settings/tokens
wrangler pages secret put GITHUB_PAT_MASTER
```

### 5. Deploy
```bash
npm run build
wrangler pages deploy dist
```

### 6. Test
```bash
curl https://mrx-backend.pages.dev/api/projects
# Should get auth error (that's good!)
```

---

## 📁 Project Structure

```
mrx-backend/
├── functions/               # Cloudflare Pages Functions
│   ├── _middleware.ts      # Global CORS, auth, errors
│   └── api/
│       ├── projects/       # Project endpoints
│       ├── jobs/           # Job management
│       └── admin/          # Admin endpoints
│
├── lib/                    # Shared libraries
│   ├── kv/                 # KV storage operations
│   │   ├── projects.ts
│   │   ├── chats.ts
│   │   ├── messages.ts
│   │   ├── jobs.ts
│   │   ├── logs.ts
│   │   ├── artifacts.ts
│   │   └── secrets.ts
│   │
│   ├── auth/               # Authentication
│   │   ├── session.ts      # Dashboard auth
│   │   ├── colab.ts        # Colab auth
│   │   └── admin.ts        # Admin auth
│   │
│   ├── crypto/             # Encryption & JWT
│   │   ├── encryption.ts
│   │   ├── tokens.ts
│   │   └── jwt.ts
│   │
│   ├── github/             # GitHub integration
│   │   ├── client.ts
│   │   └── repos.ts
│   │
│   └── utils/              # Utilities
│       ├── errors.ts
│       ├── logger.ts
│       └── pagination.ts
│
├── types/                  # TypeScript definitions
│   └── index.ts
│
├── wrangler.toml          # Cloudflare config
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript config
```

---

## 🔑 KV Data Schema

### Projects
```
Key: project:weather-app:meta
Value: {
  projectId: "weather-app",
  name: "weather-app",
  repo: "https://github.com/user/mrx-weather-app",
  defaultBranch: "main",
  createdAt: "2025-11-22T10:00:00Z"
}
```

### Chats
```
Key: project:weather-app:chat:chat_123:meta
Value: {
  chatId: "chat_123",
  projectId: "weather-app",
  title: "Add dark mode",
  llmMode: "custom",
  createdAt: "2025-11-22T10:00:00Z"
}
```

### Messages
```
Key: project:weather-app:chat:chat_123:messages:0
Value: [
  {
    messageId: "msg_1",
    role: "user",
    content: "Add dark mode to the app",
    timestamp: "2025-11-22T10:00:00Z"
  }
]
```

### Jobs
```
Key: project:weather-app:job:job_123_abc
Value: {
  jobId: "job_123_abc",
  projectId: "weather-app",
  type: "build",
  state: "pending",
  payload: { branch: "main" },
  claimedBy: null,
  createdAt: "2025-11-22T10:00:00Z"
}
```

### Logs
```
Key: project:weather-app:logs:job_123_abc:segment:0
Value: {
  segment: 0,
  timestamp: "2025-11-22T10:00:01Z",
  level: "info",
  message: "Starting build process..."
}
```

### Artifacts
```
Key: project:weather-app:artifacts
Value: [
  {
    artifactId: "artifact_1",
    drivePath: "MrX/weather-app/v1.0.apk",
    fileName: "weather-app-v1.0.apk",
    sha256: "abc123...",
    buildNumber: "1",
    uploadedAt: "2025-11-22T10:10:00Z"
  }
]
```

### Secrets (Encrypted)
```
Key: secret:github:weather-app
Value: {
  type: "github",
  projectId: "weather-app",
  encrypted: "base64-encrypted-data",
  iv: "base64-iv",
  createdAt: "2025-11-22T10:00:00Z"
}
```

---

## 🔐 Security Features

### Authentication Layers
1. **Dashboard**: JWT session tokens (1-2 hour expiry)
2. **Colab**: Long-lived agent secret + one-time claim tokens
3. **Admin**: Separate API key for secret management

### Data Protection
- Secrets encrypted with AES-256-GCM
- Claim tokens single-use, 5-minute expiry
- CORS strictly enforced
- All operations logged

### Best Practices Implemented
- ✅ Never expose secrets to frontend
- ✅ Constant-time token comparison (prevents timing attacks)
- ✅ Automatic job timeout (30 minutes)
- ✅ Audit trail for all sensitive operations
- ✅ Rate limiting via Cloudflare

---

## 🧪 Testing

### Manual Testing
```bash
# List projects
curl -H "Authorization: Bearer <token>" \
  https://mrx-backend.pages.dev/api/projects

# Create chat
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"New chat","initialMessage":"Hello"}' \
  https://mrx-backend.pages.dev/api/projects/weather-app/chats
```

### Unit Tests (Coming Soon)
```bash
npm test
```

---

## 📊 Monitoring

### View Logs
```bash
wrangler pages deployment tail
```

### Check KV Usage
Cloudflare Dashboard → KV → Your namespace → View data

### Performance Metrics
Cloudflare Dashboard → Your project → Analytics

---

## 🔄 Updating

### Update Code
```bash
git pull
npm run build
wrangler pages deploy dist
```

### Update Secrets
```bash
wrangler pages secret put SECRET_NAME
```

### Rotate Secrets
```python
# In Colab or admin script:
import requests

requests.post('https://mrx-backend.pages.dev/api/admin/secrets', 
  headers={'X-Admin-Api-Key': admin_key},
  json={
    'type': 'github',
    'projectId': 'weather-app',
    'value': 'new-token-here'
  }
)
```

---

## 💡 Tips & Tricks

### Debugging
1. Check logs: `wrangler pages deployment tail`
2. Inspect KV data in Cloudflare dashboard
3. Test endpoints with `curl` or Postman
4. Enable debug logs in code temporarily

### Performance
- KV reads are fast (~1ms)
- KV writes are slower (~10-50ms)
- Batch operations when possible
- Use pagination for large datasets

### Scaling
- Free tier: 100k requests/day
- Each request: <10ms CPU time
- If exceeding limits, upgrade to Cloudflare Workers Paid ($5/month)

---

## 🆘 Troubleshooting

### "KV namespace not found"
→ Create KV namespace and update `wrangler.toml`

### "Invalid token"
→ Check SESSION_SECRET is set correctly

### "CORS error"
→ Verify DASHBOARD_URL matches exactly

### "Job timeout"
→ Colab might be offline or job too complex

### "Rate limit exceeded"
→ You hit 100k requests/day, wait or upgrade

---

## 📚 Documentation

- [Deployment Guide](deployment-guide.md) - Step-by-step setup
- [API Reference](api-documentation.md) - Complete API docs
- [Architecture](architecture.md) - System design details

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing`
5. Open Pull Request

---

## 📄 License

MIT License - Free to use, modify, and distribute

---

## 🌟 Features Roadmap

- [ ] Webhook support for instant job notifications
- [ ] GraphQL API option
- [ ] Enhanced analytics dashboard
- [ ] Multi-region deployment
- [ ] Automated backup system
- [ ] Advanced caching strategies

---

## 💬 Support

- GitHub Issues: Report bugs or request features
- Documentation: Check the docs folder
- Community: Join our Discord (coming soon)

---

**Built with ❤️ using Cloudflare Pages Functions & Workers KV**

Ready to build Android apps with AI? Deploy this backend and let's go! 🚀
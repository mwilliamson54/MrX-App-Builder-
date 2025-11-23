# MrX Backend - API Documentation

## 🔐 Authentication

All endpoints (except Colab-specific ones) require a session token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Colab endpoints require:
```
X-Colab-Secret: <colab-agent-secret>
X-Colab-Id: <colab-agent-id>
```

---

## 📚 API Endpoints

### Projects

#### GET /api/projects
List all projects (from GitHub repos with `mrx-` prefix)

**Response:**
```json
[
  {
    "projectId": "weather-app",
    "name": "weather-app",
    "repo": "https://github.com/user/mrx-weather-app",
    "defaultBranch": "main",
    "createdAt": "2025-11-22T10:00:00Z",
    "updatedAt": "2025-11-22T10:00:00Z"
  }
]
```

#### GET /api/projects/{projectId}
Get specific project details

**Response:**
```json
{
  "projectId": "weather-app",
  "name": "weather-app",
  "repo": "https://github.com/user/mrx-weather-app",
  "defaultBranch": "main",
  "driveFolderId": "1ABC...",
  "createdAt": "2025-11-22T10:00:00Z",
  "updatedAt": "2025-11-22T10:00:00Z"
}
```

---

### Chats

#### GET /api/projects/{projectId}/chats
List all chats for a project

**Response:**
```json
[
  {
    "chatId": "chat_123",
    "projectId": "weather-app",
    "title": "Add weather widget",
    "llmMode": "custom",
    "createdAt": "2025-11-22T10:00:00Z",
    "updatedAt": "2025-11-22T10:30:00Z"
  }
]
```

#### POST /api/projects/{projectId}/chats
Create a new chat

**Request:**
```json
{
  "title": "Add weather widget",
  "llmMode": "custom",
  "initialMessage": "Create a weather widget for the main screen"
}
```

**Response:**
```json
{
  "chat": {
    "chatId": "chat_123",
    "projectId": "weather-app",
    "title": "Add weather widget",
    "llmMode": "custom",
    "createdAt": "2025-11-22T10:00:00Z",
    "updatedAt": "2025-11-22T10:00:00Z"
  },
  "jobId": "job_123_abc"
}
```

---

### Messages

#### GET /api/projects/{projectId}/chats/{chatId}/messages
Get messages in a chat (paginated)

**Query Parameters:**
- `cursor` (optional): Pagination cursor

**Response:**
```json
{
  "data": [
    {
      "messageId": "msg_123",
      "chatId": "chat_123",
      "role": "user",
      "content": "Create a weather widget",
      "timestamp": "2025-11-22T10:00:00Z"
    },
    {
      "messageId": "msg_124",
      "chatId": "chat_123",
      "role": "assistant",
      "content": "I'll create a weather widget...",
      "timestamp": "2025-11-22T10:01:00Z"
    }
  ],
  "cursor": "50",
  "hasMore": false
}
```

#### POST /api/projects/{projectId}/chats/{chatId}/messages
Add a new message

**Request:**
```json
{
  "content": "Can you add a forecast for next week?",
  "role": "user"
}
```

**Response:**
```json
{
  "message": {
    "messageId": "msg_125",
    "chatId": "chat_123",
    "role": "user",
    "content": "Can you add a forecast for next week?",
    "timestamp": "2025-11-22T10:02:00Z"
  },
  "jobId": "job_124_def"
}
```

---

### Jobs

#### POST /api/jobs/create
Create a manual job (build, patch, etc.)

**Request:**
```json
{
  "projectId": "weather-app",
  "jobType": "build",
  "payload": {
    "branch": "main",
    "buildVariant": "release"
  }
}
```

**Response:**
```json
{
  "jobId": "job_125_ghi",
  "projectId": "weather-app",
  "type": "build",
  "state": "pending",
  "payload": {
    "branch": "main",
    "buildVariant": "release"
  },
  "claimedBy": null,
  "claimExpiry": null,
  "createdAt": "2025-11-22T10:03:00Z",
  "updatedAt": "2025-11-22T10:03:00Z"
}
```

#### POST /api/jobs/claim (Colab only)
Claim the next pending job

**Request Headers:**
```
X-Colab-Secret: <secret>
X-Colab-Id: <colab-id>
```

**Response:**
```json
{
  "job": {
    "jobId": "job_125_ghi",
    "projectId": "weather-app",
    "type": "build",
    "state": "claimed",
    "payload": {...},
    "claimedBy": "colab-agent-1",
    "claimExpiry": "2025-11-22T10:33:00Z",
    "createdAt": "2025-11-22T10:03:00Z",
    "updatedAt": "2025-11-22T10:03:30Z"
  },
  "claimToken": "abc123def456..."
}
```

If no jobs available:
```json
{
  "job": null
}
```

#### PATCH /api/jobs/{jobId} (Colab only)
Update job state

**Request:**
```json
{
  "state": "running",
  "payload": {
    "progress": "Cloning repository..."
  }
}
```

**Response:**
```json
{
  "jobId": "job_125_ghi",
  "state": "running",
  "payload": {
    "progress": "Cloning repository..."
  },
  "updatedAt": "2025-11-22T10:04:00Z"
}
```

---

### Logs

#### GET /api/jobs/{jobId}/logs
Stream job logs (paginated)

**Query Parameters:**
- `cursor` (optional): Pagination cursor (segment number)

**Response:**
```json
{
  "data": [
    {
      "segment": 0,
      "timestamp": "2025-11-22T10:03:35Z",
      "level": "info",
      "message": "Starting build process..."
    },
    {
      "segment": 1,
      "timestamp": "2025-11-22T10:03:40Z",
      "level": "info",
      "message": "Cloning repository..."
    }
  ],
  "cursor": "2",
  "hasMore": true
}
```

#### POST /api/jobs/{jobId}/logs (Colab only)
Append log entry

**Request:**
```json
{
  "timestamp": "2025-11-22T10:03:45Z",
  "level": "info",
  "message": "Building APK...",
  "metadata": {
    "step": "gradle-build"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

---

### Artifacts

#### GET /api/projects/{projectId}/artifacts
List all build artifacts

**Response:**
```json
[
  {
    "artifactId": "artifact_123",
    "projectId": "weather-app",
    "drivePath": "MrX App Builder/weather-app/weather-app-v1.0.apk",
    "fileName": "weather-app-v1.0.apk",
    "sha256": "abc123...",
    "buildNumber": "1",
    "size": 5242880,
    "uploadedAt": "2025-11-22T10:10:00Z"
  }
]
```

---

### Admin (Secrets Management)

#### POST /api/admin/secrets
Store an encrypted secret

**Request Headers:**
```
X-Admin-Api-Key: <admin-key>
```

**Request:**
```json
{
  "type": "github",
  "projectId": "weather-app",
  "value": "ghp_abc123..."
}
```

**Response:**
```json
{
  "success": true
}
```

#### GET /api/admin/secrets/{projectId} (Colab only)
Retrieve decrypted secret (one-time use)

**Request Headers:**
```
X-Colab-Id: <colab-id>
X-Claim-Token: <one-time-token>
```

**Query Parameters:**
- `type`: `github`, `drive`, or `llm`

**Response:**
```json
{
  "secret": "ghp_abc123..."
}
```

---

## 🚨 Error Responses

All errors follow this format:

```json
{
  "error": true,
  "code": "JOB_NOT_FOUND",
  "message": "Job job_123 not found",
  "details": {
    "jobId": "job_123"
  },
  "timestamp": "2025-11-22T10:00:00Z"
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_TOKEN` | 401 | Invalid or expired JWT |
| `UNAUTHORIZED` | 401 | Missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `PROJECT_NOT_FOUND` | 404 | Project doesn't exist |
| `CHAT_NOT_FOUND` | 404 | Chat doesn't exist |
| `JOB_NOT_FOUND` | 404 | Job doesn't exist |
| `INVALID_REQUEST` | 400 | Invalid request body |
| `INVALID_STATE_TRANSITION` | 400 | Invalid job state change |
| `JOB_ALREADY_CLAIMED` | 409 | Job is already claimed |
| `KV_WRITE_FAILED` | 500 | Database write failed |
| `ENCRYPTION_FAILED` | 500 | Encryption/decryption failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 📊 Rate Limits

Cloudflare Pages Functions free tier:
- **100,000 requests per day**
- **10ms CPU time per request** (typically enough)
- No hard rate limits, but avoid abuse

Workers KV free tier:
- **1 GB storage**
- **100,000 read operations per day**
- **1,000 write operations per day**

---

## 🔄 Job Lifecycle

```
pending → claimed → running → completed
                           → failed
```

### State Transitions
- `pending` → `claimed`: Colab claims the job
- `claimed` → `running`: Colab starts processing
- `running` → `completed`: Job succeeds
- `running` → `failed`: Job fails
- `failed` → `pending`: Manual retry

### Claim Expiry
- Jobs claimed for 30 minutes without completion automatically fail
- Allows re-claiming by another Colab agent

---

## 🔐 Security Best Practices

1. **Never expose secrets in frontend**
   - All secrets stored encrypted in KV
   - Only accessible via backend or Colab with proper auth

2. **Session tokens**
   - Short-lived (1-2 hours)
   - Signed with SESSION_SECRET
   - Verify on every request

3. **Claim tokens**
   - One-time use only
   - 5-minute expiry
   - Required for secret retrieval

4. **CORS**
   - Strict origin checking
   - Only dashboard domain allowed
   - Colab requests bypass (no Origin header)

5. **Audit logging**
   - All operations logged
   - Structured JSON format
   - Includes timestamps and metadata

---

## 📝 Usage Examples

### Example: Dashboard Flow

```javascript
// 1. List projects
const projects = await fetch('https://mrx-backend.pages.dev/api/projects', {
  headers: { 'Authorization': 'Bearer ' + token }
});

// 2. Create a chat
const chat = await fetch('https://mrx-backend.pages.dev/api/projects/weather-app/chats', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'New feature',
    initialMessage: 'Add dark mode'
  })
});

// 3. Poll for logs
const pollLogs = async (jobId) => {
  let cursor = 0;
  while (true) {
    const response = await fetch(
      `https://mrx-backend.pages.dev/api/jobs/${jobId}/logs?cursor=${cursor}`,
      { headers: { 'Authorization': 'Bearer ' + token } }
    );
    const { data, cursor: nextCursor, hasMore } = await response.json();
    
    // Display logs
    data.forEach(log => console.log(log.message));
    
    if (!hasMore) break;
    cursor = nextCursor;
    await sleep(2000); // Poll every 2 seconds
  }
};
```

### Example: Colab Flow

```python
import requests

BACKEND_URL = 'https://mrx-backend.pages.dev'
COLAB_ID = 'colab-agent-1'
COLAB_SECRET = 'your-secret'

# 1. Claim a job
response = requests.post(f'{BACKEND_URL}/api/jobs/claim', headers={
    'X-Colab-Id': COLAB_ID,
    'X-Colab-Secret': COLAB_SECRET
})
data = response.json()

if data['job']:
    job = data['job']
    claim_token = data['claimToken']
    
    # 2. Get secrets
    secrets = requests.get(
        f'{BACKEND_URL}/api/admin/secrets/{job["projectId"]}?type=github',
        headers={
            'X-Colab-Id': COLAB_ID,
            'X-Claim-Token': claim_token
        }
    ).json()
    
    github_token = secrets['secret']
    
    # 3. Update job state
    requests.patch(f'{BACKEND_URL}/api/jobs/{job["jobId"]}', 
        headers={
            'X-Colab-Id': COLAB_ID,
            'X-Colab-Secret': COLAB_SECRET,
            'Content-Type': 'application/json'
        },
        json={'state': 'running'}
    )
    
    # 4. Append logs
    requests.post(f'{BACKEND_URL}/api/jobs/{job["jobId"]}/logs',
        headers={
            'X-Colab-Id': COLAB_ID,
            'X-Colab-Secret': COLAB_SECRET,
            'Content-Type': 'application/json'
        },
        json={
            'timestamp': '2025-11-22T10:00:00Z',
            'level': 'info',
            'message': 'Starting build...'
        }
    )
```

---

This API documentation provides everything needed to integrate with the MrX Backend! 🚀
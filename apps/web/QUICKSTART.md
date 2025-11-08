# Quick Start Guide - Real Data Integration

## 🚀 Get Started in 3 Steps

### Step 1: Configure Environment
```bash
cd apps/web
cp .env.local.example .env.local
```

Edit `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Step 2: Ensure Backend is Running
Your backend API must be running and accessible. Test it:
```bash
curl http://localhost:3001/health
# Should return 200 OK
```

### Step 3: Start the Web App
```bash
pnpm dev
```

Visit: http://localhost:3000

---

## 🧪 Testing Without Authentication

If your backend requires authentication but you want to test quickly, use the dev utilities:

1. Open browser console on your site
2. Run:
```javascript
window.devUtils.setTestAuthToken('your-test-token-here')
```

Or modify your backend to temporarily accept requests without auth.

---

## 📋 Quick Test Checklist

- [ ] Backend API running on port 3001 (or configured port)
- [ ] `.env.local` file created with correct API URL
- [ ] Web app running on port 3000
- [ ] Can visit `/create` page
- [ ] Can submit a URL
- [ ] Redirects to `/progress`
- [ ] Can see `/dashboard` with projects
- [ ] Can view project `/results`

---

## 🐛 Troubleshooting

### "Failed to fetch" errors
```bash
# Check backend is running
curl http://localhost:3001

# Check CORS settings in your backend
# Add to your Fastify config:
# fastify.register(cors, { origin: 'http://localhost:3000' })
```

### Empty dashboard
```bash
# Check if you need authentication
# If yes, set a test token:
window.devUtils.setTestAuthToken('test-token')

# Or check backend logs for auth errors
```

### Backend not processing projects
```bash
# Check your backend worker/queue is running
# Check Redis connection
# Check database connection
# Look at backend logs
```

---

## 🔧 Development Tools

Open browser console and access dev utilities:

```javascript
// Check current auth status
window.devUtils.checkAuth()

// Set test auth token
window.devUtils.setTestAuthToken('your-token')

// Clear all local storage
window.devUtils.clearAllData()

// Check current API URL
window.devUtils.getApiUrl()
```

---

## 📊 Expected Data Flow

1. **Create Project** → Backend creates project record
2. **Queue Job** → Backend queues crawl job
3. **Process** → Backend crawler/worker processes the job
4. **Update Status** → Backend updates project status
5. **Frontend Polls** → Frontend sees updates every 2s
6. **Complete** → User redirected to results

---

## 🎯 Next Steps

1. **Test the full flow** end-to-end
2. **Check backend logs** for any errors
3. **Monitor network tab** in browser DevTools
4. **Implement authentication** if needed
5. **Deploy to production** when ready

---

## 📚 More Information

- See `MIGRATION.md` for detailed documentation
- See `REAL_DATA_SUMMARY.md` for overview
- Check API routes in `apps/api/src/routes/`

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Dashboard shows real projects (not empty)
- ✅ Creating a project redirects to progress
- ✅ Progress page updates in real-time
- ✅ Completed projects show in results
- ✅ Download button appears when ready
- ✅ No console errors
- ✅ Network tab shows successful API calls

Happy coding! 🎉

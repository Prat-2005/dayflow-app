require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');
const cron = require('node-cron');
const webpush = require('web-push');
const { generateReportHtml } = require('./utils/reportGenerator');

const app = express();
app.use(cors());
app.use(express.json());

// ── Resend setup ─────────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

// ── Web Push (VAPID) setup ──────────────────────────────────────────────────
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:dayflow@example.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  console.log('[Push] VAPID keys configured');
} else {
  console.warn('[Push] VAPID keys not found in .env — push notifications disabled');
}

// In-memory stores
const scheduledJobs = {};
const pushSubscriptions = []; // Array of PushSubscription objects

// ─── Email helpers ──────────────────────────────────────────────────────────
async function sendReportEmail(email, subject, htmlContent) {
  try {
    const data = await resend.emails.send({
      from: 'DayFlow <onboarding@resend.dev>',
      to: email,
      subject: subject,
      html: htmlContent,
    });
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// ─── Email report endpoints ─────────────────────────────────────────────────
app.post('/api/report/weekly', async (req, res) => {
  try {
    const { email, tasks, userName } = req.body;
    if (!email || !tasks || !userName) {
      return res.status(400).json({ error: 'Missing required fields: email, tasks, userName' });
    }
    const html = generateReportHtml('weekly', userName, tasks);
    const result = await sendReportEmail(email, 'Your DayFlow Weekly Summary', html);
    res.status(200).json({ success: true, message: 'Weekly report sent', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/report/monthly', async (req, res) => {
  try {
    const { email, tasks, userName } = req.body;
    if (!email || !tasks || !userName) {
      return res.status(400).json({ error: 'Missing required fields: email, tasks, userName' });
    }
    const html = generateReportHtml('monthly', userName, tasks);
    const result = await sendReportEmail(email, 'Your DayFlow Monthly Summary', html);
    res.status(200).json({ success: true, message: 'Monthly report sent', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/report/schedule', (req, res) => {
  const { cron: cronExpr, email, userName, timeframe = 'weekly' } = req.query;

  if (!cronExpr || !email || !userName) {
    return res.status(400).json({ error: 'Missing required query parameters: cron, email, userName' });
  }
  if (!cron.validate(cronExpr)) {
    return res.status(400).json({ error: 'Invalid cron expression' });
  }

  if (scheduledJobs[email]) scheduledJobs[email].stop();

  const job = cron.schedule(cronExpr, async () => {
    console.log(`[CRON] Generating ${timeframe} report for ${email}...`);
    const mockTasks = [];
    const html = generateReportHtml(timeframe, userName, mockTasks);
    try {
      await sendReportEmail(email, `Your DayFlow Scheduled ${timeframe} Summary`, html);
      console.log(`[CRON] Sent ${timeframe} report to ${email}`);
    } catch (err) {
      console.error(`[CRON] Failed to send report:`, err.message);
    }
  });

  scheduledJobs[email] = job;
  res.status(200).json({
    success: true,
    message: `Scheduled ${timeframe} report for ${email} with cron: ${cronExpr}`
  });
});

// ─── Push notification endpoints ────────────────────────────────────────────

// POST /api/push/subscribe — register a push subscription
app.post('/api/push/subscribe', (req, res) => {
  const subscription = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }

  // Avoid duplicates
  const exists = pushSubscriptions.some(s => s.endpoint === subscription.endpoint);
  if (!exists) {
    pushSubscriptions.push(subscription);
    console.log(`[Push] New subscription registered (total: ${pushSubscriptions.length})`);
  }

  res.status(201).json({ success: true, message: 'Subscription registered' });
});

// POST /api/push/send — send a push notification to all subscribers
app.post('/api/push/send', async (req, res) => {
  const { title = 'DayFlow', body = 'Time to check in!' } = req.body;

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icon-512.png',
    badge: '/icon-512.png',
    data: { url: '/' },
  });

  const results = [];
  const expired = [];

  for (let i = 0; i < pushSubscriptions.length; i++) {
    try {
      await webpush.sendNotification(pushSubscriptions[i], payload);
      results.push({ index: i, status: 'sent' });
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        expired.push(i);
        results.push({ index: i, status: 'expired' });
      } else {
        results.push({ index: i, status: 'failed', error: err.message });
      }
    }
  }

  // Remove expired subscriptions (iterate in reverse to avoid index shifts)
  for (let i = expired.length - 1; i >= 0; i--) {
    pushSubscriptions.splice(expired[i], 1);
  }

  console.log(`[Push] Sent to ${results.filter(r => r.status === 'sent').length}/${results.length} subscribers`);
  res.status(200).json({ success: true, results });
});

// ─── Daily 9 AM push cron job ───────────────────────────────────────────────
cron.schedule('0 9 * * *', async () => {
  if (pushSubscriptions.length === 0) {
    console.log('[CRON] No push subscribers — skipping daily reminder');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const payload = JSON.stringify({
    title: 'Good morning! ☀️',
    body: `Time to plan your day in DayFlow! (${today})`,
    icon: '/icon-512.png',
    data: { url: '/' },
  });

  let sent = 0;
  for (const sub of pushSubscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
      sent++;
    } catch (err) {
      console.error('[CRON Push] Failed:', err.message);
    }
  }
  console.log(`[CRON] Daily push sent to ${sent}/${pushSubscriptions.length} subscribers`);
});

// ─── Server start ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`DayFlow Backend listening on port ${PORT}`);
});

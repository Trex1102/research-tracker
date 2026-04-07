/**
 * Supabase Edge Function: send-reminders
 *
 * Called daily (via GitHub Actions cron or Supabase pg_cron).
 * Checks all entries for upcoming deadlines and sends email reminders
 * at 30, 15, 10, 5, 3, and 1 day(s) before each deadline.
 *
 * Email provider: Resend (swap to SendGrid by changing sendEmail())
 * Auth: Expects Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY> header
 *       OR the cron secret in CRON_SECRET env var (passed as ?secret=xxx)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const REMINDER_DAYS = [30, 15, 10, 5, 3, 1]

const DEADLINE_FIELDS = [
  { key: 'abstract_deadline', label: 'Abstract Deadline' },
  { key: 'full_paper_deadline', label: 'Full Paper Deadline' },
  { key: 'notification_date', label: 'Notification Date' },
  { key: 'camera_ready_deadline', label: 'Camera-Ready Deadline' },
  { key: 'conference_date', label: 'Conference / Publication Date' },
]

// Status labels for email
const STATUS_LABELS: Record<string, string> = {
  'idea': 'Idea', 'topic-decided': 'Topic Decided', 'literature-review': 'Literature Review',
  'experiment-ongoing': 'Experiment Ongoing', 'paper-writing': 'Paper Writing',
  'submitted': 'Submitted', 'under-review': 'Under Review',
  'revision-requested': 'Revision Requested', 'revision-submitted': 'Revision Submitted',
  'accepted': 'Accepted', 'camera-ready': 'Camera Ready',
  'presented-published': 'Presented / Published', 'rejected': 'Rejected', 'dropped': 'Dropped',
}

function daysBetween(date1: Date, date2: Date): number {
  return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24))
}

async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  resendApiKey: string
  fromEmail: string
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${opts.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: opts.fromEmail,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    return { ok: false, error: body }
  }
  return { ok: true }
}

function buildEmailHtml(opts: {
  entryName: string
  deadlineLabel: string
  deadlineDate: string
  daysRemaining: number
  status: string
  appUrl: string
  entryId: string
}): string {
  const urgencyColor = opts.daysRemaining <= 3 ? '#dc2626' :
                       opts.daysRemaining <= 7 ? '#ea580c' :
                       opts.daysRemaining <= 15 ? '#ca8a04' : '#16a34a'

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f9fafb;margin:0;padding:20px">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="background:#4f46e5;padding:24px 32px">
      <h1 style="color:white;font-size:20px;font-weight:600;margin:0">📅 Research Tracker Reminder</h1>
    </div>
    <div style="padding:32px">
      <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px">
        <h2 style="font-size:18px;font-weight:600;color:#111827;margin:0 0 8px">${opts.entryName}</h2>
        <p style="color:#6b7280;font-size:14px;margin:0">Status: <strong style="color:#374151">${STATUS_LABELS[opts.status] || opts.status}</strong></p>
      </div>

      <div style="background:${urgencyColor}15;border:1px solid ${urgencyColor}30;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center">
        <p style="font-size:14px;color:#374151;margin:0 0 8px">${opts.deadlineLabel}</p>
        <p style="font-size:32px;font-weight:700;color:${urgencyColor};margin:0">${opts.daysRemaining}</p>
        <p style="font-size:14px;color:${urgencyColor};margin:4px 0 8px">${opts.daysRemaining === 1 ? 'day' : 'days'} remaining</p>
        <p style="font-size:13px;color:#6b7280;margin:0">Due: ${opts.deadlineDate}</p>
      </div>

      <a href="${opts.appUrl}/entries/${opts.entryId}"
         style="display:block;text-align:center;background:#4f46e5;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
        View Entry →
      </a>

      <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:24px">
        You're receiving this because you have a Research Tracker account.<br>
        Manage reminders in your <a href="${opts.appUrl}/profile" style="color:#6366f1">profile settings</a>.
      </p>
    </div>
  </div>
</body>
</html>`
}

Deno.serve(async (req: Request) => {
  // CORS for browser testing
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Auth: check cron secret or service role
    const url = new URL(req.url)
    const cronSecret = Deno.env.get('CRON_SECRET')
    const authHeader = req.headers.get('Authorization')

    if (cronSecret) {
      const providedSecret = url.searchParams.get('secret') ||
        req.headers.get('x-cron-secret')
      if (providedSecret !== cronSecret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    // Env vars
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'Research Tracker <reminders@yourdomain.com>'
    const appUrl = Deno.env.get('APP_URL') || 'https://yourusername.github.io/research-tracker'

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Supabase admin client (bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fetch all non-terminal entries with at least one deadline
    const { data: entries, error: fetchError } = await supabase
      .from('entries')
      .select('*')
      .not('status', 'in', '("rejected","dropped","presented-published")')

    if (fetchError) throw fetchError

    // Build a user_id → email map via profiles table
    const userIds = [...new Set((entries || []).map(e => e.user_id))]
    const emailMap: Record<string, string> = {}

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds)
      for (const p of (profiles || [])) {
        if (p.email) emailMap[p.id] = p.email
      }
    }

    const results: { entry: string; deadline: string; days: number; sent: boolean; error?: string }[] = []

    for (const entry of (entries || [])) {
      const userEmail = emailMap[entry.user_id]
      if (!userEmail) continue

      const remindersSent: Record<string, Record<string, string>> = entry.reminders_sent || {}
      let updated = false

      for (const { key, label } of DEADLINE_FIELDS) {
        if (!entry[key]) continue

        const deadlineDate = new Date(entry[key])
        deadlineDate.setHours(0, 0, 0, 0)
        const daysUntil = daysBetween(today, deadlineDate)

        if (daysUntil < 0 || daysUntil > 30) continue
        if (!REMINDER_DAYS.includes(daysUntil)) continue

        // Check if reminder already sent for this deadline+days
        const sentKey = String(daysUntil)
        if (remindersSent[key]?.[sentKey]) continue

        // Send email
        const html = buildEmailHtml({
          entryName: entry.name,
          deadlineLabel: label,
          deadlineDate: deadlineDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          daysRemaining: daysUntil,
          status: entry.status,
          appUrl,
          entryId: entry.id,
        })

        const subject = `⏰ ${entry.name} — ${label} in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`
        const { ok, error: emailError } = await sendEmail({
          to: userEmail,
          subject,
          html,
          resendApiKey,
          fromEmail,
        })

        results.push({ entry: entry.name, deadline: key, days: daysUntil, sent: ok, error: emailError })

        if (ok) {
          // Mark as sent
          if (!remindersSent[key]) remindersSent[key] = {}
          remindersSent[key][sentKey] = new Date().toISOString()
          updated = true
        }
      }

      // Persist updated reminders_sent
      if (updated) {
        await supabase
          .from('entries')
          .update({ reminders_sent: remindersSent })
          .eq('id', entry.id)
      }
    }

    const sent = results.filter(r => r.sent).length
    const failed = results.filter(r => !r.sent).length

    return new Response(JSON.stringify({
      ok: true,
      checked: (entries || []).length,
      reminders_sent: sent,
      reminders_failed: failed,
      details: results,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-reminders error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

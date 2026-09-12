const CHARS_PER_TOKEN = { Claude: 3.8, ChatGPT: 4.0, Gemini: 3.9, Other: 4.0 };
const REPORT_HOUR_LOCAL = 21; // 9 PM local time, daily
const DEFAULT_RATES = { rateClaude: 9.0, rateChatGPT: 7.0, rateGemini: 7.0 }; // $ per million tokens, blended

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

async function getLog() {
  const res = await chrome.storage.local.get('log');
  return res.log || {};
}

async function setLog(log) {
  await chrome.storage.local.set({ log });
}

async function getSettings() {
  const res = await chrome.storage.local.get('settings');
  return res.settings || {};
}

// --- Listen for token activity from content scripts ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'LOG_CHARS') {
    (async () => {
      const tokens = Math.max(1, Math.round(msg.chars / (CHARS_PER_TOKEN[msg.service] || 4.0)));
      const log = await getLog();
      const key = todayKey();
      if (!log[key]) log[key] = {};
      log[key][msg.service] = (log[key][msg.service] || 0) + tokens;
      await setLog(log);
    })();
  } else if (msg.type === 'SEND_REPORT_NOW') {
    (async () => {
      const ok = await sendReportForDate(todayKey());
      sendResponse({ ok });
    })();
    return true; // async response
  } else if (msg.type === 'GET_TODAY') {
    (async () => {
      const log = await getLog();
      sendResponse(log[todayKey()] || {});
    })();
    return true;
  }
});

// --- Daily alarm scheduling ---
function msUntilNextReportHour() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(REPORT_HOUR_LOCAL, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('dailyReport', {
    delayInMinutes: msUntilNextReportHour() / 60000,
    periodInMinutes: 1440
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReport') {
    sendReportForDate(todayKey());
  }
});

// --- Email sending via EmailJS ---
async function sendReportForDate(dateKey) {
  const settings = await getSettings();
  if (!settings.serviceId || !settings.templateId || !settings.publicKey || !settings.recipientEmail) {
    console.warn('Token Ledger: EmailJS not configured yet.');
    return false;
  }

  const log = await getLog();
  const totals = log[dateKey] || {};
  const total = Object.values(totals).reduce((a, b) => a + b, 0);

  const rateClaude = parseFloat(settings.rateClaude) || DEFAULT_RATES.rateClaude;
  const rateChatGPT = parseFloat(settings.rateChatGPT) || DEFAULT_RATES.rateChatGPT;
  const rateGemini = parseFloat(settings.rateGemini) || DEFAULT_RATES.rateGemini;
  const RATE_LOOKUP = { Claude: rateClaude, ChatGPT: rateChatGPT, Gemini: rateGemini };

  const costFor = (service, tok) => (tok / 1e6) * (RATE_LOOKUP[service] || 0);
  const totalCost = Object.entries(totals).reduce((s, [service, tok]) => s + costFor(service, tok), 0);
  const fmt$ = (n) => '$' + n.toFixed(2);

  const lines = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([service, tok]) => `${service}: ${tok.toLocaleString()} tokens (~${fmt$(costFor(service, tok))})`)
    .join('\n');

  const templateParams = {
    to_email: settings.recipientEmail,
    report_date: dateKey,
    total_tokens: total.toLocaleString(),
    claude_tokens: (totals.Claude || 0).toLocaleString(),
    chatgpt_tokens: (totals.ChatGPT || 0).toLocaleString(),
    gemini_tokens: (totals.Gemini || 0).toLocaleString(),
    total_cost: fmt$(totalCost),
    claude_cost: fmt$(costFor('Claude', totals.Claude || 0)),
    chatgpt_cost: fmt$(costFor('ChatGPT', totals.ChatGPT || 0)),
    gemini_cost: fmt$(costFor('Gemini', totals.Gemini || 0)),
    message: total > 0
      ? `Your AI token usage for ${dateKey}:\n\n${lines}\n\nTotal: ${total.toLocaleString()} tokens (estimated) — ~${fmt$(totalCost)} estimated cost`
      : `No AI usage was tracked for ${dateKey}.`
  };

  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: settings.serviceId,
        template_id: settings.templateId,
        user_id: settings.publicKey,
        template_params: templateParams
      })
    });
    return res.ok;
  } catch (e) {
    console.error('Token Ledger: email send failed', e);
    return false;
  }
}

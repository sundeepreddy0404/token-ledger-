const DEFAULT_RATES = { rateClaude: '9.00', rateChatGPT: '7.00', rateGemini: '7.00' };

function fmtCost(n) {
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function loadToday() {
  const settingsRes = await chrome.storage.local.get('settings');
  const settings = settingsRes.settings || {};
  const rateClaude = parseFloat(settings.rateClaude || DEFAULT_RATES.rateClaude) || 0;
  const rateChatGPT = parseFloat(settings.rateChatGPT || DEFAULT_RATES.rateChatGPT) || 0;
  const rateGemini = parseFloat(settings.rateGemini || DEFAULT_RATES.rateGemini) || 0;

  chrome.runtime.sendMessage({ type: 'GET_TODAY' }, (totals) => {
    totals = totals || {};
    const claude = totals.Claude || 0;
    const gpt = totals.ChatGPT || 0;
    const gemini = totals.Gemini || 0;
    const total = claude + gpt + gemini;

    document.getElementById('totalNum').textContent = total.toLocaleString();
    document.getElementById('claudeNum').textContent = claude.toLocaleString();
    document.getElementById('gptNum').textContent = gpt.toLocaleString();
    document.getElementById('geminiNum').textContent = gemini.toLocaleString();

    const claudeCost = (claude / 1e6) * rateClaude;
    const gptCost = (gpt / 1e6) * rateChatGPT;
    const geminiCost = (gemini / 1e6) * rateGemini;
    const totalCost = claudeCost + gptCost + geminiCost;

    document.getElementById('totalCost').textContent = fmtCost(totalCost);
    document.getElementById('claudeCost').textContent = fmtCost(claudeCost);
    document.getElementById('gptCost').textContent = fmtCost(gptCost);
    document.getElementById('geminiCost').textContent = fmtCost(geminiCost);
  });
}

async function loadSettings() {
  const res = await chrome.storage.local.get('settings');
  const s = res.settings || {};
  document.getElementById('serviceId').value = s.serviceId || '';
  document.getElementById('templateId').value = s.templateId || '';
  document.getElementById('publicKey').value = s.publicKey || '';
  document.getElementById('recipientEmail').value = s.recipientEmail || '';
  document.getElementById('rateClaude').value = s.rateClaude || DEFAULT_RATES.rateClaude;
  document.getElementById('rateChatGPT').value = s.rateChatGPT || DEFAULT_RATES.rateChatGPT;
  document.getElementById('rateGemini').value = s.rateGemini || DEFAULT_RATES.rateGemini;
  if (!s.serviceId) document.getElementById('settingsBox').style.display = 'block';
}

document.getElementById('settingsToggle').addEventListener('click', () => {
  const box = document.getElementById('settingsBox');
  box.style.display = box.style.display === 'block' ? 'none' : 'block';
});

document.getElementById('saveBtn').addEventListener('click', async () => {
  const settings = {
    serviceId: document.getElementById('serviceId').value.trim(),
    templateId: document.getElementById('templateId').value.trim(),
    publicKey: document.getElementById('publicKey').value.trim(),
    recipientEmail: document.getElementById('recipientEmail').value.trim(),
    rateClaude: document.getElementById('rateClaude').value.trim() || DEFAULT_RATES.rateClaude,
    rateChatGPT: document.getElementById('rateChatGPT').value.trim() || DEFAULT_RATES.rateChatGPT,
    rateGemini: document.getElementById('rateGemini').value.trim() || DEFAULT_RATES.rateGemini
  };
  await chrome.storage.local.set({ settings });
  const status = document.getElementById('status');
  status.textContent = 'Settings saved.';
  setTimeout(() => (status.textContent = ''), 2000);
  loadToday();
});

document.getElementById('sendNowBtn').addEventListener('click', () => {
  const status = document.getElementById('status');
  status.textContent = 'Sending...';
  chrome.runtime.sendMessage({ type: 'SEND_REPORT_NOW' }, (res) => {
    status.textContent = res && res.ok ? 'Report sent ✓' : 'Send failed — check settings.';
    setTimeout(() => (status.textContent = ''), 3000);
  });
});

loadToday();
loadSettings();

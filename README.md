# Token Ledger

A Chrome extension that passively tracks your token usage across **Claude, ChatGPT, and Gemini**, estimates the cost, and emails you a daily report — no copy-pasting, no manual logging.

<p align="center">
  <img src="logo/icon-512.png" width="240" alt="Token Ledger logo">
</p>

## Why

If you use multiple AI chat tools day to day, there's no single place to see how much you're actually using across all of them. Token Ledger sits quietly in the background of your browser and builds that picture for you automatically.

## Features

- **Passive tracking** — watches your Claude, ChatGPT, and Gemini tabs and estimates token usage as you chat, with nothing to paste or click.
- **Cost estimation** — converts tracked tokens into an estimated USD spend per service, using editable blended rate presets.
- **Daily email reports** — a full usage + cost summary lands in your inbox every night, sent via [EmailJS](https://www.emailjs.com/) (no backend server required).
- **Local-first** — all usage data is stored in your browser via `chrome.storage.local`. Nothing is sent anywhere except the nightly report you configure.
- **Minimal, monochrome UI** — no accent colors, just a clean black-and-white popup.

## Installation

1. Clone or download this repo.
2. Go to `chrome://extensions` in Chrome (or any Chromium-based browser).
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select this folder.
5. Pin the extension from the toolbar puzzle-piece icon.

## Setup: email delivery

Token Ledger uses [EmailJS](https://www.emailjs.com/) to send reports directly from the browser — no server needed.

1. Create a free account at **emailjs.com**.
2. Add an email service (e.g. Gmail) under **Email Services** → this gives you a **Service ID**.
3. Create a template under **Email Templates** with these variables in the body:
   `{{report_date}}`, `{{total_tokens}}`, `{{claude_tokens}}`, `{{chatgpt_tokens}}`, `{{gemini_tokens}}`, `{{total_cost}}`, `{{claude_cost}}`, `{{chatgpt_cost}}`, `{{gemini_cost}}`, `{{message}}` — and set the "To" field to `{{to_email}}`.
   This gives you a **Template ID**.
4. Go to **Account → API Keys** for your **Public Key**.
5. Open the extension popup → **Settings** → fill in, in order: Service ID, Template ID, Public Key, recipient email, then the per-service cost rates → **Save settings**.

Reports send automatically every night at 9 PM local time. Use **"Send today's report now"** in the popup to test it immediately.

## How it works

Rather than hardcoding each site's internal message DOM (which Claude, OpenAI, and Google all restructure often, breaking scrapers within weeks), the extension's content script watches how much new text renders on the page and converts that delta into an estimated token count using per-model characters-per-token ratios (~3.8–4.0 chars/token). The background service worker aggregates these deltas per day and per service, computes an estimated cost from user-set rates, and fires the EmailJS request on a daily `chrome.alarms` schedule.

```
content.js  → watches page text growth on each site, sends char deltas
background.js → converts to token/cost estimates, stores daily totals, sends email via EmailJS
popup.html/js → today's live totals + settings
```

## Limitations

- Token counts are an **estimate**, not each provider's exact tokenizer output.
- Opening a long *old* conversation can register as a small spike, since a lot of existing text renders onto the page at once.
- Cost rates are blended averages of published API pricing for a mid-tier model on each platform — not what you're billed on a flat-fee ChatGPT/Claude/Gemini subscription, and not exact for whatever specific model you're chatting with. Edit the rates in Settings to match your own usage.
- Chrome throttles timers in background/inactive tabs, so heavy multi-tab usage may lag slightly before being counted.

## Privacy

See [PRIVACY.md](PRIVACY.md) for a full breakdown of what data this extension reads, stores, and transmits.

## Tech stack

Vanilla JS, Chrome Extension Manifest V3, `chrome.storage`, `chrome.alarms`, EmailJS REST API. No build step, no dependencies.

## License

MIT — see [LICENSE](LICENSE).

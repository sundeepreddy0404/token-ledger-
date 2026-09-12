# Privacy

Token Ledger is designed to keep everything local by default, and only sends data where you explicitly configure it to.

## What it reads

The content script (`content.js`) runs on `claude.ai`, `chatgpt.com`/`chat.openai.com`, and `gemini.google.com`. It reads `document.body.innerText.length` — the *character count* of visible page text — on a timer. It does **not** read, copy, or transmit the actual text content of your conversations. Only the numeric length is used, to estimate how many new characters (and therefore tokens) appeared.

## What it stores

- Daily token totals per AI service, in `chrome.storage.local` (on your device only).
- Your EmailJS Service ID, Template ID, Public Key, recipient email, and cost-rate settings, also in `chrome.storage.local`.

None of this is synced to any Anthropic, Google, or OpenAI account, and none of it leaves your browser except as described below.

## What it sends, and to whom

Once a day (or when you click "Send today's report now"), the background script sends a request to EmailJS's API (`api.emailjs.com`) containing:

- The date
- Token totals and estimated cost, per service and total

This request includes your EmailJS Service ID, Template ID, and Public Key (which you provide) so EmailJS can route the email to the address you configured. EmailJS's own handling of this data is governed by [their privacy policy](https://www.emailjs.com/legal/privacy-policy/) — this extension does not control what EmailJS does after the request is sent.

No data is sent to any other third party. There is no analytics, telemetry, or tracking of any kind beyond this.

## Uninstalling

Removing the extension deletes all locally stored data (`chrome.storage.local` is cleared automatically by Chrome on uninstall).

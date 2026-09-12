(function () {
  const host = location.hostname;
  let SERVICE = 'Other';
  if (host.includes('claude.ai')) SERVICE = 'Claude';
  else if (host.includes('chatgpt.com') || host.includes('chat.openai.com')) SERVICE = 'ChatGPT';
  else if (host.includes('gemini.google.com')) SERVICE = 'Gemini';

  let lastLen = document.body.innerText.length;

  function poll() {
    const len = document.body.innerText.length;
    const delta = len - lastLen;
    lastLen = len;

    // Only count reasonable positive growth. Negative deltas (nav, cleared UI)
    // and huge jumps (opening a long old thread) are ignored to reduce noise.
    if (delta > 3 && delta < 20000) {
      chrome.runtime.sendMessage({ type: 'LOG_CHARS', service: SERVICE, chars: delta });
    }
  }

  setInterval(poll, 2500);
})();

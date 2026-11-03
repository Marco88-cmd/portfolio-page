// src/utils.js: small helpers that keep text from the database safe on the page.

// Turns characters like < and " into harmless text before it goes into HTML.
export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

// Only allows normal web links (http or https), so a link can never run code.
export function safeUrl(u) {
  return /^https?:\/\//i.test(String(u)) ? String(u) : '#'
}

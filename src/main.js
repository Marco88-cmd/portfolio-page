// src/main.js: the portfolio page. Loads projects from Supabase and draws the cards.
// The CSS is linked from index.html, so it is not imported here.
import { supabase } from './supabase.js'
import { esc, safeUrl } from './utils.js'

// Colors for the preview of a project that has no screenshot.
const DEFAULT_COLORS = { bg: '#1b1d27', fg: '#eef0f4', accent: '#ffc533' }

// Backup list: shown if the database is empty, paused or unreachable.
// Change the links to your real Vercel URLs.
const backup = [
  {
    title: 'Hydra One',
    type: 'Product landing page',
    description: 'A launch page for a smart water bottle, with a pre-order form and a light and dark theme.',
    url: 'https://hydra-one-demo.vercel.app',
    image_url: null,
    colors: { bg: '#0d1e27', fg: '#e8f3f2', accent: '#5ad1d9' },
  },
  {
    title: 'Marlow & Son Barbershop',
    type: 'Local business site',
    description: 'A one-page site for a neighborhood barbershop, with a price list and opening hours.',
    url: 'https://marlow-barbershop-demo.vercel.app',
    image_url: null,
    colors: { bg: '#12233f', fg: '#f3f6fb', accent: '#ff6a5c' },
  },
]

async function loadProjects() {
  if (!supabase) return backup
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
  if (error) console.warn('Could not load projects:', error.message)
  return error || !data || data.length === 0 ? backup : data
}

function preview(p) {
  if (p.image_url) {
    return `<img src="${esc(safeUrl(p.image_url))}" alt="Screenshot of ${esc(p.title)}" loading="lazy" class="aspect-[16/10] w-full object-cover">`
  }
  const c = p.colors || DEFAULT_COLORS
  return `<div class="aspect-[16/10] w-full p-6" style="background:${c.bg}" role="img" aria-label="Preview of ${esc(p.title)}">
    <div class="h-2 w-16 rounded" style="background:${c.fg};opacity:.6"></div>
    <div class="mt-8 h-5 w-3/4 rounded" style="background:${c.fg}"></div>
    <div class="mt-3 h-5 w-1/2 rounded" style="background:${c.fg}"></div>
    <div class="mt-8 h-8 w-28 rounded-full" style="background:${c.accent}"></div></div>`
}

function card(p) {
  const link = safeUrl(p.url)
  const host = link.replace(/^https?:\/\//, '')
  return `<article class="overflow-hidden rounded-xl border border-line bg-page">
    <div class="flex items-center gap-2 border-b border-line px-4 py-3">
      <span class="h-3 w-3 rounded-full" style="background:#ff5f57"></span><span class="h-3 w-3 rounded-full" style="background:#febc2e"></span><span class="h-3 w-3 rounded-full" style="background:#28c840"></span>
      <span class="ml-3 truncate text-xs text-muted">${esc(host)}</span>
    </div>
    ${preview(p)}
    <div class="p-6">
      <span class="inline-block rounded bg-accent px-2 py-1 text-xs font-semibold text-onaccent">${esc(p.type)}</span>
      <h3 class="mt-3 font-display text-xl font-bold">${esc(p.title)}</h3>
      <p class="mt-2 text-muted">${esc(p.description)}</p>
      <a href="${esc(link)}" class="mt-4 inline-block font-semibold underline underline-offset-4">View live site</a>
    </div></article>`
}

async function init() {
  const box = document.getElementById('projects')
  box.innerHTML = '<p class="text-muted">Loading projects…</p>'
  const projects = await loadProjects()
  box.innerHTML = projects.map(card).join('')
}
init()

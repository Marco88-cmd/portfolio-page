// src/admin.js: login, add projects with a screenshot, hide/show and delete.
import { supabase } from './supabase.js'
import { esc, safeUrl } from './utils.js'

const BUCKET = 'project-images'
const $ = (id) => document.getElementById(id)
let projects = []

// Shows a message under a form. Errors get a border so they stand out in both themes.
function say(id, text, isError = false) {
  const el = $(id)
  el.textContent = text
  el.className = isError ? 'mt-4 rounded-lg border-2 border-ink p-3 font-semibold' : 'mt-4 text-muted'
}

// Shows the login form or the dashboard, depending on whether you are signed in.
function render(session) {
  $('login').hidden = !!session
  $('dash').hidden = !session
  $('signout').hidden = !session
  if (session) loadList()
}

function row(p) {
  const thumb = p.image_url
    ? `<img src="${esc(safeUrl(p.image_url))}" alt="" class="h-16 w-24 shrink-0 rounded-lg object-cover">`
    : '<div class="h-16 w-24 shrink-0 rounded-lg bg-line"></div>'
  return `<article class="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-4">
    ${thumb}
    <div class="min-w-0 flex-1">
      <h3 class="truncate font-display font-bold">${esc(p.title)}</h3>
      <p class="text-sm text-muted">${esc(p.type)}, ${p.published ? 'visible' : 'hidden'}</p>
    </div>
    <div class="flex gap-2">
      <button type="button" data-action="toggle" data-id="${esc(p.id)}" class="rounded-lg border-2 border-ink px-3 py-2 text-sm font-semibold">${p.published ? 'Hide' : 'Show'}</button>
      <button type="button" data-action="delete" data-id="${esc(p.id)}" class="rounded-lg border-2 border-ink px-3 py-2 text-sm font-semibold">Delete</button>
    </div></article>`
}

async function loadList() {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
  if (error) return say('form-msg', error.message, true)
  projects = data
  $('list').innerHTML = projects.length
    ? projects.map(row).join('')
    : '<p class="text-muted">No projects yet. Add your first one above.</p>'
}

// The file name inside the bucket, taken from the image's public link.
function imagePath(url) {
  return decodeURIComponent(url.split(`/${BUCKET}/`)[1] || '')
}

async function init() {
  if (!supabase) { $('config-msg').hidden = false; return }

  const { data } = await supabase.auth.getSession()
  render(data.session)
  // setTimeout avoids calling Supabase from inside its own auth callback.
  supabase.auth.onAuthStateChange((_event, session) => setTimeout(() => render(session), 0))

  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    say('login-msg', 'Signing in…')
    const { error } = await supabase.auth.signInWithPassword({ email: $('email').value, password: $('password').value })
    if (error) say('login-msg', error.message, true)
    else say('login-msg', '')
  })

  $('signout').addEventListener('click', () => supabase.auth.signOut())

  $('project-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.target
    $('save').disabled = true
    say('form-msg', 'Saving…')
    let path = null
    try {
      let image_url = null
      const file = $('image').files[0]
      if (file) {
        if (file.size > 3 * 1024 * 1024) throw new Error('That image is over 3 MB. Compress it first (Squoosh works well).')
        path = `${crypto.randomUUID()}.${file.type.split('/')[1].replace('jpeg', 'jpg')}`
        const { error: upError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })
        if (upError) throw upError
        image_url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
      }
      const { error } = await supabase.from('projects').insert({
        title: $('title').value.trim(),
        type: $('type').value.trim(),
        description: $('description').value.trim(),
        url: $('url').value.trim(),
        image_url,
        published: $('published').checked,
      })
      if (error) {
        if (path) await supabase.storage.from(BUCKET).remove([path]) // don't leave an unused image behind
        throw error
      }
      form.reset()
      $('published').checked = true
      say('form-msg', 'Project saved.')
      loadList()
    } catch (err) {
      say('form-msg', err.message || 'Something went wrong.', true)
    } finally {
      $('save').disabled = false
    }
  })

  $('list').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]')
    const p = btn && projects.find((x) => x.id === btn.dataset.id)
    if (!p) return
    btn.disabled = true
    if (btn.dataset.action === 'toggle') {
      const { error } = await supabase.from('projects').update({ published: !p.published }).eq('id', p.id)
      if (error) say('form-msg', error.message, true)
    } else if (confirm(`Delete "${p.title}"? This cannot be undone.`)) {
      const { error } = await supabase.from('projects').delete().eq('id', p.id)
      if (error) say('form-msg', error.message, true)
      else if (p.image_url && imagePath(p.image_url)) await supabase.storage.from(BUCKET).remove([imagePath(p.image_url)])
    }
    loadList()
  })
}
init()

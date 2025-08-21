// public/app.js

// --- RÉCUPÉRER & AFFICHER LES NOTES ---
async function fetchNotes() {
  try {
    const res = await fetch('/api/notes');
    if (!res.ok) throw new Error(`GET /api/notes -> ${res.status}`);
    const notes = await res.json();
    renderNotes(notes);
  } catch (err) {
    console.error(err);
    showMsg("Erreur lors du chargement des notes", true);
  }
}

function renderNotes(notes) {
  const ul = document.getElementById('notesList');
  ul.innerHTML = '';
  notes.forEach(n => {
    const li = document.createElement('li');
    const date = new Date(n.created_at).toLocaleString();
    li.innerHTML = `
      <div>${escapeHtml(n.content)}</div>
      <div class="small">#${n.id} • ${date}</div>
      <button class="danger" onclick="deleteNote(${n.id})">🗑️ Supprimer</button>
    `;
    ul.appendChild(li);
  });
}

// --- AJOUTER UNE NOTE ---
document.getElementById('noteForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('content');
  const msg = document.getElementById('msg');
  const content = input.value.trim();
  if (!content) return;

  showMsg('Envoi…');

  try {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (res.ok) {
      input.value = '';
      showMsg('Note ajoutée ✅', false, 1200);
      fetchNotes();
    } else {
      const err = await res.json().catch(() => ({}));
      showMsg('Erreur : ' + (err.error || res.status), true);
    }
  } catch (err) {
    console.error(err);
    showMsg('Erreur réseau', true);
  }
});

// --- SUPPRIMER UNE NOTE ---
async function deleteNote(id) {
  if (!confirm('Voulez-vous vraiment supprimer cette note ?')) return;

  try {
    const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchNotes();
      showMsg('Note supprimée ✅', false, 1200);
    } else {
      const err = await res.json().catch(() => ({}));
      showMsg('Erreur suppression : ' + (err.error || res.status), true);
    }
  } catch (err) {
    console.error(err);
    showMsg('Erreur réseau', true);
  }
}

// --- PETITES UTILITAIRES ---
function showMsg(text, isError = false, autoHideMs = 0) {
  const el = document.getElementById('msg');
  el.textContent = text;
  el.style.color = isError ? '#e74c3c' : '#2ecc71';
  if (autoHideMs) {
    setTimeout(() => { el.textContent = ''; }, autoHideMs);
  }
}

// Échapper le HTML pour éviter l’injection (XSS) basique
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// --- DÉMARRAGE ---
document.addEventListener('DOMContentLoaded', fetchNotes);

// Expose deleteNote pour l’attribut onclick
window.deleteNote = deleteNote;

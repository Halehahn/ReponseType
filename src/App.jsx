import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Plus, Copy, Star, Pencil, Trash2, X, Menu, MessageSquareText, Check, Tag, SlidersHorizontal } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const emptyForm = { title: '', content: '', category_id: '', shortcut: '', tags: '' };
const normalizeSearch = value => (value || '')
  .toLocaleLowerCase('fr')
  .normalize('NFD')
  .replace(/[\\u0300-\\u036f]/g, '')
  .trim();
export default function App() {
  const [responses, setResponses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [copied, setCopied] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const searchRef = useRef(null);

  async function load() {
    if (!supabase) { setError('Connexion Supabase non configurée. Ajoutez les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans Vercel.'); setLoading(false); return; }
    setLoading(true); setError('');
    const [c, r] = await Promise.all([
      supabase.from('rt_categories').select('*').order('name'),
      supabase.from('rt_responses').select('*').order('updated_at', { ascending: false })
    ]);
    if (c.error || r.error) setError(c.error?.message || r.error?.message || 'Impossible de charger les réponses.');
    else { setCategories(c.data || []); setResponses(r.data || []); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const terms = normalizeSearch(query).split(/\\s+/).filter(Boolean);
    return responses
      .map(r => {
        const title = normalizeSearch(r.title);
        const shortcut = normalizeSearch(r.shortcut);
        const tags = (r.tags || []).map(normalizeSearch);
        const content = normalizeSearch(r.content);
        const searchable = [title, shortcut, ...tags, content].join(' ');
        const matches = terms.every(term => searchable.includes(term));
        let score = 0;
        for (const term of terms) {
          if (title.includes(term)) score += title === term ? 14 : 10;
          if (tags.some(tag => tag.includes(term))) score += 7;
          if (shortcut.includes(term)) score += 5;
          if (content.includes(term)) score += 1;
        }
        return { response: r, matches, score };
      })
      .filter(item => item.matches
        && (category === 'all' || item.response.category_id === category)
        && (!favoritesOnly || item.response.is_favorite))
      .sort((a, b) => b.score - a.score || new Date(b.response.updated_at || 0) - new Date(a.response.updated_at || 0))
      .map(item => item.response);
  }, [responses, query, category, favoritesOnly]);

  useEffect(() => {
    const handleSearchShortcut = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === 'Escape' && document.activeElement === searchRef.current) {
        setQuery('');
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, []);

  function openNew() { setEditing(null); setForm(emptyForm); setModal(true); }
  function openEdit(r) { setEditing(r); setForm({ title:r.title || '', content:r.content || '', category_id:r.category_id || '', shortcut:r.shortcut || '', tags:(r.tags || []).join(', ') }); setModal(true); }
  async function save(e) {
    e.preventDefault();
    if (!supabase) return;
    const payload = { title: form.title.trim() || (form.shortcut ? form.shortcut : 'Nouvelle réponse'), content: form.content, category_id: form.category_id || null, shortcut: form.shortcut.trim() || null, tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean), updated_at: new Date().toISOString() };
    const result = editing ? await supabase.from('rt_responses').update(payload).eq('id', editing.id) : await supabase.from('rt_responses').insert(payload);
    if (result.error) { setError(result.error.message); return; }
    setModal(false); await load();
  }
  async function toggleFavorite(r) {
    if (!supabase) return;
    const { error } = await supabase.from('rt_responses').update({ is_favorite: !r.is_favorite, updated_at: new Date().toISOString() }).eq('id', r.id);
    if (error) setError(error.message); else setResponses(old=>old.map(x=>x.id===r.id?{...x,is_favorite:!x.is_favorite}:x));
  }
  async function remove(r) {
    if (!confirm('Supprimer cette réponse type ?')) return;
    const { error } = await supabase.from('rt_responses').delete().eq('id', r.id);
    if (error) setError(error.message); else setResponses(old=>old.filter(x=>x.id!==r.id));
  }
  async function copy(r) {
    try { await navigator.clipboard.writeText(r.content || ''); setCopied(r.id); setTimeout(()=>setCopied(null), 1600); }
    catch { setError('La copie automatique a échoué.'); }
  }
  const count = responses.length;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu?'open':''}`}>
      <div className="brand"><div className="brand-mark"><MessageSquareText size={21}/></div><span>Réponse Type</span><button className="icon-btn mobile-close" onClick={()=>setMobileMenu(false)}><X size={19}/></button></div>
      <button className={`side-link ${category==='all'&&!favoritesOnly?'active':''}`} onClick={()=>{setCategory('all');setFavoritesOnly(false);setMobileMenu(false)}}><MessageSquareText size={18}/> Toutes les réponses <span className="side-count">{count}</span></button>
      <button className={`side-link ${favoritesOnly?'active':''}`} onClick={()=>{setFavoritesOnly(v=>!v);setCategory('all');setMobileMenu(false)}}><Star size={18}/> Favoris</button>
      <div className="side-label">CATÉGORIES</div>
      {categories.map(c=><button key={c.id} className={`side-link ${category===c.id?'active':''}`} onClick={()=>{setCategory(c.id);setFavoritesOnly(false);setMobileMenu(false)}}><span className="category-dot" style={{background:c.color || '#a78bfa'}}/>{c.name}<span className="side-count">{responses.filter(r=>r.category_id===c.id).length}</span></button>)}
      <div className="sidebar-bottom"><div className="sidebar-note">Votre bibliothèque de réponses, toujours à portée de main.</div></div>
    </aside>
    {mobileMenu && <div className="scrim" onClick={()=>setMobileMenu(false)}/>}
    <main className="main">
      <header className="topbar"><button className="icon-btn mobile-menu" onClick={()=>setMobileMenu(true)}><Menu/></button><div className="crumb">Bibliothèque <span>/</span> <b>{favoritesOnly?'Favoris':category==='all'?'Toutes les réponses':categories.find(c=>c.id===category)?.name}</b></div><button className="primary-btn top-add" onClick={openNew}><Plus size={17}/> Nouvelle réponse</button></header>
      <section className="content">
        <div className="page-heading"><div><div className="eyebrow">ESPACE DE TRAVAIL</div><h1>{favoritesOnly?'Vos favoris':category==='all'?'Toutes vos réponses':categories.find(c=>c.id===category)?.name}</h1><p>Retrouvez, organisez et copiez vos réponses en un clic.</p></div><div className="total-pill">{filtered.length} réponse{filtered.length>1?'s':''}</div></div>
        <div className="toolbar"><div className="search-box"><Search size={19}/><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher une réponse, un mot-clé, un raccourci…" aria-label="Rechercher dans les réponses"/>{query&&<button className="clear-search" onClick={()=>setQuery('')} aria-label="Effacer la recherche"><X size={16}/></button>}<kbd className="search-shortcut">Ctrl K</kbd></div><button className={`filter-btn ${favoritesOnly?'selected':''}`} onClick={()=>setFavoritesOnly(v=>!v)}><SlidersHorizontal size={17}/> Favoris</button></div>
        {error && <div className="alert">{error}<button onClick={()=>setError('')}><X size={16}/></button></div>}
        {loading ? <div className="empty-state">Chargement de votre bibliothèque…</div> : filtered.length===0 ? <div className="empty-state"><div className="empty-icon"><MessageSquareText size={25}/></div><h3>Aucune réponse trouvée</h3><p>Essayez une autre recherche ou ajoutez votre première réponse.</p><button className="primary-btn" onClick={openNew}><Plus size={17}/> Ajouter une réponse</button></div> :
          <div className="response-grid">{filtered.map(r=><article className="response-card" key={r.id}>
            <div className="card-top"><span className="category-chip"><span className="category-dot" style={{background:categories.find(c=>c.id===r.category_id)?.color || '#a78bfa'}}/>{categories.find(c=>c.id===r.category_id)?.name || 'Sans catégorie'}</span><button className={`star-btn ${r.is_favorite?'is-favorite':''}`} onClick={()=>toggleFavorite(r)} aria-label="Favori"><Star size={18} fill={r.is_favorite?'currentColor':'none'}/></button></div>
            <h3>{r.title || r.shortcut || 'Réponse sans titre'}</h3>
            {r.shortcut&&<div className="shortcut"><kbd>{r.shortcut}</kbd></div>}
            <p className="preview">{r.content}</p>
            {!!(r.tags||[]).length&&<div className="tags">{r.tags.slice(0,3).map(t=><span key={t}><Tag size={11}/>{t}</span>)}</div>}
            <div className="card-footer"><button className="copy-btn" onClick={()=>copy(r)}>{copied===r.id?<><Check size={16}/> Copié</>:<><Copy size={16}/> Copier la réponse</>}</button><div className="card-actions"><button className="icon-btn" onClick={()=>openEdit(r)} aria-label="Modifier"><Pencil size={16}/></button><button className="icon-btn danger-hover" onClick={()=>remove(r)} aria-label="Supprimer"><Trash2 size={16}/></button></div></div>
          </article>)}</div>}
      </section>
    </main>
    {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><form className="modal" onSubmit={save}><div className="modal-head"><div><div className="eyebrow">{editing?'MODIFICATION':'NOUVELLE ENTRÉE'}</div><h2>{editing?'Modifier la réponse':'Créer une réponse type'}</h2></div><button type="button" className="icon-btn" onClick={()=>setModal(false)}><X/></button></div>
      <label>Titre<input autoFocus value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Ex. Suivi d'un incident"/></label>
      <label>Réponse<textarea required rows="8" value={form.content} onChange={e=>setForm({...form,content:e.target.value})} placeholder="Saisissez votre réponse…"/></label>
      <div className="form-row"><label>Catégorie<select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Sans catégorie</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Raccourci<input value={form.shortcut} onChange={e=>setForm({...form,shortcut:e.target.value})} placeholder="Ex. /incident"/></label></div>
      <label>Tags <span className="muted">(séparés par des virgules)</span><input value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="incident, fibre, suivi"/></label>
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setModal(false)}>Annuler</button><button className="primary-btn" type="submit">Enregistrer</button></div>
    </form></div>}
  </div>;
}

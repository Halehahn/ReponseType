import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Plus, Copy, Star, Pencil, Trash2, X, Menu, MessageSquareText, Check, Tag, SlidersHorizontal, Images, ExternalLink } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const freeboxModels = [{"name":"Freebox Ultra","year":"2024","type":"Fibre","equipment":"Server Ultra, Player TV Free 4K, répéteur Wi-Fi 7","guide":"https://assistance.cdn.scw.iliad.fr/Apercu_UG_Server_Ultra_E011614_0_3e59de40cf.pdf","page":3,"ports":"4 × Ethernet 2,5 Gb/s · SFP 10G LAN · SFP fibre · USB 3.0 · téléphone RJ11 · alimentation USB-C","guideLabel":"Guide officiel Server Ultra"},{"name":"Freebox Ultra Essentiel","year":"2024","type":"Fibre","equipment":"Server Ultra, Player TV en option","guide":"https://assistance.cdn.scw.iliad.fr/Apercu_UG_Server_Ultra_E011614_0_3e59de40cf.pdf","page":3,"ports":"Connectique identique au Server Ultra : 4 × Ethernet 2,5 Gb/s · SFP 10G LAN · SFP fibre · USB 3.0 · RJ11 · USB-C","guideLabel":"Guide officiel Server Ultra"},{"name":"Freebox Pop","year":"2020","type":"Fibre / ADSL","equipment":"Server Pop, Player TV Pop, répéteur Wi-Fi Pop","guide":"https://assistance.cdn.scw.iliad.fr/Userguide_Freebox_Pop_Server_156b8a4c95.pdf","page":2,"ports":"Ethernet 2,5 Gb/s · Ethernet 1 Gb/s · DSL · fibre/SFP · téléphone RJ11 · alimentation","guideLabel":"Guide officiel Server Pop"},{"name":"Freebox Pop S","year":"2024","type":"Fibre","equipment":"Server Pop, sans Player TV inclus","guide":"https://assistance.cdn.scw.iliad.fr/Userguide_Freebox_Pop_Server_156b8a4c95.pdf","page":2,"ports":"Connectique du Server Pop : Ethernet 2,5 Gb/s · Ethernet 1 Gb/s · DSL · fibre/SFP · RJ11 · alimentation","guideLabel":"Guide officiel Server Pop"},{"name":"Freebox Delta","year":"2018","type":"Fibre / ADSL","equipment":"Server Delta, Player Devialet ou Player TV Free 4K","guide":"https://assistance.cdn.scw.iliad.fr/Userguide_Freebox_Delta_Server_ADSL_983f7ec76c.pdf","page":2,"ports":"4 × Ethernet Gigabit · SFP+ 10 Gb/s · USB-A 3.0 · USB-C · RJ11 téléphone · DSL selon version","guideLabel":"Guide officiel Server Delta (ADSL)"},{"name":"Freebox One","year":"2018","type":"Fibre / ADSL","equipment":"Boîtier tout-en-un Server et Player","guide":"https://assistance.cdn.scw.iliad.fr/Userguide_Freebox_One_5fe1cfdc82.pdf","page":2,"ports":"DSL RJ11 · SFP fibre · 4 × Ethernet · USB-C · 2 × USB-A · eSATA · HDMI · TNT · téléphone · audio","guideLabel":"Guide officiel Freebox One"},{"name":"Freebox Révolution","year":"2010","type":"Fibre / ADSL","equipment":"Server Révolution, Player avec lecteur Blu-ray","guide":"https://assistance.cdn.scw.iliad.fr/Guide_Freebox_Revolution_Server_cbb5c0122e.pdf","page":2,"ports":"Ethernet · fibre/SFP ou DSL selon raccordement · USB · eSATA · téléphone · alimentation","guideLabel":"Guide officiel Server Révolution"},{"name":"Freebox Révolution Light","year":"2023","type":"Fibre / ADSL","equipment":"Server Révolution et Player TV","guide":"https://assistance.cdn.scw.iliad.fr/Guide_Freebox_Revolution_Server_cbb5c0122e.pdf","page":2,"ports":"Même famille de Server Révolution : Ethernet · fibre/SFP ou DSL · USB · eSATA · RJ11 · alimentation","guideLabel":"Guide officiel Server Révolution"},{"name":"Freebox mini 4K","year":"2015","type":"Fibre / ADSL","equipment":"Server mini 4K et Player Android TV","guide":"https://assistance.cdn.scw.iliad.fr/UG_Server_Free_Plugs_Mini_4_K_2022_16_Pages_apercu_a6fdbbb7f9.pdf","page":2,"ports":"Ethernet · fibre/SFP ou DSL · USB · téléphone · alimentation 12V (selon version)","guideLabel":"Guide officiel Server mini 4K"},{"name":"Freebox Crystal","year":"2013","type":"ADSL","equipment":"Boîtier ADSL et Player Crystal","guide":"https://assistance.cdn.scw.iliad.fr/Userguide_Freebox_Crystal_ea97268656.pdf","page":2,"ports":"DSL RJ11 · Ethernet · USB · téléphone · alimentation 12V (boîtier Server)","guideLabel":"Guide officiel Freebox Crystal"},{"name":"Freebox HD / V5","year":"2006","type":"ADSL","equipment":"Boîtier ADSL et boîtier HD TV","guide":"https://assistance.cdn.scw.iliad.fr/Userguide_Freebox_Crystal_ea97268656.pdf","page":2,"ports":"Documentation Crystal/HD utile pour la famille V5 ; connectique du Server et du boîtier HD distincte","guideLabel":"Guide officiel famille HD / Crystal"},{"name":"Freebox V4","year":"2004","type":"ADSL","equipment":"Boîtier Freebox V4","guide":null,"page":1,"ports":"Documentation officielle illustrée des ports non retrouvée ; ne pas extrapoler la connectique des modèles ultérieurs","guideLabel":null},{"name":"Freebox V3","year":"2003","type":"ADSL","equipment":"Boîtier Freebox V3","guide":null,"page":1,"ports":"Documentation officielle illustrée des ports non retrouvée ; ne pas extrapoler la connectique des modèles ultérieurs","guideLabel":null},{"name":"Freebox V1 / V2","year":"2002","type":"ADSL","equipment":"Premières générations de boîtiers Freebox","guide":null,"page":1,"ports":"Documentation officielle illustrée des ports non retrouvée ; ne pas extrapoler la connectique des modèles ultérieurs","guideLabel":null}];
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
  const [showGallery, setShowGallery] = useState(false);
  const [galleryQuery, setGalleryQuery] = useState('');
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
      <button className={`side-link ${category==='all'&&!favoritesOnly&&!showGallery?'active':''}`} onClick={()=>{setCategory('all');setFavoritesOnly(false);setShowGallery(false);setMobileMenu(false)}}><MessageSquareText size={18}/> Toutes les réponses <span className="side-count">{count}</span></button>
      <button className={`side-link ${favoritesOnly?'active':''}`} onClick={()=>{setFavoritesOnly(v=>!v);setCategory('all');setShowGallery(false);setMobileMenu(false)}}><Star size={18}/> Favoris</button>
      <button className={`side-link ${showGallery ? "active" : ""}`} onClick={()=>{setShowGallery(true);setMobileMenu(false)}}><Images size={18}/> Photos des Freebox <span className="side-count">{freeboxModels.length}</span></button>
      <div className="side-label">CATÉGORIES</div>
      {categories.map(c=><button key={c.id} className={`side-link ${category===c.id?'active':''}`} onClick={()=>{setCategory(c.id);setFavoritesOnly(false);setShowGallery(false);setMobileMenu(false)}}><span className="category-dot" style={{background:c.color || '#a78bfa'}}/>{c.name}<span className="side-count">{responses.filter(r=>r.category_id===c.id).length}</span></button>)}
      <div className="sidebar-bottom"><div className="sidebar-note">Votre bibliothèque de réponses, toujours à portée de main.</div></div>
    </aside>
    {mobileMenu && <div className="scrim" onClick={()=>setMobileMenu(false)}/>}
    <main className="main">
      <header className="topbar"><button className="icon-btn mobile-menu" onClick={()=>setMobileMenu(true)}><Menu/></button><div className="crumb">Bibliothèque <span>/</span> <b>{showGallery?'Photos des Freebox':favoritesOnly?'Favoris':category==='all'?'Toutes les réponses':categories.find(c=>c.id===category)?.name}</b></div>{!showGallery && <button className="primary-btn top-add" onClick={openNew}><Plus size={17}/> Nouvelle réponse</button>}</header>
      <section className="content">
        {showGallery ? <><div className="page-heading"><div><div className="eyebrow">GUIDE VISUEL DES ÉQUIPEMENTS</div><h1>Photos des Freebox</h1><p>Schémas officiels des connectiques et repérage des ports, avec les guides Free en source.</p></div><div className="total-pill">{freeboxModels.length} modèles</div></div><div className="toolbar"><div className="search-box"><Search size={19}/><input value={galleryQuery} onChange={e=>setGalleryQuery(e.target.value)} placeholder="Rechercher un modèle ou un équipement…"/></div></div><div className="freebox-grid">{freeboxModels.filter(m=>(m.name+" "+m.type+" "+m.equipment).toLocaleLowerCase("fr").includes(galleryQuery.toLocaleLowerCase("fr"))).map((m,i)=><article className="freebox-card" key={m.name}><div className="freebox-visual freebox-port-preview">{m.guide ? <iframe title={`Schéma des ports ${m.name}`} src={`${m.guide}#page=${m.page}&toolbar=0&navpanes=0`} loading="lazy"/> : <div className="freebox-no-guide"><Images size={28}/><span>Schéma officiel non retrouvé</span></div>}</div><div className="freebox-info"><div className="freebox-meta">{m.year} · {m.type}</div><h3>{m.name}</h3><p>{m.equipment}</p><div className="freebox-ports"><strong>Connectique :</strong> {m.ports}</div>{m.guide && <a href={m.guide} target="_blank" rel="noreferrer">{m.guideLabel} <ExternalLink size={13}/></a>}</div></article>)}</div><p className="gallery-note">Les schémas intégrés proviennent des guides officiels Free. Pour les V1 à V4, aucun schéma officiel suffisamment fiable n’a été retrouvé à ce stade.</p></> : <>
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
      </>}
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

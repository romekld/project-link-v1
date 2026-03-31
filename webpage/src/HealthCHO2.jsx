import { useState, useRef, useEffect } from "react";

// ── CONSTANTS ────────────────────────────────────────────────────────────────────
const ADMIN = { email: "admin@cho2.gov.ph", password: "cho2admin", name: "CHO 2 Administrator" };

const CATEGORIES = [
  "Animal Bite","Lying In","Family Planning","Consultation",
  "Immunization","Dental","Laboratory","TB DOTS","Counseling"
];

const CAT_ICONS = {
  "Animal Bite":     "🐾",
  "Lying In":        "🛏️",
  "Family Planning": "👨‍👩‍👧",
  "Consultation":    "🩺",
  "Immunization":    "💉",
  "Dental":          "🦷",
  "Laboratory":      "🔬",
  "TB DOTS":         "💊",
  "Counseling":      "🤝",
};

const BARANGAYS = [
  "Burol I","Burol II","Burol III",
  "Emmanuel Bergado I","Emmanuel Bergado II",
  "Fatima I","Fatima II","Fatima III",
  "Luzviminda I","Luzviminda II",
  "San Andres I","San Andres II",
  "San Antonio De Padua I","San Antonio De Padua II",
  "San Francisco I","San Francisco II",
  "San Lorenzo Ruiz I","San Lorenzo Ruiz II",
  "San Luis I","San Luis II",
  "San Mateo",
  "San Nicolas I","San Nicolas II",
  "San Roque","San Simon",
  "Santa Cristina I","Santa Cristina II",
  "Santa Cruz I","Santa Cruz II",
  "Santa Fe","Santa Maria","Victoria",
];

const SAMPLE_POSTS = [
  {
    id:"p1", category:"Immunization",
    title:"Monthly Immunization Schedule — April 2026",
    content:"Regular immunization services will be conducted every Tuesday and Thursday at all barangay health centers under CHO 2. Please bring your child's immunization card. Vaccines available: BCG, HepB, DPT-HepB-Hib, OPV, IPV, PCV, and MMR.\n\nParents are advised to arrive early to avoid long queues. Free service for all qualified beneficiaries.",
    imageUrl:"https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=700&q=80",
    createdAt: new Date(Date.now()-3600000*2).toISOString(),
  },
  {
    id:"p2", category:"TB DOTS",
    title:"TB DOTS Program: Free Testing and Medication Available",
    content:"The City Health Office 2 is continuously offering FREE TB testing and DOTS (Directly Observed Treatment, Short-course) services. Any resident experiencing persistent cough for 2 weeks or more is encouraged to visit the nearest CHO 2 health facility for sputum examination.\n\nAll medications are provided free of charge courtesy of the DOH.",
    imageUrl:null,
    createdAt: new Date(Date.now()-3600000*10).toISOString(),
  },
  {
    id:"p3", category:"Animal Bite",
    title:"Animal Bite Treatment Center — Updated Operating Hours",
    content:"The Animal Bite Treatment Center under CHO 2 is now open Monday to Saturday, 7:00 AM – 5:00 PM. Anti-rabies vaccine and RIG are available. Patients who have been bitten by animals (dogs, cats, bats, etc.) must report immediately for wound cleaning and vaccination.\n\nDo not wait — early treatment is critical.",
    imageUrl:"https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=700&q=80",
    createdAt: new Date(Date.now()-3600000*26).toISOString(),
  },
];

const genId   = () => Math.random().toString(36).slice(2,9);
const timeAgo = iso => {
  const s = (Date.now()-new Date(iso))/1000;
  if(s<60)     return "just now";
  if(s<3600)   return `${Math.floor(s/60)}m ago`;
  if(s<86400)  return `${Math.floor(s/3600)}h ago`;
  if(s<604800) return `${Math.floor(s/86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"});
};

// ── STYLES ───────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --g900:#064E3B;--g800:#065F46;--g700:#047857;--g600:#059669;
  --g500:#10B981;--g400:#34D399;--g200:#A7F3D0;--g100:#D1FAE5;--g50:#ECFDF5;
  --gray-800:#1F2937;--gray-700:#374151;--gray-600:#4B5563;--gray-500:#6B7280;--gray-400:#9CA3AF;
  --gray-200:#E5E7EB;--gray-100:#F3F4F6;--gray-50:#F9FAFB;
  --white:#FFFFFF;--red:#DC2626;
  --font:'Plus Jakarta Sans',sans-serif;
  --sh:0 1px 3px rgba(6,78,59,.1),0 1px 2px rgba(6,78,59,.06);
  --sh2:0 4px 16px rgba(6,78,59,.12),0 2px 6px rgba(6,78,59,.07);
  --sh3:0 12px 40px rgba(6,78,59,.18);
  --r:10px;--r2:14px;--r3:20px;
  --nav-h:58px;
}
html{-webkit-text-size-adjust:100%}
body{font-family:var(--font);background:var(--g50);color:var(--gray-800);-webkit-font-smoothing:antialiased}
button{cursor:pointer;font-family:var(--font);}
input,textarea,select{font-family:var(--font);}

@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fadeUp .3s ease forwards}
.sc{animation:scaleIn .22s ease forwards}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:none;border-radius:var(--r);
  padding:9px 20px;font-size:13.5px;font-weight:600;transition:all .18s;cursor:pointer;white-space:nowrap}
.btn-green{background:var(--g700);color:#fff}
.btn-green:hover{background:var(--g800);box-shadow:0 4px 14px rgba(5,150,105,.35);transform:translateY(-1px)}
.btn-red{background:var(--red);color:#fff}
.btn-red:hover{background:#B91C1C}
.btn-ghost{background:transparent;border:1.5px solid var(--gray-200);color:var(--gray-600)}
.btn-ghost:hover{background:var(--gray-100)}
.btn-sm{padding:6px 12px;font-size:12px}
.btn-icon{padding:8px;border-radius:8px;background:transparent;border:1.5px solid var(--gray-200);color:var(--gray-600)}
.btn-icon:hover{background:var(--gray-100)}

.card{background:var(--white);border-radius:var(--r2);border:1px solid var(--gray-200);box-shadow:var(--sh)}
.input{width:100%;padding:10px 14px;border:1.5px solid var(--gray-200);border-radius:var(--r);
  font-size:14px;color:var(--gray-800);outline:none;transition:border-color .2s,box-shadow .2s;background:var(--white)}
.input:focus{border-color:var(--g600);box-shadow:0 0 0 3px rgba(5,150,105,.15)}
.overlay{position:fixed;inset:0;background:rgba(6,78,59,.5);backdrop-filter:blur(5px);
  z-index:1000;display:flex;align-items:flex-end;justify-content:center;padding:0;
  overflow-y:auto}
.modal{background:var(--white);box-shadow:var(--sh3);
  width:100%;max-height:95vh;overflow-y:auto;
  border-radius:var(--r3) var(--r3) 0 0;
  animation:slideUp .28s ease forwards}

/* Drop zone */
.drop-zone{border:2px dashed var(--g200);border-radius:var(--r2);padding:28px 20px;
  text-align:center;cursor:pointer;transition:all .2s;background:var(--g50)}
.drop-zone:hover,.drop-zone.drag{border-color:var(--g500);background:var(--g100)}

/* Bottom nav mobile */
.bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:900;
  background:white;border-top:1px solid var(--gray-200);box-shadow:0 -2px 8px rgba(6,78,59,.06);
  padding:6px 0 max(6px, env(safe-area-inset-bottom))}

/* Responsive sidebar drawer */
.sidebar-drawer{position:fixed;inset:0;z-index:800;display:none}
.sidebar-drawer.open{display:block}
.drawer-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.4)}
.drawer-panel{position:absolute;left:0;top:0;bottom:0;width:280px;background:white;
  box-shadow:4px 0 20px rgba(0,0,0,.15);padding:16px 12px;overflow-y:auto;
  animation:slideDrawer .25s ease forwards}
@keyframes slideDrawer{from{transform:translateX(-100%)}to{transform:translateX(0)}}

/* FAB button */
.fab{position:fixed;bottom:80px;right:20px;z-index:700;width:56px;height:56px;
  border-radius:16px;background:var(--g700);color:white;border:none;
  box-shadow:0 6px 20px rgba(5,150,105,.45);display:none;
  align-items:center;justify-content:center;cursor:pointer;transition:all .18s;font-family:var(--font)}
.fab:hover{background:var(--g800);transform:translateY(-2px)}

/* Responsive breakpoints */
@media(min-width:768px){
  .overlay{align-items:center;padding:16px}
  .modal{border-radius:var(--r3);max-width:var(--modal-max,580px);animation:scaleIn .22s ease forwards}
  .bottom-nav{display:none!important}
  .fab{display:none!important}
}

@media(max-width:767px){
  :root{--nav-h:54px}
  .bottom-nav{display:flex;justify-content:space-around;align-items:center}
  .fab{display:flex}
  .sidebar-desktop{display:none!important}
  .fab-actions-wrap{display:none}
  .search-desktop{display:none!important}
  .nav-actions-row{display:none!important}
  .desktop-search-only{display:none!important}
  .nav-new-post-btn{display:none!important}
  .nav-logo-btn{display:none!important}
}

@media(min-width:480px) and (max-width:767px){
  .modal{--modal-padding:22px}
}

@media(max-width:479px){
  .modal{--modal-padding:16px}
  .btn{padding:8px 14px;font-size:13px}
  .btn-sm{padding:5px 10px;font-size:11.5px}
}

/* Tablet adjustments */
@media(min-width:768px) and (max-width:1023px){
  .sidebar-desktop{width:180px!important}
  .nav-actions-row{gap:8px!important}
  .search-desktop{max-width:180px!important}
}

/* Scrollbar styling */
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--gray-200);border-radius:10px}
`;

// ── DEFAULT LOGO ─────────────────────────────────────────────────────────────────
function DefaultLogoMark({ size=34 }) {
  return (
    <div style={{width:size,height:size,borderRadius:size*0.26,flexShrink:0,
      background:"linear-gradient(135deg,var(--g800),var(--g500))",
      display:"flex",alignItems:"center",justifyContent:"center"}}>
      <svg width={size*0.53} height={size*0.53} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    </div>
  );
}

function LogoImg({ src, size=34 }) {
  if (!src) return <DefaultLogoMark size={size}/>;
  return (
    <img src={src} alt="CHO 2 Logo"
      style={{width:size,height:size,borderRadius:size*0.26,objectFit:"contain",
        background:"white",border:"1px solid var(--gray-200)",flexShrink:0}}/>
  );
}

// ── LOGO MODAL ───────────────────────────────────────────────────────────────────
function LogoModal({ currentLogo, onSave, onClose }) {
  const [preview, setPreview]   = useState(currentLogo || null);
  const [dragging, setDragging] = useState(false);
  const [error, setError]       = useState("");
  const fileRef = useRef();

  const processFile = file => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file (PNG, JPG, SVG, etc.)"); return; }
    if (file.size > 5 * 1024 * 1024)    { setError("Image must be smaller than 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const onFileChange = e => processFile(e.target.files[0]);
  const onDrop = e => {
    e.preventDefault(); setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const p = "var(--modal-padding, 22px)";

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal sc" style={{"--modal-max":"460px"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:`20px ${p} 16px`,borderBottom:"1px solid var(--gray-200)",
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h2 style={{fontSize:17,fontWeight:700,color:"var(--g900)"}}>Upload Logo</h2>
            <p style={{fontSize:12,color:"var(--gray-400)",marginTop:2}}>Appears in the navbar and login screen</p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--gray-400)",lineHeight:0,padding:6,borderRadius:8}}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div style={{padding:`20px ${p}`,display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",
            background:"var(--g50)",borderRadius:12,border:"1px solid var(--g200)"}}>
            <div style={{flexShrink:0}}>
              {preview
                ? <img src={preview} alt="preview" style={{width:56,height:56,borderRadius:10,
                    objectFit:"contain",background:"white",border:"1px solid var(--gray-200)"}}/>
                : <DefaultLogoMark size={56}/>}
            </div>
            <div>
              <p style={{fontSize:13,fontWeight:600,color:"var(--g800)"}}>
                {preview ? "Logo preview" : "Default logo"}
              </p>
              <p style={{fontSize:12,color:"var(--gray-400)",marginTop:2}}>
                {preview ? "Looking good! Save to apply." : "Upload an image to replace this."}
              </p>
            </div>
          </div>

          <div
            className={`drop-zone${dragging?" drag":""}`}
            onClick={()=>fileRef.current.click()}
            onDragOver={e=>{e.preventDefault();setDragging(true)}}
            onDragLeave={()=>setDragging(false)}
            onDrop={onDrop}>
            <div style={{marginBottom:10,fontSize:30}}>🖼️</div>
            <p style={{fontSize:14,fontWeight:600,color:"var(--g700)",marginBottom:4}}>
              Click to browse or drag & drop
            </p>
            <p style={{fontSize:12,color:"var(--gray-400)"}}>PNG, JPG, SVG, WebP — max 5 MB</p>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={onFileChange}/>
          </div>

          {error && (
            <div style={{padding:"10px 14px",background:"#FEF2F2",border:"1px solid #FECACA",
              borderRadius:8,fontSize:13,color:"var(--red)"}}>⚠️ {error}</div>
          )}

          <div style={{fontSize:12,color:"var(--gray-400)",lineHeight:1.7,
            padding:"10px 14px",background:"var(--gray-50)",borderRadius:8}}>
            <strong style={{color:"var(--gray-500)"}}>Tips for best results:</strong><br/>
            • Square or circle logos work best<br/>
            • Transparent PNG preferred for clean display<br/>
            • Recommended size: 200×200 px or larger
          </div>
        </div>

        <div style={{padding:`14px ${p} 22px`,borderTop:"1px solid var(--gray-200)",
          display:"flex",gap:10,justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}>
          {currentLogo
            ? <button className="btn btn-ghost btn-sm" style={{color:"var(--red)",borderColor:"#FECACA"}}
                onClick={()=>{onSave(null);onClose();}}>Remove logo</button>
            : <span/>}
          <div style={{display:"flex",gap:10,marginLeft:"auto"}}>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-green btn-sm" disabled={!preview}
              onClick={()=>{onSave(preview);onClose();}}
              style={{opacity:preview?1:0.5,cursor:preview?"pointer":"not-allowed"}}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Apply Logo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CONFIRM MODAL ────────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal sc" style={{"--modal-max":"400px",padding:"28px 24px"}} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center"}}>
          <div style={{width:52,height:52,background:"#FEF2F2",borderRadius:"50%",
            display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="2">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>
          <h3 style={{fontSize:17,fontWeight:700,marginBottom:8}}>{title}</h3>
          <p style={{fontSize:13,color:"var(--gray-400)",lineHeight:1.6,marginBottom:24}}>{message}</p>
          <div style={{display:"flex",gap:10}}>
            <button className="btn btn-ghost" style={{flex:1}} onClick={onCancel}>Cancel</button>
            <button className="btn btn-red"   style={{flex:1}} onClick={onConfirm}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── POST FORM MODAL ──────────────────────────────────────────────────────────────
function PostFormModal({ post, onSave, onClose }) {
  const editing = !!post;
  const [form, setForm] = useState({
    title:    post?.title    || "",
    content:  post?.content  || "",
    category: post?.category || "Consultation",
    imageUrl: post?.imageUrl || "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim())           e.title   = "Title is required";
    else if (form.title.length<5)     e.title   = "At least 5 characters";
    if (!form.content.trim())         e.content = "Content is required";
    else if (form.content.length<10)  e.content = "At least 10 characters";
    if (form.imageUrl && !/^https?:\/\/.+/.test(form.imageUrl)) e.imageUrl = "Enter a valid image URL";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ ...form, imageUrl: form.imageUrl.trim() || null });
  };

  const set = (k,v) => { setForm(p=>({...p,[k]:v})); setErrors(p=>({...p,[k]:undefined})); };

  const p = "var(--modal-padding, 24px)";

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal sc" style={{"--modal-max":"580px"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:`18px ${p} 16px`,borderBottom:"1px solid var(--gray-200)",
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h2 style={{fontSize:17,fontWeight:700,color:"var(--g900)"}}>{editing?"Edit Post":"New Post"}</h2>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--gray-400)",lineHeight:0,padding:6,borderRadius:8}}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div style={{padding:`18px ${p}`,display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:"var(--gray-600)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:".5px"}}>Category</label>
            <select className="input" value={form.category} onChange={e=>set("category",e.target.value)}>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:"var(--gray-600)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:".5px"}}>
              Title <span style={{color:"var(--red)"}}>*</span>
            </label>
            <input className="input" placeholder="Post title…" value={form.title} onChange={e=>set("title",e.target.value)}/>
            {errors.title&&<p style={{fontSize:12,color:"var(--red)",marginTop:4}}>{errors.title}</p>}
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:"var(--gray-600)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:".5px"}}>
              Content <span style={{color:"var(--red)"}}>*</span>
            </label>
            <textarea className="input" rows={5} placeholder="Write your announcement or update…"
              value={form.content} onChange={e=>set("content",e.target.value)} style={{resize:"vertical"}}/>
            {errors.content&&<p style={{fontSize:12,color:"var(--red)",marginTop:4}}>{errors.content}</p>}
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:"var(--gray-600)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:".5px"}}>
              Image URL <span style={{fontSize:11,fontWeight:400,color:"var(--gray-400)",textTransform:"none"}}>(optional)</span>
            </label>
            <input className="input" placeholder="https://…" value={form.imageUrl} onChange={e=>set("imageUrl",e.target.value)}/>
            {errors.imageUrl&&<p style={{fontSize:12,color:"var(--red)",marginTop:4}}>{errors.imageUrl}</p>}
            {form.imageUrl&&!errors.imageUrl&&(
              <img src={form.imageUrl} alt="" onError={()=>set("imageUrl","")}
                style={{marginTop:10,width:"100%",height:130,objectFit:"cover",borderRadius:8}}/>
            )}
          </div>
        </div>

        <div style={{padding:`12px ${p} 20px`,borderTop:"1px solid var(--gray-200)",display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-green" onClick={submit}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <path d="M17 21v-8H7v8M7 3v5h8"/>
            </svg>
            {editing ? "Save Changes" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── POST DETAIL MODAL ────────────────────────────────────────────────────────────
function PostDetailModal({ post, onClose, onEdit, onDelete }) {
  const p = "var(--modal-padding, 22px)";
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal sc" style={{"--modal-max":"620px"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:`18px ${p} 14px`,borderBottom:"1px solid var(--gray-200)",
          display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
          <CatBadge cat={post.category}/>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--gray-400)",lineHeight:0,padding:6,borderRadius:8,flexShrink:0}}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div style={{padding:`18px ${p}`,overflowY:"auto"}}>
          <h2 style={{fontSize:19,fontWeight:700,color:"var(--g900)",marginBottom:8,lineHeight:1.4}}>{post.title}</h2>
          <p style={{fontSize:12,color:"var(--gray-400)",marginBottom:16}}>
            Posted by {ADMIN.name} · {timeAgo(post.createdAt)}
          </p>
          {post.imageUrl&&(
            <img src={post.imageUrl} alt={post.title}
              style={{width:"100%",borderRadius:10,marginBottom:16,maxHeight:300,objectFit:"cover"}}/>
          )}
          <p style={{fontSize:14.5,color:"var(--gray-600)",lineHeight:1.8,whiteSpace:"pre-line"}}>{post.content}</p>
          <div style={{marginTop:20,display:"flex",gap:10,justifyContent:"flex-end",flexWrap:"wrap"}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>onEdit(post)}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
            <button className="btn btn-red btn-sm" onClick={()=>onDelete(post)}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CATEGORY BADGE ───────────────────────────────────────────────────────────────
function CatBadge({ cat }) {
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,
      padding:"4px 10px",borderRadius:20,background:"var(--g100)",
      color:"var(--g800)",fontSize:11.5,fontWeight:700,letterSpacing:".2px"}}>
      <span>{CAT_ICONS[cat]||"📋"}</span>{cat}
    </span>
  );
}

// ── POST CARD ────────────────────────────────────────────────────────────────────
function PostCard({ post, onView, onEdit, onDelete, idx }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="card fu" style={{marginBottom:14,overflow:"hidden",animationDelay:`${idx*0.07}s`,position:"relative"}}>
      {/* Header row: avatar+name LEFT | badge + icon actions RIGHT — never wraps */}
      <div style={{padding:"12px 14px 8px",display:"flex",alignItems:"center",
        justifyContent:"space-between",gap:8}}>

        {/* Left: avatar + author */}
        <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
          <div style={{width:36,height:36,borderRadius:10,flexShrink:0,
            background:"linear-gradient(135deg,var(--g700),var(--g500))",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--g800)",
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ADMIN.name}</div>
            <div style={{fontSize:11,color:"var(--gray-400)"}}>{timeAgo(post.createdAt)}</div>
          </div>
        </div>

        {/* Right: badge + icon buttons (always visible, never wrap) */}
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <CatBadge cat={post.category}/>

          {/* Edit icon button */}
          <button
            title="Edit post"
            onClick={e=>{e.stopPropagation();onEdit(post);}}
            style={{width:32,height:32,borderRadius:8,border:"1.5px solid var(--gray-200)",
              background:"white",color:"var(--gray-500)",display:"flex",alignItems:"center",
              justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--g50)";e.currentTarget.style.borderColor="var(--g400)";e.currentTarget.style.color="var(--g700)"}}
            onMouseLeave={e=>{e.currentTarget.style.background="white";e.currentTarget.style.borderColor="var(--gray-200)";e.currentTarget.style.color="var(--gray-500)"}}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>

          {/* Delete icon button */}
          <button
            title="Delete post"
            onClick={e=>{e.stopPropagation();onDelete(post);}}
            style={{width:32,height:32,borderRadius:8,border:"1.5px solid #FECACA",
              background:"#FEF2F2",color:"var(--red)",display:"flex",alignItems:"center",
              justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="#FEE2E2";e.currentTarget.style.borderColor="#FCA5A5"}}
            onMouseLeave={e=>{e.currentTarget.style.background="#FEF2F2";e.currentTarget.style.borderColor="#FECACA"}}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{padding:"0 14px 12px",cursor:"pointer"}} onClick={()=>onView(post)}>
        <h3 style={{fontSize:15,fontWeight:700,color:"var(--gray-800)",marginBottom:6,lineHeight:1.4}}>{post.title}</h3>
        <p style={{fontSize:13.5,color:"var(--gray-600)",lineHeight:1.65,
          display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
          {post.content}
        </p>
        {post.content.length>220&&(
          <span style={{fontSize:12.5,color:"var(--g600)",fontWeight:600,display:"block",marginTop:4}}>Read more →</span>
        )}
      </div>

      {post.imageUrl&&(
        <div onClick={()=>onView(post)} style={{cursor:"pointer"}}>
          <img src={post.imageUrl} alt={post.title} style={{width:"100%",maxHeight:240,objectFit:"cover"}}/>
        </div>
      )}
    </div>
  );
}

// ── BARANGAY PANEL ───────────────────────────────────────────────────────────────
function BarangayPanel() {
  const [search, setSearch] = useState("");
  const filtered = BARANGAYS.filter(b=>b.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{background:"linear-gradient(135deg,var(--g800),var(--g600))",
        padding:"18px 20px",color:"white",borderRadius:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="1.8">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <path d="M9 22V12h6v10"/>
          </svg>
          <span style={{fontWeight:800,fontSize:15}}>CHO 2 Coverage Area</span>
        </div>
        <p style={{fontSize:12,opacity:.75}}>32 barangays · Dasmariñas, Cavite</p>
      </div>

      <div className="card" style={{padding:"16px"}}>
        <div style={{position:"relative",marginBottom:12}}>
          <svg style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",
            color:"var(--gray-400)"}} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input className="input" placeholder="Search barangay…" value={search}
            onChange={e=>setSearch(e.target.value)}
            style={{paddingLeft:32,fontSize:12,height:34,background:"var(--gray-50)"}}/>
        </div>
        <p style={{fontSize:11,color:"var(--gray-400)",marginBottom:10,fontWeight:600}}>
          {filtered.length} barangay{filtered.length!==1?"s":""}
        </p>
        {/* Responsive grid for barangay list */}
        <div style={{maxHeight:420,overflowY:"auto",
          display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:2}}>
          {filtered.map(b=>(
            <div key={b} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",
              borderRadius:8,transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="var(--g50)"}
              onMouseLeave={e=>e.currentTarget.style.background=""}>
              <span style={{fontSize:11,fontWeight:700,color:"var(--g600)",minWidth:22,textAlign:"right"}}>
                {BARANGAYS.indexOf(b)+1}
              </span>
              <div style={{width:6,height:6,borderRadius:"50%",background:"var(--g400)",flexShrink:0}}/>
              <span style={{fontSize:13,color:"var(--gray-700)",fontWeight:500}}>{b}</span>
            </div>
          ))}
          {filtered.length===0&&(
            <p style={{fontSize:13,color:"var(--gray-400)",textAlign:"center",padding:"20px 0",gridColumn:"1/-1"}}>No results found</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── LOGIN PAGE ───────────────────────────────────────────────────────────────────
function LoginPage({ onLogin, logo }) {
  const [email,    setEmail]    = useState("admin@cho2.gov.ph");
  const [password, setPassword] = useState("cho2admin");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const submit = () => {
    setLoading(true); setError("");
    setTimeout(() => {
      if (email.trim()===ADMIN.email && password===ADMIN.password) onLogin();
      else { setError("Invalid credentials. Please try again."); setLoading(false); }
    }, 500);
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:"linear-gradient(145deg,#064E3B 0%,#065F46 45%,#047857 100%)",
      padding:"20px 16px",position:"relative",overflow:"hidden"}}>
      {/* Background orbs — hidden on small screens */}
      {[[400,400,"15%","-10%"],[250,250,"-5%","60%"],[300,300,"65%","70%"]].map(([w,h,t,l],i)=>(
        <div key={i} style={{position:"absolute",width:w,height:h,top:t,left:l,
          borderRadius:"50%",background:"rgba(255,255,255,0.04)"}}/>
      ))}

      <div style={{width:"100%",maxWidth:400,position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          {logo ? (
            <div style={{width:72,height:72,margin:"0 auto 12px",borderRadius:18,overflow:"hidden",
              background:"rgba(255,255,255,0.95)",display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:"0 8px 24px rgba(0,0,0,0.2)"}}>
              <img src={logo} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
            </div>
          ) : (
            <div style={{width:64,height:64,background:"rgba(255,255,255,0.18)",borderRadius:18,
              display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",
              backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.25)"}}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
          )}
          <h1 style={{color:"white",fontSize:22,fontWeight:800,letterSpacing:"-0.3px",marginBottom:4}}>
            City Health Office 2
          </h1>
          <p style={{color:"rgba(255,255,255,0.65)",fontSize:13}}>Dasmariñas, Cavite — Admin Portal</p>
        </div>

        <div style={{background:"rgba(255,255,255,0.97)",borderRadius:20,padding:"28px 24px",
          boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
          <h2 style={{fontSize:17,fontWeight:700,color:"var(--g900)",marginBottom:4}}>Administrator Login</h2>
          <p style={{fontSize:13,color:"var(--gray-400)",marginBottom:20}}>Authorized personnel only</p>

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"var(--gray-600)",display:"block",marginBottom:6,
                textTransform:"uppercase",letterSpacing:".5px"}}>Email</label>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="admin@cho2.gov.ph"/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"var(--gray-600)",display:"block",marginBottom:6,
                textTransform:"uppercase",letterSpacing:".5px"}}>Password</label>
              <input className="input" type="password" value={password}
                onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
            </div>
          </div>

          {error&&<div style={{marginTop:12,padding:"10px 14px",background:"#FEF2F2",
            border:"1px solid #FECACA",borderRadius:8,fontSize:13,color:"var(--red)"}}>{error}</div>}

          <button className="btn btn-green" onClick={submit} disabled={loading}
            style={{width:"100%",marginTop:18,padding:"12px",fontSize:14,borderRadius:10}}>
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <p style={{fontSize:11,color:"var(--gray-400)",textAlign:"center",marginTop:12}}>
            Default: admin@cho2.gov.ph / cho2admin
          </p>
        </div>
      </div>
    </div>
  );
}

// ── MOBILE SEARCH BAR ─────────────────────────────────────────────────────────────
function MobileSearchBar({ value, onChange }) {
  return (
    <div style={{padding:"8px 14px",background:"white",borderBottom:"1px solid var(--gray-200)"}}>
      <div style={{position:"relative"}}>
        <svg style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--gray-400)"}}
          width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input className="input" placeholder="Search posts…" value={value}
          onChange={e=>onChange(e.target.value)}
          style={{paddingLeft:32,height:36,fontSize:13,background:"var(--g50)"}}/>
        {value && (
          <button onClick={()=>onChange("")}
            style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
              background:"none",border:"none",color:"var(--gray-400)",lineHeight:0,padding:0,cursor:"pointer"}}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── SIDEBAR CONTENT ───────────────────────────────────────────────────────────────
function SidebarContent({ activeFilter, setActiveFilter, posts, onClose }) {
  return (
    <>
      {onClose && (
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,paddingBottom:12,
          borderBottom:"1px solid var(--gray-100)"}}>
          <span style={{fontSize:14,fontWeight:700,color:"var(--g900)"}}>Filter by Service</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--gray-400)",lineHeight:0,cursor:"pointer"}}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}
      <div className="card" style={{padding:"12px 10px",marginBottom:12}}>
        <p style={{fontSize:11,fontWeight:800,color:"var(--gray-400)",letterSpacing:".06em",
          textTransform:"uppercase",marginBottom:8,paddingLeft:6}}>Services</p>
        <button onClick={()=>{setActiveFilter(null);onClose&&onClose();}}
          style={{width:"100%",textAlign:"left",padding:"7px 10px",borderRadius:8,border:"none",
            fontSize:13,fontWeight:activeFilter?400:700,cursor:"pointer",marginBottom:2,
            background:!activeFilter?"var(--g100)":"transparent",
            color:!activeFilter?"var(--g800)":"var(--gray-600)",transition:"all .15s",fontFamily:"var(--font)"}}>
          📋 All Posts
        </button>
        {CATEGORIES.map(cat=>(
          <button key={cat} onClick={()=>{setActiveFilter(cat===activeFilter?null:cat);onClose&&onClose();}}
            style={{width:"100%",textAlign:"left",padding:"7px 10px",borderRadius:8,border:"none",
              fontSize:13,fontWeight:activeFilter===cat?700:400,cursor:"pointer",marginBottom:2,
              background:activeFilter===cat?"var(--g100)":"transparent",
              color:activeFilter===cat?"var(--g800)":"var(--gray-600)",transition:"all .15s",
              display:"flex",alignItems:"center",gap:8,fontFamily:"var(--font)"}}>
            <span>{CAT_ICONS[cat]}</span>{cat}
          </button>
        ))}
      </div>

      <div className="card" style={{padding:"12px 14px"}}>
        <p style={{fontSize:11,fontWeight:800,color:"var(--gray-400)",letterSpacing:".06em",
          textTransform:"uppercase",marginBottom:8}}>Overview</p>
        {[
          {label:"Total Posts",val:posts.length,col:"var(--g700)"},
          {label:"This Week",val:posts.filter(p=>Date.now()-new Date(p.createdAt)<604800000).length,col:"var(--g600)"},
        ].map(s=>(
          <div key={s.label} style={{display:"flex",justifyContent:"space-between",
            alignItems:"center",marginBottom:6,paddingBottom:6,borderBottom:"1px solid var(--gray-100)"}}>
            <span style={{fontSize:12,color:"var(--gray-500)"}}>{s.label}</span>
            <span style={{fontSize:16,fontWeight:800,color:s.col}}>{s.val}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn,     setLoggedIn]     = useState(false);
  const [logo,         setLogo]         = useState(null);
  const [posts,        setPosts]        = useState(SAMPLE_POSTS);
  const [activeFilter, setActiveFilter] = useState(null);
  const [search,       setSearch]       = useState("");
  const [modal,        setModal]        = useState(null);
  const [activeTab,    setActiveTab]    = useState("feed");
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [showSearch,   setShowSearch]   = useState(false);

  if (!loggedIn) return (
    <>
      <style>{css}</style>
      <LoginPage onLogin={()=>setLoggedIn(true)} logo={logo}/>
    </>
  );

  const filtered = posts
    .filter(p => {
      const mCat = !activeFilter || p.category===activeFilter;
      const mSrc = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase());
      return mCat && mSrc;
    })
    .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  const handleCreate = form => { setPosts(p=>[{id:genId(),...form,createdAt:new Date().toISOString()},...p]); setModal(null); };
  const handleEdit   = form => { setPosts(p=>p.map(x=>x.id===modal.post.id?{...x,...form}:x)); setModal(null); };
  const handleDelete = ()   => { setPosts(p=>p.filter(x=>x.id!==modal.post.id)); setModal(null); };

  return (
    <>
      <style>{css}</style>

      {/* ── MODALS ── */}
      {modal?.type==="logo"&&(
        <LogoModal currentLogo={logo} onSave={setLogo} onClose={()=>setModal(null)}/>
      )}
      {modal?.type==="create"&&(
        <PostFormModal onSave={handleCreate} onClose={()=>setModal(null)}/>
      )}
      {modal?.type==="edit"&&(
        <PostFormModal post={modal.post} onSave={handleEdit} onClose={()=>setModal(null)}/>
      )}
      {modal?.type==="view"&&(
        <PostDetailModal post={modal.post} onClose={()=>setModal(null)}
          onEdit={p=>setModal({type:"edit",post:p})}
          onDelete={p=>setModal({type:"delete",post:p})}/>
      )}
      {modal?.type==="delete"&&(
        <ConfirmModal
          title="Delete this post?"
          message="This will permanently remove the post. This action cannot be undone."
          onConfirm={handleDelete} onCancel={()=>setModal(null)}/>
      )}

      {/* ── MOBILE SIDEBAR DRAWER ── */}
      <div className={`sidebar-drawer${drawerOpen?" open":""}`}>
        <div className="drawer-backdrop" onClick={()=>setDrawerOpen(false)}/>
        <div className="drawer-panel">
          <SidebarContent
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            posts={posts}
            onClose={()=>setDrawerOpen(false)}/>
        </div>
      </div>

      {/* ── FAB (Mobile New Post) ── */}
      <button className="fab" onClick={()=>setModal({type:"create"})}>
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>

      <div style={{minHeight:"100vh",background:"var(--g50)",paddingBottom:"env(safe-area-inset-bottom)"}}>

        {/* ── NAVBAR ── */}
        <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:900,
          background:"white",borderBottom:"1px solid var(--gray-200)",boxShadow:"var(--sh)"}}>
          <div style={{maxWidth:1100,margin:"0 auto",padding:"0 14px",height:"var(--nav-h)",
            display:"flex",alignItems:"center",gap:10}}>

            {/* Mobile: Hamburger */}
            <button className="btn-icon nav-actions-row" style={{flexShrink:0,display:"none"}}
              onClick={()=>setDrawerOpen(true)}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18"/>
              </svg>
            </button>
            {/* Show hamburger on mobile via inline media */}
            <style>{`@media(max-width:767px){.mob-hamburger{display:flex!important}}`}</style>
            <button className="btn-icon mob-hamburger" style={{flexShrink:0,display:"none"}}
              onClick={()=>setDrawerOpen(true)}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18"/>
              </svg>
            </button>

            {/* Logo */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginRight:4,flexShrink:0}}>
              <div style={{position:"relative",cursor:"pointer"}}
                onClick={()=>setModal({type:"logo"})} title="Click to change logo">
                <LogoImg src={logo} size={34}/>
                <div style={{position:"absolute",bottom:-3,right:-3,width:14,height:14,
                  background:"var(--g600)",borderRadius:"50%",border:"2px solid white",
                  display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="7" height="7" fill="white" viewBox="0 0 24 24">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              </div>
              <div className="desktop-search-only">
                <div style={{fontSize:13,fontWeight:800,color:"var(--g900)",lineHeight:1.2}}>City Health Office 2</div>
                <div style={{fontSize:10,color:"var(--gray-400)",lineHeight:1}}>Dasmariñas, Cavite</div>
              </div>
              {/* Mobile: short name */}
              <style>{`@media(max-width:767px){.mob-title{display:block!important}}`}</style>
              <div className="mob-title" style={{display:"none"}}>
                <div style={{fontSize:12,fontWeight:800,color:"var(--g900)",lineHeight:1.2}}>CHO 2</div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{display:"flex",gap:2,background:"var(--g50)",borderRadius:10,padding:3,marginRight:"auto"}}>
              {[["feed","📰 Feed"],["barangays","🏘️ Brgy"]].map(([key,label])=>(
                <button key={key} onClick={()=>setActiveTab(key)}
                  style={{padding:"5px 12px",borderRadius:8,border:"none",fontSize:12,fontWeight:600,
                    background:activeTab===key?"var(--g700)":"transparent",
                    color:activeTab===key?"white":"var(--gray-500)",transition:"all .18s",fontFamily:"var(--font)"}}>
                  {label}
                </button>
              ))}
            </div>

            {/* Desktop search */}
            {activeTab==="feed"&&(
              <div className="search-desktop" style={{position:"relative",maxWidth:220,width:"100%"}}>
                <svg style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--gray-400)"}}
                  width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input className="input" placeholder="Search posts…" value={search}
                  onChange={e=>setSearch(e.target.value)}
                  style={{paddingLeft:30,height:34,fontSize:12.5,background:"var(--g50)"}}/>
              </div>
            )}

            {/* Mobile search icon */}
            {activeTab==="feed"&&(
              <style>{`@media(max-width:767px){.mob-search-btn{display:flex!important}}`}</style>
            )}
            <button className="btn-icon mob-search-btn" style={{display:"none"}}
              onClick={()=>setShowSearch(s=>!s)}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </button>

            {/* Desktop actions */}
            <div className="nav-actions-row" style={{display:"flex",alignItems:"center",gap:8}}>
              <button className="btn btn-green btn-sm nav-new-post-btn" onClick={()=>setModal({type:"create"})}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                New Post
              </button>
              <button className="btn btn-ghost btn-sm nav-logo-btn"
                onClick={()=>setModal({type:"logo"})} title="Upload logo">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Logo
              </button>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:28,height:28,borderRadius:7,
                  background:"linear-gradient(135deg,var(--g700),var(--g500))",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:10,fontWeight:800,color:"white",flexShrink:0}}>AD</div>
                <button className="btn btn-ghost btn-sm" onClick={()=>setLoggedIn(false)}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Mobile search bar (expandable) */}
          {showSearch && activeTab==="feed" && (
            <MobileSearchBar value={search} onChange={setSearch}/>
          )}
        </nav>

        {/* ── BODY ── */}
        <div style={{maxWidth:1100,margin:"0 auto",
          padding:`calc(var(--nav-h) + 16px) 14px 90px`,
          display:"flex",gap:16,alignItems:"flex-start"}}>

          {activeTab==="barangays" ? (
            <div style={{flex:1}}><BarangayPanel/></div>
          ) : (
            <>
              {/* Desktop Sidebar */}
              <div className="sidebar-desktop" style={{width:200,flexShrink:0,position:"sticky",top:"calc(var(--nav-h) + 16px)",alignSelf:"flex-start"}}>
                <SidebarContent
                  activeFilter={activeFilter}
                  setActiveFilter={setActiveFilter}
                  posts={posts}
                  onClose={null}/>
              </div>

              {/* Feed */}
              <div style={{flex:1,minWidth:0}}>
                {/* Compose box */}
                <div className="card" style={{padding:"12px 14px",marginBottom:14,display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{width:38,height:38,borderRadius:10,flexShrink:0,
                    background:"linear-gradient(135deg,var(--g700),var(--g500))",
                    display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  </div>
                  <button onClick={()=>setModal({type:"create"})}
                    style={{flex:1,textAlign:"left",padding:"9px 14px",background:"var(--g50)",
                      border:"1.5px solid var(--g200)",borderRadius:22,color:"var(--gray-400)",
                      fontSize:13,cursor:"pointer",transition:"all .2s",fontFamily:"var(--font)"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="var(--g100)";e.currentTarget.style.borderColor="var(--g400)"}}
                    onMouseLeave={e=>{e.currentTarget.style.background="var(--g50)";e.currentTarget.style.borderColor="var(--g200)"}}>
                    Post a health update or announcement…
                  </button>
                </div>

                {/* Active filter banner */}
                {(activeFilter||search)&&(
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,
                    padding:"9px 12px",background:"var(--g100)",borderRadius:10,flexWrap:"wrap"}}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="var(--g700)" strokeWidth="2">
                      <path d="M3 6h18M7 12h10M11 18h2"/>
                    </svg>
                    <span style={{fontSize:12.5,color:"var(--g800)",fontWeight:500,flex:1}}>
                      {[activeFilter,search&&`"${search}"`].filter(Boolean).join(" · ")} · {filtered.length} result{filtered.length!==1?"s":""}
                    </span>
                    <button onClick={()=>{setActiveFilter(null);setSearch("");}}
                      style={{background:"none",border:"none",color:"var(--g700)",
                        fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"var(--font)"}}>Clear</button>
                  </div>
                )}

                {/* Posts */}
                {filtered.length===0 ? (
                  <div className="card" style={{padding:"40px 20px",textAlign:"center"}}>
                    <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="var(--g200)" strokeWidth="1.5"
                      style={{margin:"0 auto 12px",display:"block"}}>
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p style={{fontSize:15,fontWeight:600,color:"var(--gray-400)"}}>No posts found</p>
                    <p style={{fontSize:13,color:"var(--gray-300)",marginTop:4}}>Try a different filter or search term.</p>
                  </div>
                ) : (
                  filtered.map((post,i)=>(
                    <PostCard key={post.id} post={post} idx={i}
                      onView={p=>setModal({type:"view",post:p})}
                      onEdit={p=>setModal({type:"edit",post:p})}
                      onDelete={p=>setModal({type:"delete",post:p})}/>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── BOTTOM NAV (Mobile) ── */}
      <nav className="bottom-nav">
        {/* Feed tab */}
        <button onClick={()=>setActiveTab("feed")}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,
            background:"none",border:"none",color:activeTab==="feed"?"var(--g700)":"var(--gray-400)",
            fontSize:10,fontWeight:600,padding:"4px 0",fontFamily:"var(--font)",cursor:"pointer"}}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            strokeWidth={activeTab==="feed"?2.5:1.8}>
            <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v8a2 2 0 01-2 2z"/>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
          </svg>
          Feed
        </button>

        {/* Barangays tab */}
        <button onClick={()=>setActiveTab("barangays")}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,
            background:"none",border:"none",color:activeTab==="barangays"?"var(--g700)":"var(--gray-400)",
            fontSize:10,fontWeight:600,padding:"4px 0",fontFamily:"var(--font)",cursor:"pointer"}}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            strokeWidth={activeTab==="barangays"?2.5:1.8}>
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <path d="M9 22V12h6v10"/>
          </svg>
          Barangays
        </button>

        {/* Filter (opens drawer) */}
        <button onClick={()=>setDrawerOpen(true)}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,
            background:"none",border:"none",
            color:activeFilter?"var(--g700)":"var(--gray-400)",
            fontSize:10,fontWeight:600,padding:"4px 0",fontFamily:"var(--font)",cursor:"pointer",position:"relative"}}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 6h18M7 12h10M11 18h2"/>
          </svg>
          Filter
          {activeFilter && (
            <span style={{position:"absolute",top:2,right:"calc(50% - 18px)",width:8,height:8,
              background:"var(--g500)",borderRadius:"50%",border:"1.5px solid white"}}/>
          )}
        </button>

        {/* Logo/Settings */}
        <button onClick={()=>setModal({type:"logo"})}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,
            background:"none",border:"none",color:"var(--gray-400)",
            fontSize:10,fontWeight:600,padding:"4px 0",fontFamily:"var(--font)",cursor:"pointer"}}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="4"/>
            <path d="M20 21a8 8 0 10-16 0"/>
          </svg>
          Account
        </button>
      </nav>
    </>
  );
}

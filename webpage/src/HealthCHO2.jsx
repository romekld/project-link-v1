import { useState, useRef } from "react";

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
  --gray-800:#1F2937;--gray-600:#4B5563;--gray-500:#6B7280;--gray-400:#9CA3AF;
  --gray-200:#E5E7EB;--gray-100:#F3F4F6;--gray-50:#F9FAFB;
  --white:#FFFFFF;--red:#DC2626;
  --font:'Plus Jakarta Sans',sans-serif;
  --sh:0 1px 3px rgba(6,78,59,.1),0 1px 2px rgba(6,78,59,.06);
  --sh2:0 4px 16px rgba(6,78,59,.12),0 2px 6px rgba(6,78,59,.07);
  --sh3:0 12px 40px rgba(6,78,59,.18);
  --r:10px;--r2:14px;--r3:20px;
}
body{font-family:var(--font);background:var(--g50);color:var(--gray-800);}
button{cursor:pointer;font-family:var(--font);}
input,textarea,select{font-family:var(--font);}

@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.fu{animation:fadeUp .3s ease forwards}
.sc{animation:scaleIn .22s ease forwards}

.btn{display:inline-flex;align-items:center;gap:6px;border:none;border-radius:var(--r);
  padding:9px 20px;font-size:13.5px;font-weight:600;transition:all .18s;cursor:pointer}
.btn-green{background:var(--g700);color:#fff}
.btn-green:hover{background:var(--g800);box-shadow:0 4px 14px rgba(5,150,105,.35);transform:translateY(-1px)}
.btn-red{background:var(--red);color:#fff}
.btn-red:hover{background:#B91C1C}
.btn-ghost{background:transparent;border:1.5px solid var(--gray-200);color:var(--gray-600)}
.btn-ghost:hover{background:var(--gray-100)}
.btn-sm{padding:6px 12px;font-size:12px}

.card{background:var(--white);border-radius:var(--r2);border:1px solid var(--gray-200);box-shadow:var(--sh)}
.input{width:100%;padding:10px 14px;border:1.5px solid var(--gray-200);border-radius:var(--r);
  font-size:14px;color:var(--gray-800);outline:none;transition:border-color .2s,box-shadow .2s;background:var(--white)}
.input:focus{border-color:var(--g600);box-shadow:0 0 0 3px rgba(5,150,105,.15)}
.overlay{position:fixed;inset:0;background:rgba(6,78,59,.5);backdrop-filter:blur(5px);
  z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px}
.modal{background:var(--white);border-radius:var(--r3);box-shadow:var(--sh3);
  width:100%;max-height:92vh;overflow-y:auto}

/* Logo upload drop zone */
.drop-zone{border:2px dashed var(--g200);border-radius:var(--r2);padding:28px 20px;
  text-align:center;cursor:pointer;transition:all .2s;background:var(--g50)}
.drop-zone:hover,.drop-zone.drag{border-color:var(--g500);background:var(--g100)}
`;

// ── DEFAULT LOGO (svg fallback shown when no logo uploaded) ──────────────────────
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

// ── LOGO DISPLAY (navbar + login) ────────────────────────────────────────────────
function LogoImg({ src, size=34 }) {
  if (!src) return <DefaultLogoMark size={size}/>;
  return (
    <img src={src} alt="CHO 2 Logo"
      style={{width:size,height:size,borderRadius:size*0.26,objectFit:"contain",
        background:"white",border:"1px solid var(--gray-200)",flexShrink:0}}/>
  );
}

// ── LOGO UPLOAD MODAL ─────────────────────────────────────────────────────────────
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

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal sc" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{padding:"22px 26px 16px",borderBottom:"1px solid var(--gray-200)",
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h2 style={{fontSize:17,fontWeight:700,color:"var(--g900)"}}>Upload Logo</h2>
            <p style={{fontSize:12,color:"var(--gray-400)",marginTop:2}}>Appears in the navbar and login screen</p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--gray-400)",lineHeight:0,padding:4}}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div style={{padding:"22px 26px",display:"flex",flexDirection:"column",gap:18}}>

          {/* Current preview */}
          <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",
            background:"var(--g50)",borderRadius:12,border:"1px solid var(--g200)"}}>
            <div style={{flexShrink:0}}>
              {preview
                ? <img src={preview} alt="preview" style={{width:56,height:56,borderRadius:10,
                    objectFit:"contain",background:"white",border:"1px solid var(--gray-200)"}}/>
                : <DefaultLogoMark size={56}/>
              }
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

          {/* Drop zone */}
          <div
            className={`drop-zone${dragging?" drag":""}`}
            onClick={()=>fileRef.current.click()}
            onDragOver={e=>{e.preventDefault();setDragging(true)}}
            onDragLeave={()=>setDragging(false)}
            onDrop={onDrop}
          >
            <div style={{marginBottom:10,fontSize:30}}>🖼️</div>
            <p style={{fontSize:14,fontWeight:600,color:"var(--g700)",marginBottom:4}}>
              Click to browse or drag & drop
            </p>
            <p style={{fontSize:12,color:"var(--gray-400)"}}>PNG, JPG, SVG, WebP — max 5 MB</p>
            <input ref={fileRef} type="file" accept="image/*"
              style={{display:"none"}} onChange={onFileChange}/>
          </div>

          {error && (
            <div style={{padding:"10px 14px",background:"#FEF2F2",border:"1px solid #FECACA",
              borderRadius:8,fontSize:13,color:"var(--red)"}}>
              ⚠️ {error}
            </div>
          )}

          {/* Tips */}
          <div style={{fontSize:12,color:"var(--gray-400)",lineHeight:1.7,
            padding:"10px 14px",background:"var(--gray-50)",borderRadius:8}}>
            <strong style={{color:"var(--gray-500)"}}>Tips for best results:</strong><br/>
            • Square or circle logos work best<br/>
            • Transparent PNG preferred for clean display<br/>
            • Recommended size: 200×200 px or larger
          </div>
        </div>

        {/* Footer */}
        <div style={{padding:"14px 26px 22px",borderTop:"1px solid var(--gray-200)",
          display:"flex",gap:10,justifyContent:"space-between",alignItems:"center"}}>
          {/* Remove button — only show if there's a saved logo */}
          {currentLogo
            ? <button className="btn btn-ghost btn-sm" style={{color:"var(--red)",borderColor:"#FECACA"}}
                onClick={()=>{onSave(null);onClose();}}>
                Remove logo
              </button>
            : <span/>
          }
          <div style={{display:"flex",gap:10}}>
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
      <div className="modal sc" style={{maxWidth:400,padding:32}} onClick={e=>e.stopPropagation()}>
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
            <button className="btn btn-ghost" style={{flex:1,justifyContent:"center"}} onClick={onCancel}>Cancel</button>
            <button className="btn btn-red"   style={{flex:1,justifyContent:"center"}} onClick={onConfirm}>Delete</button>
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
    if (!form.title.trim())       e.title   = "Title is required";
    else if (form.title.length<5) e.title   = "At least 5 characters";
    if (!form.content.trim())     e.content = "Content is required";
    else if (form.content.length<10) e.content = "At least 10 characters";
    if (form.imageUrl && !/^https?:\/\/.+/.test(form.imageUrl)) e.imageUrl = "Enter a valid image URL";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ ...form, imageUrl: form.imageUrl.trim() || null });
  };

  const set = (k,v) => { setForm(p=>({...p,[k]:v})); setErrors(p=>({...p,[k]:undefined})); };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal sc" style={{maxWidth:580}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"22px 28px 18px",borderBottom:"1px solid var(--gray-200)",
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h2 style={{fontSize:17,fontWeight:700,color:"var(--g900)"}}>{editing?"Edit Post":"New Post"}</h2>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--gray-400)",lineHeight:0}}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div style={{padding:"22px 28px",display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:"var(--gray-600)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:".5px"}}>Category</label>
            <select className="input" value={form.category} onChange={e=>set("category",e.target.value)}>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:"var(--gray-600)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:".5px"}}>Title <span style={{color:"var(--red)"}}>*</span></label>
            <input className="input" placeholder="Post title…" value={form.title} onChange={e=>set("title",e.target.value)}/>
            {errors.title&&<p style={{fontSize:12,color:"var(--red)",marginTop:4}}>{errors.title}</p>}
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:"var(--gray-600)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:".5px"}}>Content <span style={{color:"var(--red)"}}>*</span></label>
            <textarea className="input" rows={6} placeholder="Write your announcement or update…"
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
                style={{marginTop:10,width:"100%",height:140,objectFit:"cover",borderRadius:8}}/>
            )}
          </div>
        </div>

        <div style={{padding:"14px 28px 22px",borderTop:"1px solid var(--gray-200)",display:"flex",gap:10,justifyContent:"flex-end"}}>
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
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal sc" style={{maxWidth:620}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"20px 26px 16px",borderBottom:"1px solid var(--gray-200)",
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <CatBadge cat={post.category}/>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--gray-400)",lineHeight:0}}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div style={{padding:"20px 26px",overflowY:"auto",maxHeight:"78vh"}}>
          <h2 style={{fontSize:20,fontWeight:700,color:"var(--g900)",marginBottom:8,lineHeight:1.4}}>{post.title}</h2>
          <p style={{fontSize:12,color:"var(--gray-400)",marginBottom:16}}>
            Posted by {ADMIN.name} · {timeAgo(post.createdAt)}
          </p>
          {post.imageUrl&&(
            <img src={post.imageUrl} alt={post.title}
              style={{width:"100%",borderRadius:10,marginBottom:16,maxHeight:340,objectFit:"cover"}}/>
          )}
          <p style={{fontSize:15,color:"var(--gray-600)",lineHeight:1.8,whiteSpace:"pre-line"}}>{post.content}</p>
          <div style={{marginTop:22,display:"flex",gap:10,justifyContent:"flex-end"}}>
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
  return (
    <div className="card fu" style={{marginBottom:14,overflow:"hidden",animationDelay:`${idx*0.07}s`}}>
      <div style={{padding:"14px 18px 10px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:38,height:38,borderRadius:10,flexShrink:0,
            background:"linear-gradient(135deg,var(--g700),var(--g500))",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--g800)"}}>{ADMIN.name}</div>
            <div style={{fontSize:11,color:"var(--gray-400)"}}>{timeAgo(post.createdAt)}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <CatBadge cat={post.category}/>
          <div style={{display:"flex",gap:4}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>onEdit(post)}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
            <button className="btn btn-sm" onClick={()=>onDelete(post)}
              style={{background:"#FEF2F2",color:"var(--red)",border:"1.5px solid #FECACA"}}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      <div style={{padding:"0 18px 14px",cursor:"pointer"}} onClick={()=>onView(post)}>
        <h3 style={{fontSize:15.5,fontWeight:700,color:"var(--gray-800)",marginBottom:7,lineHeight:1.4}}>{post.title}</h3>
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
          <img src={post.imageUrl} alt={post.title} style={{width:"100%",maxHeight:280,objectFit:"cover"}}/>
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

      <div className="card" style={{padding:"16px 18px"}}>
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
        <div style={{maxHeight:440,overflowY:"auto",paddingRight:4}}>
          {filtered.map(b=>(
            <div key={b} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",
              borderRadius:8,marginBottom:2,transition:"background .15s"}}
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
            <p style={{fontSize:13,color:"var(--gray-400)",textAlign:"center",padding:"20px 0"}}>No results found</p>
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
      padding:20,position:"relative",overflow:"hidden"}}>
      {[[400,400,"15%","-10%"],[250,250,"-5%","60%"],[300,300,"65%","70%"]].map(([w,h,t,l],i)=>(
        <div key={i} style={{position:"absolute",width:w,height:h,top:t,left:l,
          borderRadius:"50%",background:"rgba(255,255,255,0.04)"}}/>
      ))}

      <div style={{width:"100%",maxWidth:420,position:"relative",zIndex:1}}>
        {/* Logo block */}
        <div style={{textAlign:"center",marginBottom:28}}>
          {/* Show uploaded logo or default */}
          {logo ? (
            <div style={{width:80,height:80,margin:"0 auto 14px",borderRadius:20,overflow:"hidden",
              background:"rgba(255,255,255,0.95)",display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:"0 8px 24px rgba(0,0,0,0.2)"}}>
              <img src={logo} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
            </div>
          ) : (
            <div style={{width:70,height:70,background:"rgba(255,255,255,0.18)",borderRadius:20,
              display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",
              backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.25)"}}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
          )}
          <h1 style={{color:"white",fontSize:24,fontWeight:800,letterSpacing:"-0.3px",marginBottom:4}}>
            City Health Office 2
          </h1>
          <p style={{color:"rgba(255,255,255,0.65)",fontSize:13}}>Dasmariñas, Cavite — Admin Portal</p>
        </div>

        <div style={{background:"rgba(255,255,255,0.97)",borderRadius:20,padding:"32px 36px",
          boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
          <h2 style={{fontSize:18,fontWeight:700,color:"var(--g900)",marginBottom:4}}>Administrator Login</h2>
          <p style={{fontSize:13,color:"var(--gray-400)",marginBottom:22}}>Authorized personnel only</p>

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"var(--gray-600)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:".5px"}}>Email</label>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@cho2.gov.ph"/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"var(--gray-600)",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:".5px"}}>Password</label>
              <input className="input" type="password" value={password}
                onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
            </div>
          </div>

          {error&&<div style={{marginTop:12,padding:"10px 14px",background:"#FEF2F2",
            border:"1px solid #FECACA",borderRadius:8,fontSize:13,color:"var(--red)"}}>{error}</div>}

          <button className="btn btn-green" onClick={submit} disabled={loading}
            style={{width:"100%",justifyContent:"center",marginTop:20,padding:"12px",fontSize:14,borderRadius:10}}>
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <p style={{fontSize:11,color:"var(--gray-400)",textAlign:"center",marginTop:14}}>
            Default: admin@cho2.gov.ph / cho2admin
          </p>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn,     setLoggedIn]     = useState(false);
  const [logo,         setLogo]         = useState(null);   // base64 data URL or null
  const [posts,        setPosts]        = useState(SAMPLE_POSTS);
  const [activeFilter, setActiveFilter] = useState(null);
  const [search,       setSearch]       = useState("");
  const [modal,        setModal]        = useState(null);
  const [activeTab,    setActiveTab]    = useState("feed");

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

      <div style={{minHeight:"100vh",background:"var(--g50)"}}>

        {/* ── NAVBAR ── */}
        <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:900,
          background:"white",borderBottom:"1px solid var(--gray-200)",boxShadow:"var(--sh)"}}>
          <div style={{maxWidth:1100,margin:"0 auto",padding:"0 20px",height:58,
            display:"flex",alignItems:"center",gap:14}}>

            {/* ── LOGO AREA ── */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginRight:4}}>
              {/* Clickable logo — opens upload modal */}
              <div style={{position:"relative",cursor:"pointer",flexShrink:0}}
                onClick={()=>setModal({type:"logo"})}
                title="Click to change logo">
                <LogoImg src={logo} size={36}/>
                {/* Small camera badge */}
                <div style={{position:"absolute",bottom:-3,right:-3,width:16,height:16,
                  background:"var(--g600)",borderRadius:"50%",border:"2px solid white",
                  display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="8" height="8" fill="white" viewBox="0 0 24 24">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"var(--g900)",lineHeight:1.2}}>City Health Office 2</div>
                <div style={{fontSize:10,color:"var(--gray-400)",lineHeight:1}}>Dasmariñas, Cavite</div>
              </div>
            </div>

            {/* ── TABS ── */}
            <div style={{display:"flex",gap:2,background:"var(--g50)",borderRadius:10,padding:3,marginRight:"auto"}}>
              {[["feed","📰 News Feed"],["barangays","🏘️ Barangays"]].map(([key,label])=>(
                <button key={key} onClick={()=>setActiveTab(key)}
                  style={{padding:"6px 16px",borderRadius:8,border:"none",fontSize:13,fontWeight:600,
                    background:activeTab===key?"var(--g700)":"transparent",
                    color:activeTab===key?"white":"var(--gray-500)",transition:"all .18s"}}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── SEARCH ── */}
            {activeTab==="feed"&&(
              <div style={{position:"relative",maxWidth:240,width:"100%"}}>
                <svg style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--gray-400)"}}
                  width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input className="input" placeholder="Search posts…" value={search}
                  onChange={e=>setSearch(e.target.value)}
                  style={{paddingLeft:32,height:36,fontSize:13,background:"var(--g50)"}}/>
              </div>
            )}

            {/* ── ACTIONS ── */}
            <button className="btn btn-green" onClick={()=>setModal({type:"create"})}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              New Post
            </button>

            {/* Upload logo button */}
            <button className="btn btn-ghost btn-sm"
              onClick={()=>setModal({type:"logo"})}
              title="Upload logo"
              style={{gap:5,padding:"6px 12px"}}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Logo
            </button>

            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:30,height:30,borderRadius:8,
                background:"linear-gradient(135deg,var(--g700),var(--g500))",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:11,fontWeight:800,color:"white"}}>AD</div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setLoggedIn(false)}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* ── BODY ── */}
        <div style={{maxWidth:1100,margin:"0 auto",padding:"70px 20px 32px",display:"flex",gap:18,alignItems:"flex-start"}}>

          {activeTab==="barangays" ? (
            <div style={{flex:1}}><BarangayPanel/></div>
          ) : (
            <>
              {/* ── SIDEBAR ── */}
              <div style={{width:210,flexShrink:0,position:"sticky",top:72,alignSelf:"flex-start"}}>
                <div className="card" style={{padding:"14px 12px"}}>
                  <p style={{fontSize:11,fontWeight:800,color:"var(--gray-400)",letterSpacing:".06em",
                    textTransform:"uppercase",marginBottom:10,paddingLeft:6}}>Services</p>
                  <button onClick={()=>setActiveFilter(null)}
                    style={{width:"100%",textAlign:"left",padding:"8px 10px",borderRadius:8,border:"none",
                      fontSize:13,fontWeight:activeFilter?400:700,cursor:"pointer",marginBottom:2,
                      background:!activeFilter?"var(--g100)":"transparent",
                      color:!activeFilter?"var(--g800)":"var(--gray-600)",transition:"all .15s"}}>
                    📋 All Posts
                  </button>
                  {CATEGORIES.map(cat=>(
                    <button key={cat} onClick={()=>setActiveFilter(cat===activeFilter?null:cat)}
                      style={{width:"100%",textAlign:"left",padding:"8px 10px",borderRadius:8,border:"none",
                        fontSize:13,fontWeight:activeFilter===cat?700:400,cursor:"pointer",marginBottom:2,
                        background:activeFilter===cat?"var(--g100)":"transparent",
                        color:activeFilter===cat?"var(--g800)":"var(--gray-600)",transition:"all .15s",
                        display:"flex",alignItems:"center",gap:8}}>
                      <span>{CAT_ICONS[cat]}</span>{cat}
                    </button>
                  ))}
                </div>

                <div className="card" style={{padding:"14px 16px",marginTop:12}}>
                  <p style={{fontSize:11,fontWeight:800,color:"var(--gray-400)",letterSpacing:".06em",
                    textTransform:"uppercase",marginBottom:10}}>Overview</p>
                  {[
                    {label:"Total Posts",val:posts.length,col:"var(--g700)"},
                    {label:"This Week",val:posts.filter(p=>Date.now()-new Date(p.createdAt)<604800000).length,col:"var(--g600)"},
                  ].map(s=>(
                    <div key={s.label} style={{display:"flex",justifyContent:"space-between",
                      alignItems:"center",marginBottom:8,paddingBottom:8,borderBottom:"1px solid var(--gray-100)"}}>
                      <span style={{fontSize:12,color:"var(--gray-500)"}}>{s.label}</span>
                      <span style={{fontSize:16,fontWeight:800,color:s.col}}>{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── FEED ── */}
              <div style={{flex:1,minWidth:0}}>
                <div className="card" style={{padding:"14px 18px",marginBottom:14,display:"flex",gap:12,alignItems:"center"}}>
                  <div style={{width:40,height:40,borderRadius:10,flexShrink:0,
                    background:"linear-gradient(135deg,var(--g700),var(--g500))",
                    display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  </div>
                  <button onClick={()=>setModal({type:"create"})}
                    style={{flex:1,textAlign:"left",padding:"10px 16px",background:"var(--g50)",
                      border:"1.5px solid var(--g200)",borderRadius:24,color:"var(--gray-400)",
                      fontSize:13.5,cursor:"pointer",transition:"all .2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="var(--g100)";e.currentTarget.style.borderColor="var(--g400)"}}
                    onMouseLeave={e=>{e.currentTarget.style.background="var(--g50)";e.currentTarget.style.borderColor="var(--g200)"}}>
                    Post a health update or announcement…
                  </button>
                </div>

                {(activeFilter||search)&&(
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,
                    padding:"9px 14px",background:"var(--g100)",borderRadius:10}}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="var(--g700)" strokeWidth="2">
                      <path d="M3 6h18M7 12h10M11 18h2"/>
                    </svg>
                    <span style={{fontSize:12.5,color:"var(--g800)",fontWeight:500}}>
                      {[activeFilter,search&&`"${search}"`].filter(Boolean).join(" · ")} · {filtered.length} result{filtered.length!==1?"s":""}
                    </span>
                    <button onClick={()=>{setActiveFilter(null);setSearch("");}}
                      style={{marginLeft:"auto",background:"none",border:"none",color:"var(--g700)",
                        fontSize:12,fontWeight:700,cursor:"pointer"}}>Clear</button>
                  </div>
                )}

                {filtered.length===0 ? (
                  <div className="card" style={{padding:"48px 24px",textAlign:"center"}}>
                    <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="var(--g200)" strokeWidth="1.5"
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
    </>
  );
}

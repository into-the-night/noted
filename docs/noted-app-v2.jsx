// noted-app.jsx
// Main app: routing + views (Home / Project / Resource) + viewers (PDF/PPT/Video)
// + ChatPanel + UploadModal. Geist throughout. No sidebar — TopBar handles nav.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "view": "resource",
  "resourceType": "pdf",
  "theme": "light",
  "showUpload": false,
  "palette": "ember",
  "font": "geist",
  "bg": "plain",
  "radius": "soft"
}/*EDITMODE-END*/;

/* ─────────────────────────────────────────────────────────────
   HOME VIEW — all projects + recent stars rollup
   ───────────────────────────────────────────────────────────── */
function HomeView({ onNavigate, onUpload }) {
  return (
    <div className="view-fade" style={{ flex:1, overflowY:'auto' }} data-screen-label="home">
      <div style={{ maxWidth: 1180, margin:'0 auto', padding:'48px 56px 80px' }}>
        {/* Header */}
        <header style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom: 40, paddingBottom: 24, borderBottom:'1px solid var(--border-soft)' }}>
          <div>
            <div className="mono" style={{ fontSize: 11, letterSpacing:'0.08em', color:'var(--muted)', textTransform:'uppercase', marginBottom: 12 }}>
              Tuesday · 25 May
            </div>
            <h1 style={{ fontSize: 44, fontWeight: 600, margin: 0, color:'var(--ink)', letterSpacing:'-0.025em', lineHeight: 1.05 }}>
              Welcome back.
            </h1>
            <div style={{ fontSize: 14.5, color:'var(--muted)', marginTop: 10 }}>
              6 projects · 54 resources · 186 stars across all subjects.
            </div>
          </div>
          <button style={btnPrimary()} onClick={onUpload}>{I.plus()} New project</button>
        </header>

        {/* Projects grid */}
        <section style={{ marginBottom: 56 }}>
          <SectionHead title="Your projects" hint={`${PROJECTS.length} active`} />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 14 }}>
            {PROJECTS.map(p => (
              <ProjectCard key={p.id} project={p} onClick={() => onNavigate({ view:'project', projectId: p.id })} />
            ))}
            <button onClick={onUpload} style={{
              border:'1.5px dashed var(--border)', borderRadius: 12, background:'transparent',
              padding: 22, display:'flex', flexDirection:'column', alignItems:'flex-start', gap: 10,
              cursor:'pointer', color:'var(--muted)', minHeight: 168,
              justifyContent:'center', textAlign:'left',
              fontFamily:'inherit', transition:'all 140ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
            >
              {I.plus({ width: 18, height: 18 })}
              <span style={{ fontSize: 18, fontWeight: 500, letterSpacing:'-0.015em', color:'inherit' }}>New project</span>
              <span style={{ fontSize: 12, color:'var(--muted)' }}>One project per subject, exam, or unit.</span>
            </button>
          </div>
        </section>

        {/* Recent stars */}
        <section>
          <SectionHead title="Recent stars" hint="Across all projects" />
          <div style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius: 12, padding:'4px 22px 8px' }}>
            {RECENT_STARS.map(s => <StarRow key={s.id} s={s} />)}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHead({ title, hint }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 16 }}>
      <h2 style={{ fontSize: 19, fontWeight: 600, margin: 0, color:'var(--ink)', letterSpacing:'-0.018em' }}>
        {title}
      </h2>
      {hint && <span className="mono" style={{ fontSize: 11, color:'var(--muted)', letterSpacing:'0.02em' }}>{hint}</span>}
    </div>
  );
}

function ProjectCard({ project: p, onClick }) {
  return (
    <button onClick={onClick} style={{
      background:'var(--panel)', border:'1px solid var(--border)',
      borderRadius: 12, padding:'20px 22px',
      textAlign:'left', cursor:'pointer', fontFamily:'inherit',
      display:'flex', flexDirection:'column', gap: 14,
      minHeight: 168, transition:'all 160ms ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <span style={{
          width:32, height:32, borderRadius:8,
          background:'var(--panel-2)', color:'var(--ink)',
          border:'1px solid var(--border)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize: 14, fontWeight: 600, letterSpacing:'-0.02em',
        }}>{p.name[0]}</span>
        <span className="mono" style={{ fontSize: 10.5, color:'var(--muted-2)', letterSpacing:'0.02em' }}>{p.lastSeen}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 500, color:'var(--ink)', letterSpacing:'-0.018em', lineHeight: 1.2, flex:1 }}>
        {p.name}
      </div>
      <div className="mono" style={{ display:'flex', gap: 18, fontSize: 11, color:'var(--muted)', letterSpacing:'0.01em' }}>
        <span><span style={{ color:'var(--ink)', fontWeight: 500 }}>{p.resources}</span> resources</span>
        <span style={{ color:'var(--gold)', display:'inline-flex', alignItems:'center', gap: 4 }}>
          {I.starFilled({ width:10, height:10 })} {p.stars}
        </span>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   PROJECT VIEW — resources grid + revision tab
   ───────────────────────────────────────────────────────────── */
function ProjectView({ projectId, onNavigate, onUpload }) {
  const project = PROJECTS.find(p => p.id === projectId) || PROJECTS[0];
  const [tab, setTab] = useState('resources');

  return (
    <div className="view-fade" style={{ flex:1, overflowY:'auto' }} data-screen-label="project">
      <div style={{ maxWidth: 1280, margin:'0 auto' }}>
        {/* Project header */}
        <div style={{ padding:'40px 56px 0' }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap: 30, marginBottom: 24 }}>
            <div style={{ flex:1 }}>
              <div className="mono" style={{ fontSize: 10.5, letterSpacing:'0.08em', color:'var(--muted)', textTransform:'uppercase', marginBottom: 10 }}>
                Project · created Apr 12 · last opened {project.lastSeen}
              </div>
              <h1 style={{ fontSize: 38, fontWeight: 600, margin: 0, color:'var(--ink)', letterSpacing:'-0.022em', lineHeight: 1.1 }}>
                {project.name}
              </h1>
            </div>
            <div style={{ display:'flex', gap: 10 }}>
              <button style={btnGhost()}>{I.settings()} Settings</button>
              <button style={btnPrimary()} onClick={onUpload}>{I.plus()} Add resource</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap: 4, borderBottom:'1px solid var(--border)', marginBottom: 28 }}>
            {[
              { id:'resources', label: `Resources`, count: project.resources },
              { id:'revision',  label: `Revision`,  count: project.stars },
              { id:'lists',     label: `Lists`,     count: 5 },
            ].map(t => {
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  padding:'10px 14px 12px', background:'transparent', border:'none',
                  borderBottom:`2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                  marginBottom: -1, cursor:'pointer', fontFamily:'inherit',
                  color: active ? 'var(--ink)' : 'var(--muted)',
                  fontSize: 13.5, fontWeight: active ? 500 : 400,
                  display:'inline-flex', alignItems:'center', gap: 8,
                }}>
                  {t.label}
                  <span className="mono" style={{ fontSize: 10.5, color:'var(--muted-2)' }}>{t.count}</span>
                </button>
              );
            })}
            <div style={{ flex:1 }}/>
            <div style={{ display:'flex', alignItems:'center', gap: 8, padding:'8px 0', color:'var(--muted)', fontSize: 12 }}>
              <span>Sort:</span>
              <button style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--ink-soft)', fontSize: 12, fontWeight: 500, padding:0, fontFamily:'inherit' }}>
                Recently added
              </button>
              {I.chevron({ width:10, height:10 })}
            </div>
          </div>
        </div>

        {tab === 'resources' && (
          <div style={{ padding:'0 56px 80px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 24 }}>
              {RESOURCES.map(r => (
                <ResourceThumb key={r.id} resource={r}
                  onClick={() => r.status === 'ready' && onNavigate({ view:'resource', resourceId: r.id, resourceType: r.type === 'pptx' ? 'ppt' : r.type === 'youtube' ? 'video' : r.type })}
                />
              ))}
              <button onClick={onUpload} style={{
                border:'1.5px dashed var(--border)', borderRadius: 8,
                background:'transparent', aspectRatio:'4 / 3',
                cursor:'pointer', color:'var(--muted)', fontFamily:'inherit',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 10,
                transition:'all 140ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
              >
                {I.plus({ width: 18, height: 18 })}
                <span style={{ fontSize: 12.5 }}>Add resource</span>
              </button>
            </div>
          </div>
        )}

        {tab === 'revision' && (
          <div style={{ padding:'0 56px 80px', maxWidth: 920 }}>
            <div style={{ display:'flex', gap: 8, marginBottom: 22, flexWrap:'wrap' }}>
              {['All', 'PDF pages', 'Slides', 'Timestamps', 'Selections', 'Chat'].map((f, i) => (
                <button key={f} style={{
                  padding:'5px 12px', fontFamily:'inherit', fontSize: 12,
                  background: i === 0 ? 'var(--ink)' : 'var(--panel)',
                  color: i === 0 ? 'var(--bg)' : 'var(--ink-soft)',
                  border: `1px solid ${i === 0 ? 'var(--ink)' : 'var(--border)'}`,
                  borderRadius: 99, cursor:'pointer',
                }}>{f}</button>
              ))}
            </div>
            <div style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius: 12, padding:'4px 22px 8px' }}>
              {RECENT_STARS.map(s => <StarRow key={s.id} s={s} />)}
            </div>
          </div>
        )}

        {tab === 'lists' && (
          <div style={{ padding:'0 56px 80px', color:'var(--muted)', fontSize: 14 }}>
            Lists let you group cards manually. None yet — create one from any starred card.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   RESOURCE VIEW — viewer + chat
   ───────────────────────────────────────────────────────────── */
function ResourceView({ resourceType, onNavigate }) {
  const config = {
    pdf:   { resource: RESOURCES.find(r => r.id === 'r1'),  chats: CHATS_PDF,   messages: MESSAGES_PDF,   Viewer: PdfViewer,   anchorLabel: `p. ${PDF_PAGE.number}`, anchorKind:'page' },
    ppt:   { resource: RESOURCES.find(r => r.id === 'r3'),  chats: CHATS_PPT,   messages: MESSAGES_PPT,   Viewer: PptViewer,   anchorLabel: `slide ${PPT.number}`,   anchorKind:'slide' },
    video: { resource: RESOURCES.find(r => r.id === 'r4'),  chats: CHATS_VIDEO, messages: MESSAGES_VIDEO, Viewer: VideoViewer, anchorLabel: VIDEO.current,           anchorKind:'time' },
  }[resourceType];
  const { chats, messages, Viewer, anchorLabel, anchorKind } = config;

  return (
    <div className="view-fade" style={{ flex:1, display:'flex', minHeight: 0 }} data-screen-label={`resource-${resourceType}`}>
      <div style={{ flex: '1 1 60%', minWidth: 0, background:'transparent', display:'flex', flexDirection:'column' }}>
        <Viewer />
      </div>
      <div style={{ flex: '1 1 40%', minWidth: 380, maxWidth: 540, borderLeft:'1px solid var(--border)', background:'var(--panel)', display:'flex', flexDirection:'column' }}>
        <ChatPanel chats={chats} messages={messages} anchorLabel={anchorLabel} anchorKind={anchorKind} resourceType={resourceType} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PDF VIEWER
   ───────────────────────────────────────────────────────────── */
function PdfViewer() {
  return (
    <>
      <div style={viewerToolbar()}>
        <div style={{ display:'flex', alignItems:'center', gap: 4 }}>
          <IconBtn label="Previous page">{I.chevron({ style:{ transform:'rotate(180deg)' } })}</IconBtn>
          <span className="mono" style={{ fontSize: 11.5, color:'var(--ink-soft)', padding:'0 6px' }}>
            <span style={{ color:'var(--ink)', fontWeight: 500 }}>{PDF_PAGE.number}</span>
            <span style={{ color:'var(--muted-2)' }}> / {PDF_PAGE.total}</span>
          </span>
          <IconBtn label="Next page">{I.chevron()}</IconBtn>
        </div>
        <div style={{ flex:1 }}/>
        <span className="mono" style={{ fontSize: 10.5, color:'var(--muted)' }}>125%</span>
        <button style={starBtn()} title="Star this page">
          {I.star({ width: 12, height: 12 })}
          <span>Star page</span>
        </button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'28px 0', display:'flex', justifyContent:'center' }}>
        <div style={{ position:'relative' }}>
          {/* Pinned chat margin indicator */}
          <div style={{ position:'absolute', left: -44, top: 240, display:'flex', flexDirection:'column', alignItems:'center', gap: 2 }} title="1 pinned chat here">
            <div style={{
              width: 30, height: 30, borderRadius:'50%',
              background:'var(--accent)', color:'var(--accent-fg)',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', boxShadow:'var(--shadow-md)',
            }}>
              {I.pin({ width:13, height:13 })}
            </div>
            <div className="mono" style={{ fontSize: 9.5, color:'var(--accent)', letterSpacing:'0.04em' }}>1</div>
          </div>

          {/* Paper */}
          <article style={{
            width: 560, minHeight: 760, background:'#FBFAF6',
            border:'1px solid var(--border)', borderRadius: 3,
            boxShadow:'var(--shadow-md)', padding:'56px 60px 80px',
            color:'#1F1B17', position:'relative',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize: 10.5, color:'#8B847A', letterSpacing:'0.04em', textTransform:'uppercase', marginBottom: 42, paddingBottom: 10, borderBottom:'0.5px solid #DDD5C2' }}>
              <span>{PDF_PAGE.chapter}</span>
              <span>{PDF_PAGE.number}</span>
            </div>

            <div className="mono" style={{ fontSize: 10.5, color:'#8B847A', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom: 10 }}>
              § {PDF_PAGE.section}
            </div>
            <h1 style={{ fontSize: 28, margin:'0 0 24px', fontWeight: 600, letterSpacing:'-0.022em', color:'#1F1B17' }}>
              {PDF_PAGE.title}
            </h1>

            {PDF_PAGE.paragraphs.map((p, i) => (
              <p key={i} style={{ fontSize: 14.5, lineHeight: 1.65, margin:'0 0 14px', textIndent: i === 0 ? 0 : 20 }}>
                {i === 1 ? (
                  <>
                    The simplest CPU-scheduling algorithm is the <span style={{ position:'relative' }}>
                      <mark style={{ background: 'rgba(234, 88, 12, 0.18)', color:'inherit', padding:'1px 3px', borderRadius: 2, cursor:'pointer' }}>
                        first-come, first-served (FCFS) scheduling algorithm
                      </mark>
                      <SelectionPopover />
                    </span>. With this scheme, the process that requests the CPU first is allocated the CPU first. The implementation of the FCFS policy is easily managed with a FIFO queue.
                  </>
                ) : p}
              </p>
            ))}

            <aside style={{
              borderLeft:'2px solid var(--accent)',
              paddingLeft: 18, margin:'24px 0 28px',
              fontSize: 14.5, lineHeight: 1.6, color:'#3D3A33',
            }}>
              {PDF_PAGE.callout}
            </aside>

            <table style={{ width:'60%', borderCollapse:'collapse', margin:'18px 0' }}>
              <thead>
                <tr style={{ fontSize: 10.5, letterSpacing:'0.04em', textTransform:'uppercase', color:'#8B847A' }}>
                  <th style={{ textAlign:'left', padding:'8px 12px', borderBottom:'0.5px solid #DDD5C2' }}>Process</th>
                  <th style={{ textAlign:'right', padding:'8px 12px', borderBottom:'0.5px solid #DDD5C2' }}>Burst (ms)</th>
                </tr>
              </thead>
              <tbody>
                {PDF_PAGE.table.map((row, i) => (
                  <tr key={i}>
                    <td style={{ padding:'8px 12px', fontSize: 13, borderBottom: i < 2 ? '0.5px solid #ECE6D5' : 'none' }}>{row.p}</td>
                    <td className="mono" style={{ padding:'8px 12px', textAlign:'right', fontSize: 13, borderBottom: i < 2 ? '0.5px solid #ECE6D5' : 'none' }}>{row.burst}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p style={{ fontSize: 14.5, lineHeight: 1.65, margin:'0 0 14px' }}>
              If the processes arrive in the order P&#8321;, P&#8322;, P&#8323;, and are served in FCFS order, we get the result shown in the following Gantt chart, which is a bar chart that illustrates a particular schedule, including the start and finish times of each of the participating processes:
            </p>

            <svg viewBox="0 0 320 44" width="320" height="44" style={{ marginTop: 10 }}>
              <rect x="0" y="8" width="200" height="22" fill="#EFE6D6" stroke="#1F1B17" strokeWidth="0.6"/>
              <rect x="200" y="8" width="40" height="22" fill="#FBFAF6" stroke="#1F1B17" strokeWidth="0.6"/>
              <rect x="240" y="8" width="40" height="22" fill="#EFE6D6" stroke="#1F1B17" strokeWidth="0.6"/>
              <text x="100" y="23" fontSize="9" textAnchor="middle" fill="#1F1B17" fontFamily="Geist Mono">P₁</text>
              <text x="220" y="23" fontSize="9" textAnchor="middle" fill="#1F1B17" fontFamily="Geist Mono">P₂</text>
              <text x="260" y="23" fontSize="9" textAnchor="middle" fill="#1F1B17" fontFamily="Geist Mono">P₃</text>
              <text x="0" y="42" fontSize="8" textAnchor="middle" fill="#807870" fontFamily="Geist Mono">0</text>
              <text x="200" y="42" fontSize="8" textAnchor="middle" fill="#807870" fontFamily="Geist Mono">24</text>
              <text x="240" y="42" fontSize="8" textAnchor="middle" fill="#807870" fontFamily="Geist Mono">27</text>
              <text x="280" y="42" fontSize="8" textAnchor="middle" fill="#807870" fontFamily="Geist Mono">30</text>
            </svg>
          </article>
        </div>
      </div>
    </>
  );
}

/* Tiny popover that appears above the highlighted selection on the PDF */
function SelectionPopover() {
  return (
    <span style={{
      position:'absolute', left:'50%', top: -42, transform:'translateX(-50%)',
      display:'inline-flex', alignItems:'center', gap: 2,
      background:'var(--ink)', color:'var(--bg)',
      borderRadius: 7, padding: 3,
      boxShadow:'var(--shadow-md)',
      whiteSpace:'nowrap', fontFamily:'Geist',
    }}>
      <span style={{
        display:'inline-flex', alignItems:'center', gap: 5,
        padding:'5px 9px', borderRadius: 5, fontSize: 11.5, cursor:'pointer',
        color:'var(--accent)', background:'rgba(234,88,12,0.16)',
      }}>
        {I.star({ width:11, height:11 })} Star selection
      </span>
      <span style={{
        padding:'5px 9px', borderRadius: 5, fontSize: 11.5, cursor:'pointer',
        color:'var(--bg)',
      }}>Ask</span>
      <span style={{
        position:'absolute', bottom:-4, left:'50%', transform:'translateX(-50%) rotate(45deg)',
        width:8, height:8, background:'var(--ink)',
      }}/>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   PPT VIEWER
   ───────────────────────────────────────────────────────────── */
function PptViewer() {
  return (
    <>
      <div style={viewerToolbar()}>
        <div style={{ display:'flex', alignItems:'center', gap: 4 }}>
          <IconBtn label="Previous slide">{I.chevron({ style:{ transform:'rotate(180deg)' } })}</IconBtn>
          <span className="mono" style={{ fontSize: 11.5, color:'var(--ink-soft)', padding:'0 6px' }}>
            <span style={{ color:'var(--ink)', fontWeight: 500 }}>{PPT.number}</span>
            <span style={{ color:'var(--muted-2)' }}> / {PPT.total}</span>
          </span>
          <IconBtn label="Next slide">{I.chevron()}</IconBtn>
        </div>
        <div style={{ flex:1 }}/>
        <button style={starBtn()} title="Star this slide">
          {I.star({ width: 12, height: 12 })}
          <span>Star slide</span>
        </button>
      </div>

      <div style={{ flex:1, display:'flex', minHeight: 0 }}>
        <div style={{ width: 130, flex:'0 0 130px', borderRight:'1px solid var(--border-soft)', overflowY:'auto', padding:'14px 8px', background:'var(--panel-2)' }}>
          {[10,11,12,13,14,15,16].map(n => {
            const active = n === PPT.number;
            return (
              <div key={n} style={{
                display:'flex', alignItems:'center', gap: 6, marginBottom: 8,
              }}>
                <span className="mono" style={{ fontSize: 10, color:'var(--muted-2)', width: 18, textAlign:'right' }}>{n}</span>
                <div style={{
                  flex:1, aspectRatio:'16/9', background:'#FBFAF6',
                  border:`1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 3, position:'relative',
                  padding:'5px 6px', overflow:'hidden',
                  cursor:'pointer'
                }}>
                  <div style={{ height: 1.5, width:'70%', background:'#1F1B17', marginBottom: 3 }}/>
                  <div style={{ height: 0.8, width:'85%', background:'#807870', marginBottom: 2 }}/>
                  <div style={{ height: 0.8, width:'60%', background:'#807870', marginBottom: 2 }}/>
                  <div style={{ height: 0.8, width:'75%', background:'#807870' }}/>
                  {active && (
                    <div style={{ position:'absolute', top:-2, right:-2, width: 8, height: 8, background:'var(--accent)', borderRadius:'50%', border:'1.5px solid var(--panel-2)' }}/>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ flex:1, padding:'30px', display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', position:'relative' }}>
          <div style={{ position:'absolute', top: 24, right: 24, display:'flex', alignItems:'center', gap: 6, padding:'5px 11px', background:'var(--accent)', color:'var(--accent-fg)', borderRadius: 99, fontSize: 11.5, fontWeight: 500, boxShadow:'var(--shadow-sm)' }}>
            {I.pin({ width:11, height:11 })}
            <span className="mono" style={{ letterSpacing:'0.02em' }}>1 pinned</span>
          </div>

          <div style={{
            width:'100%', maxWidth: 720, aspectRatio:'16 / 9',
            background:'#FBFAF6', border:'1px solid #DDD5C2',
            borderRadius: 6, boxShadow:'var(--shadow-md)',
            padding:'48px 54px',
            display:'flex', flexDirection:'column',
            position:'relative', color:'#1A1815',
          }}>
            <div className="mono" style={{ position:'absolute', top: 18, left: 24, fontSize: 9.5, letterSpacing:'0.08em', color:'#8B847A', textTransform:'uppercase' }}>
              MEM-MGMT · 12
            </div>

            <h1 style={{ fontSize: 36, fontWeight: 600, margin:'12px 0 32px', letterSpacing:'-0.025em', color:'#1A1815', lineHeight: 1.1 }}>
              {PPT.title}
            </h1>

            <ul style={{ listStyle:'none', padding: 0, margin: 0, display:'flex', flexDirection:'column', gap: 14 }}>
              {PPT.bullets.map((b, i) => (
                <li key={i} style={{ display:'flex', gap: 14, fontSize: 16, lineHeight: 1.5, color:'#3D3A33' }}>
                  <span className="mono" style={{ fontSize: 11, color:'var(--accent)', paddingTop: 5, minWidth: 22, fontWeight: 500 }}>
                    0{i+1}
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mono" style={{ marginTop:'auto', paddingTop: 24, display:'flex', justifyContent:'space-between', alignItems:'baseline', fontSize: 10, color:'#B0A899', letterSpacing:'0.06em' }}>
              <span>{PPT.footnote}</span>
              <span>{PPT.number} / {PPT.total}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   VIDEO VIEWER
   ───────────────────────────────────────────────────────────── */
function VideoViewer() {
  return (
    <>
      <div style={viewerToolbar()}>
        <span style={{ fontSize: 12.5, color:'var(--ink-soft)' }}>{VIDEO.speaker}</span>
        <span style={{ width: 3, height: 3, borderRadius:'50%', background:'var(--muted-2)' }}/>
        <span className="mono" style={{ fontSize: 10.5, color:'var(--muted)' }}>
          uploaded · transcribed
        </span>
        <div style={{ flex:1 }}/>
        <button style={starBtn()} title="Star this moment">
          {I.star({ width: 12, height: 12 })}
          <span>Star {VIDEO.current}</span>
        </button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'24px 30px 30px' }}>
        <div style={{
          width:'100%', aspectRatio:'16 / 9', background:'#0A0A0A',
          border:'1px solid var(--border)', borderRadius: 8,
          position:'relative', overflow:'hidden',
          marginBottom: 14,
        }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 30% 40%, rgba(234,88,12,0.22) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(184,136,30,0.16) 0%, transparent 55%)' }}/>

          <div style={{ position:'absolute', left: 30, top: 30, color:'rgba(250,250,248,0.92)' }}>
            <div className="mono" style={{ fontSize: 10.5, letterSpacing:'0.1em', textTransform:'uppercase', opacity: 0.6, marginBottom: 8 }}>
              Lecture 09 · CS-318
            </div>
            <div style={{ fontSize: 24, fontWeight: 500, letterSpacing:'-0.018em' }}>
              {VIDEO.title}
            </div>
          </div>

          <div className="mono" style={{ position:'absolute', top: 20, right: 22, padding:'4px 10px', background:'rgba(10,10,10,0.7)', border:'1px solid rgba(250,250,248,0.18)', borderRadius: 4, color:'#FAFAF8', fontSize: 11 }}>
            {VIDEO.current} / {VIDEO.total}
          </div>

          <div style={{ position:'absolute', bottom: 52, left: `${VIDEO.pct * 100}%`, transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', color:'var(--accent)' }}>
            {I.pin({ width:14, height:14 })}
          </div>

          <div style={{
            position:'absolute', left: 0, right: 0, bottom: 0,
            padding:'14px 20px', display:'flex', alignItems:'center', gap: 12,
            background:'linear-gradient(to top, rgba(10,10,10,0.85), transparent)',
          }}>
            <button style={{
              width: 32, height: 32, borderRadius:'50%', background:'#FAFAF8',
              border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              color:'#0A0A0A', paddingLeft: 2,
            }}>{I.play()}</button>
            <div className="mono" style={{ fontSize: 11, color:'#FAFAF8' }}>{VIDEO.current}</div>
            <div style={{ flex:1, height: 3, background:'rgba(250,250,248,0.22)', borderRadius: 2, position:'relative' }}>
              <div style={{ position:'absolute', left:0, top:0, bottom: 0, width:`${VIDEO.pct * 100}%`, background:'var(--accent)', borderRadius: 2 }}/>
              <div style={{ position:'absolute', left:`${VIDEO.pct * 100}%`, top:'50%', width: 10, height: 10, borderRadius:'50%', background:'#FAFAF8', transform:'translate(-50%, -50%)' }}/>
            </div>
            <div className="mono" style={{ fontSize: 11, color:'rgba(250,250,248,0.7)' }}>{VIDEO.total}</div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color:'var(--ink)', letterSpacing:'-0.015em' }}>Transcript</h3>
          <span className="mono" style={{ fontSize: 10.5, color:'var(--muted)' }}>auto · english</span>
        </div>

        <div style={{ background:'var(--panel)', border:'1px solid var(--border-soft)', borderRadius: 8, padding:'8px 0' }}>
          {VIDEO.transcript.map((seg, i) => (
            <div key={i} style={{
              display:'flex', gap: 14, padding:'10px 18px',
              background: seg.active ? 'var(--accent-tint)' : 'transparent',
              borderLeft: seg.active ? '2px solid var(--accent)' : '2px solid transparent',
              cursor:'pointer',
            }}>
              <span className="mono" style={{ fontSize: 11, color: seg.active ? 'var(--accent)' : 'var(--muted-2)', minWidth: 38, paddingTop: 2 }}>
                {seg.t}
              </span>
              <span style={{ fontSize: 14, lineHeight: 1.55, color: seg.active ? 'var(--ink)' : 'var(--ink-soft)' }}>
                {seg.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   CHAT PANEL
   ───────────────────────────────────────────────────────────── */
function ChatPanel({ chats, messages, anchorLabel, anchorKind, resourceType }) {
  const activeChat = chats.find(c => c.active) || chats[0];
  const pinned = !!activeChat.pinned;
  const pinLabel = pinned
    ? `Pinned to ${formatAnchor(activeChat.pinned)}`
    : `Pin to ${anchorLabel}`;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight: 0 }}>
      {/* Tab strip */}
      <div style={{ display:'flex', alignItems:'stretch', borderBottom:'1px solid var(--border-soft)', background:'var(--panel-2)', minHeight: 40 }}>
        {chats.map(c => {
          const isActive = c.active;
          return (
            <div key={c.id} style={{
              padding:'9px 10px 9px 14px', display:'flex', alignItems:'center', gap: 7,
              background: isActive ? 'var(--panel)' : 'transparent',
              borderRight:'1px solid var(--border-soft)',
              borderBottom: isActive ? '1px solid var(--panel)' : 'none',
              marginBottom: isActive ? -1 : 0,
              maxWidth: 230, minWidth: 0, cursor:'pointer', position:'relative',
            }}>
              {c.pinned && (
                <span style={{ color:'var(--accent)', flexShrink: 0 }}>{I.pin({ width:11, height:11 })}</span>
              )}
              <span style={{
                fontSize: 12.5, color: isActive ? 'var(--ink)' : 'var(--ink-soft)',
                fontWeight: isActive ? 500 : 400,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>{c.name}</span>
              {c.pinned && (
                <span className="mono" style={{ fontSize: 9.5, color:'var(--accent)', background:'var(--accent-tint)', padding:'1px 5px', borderRadius: 3, flexShrink: 0 }}>
                  {formatAnchor(c.pinned, true)}
                </span>
              )}
              {isActive && (
                <IconBtn label="Star this chat" size={18} style={{ color:'var(--muted-2)' }}>{I.star({ width:11, height:11 })}</IconBtn>
              )}
              {!c.pinned && isActive && (
                <IconBtn label="Close" size={18} style={{ color:'var(--muted-2)' }}>{I.close({ width:11, height:11 })}</IconBtn>
              )}
            </div>
          );
        })}
        <button style={{
          padding:'0 12px', background:'transparent', border:'none', cursor:'pointer',
          color:'var(--muted)', display:'inline-flex', alignItems:'center', gap: 5, fontSize: 12,
          fontFamily:'inherit',
        }} title="New chat">{I.plus({ width:12, height:12 })} New</button>
        <div style={{ flex:1 }}/>
      </div>

      {/* Ribbon — pin button only, no context/Hinglish noise */}
      <div style={{ display:'flex', alignItems:'center', padding:'10px 14px', borderBottom:'1px solid var(--border-soft)', background:'var(--panel)', gap: 10 }}>
        <button style={{
          display:'inline-flex', alignItems:'center', gap: 7,
          padding:'6px 11px',
          background: pinned ? 'var(--accent)' : 'transparent',
          color: pinned ? 'var(--accent-fg)' : 'var(--ink-soft)',
          border: `1px solid ${pinned ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 7, cursor:'pointer', fontSize: 12, fontFamily:'inherit', fontWeight: 500,
        }}>
          {I.pin({ width:11, height:11 })} {pinLabel} {pinned && <span style={{ marginLeft:1 }}>✓</span>}
        </button>
        <div style={{ flex:1 }}/>
        <IconBtn label="More" size={26}>{I.more()}</IconBtn>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'22px 22px 14px', display:'flex', flexDirection:'column', gap: 22 }}>
        {messages.map((m, i) => <Message key={i} message={m} />)}
        {messages[messages.length - 1]?.followups && (
          <div style={{ display:'flex', flexDirection:'column', gap: 6, marginTop: -6 }}>
            <span className="mono" style={{ fontSize: 10, color:'var(--muted)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom: 4 }}>
              Suggested
            </span>
            {messages[messages.length - 1].followups.map((f, i) => (
              <button key={i} style={{
                textAlign:'left', padding:'9px 12px',
                background:'transparent', border:'1px solid var(--border-soft)',
                borderRadius: 7, cursor:'pointer', fontFamily:'inherit',
                color:'var(--ink-soft)', fontSize: 13,
                display:'flex', alignItems:'center', gap: 8,
                transition:'all 140ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background='var(--accent-tint)'; e.currentTarget.style.color='var(--ink)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-soft)'; e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--ink-soft)'; }}
              >
                <span className="mono" style={{ color:'var(--muted-2)', fontSize: 11 }}>→</span> {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding:'12px 14px 14px', borderTop:'1px solid var(--border-soft)', background:'var(--panel)' }}>
        <div style={{
          background:'var(--panel-2)', border:'1px solid var(--border)', borderRadius: 10,
          padding:'10px 12px 8px', transition:'border-color 140ms ease',
        }}>
          <div contentEditable suppressContentEditableWarning style={{
            outline:'none', fontSize: 13.5, lineHeight: 1.5, minHeight: 36,
            color:'var(--ink)',
          }}>
            <span style={{ color:'var(--muted-2)' }}>Ask about this {anchorKind === 'page' ? 'page' : anchorKind === 'slide' ? 'slide' : 'moment'}…</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop: 6, paddingTop: 6, borderTop:'1px solid var(--border-soft)' }}>
            <Pill color="var(--muted)" bg="transparent" border="var(--border-soft)" style={{ fontSize: 10 }}>claude-sonnet-4-6</Pill>
            <button style={{
              display:'inline-flex', alignItems:'center', gap: 6,
              padding:'5px 10px 5px 11px', background:'var(--ink)', color:'var(--bg)',
              border:'none', borderRadius: 6, cursor:'pointer', fontSize: 12, fontWeight: 500,
              fontFamily:'inherit',
            }}>
              Send <kbd style={{ background:'rgba(255,255,255,0.14)', border:'none', color:'var(--bg)' }}>⌘↵</kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Message({ message: m }) {
  const [hover, setHover] = useState(false);

  if (m.role === 'user') {
    return (
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ alignSelf:'flex-end', maxWidth: '88%', position:'relative' }}
      >
        <div style={{
          background:'var(--panel-sunk)', border:'1px solid var(--border-soft)',
          borderRadius:'12px 12px 4px 12px', padding:'10px 13px',
          fontSize: 13.5, color:'var(--ink)', lineHeight: 1.55
        }}>
          {m.text}
        </div>
      </div>
    );
  }
  // assistant
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display:'flex', gap: 10, alignItems:'flex-start', position:'relative' }}
    >
      <div style={{
        width: 26, height: 26, borderRadius: 7,
        background:'var(--accent)', color:'var(--accent-fg)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize: 12, fontWeight: 700, letterSpacing:'-0.02em', flexShrink: 0,
      }}>N</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize: 13.5, color:'var(--ink)', lineHeight: 1.6 }}>
          {renderAssistantText(m.text)}
        </div>
      </div>
      {/* Hover action rail — star this message */}
      <div style={{
        position:'absolute', top: -10, right: 0,
        display:'flex', alignItems:'center', gap: 1,
        padding: 2,
        background:'var(--panel)', border:'1px solid var(--border)', borderRadius: 7,
        boxShadow:'var(--shadow-sm)',
        opacity: hover ? 1 : 0,
        transform: hover ? 'translateY(0)' : 'translateY(-2px)',
        transition:'all 120ms ease',
        pointerEvents: hover ? 'auto' : 'none',
      }}>
        <IconBtn label="Star message" size={22} style={{ color:'var(--gold)' }}>{I.star({ width:11, height:11 })}</IconBtn>
        <IconBtn label="Copy" size={22}>{I.card({ width:11, height:11 })}</IconBtn>
        <IconBtn label="More" size={22}>{I.more({ width:11, height:11 })}</IconBtn>
      </div>
    </div>
  );
}

function renderAssistantText(text) {
  const parts = [];
  let key = 0;
  text.split(/\n\n+/).forEach((para, pi) => {
    if (pi > 0) parts.push(<div key={`gap-${key++}`} style={{ height: 8 }}/>);
    const tokens = para.split(/(\*\*[^*]+\*\*|\[[^\]]+\])/g);
    parts.push(<div key={`p-${key++}`}>
      {tokens.map((tok, i) => {
        if (tok.startsWith('**')) return <strong key={i} style={{ fontWeight: 600 }}>{tok.slice(2, -2)}</strong>;
        if (tok.startsWith('[')) return <CitationChip key={i} label={tok.slice(1, -1)} />;
        return <React.Fragment key={i}>{tok}</React.Fragment>;
      })}
    </div>);
  });
  return parts;
}

function CitationChip({ label }) {
  return (
    <button className="mono" style={{
      display:'inline-flex', alignItems:'center', gap: 3,
      padding:'1px 6px', margin:'0 1px',
      background:'var(--accent-tint)', border:'1px solid var(--accent-soft)',
      borderRadius: 4, color:'var(--accent)',
      fontSize: 10.5, cursor:'pointer',
      verticalAlign:'baseline', fontWeight: 500,
    }}>
      {label}
    </button>
  );
}

function formatAnchor(a, short) {
  if (a.page != null)  return short ? `p.${a.page}` : `page ${a.page}`;
  if (a.slide != null) return short ? `s.${a.slide}` : `slide ${a.slide}`;
  if (a.t)             return short ? a.t : a.t;
  return '';
}

/* ─────────────────────────────────────────────────────────────
   UPLOAD MODAL
   ───────────────────────────────────────────────────────────── */
function UploadModal({ onClose }) {
  const [step, setStep] = useState('pick');

  return (
    <div style={{
      position:'fixed', inset: 0, zIndex: 100,
      background:'rgba(10,10,10,0.5)',
      backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 620, background:'var(--panel)', borderRadius: 14,
        boxShadow:'var(--shadow-lg)', overflow:'hidden',
        border:'1px solid var(--border)',
      }}>
        <div style={{ padding:'20px 26px 18px', borderBottom:'1px solid var(--border-soft)', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div className="mono" style={{ fontSize: 10.5, letterSpacing:'0.08em', color:'var(--muted)', textTransform:'uppercase', marginBottom: 6 }}>
              Operating Systems
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, color:'var(--ink)', letterSpacing:'-0.02em' }}>
              {step === 'pick' ? 'Add a resource' : step === 'pdf' ? 'Upload a PDF' : 'Paste a YouTube link'}
            </h2>
          </div>
          <IconBtn label="Close" onClick={onClose} size={30}>{I.close()}</IconBtn>
        </div>

        {step === 'pick' && (
          <div style={{ padding:'22px 26px 26px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
              <UploadTile icon={I.pdf}     label="PDF"     hint=".pdf — books, notes, papers"     onClick={() => setStep('pdf')} />
              <UploadTile icon={I.ppt}     label="PPT"     hint=".pptx — lecture decks" />
              <UploadTile icon={I.youtube} label="YouTube" hint="Paste a video URL"               onClick={() => setStep('youtube')} />
              <UploadTile icon={I.video}   label="Video"   hint=".mp4 .mov .webm — local Whisper" />
            </div>

            <div style={{ marginTop: 18, padding:'12px 14px', background:'var(--panel-2)', border:'1px solid var(--border-soft)', borderRadius: 8, display:'flex', gap: 12, alignItems:'flex-start' }}>
              <span style={{ color:'var(--muted)', paddingTop: 1 }}>{I.upload()}</span>
              <div style={{ fontSize: 12.5, color:'var(--ink-soft)', lineHeight: 1.5 }}>
                <strong style={{ fontWeight: 600 }}>Drag files here</strong> to skip this picker. Everything processes locally — PDFs and PPTs extract immediately, videos transcribe in the background.
              </div>
            </div>
          </div>
        )}

        {step === 'pdf' && (
          <div style={{ padding:'22px 26px 26px' }}>
            <button onClick={() => setStep('pick')} style={{ display:'inline-flex', alignItems:'center', gap: 5, background:'transparent', border:'none', color:'var(--muted)', fontSize: 12, cursor:'pointer', marginBottom: 18, padding:0, fontFamily:'inherit' }}>
              {I.back()} Back
            </button>

            <div style={{
              border:'1.5px dashed var(--border)', borderRadius: 12,
              padding:'52px 30px', textAlign:'center',
              background:'var(--panel-2)',
            }}>
              <div style={{ color:'var(--accent)', marginBottom: 14, display:'inline-block' }}>
                {I.upload({ width: 26, height: 26 })}
              </div>
              <div style={{ fontSize: 17, fontWeight: 500, color:'var(--ink)', marginBottom: 6, letterSpacing:'-0.015em' }}>
                Drop a PDF here
              </div>
              <div style={{ fontSize: 13, color:'var(--muted)', marginBottom: 16 }}>
                or <span style={{ color:'var(--accent)', textDecoration:'underline', cursor:'pointer', fontWeight: 500 }}>browse files</span> · up to 200 MB
              </div>
              <div className="mono" style={{ fontSize: 10.5, color:'var(--muted-2)', letterSpacing:'0.04em' }}>
                pymupdf · ~2 sec per 100 pages
              </div>
            </div>

            <div style={{ marginTop: 16, display:'flex', alignItems:'center', gap: 10, fontSize: 12.5, color:'var(--ink-soft)' }}>
              <input type="checkbox" defaultChecked style={{ accentColor:'var(--accent)' }}/>
              Star the cover page automatically
            </div>
          </div>
        )}

        {step === 'youtube' && (
          <div style={{ padding:'22px 26px 26px' }}>
            <button onClick={() => setStep('pick')} style={{ display:'inline-flex', alignItems:'center', gap: 5, background:'transparent', border:'none', color:'var(--muted)', fontSize: 12, cursor:'pointer', marginBottom: 18, padding:0, fontFamily:'inherit' }}>
              {I.back()} Back
            </button>

            <div style={{ marginBottom: 14 }}>
              <label className="mono" style={{ display:'block', fontSize: 10, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--muted)', marginBottom: 8 }}>
                Video URL
              </label>
              <div style={{ display:'flex', alignItems:'center', gap: 10, border:'1px solid var(--border)', borderRadius: 8, padding:'10px 14px', background:'var(--panel-2)' }}>
                <span style={{ color:'var(--muted)' }}>{I.link()}</span>
                <input
                  placeholder="https://youtube.com/watch?v=..."
                  defaultValue="https://www.youtube.com/watch?v=4w_uK4QkVrk"
                  style={{
                    flex:1, border:'none', outline:'none', background:'transparent',
                    fontFamily:"'Geist Mono', monospace", fontSize: 12.5, color:'var(--ink)',
                  }}/>
              </div>
            </div>

            <div style={{ marginTop: 14, padding:'14px 16px', background:'var(--panel-2)', border:'1px solid var(--border-soft)', borderRadius: 10, display:'flex', gap: 12 }}>
              <div style={{ width: 88, aspectRatio:'16/9', background:'#0A0A0A', borderRadius: 4, flexShrink: 0, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', inset: 0, background:'radial-gradient(circle at 50% 50%, rgba(234,88,12,0.34) 0%, transparent 60%)' }}/>
                <div className="mono" style={{ position:'absolute', top: 4, left: 6, fontSize: 8, color:'#FAFAF8' }}>4K</div>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize: 13, color:'var(--ink)', fontWeight: 500, marginBottom: 4 }}>
                  Threads, Locks &amp; the Memory Model
                </div>
                <div className="mono" style={{ fontSize: 10.5, color:'var(--muted)' }}>
                  47:13 · captions available · english
                </div>
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', gap: 10, marginTop: 22 }}>
              <button style={btnGhost()} onClick={onClose}>Cancel</button>
              <button style={btnPrimary()}>Add to project</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UploadTile({ icon, label, hint, onClick }) {
  return (
    <button onClick={onClick} disabled={!onClick} style={{
      display:'flex', flexDirection:'column', alignItems:'flex-start', gap: 8,
      padding:'16px 16px 14px',
      background:'var(--panel-2)', border:'1px solid var(--border-soft)',
      borderRadius: 10, cursor: onClick ? 'pointer' : 'not-allowed',
      textAlign:'left', transition:'all 140ms ease',
      opacity: onClick ? 1 : 0.55, fontFamily:'inherit',
    }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-tint)'; } }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-soft)'; e.currentTarget.style.background = 'var(--panel-2)'; }}
    >
      <span style={{ color:'var(--ink)' }}>{React.createElement(icon, { width: 18, height: 18 })}</span>
      <div style={{ fontSize: 14, color:'var(--ink)', fontWeight: 500 }}>{label}</div>
      <div className="mono" style={{ fontSize: 10.5, color:'var(--muted)' }}>{hint}</div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   Style helpers
   ───────────────────────────────────────────────────────────── */
function btnPrimary() {
  return {
    display:'inline-flex', alignItems:'center', gap: 6,
    padding:'7px 13px',
    background:'var(--accent)', color:'var(--accent-fg)',
    border:'1px solid var(--accent)', borderRadius: 7, cursor:'pointer',
    fontSize: 13, fontWeight: 500, fontFamily:'inherit',
    transition:'background 140ms ease',
  };
}
function btnGhost() {
  return {
    display:'inline-flex', alignItems:'center', gap: 6,
    padding:'7px 12px',
    background:'transparent', color:'var(--ink-soft)',
    border:'1px solid var(--border)', borderRadius: 7, cursor:'pointer',
    fontSize: 13, fontFamily:'inherit',
  };
}
function viewerToolbar() {
  return {
    display:'flex', alignItems:'center', gap: 8,
    padding:'10px 14px',
    background:'var(--panel)',
    borderBottom:'1px solid var(--border-soft)',
    minHeight: 44,
  };
}
function starBtn() {
  return {
    display:'inline-flex', alignItems:'center', gap: 5,
    padding:'5px 10px',
    background:'transparent',
    color:'var(--gold)',
    border:'1px solid var(--border)', borderRadius: 6, cursor:'pointer',
    fontSize: 12, fontFamily:'inherit', fontWeight: 500,
  };
}

/* ─────────────────────────────────────────────────────────────
   App
   ───────────────────────────────────────────────────────────── */
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState({ view: t.view, resourceType: t.resourceType, projectId: 'os' });

  useEffect(() => {
    setRoute(r => ({ ...r, view: t.view, resourceType: t.resourceType }));
  }, [t.view, t.resourceType]);

  // Apply theme, palette, font, background, radius as data-attrs on <html>
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-theme',   t.theme   || 'light');
    r.setAttribute('data-palette', t.palette || 'ember');
    r.setAttribute('data-font',    t.font    || 'geist');
    r.setAttribute('data-bg',      t.bg      || 'plain');
    r.setAttribute('data-radius',  t.radius  || 'soft');
  }, [t.theme, t.palette, t.font, t.bg, t.radius]);

  const navigate = (next) => {
    setRoute(r => ({ ...r, ...next }));
    if (next.view) setTweak({ view: next.view });
    if (next.resourceType) setTweak({ resourceType: next.resourceType });
    if (next.showUpload != null) setTweak({ showUpload: next.showUpload });
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', width:'100vw', background:'transparent' }}>
      <TopBar
        route={route}
        onNavigate={navigate}
        theme={t.theme}
        onThemeChange={(v) => setTweak({ theme: v })}
      />

      <main style={{ flex:1, display:'flex', minHeight: 0 }}>
        {route.view === 'home'     && <HomeView onNavigate={navigate} onUpload={() => setTweak({ showUpload: true })} />}
        {route.view === 'project'  && <ProjectView projectId={route.projectId} onNavigate={navigate} onUpload={() => setTweak({ showUpload: true })} />}
        {route.view === 'resource' && <ResourceView resourceType={route.resourceType} onNavigate={navigate} />}
      </main>

      {t.showUpload && <UploadModal onClose={() => setTweak({ showUpload: false })} />}

      <TweaksPanel>
        <TweakSection label="View" />
        <TweakRadio label="Screen" value={t.view}
          options={[
            { label:'Home',     value:'home' },
            { label:'Project',  value:'project' },
            { label:'Resource', value:'resource' },
          ]}
          onChange={(v) => setTweak({ view: v })} />
        {t.view === 'resource' && (
          <TweakRadio label="Resource type" value={t.resourceType}
            options={[
              { label:'PDF',   value:'pdf' },
              { label:'PPT',   value:'ppt' },
              { label:'Video', value:'video' },
            ]}
            onChange={(v) => setTweak({ resourceType: v })} />
        )}
        <TweakToggle label="Show upload modal" value={t.showUpload}
          onChange={(v) => setTweak({ showUpload: v })} />

        <TweakSection label="Surface" />
        <TweakRadio label="Mode" value={t.theme}
          options={[
            { label:'Light',   value:'light' },
            { label:'Dark',    value:'dark' },
            { label:'Reading', value:'reading' },
          ]}
          onChange={(v) => setTweak({ theme: v })} />
        <TweakSelect label="Background" value={t.bg}
          options={[
            { label:'Plain',     value:'plain' },
            { label:'Paper dot', value:'paper' },
            { label:'Grid',      value:'grid' },
            { label:'Warm wash', value:'warm' },
            { label:'Hairline',  value:'hairline' },
          ]}
          onChange={(v) => setTweak({ bg: v })} />

        <TweakSection label="Palette" />
        <TweakRow label="Accent">
          <div style={{ display:'flex', gap: 8, flexWrap:'wrap' }}>
            {[
              { key:'ember',    color:'#C2410C' },
              { key:'graphite', color:'#18181B' },
              { key:'forest',   color:'#2F6B49' },
              { key:'indigo',   color:'#3A3A8A' },
              { key:'plum',     color:'#831843' },
            ].map(p => {
              const active = t.palette === p.key;
              return (
                <button key={p.key} onClick={() => setTweak({ palette: p.key })}
                  title={p.key}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: p.color, cursor:'pointer',
                    border: active ? '2px solid var(--ink)' : '2px solid transparent',
                    outline: active ? '1px solid var(--border)' : 'none',
                    outlineOffset: 1,
                    padding: 0, transition:'transform 120ms ease',
                  }}/>
              );
            })}
          </div>
        </TweakRow>

        <TweakSection label="Typography" />
        <TweakSelect label="Type system" value={t.font}
          options={[
            { label:'Geist — modern sans',   value:'geist' },
            { label:'Editorial — serif display + sans',  value:'editorial' },
            { label:'IBM Plex — workhorse', value:'plex' },
            { label:'Literary — Newsreader + sans', value:'literary' },
            { label:'Mono-forward',          value:'mono' },
          ]}
          onChange={(v) => setTweak({ font: v })} />
      </TweaksPanel>
    </div>
  );
}

function hexToRgba(hex, a) {
  const m = hex.replace('#','');
  const r = parseInt(m.slice(0,2),16), g = parseInt(m.slice(2,4),16), b = parseInt(m.slice(4,6),16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function relLum(hex) {
  const m = hex.replace('#','');
  const r = parseInt(m.slice(0,2),16)/255, g = parseInt(m.slice(2,4),16)/255, b = parseInt(m.slice(4,6),16)/255;
  const f = (c) => c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

import { useState, useEffect, useRef, useCallback } from "react";

// ─── localStorage persistence hook ───────────────────────────────────────────
function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem("flowstate_" + key);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) { /* ignore parse errors, use default */ }
    return typeof defaultValue === "function" ? defaultValue() : defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem("flowstate_" + key, JSON.stringify(value));
    } catch (e) { /* storage full or unavailable */ }
  }, [key, value]);

  return [value, setValue];
}

// ─── COLOR SYSTEM (science-backed) ───────────────────────────────────────────
const C = {
  bg: "#0f1117", bgWarm: "#12131a", surface: "#181a24", surfaceAlt: "#1c1f2b",
  surfaceHover: "#222536", border: "#272b3a", borderLight: "#323752",
  blue: "#5b8af5", blueDim: "#3d6ad4", blueBg: "rgba(91,138,245,0.07)", blueBorder: "rgba(91,138,245,0.18)",
  green: "#6bcb8b", greenDim: "#4a9a68", greenBg: "rgba(107,203,139,0.07)",
  amber: "#e8a84c", amberDim: "#b8842d", amberBg: "rgba(232,168,76,0.07)",
  rose: "#e87070", roseBg: "rgba(232,112,112,0.07)",
  lavender: "#9b8afb", lavenderBg: "rgba(155,138,251,0.07)",
  teal: "#5bc4c0", tealBg: "rgba(91,196,192,0.07)",
  text: "#e2e4ed", textSoft: "#a8adc2", textMuted: "#6b7190", textDim: "#464c65",
  overlay: "rgba(10,12,20,0.7)",
};

// ─── TABS (reorganized) ──────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "◉", group: "general" },
  { id: "notes", label: "Notes", icon: "▤", group: "general" },
  { id: "mindmap", label: "Mind Map", icon: "◎", group: "general" },
  { id: "timeblock", label: "Time Block", icon: "▦", group: "plan" },
  { id: "todos", label: "Tasks", icon: "◇", group: "plan" },
  { id: "pomodoro", label: "Pomodoro", icon: "◔", group: "execute" },
  { id: "soundscape", label: "Focus Sounds", icon: "♫", group: "execute" },
  { id: "energy", label: "Energy Map", icon: "∿", group: "reflect" },
  { id: "journal", label: "Journal", icon: "☽", group: "reflect" },
  { id: "weekly", label: "Weekly Review", icon: "⊕", group: "reflect" },
  { id: "habits", label: "Habits", icon: "⟡", group: "reflect" },
  { id: "guide", label: "Guide", icon: "❖", group: "help" },
];
const GROUP_LABELS = { general: "General", plan: "Plan", execute: "Execute", reflect: "Reflect", help: "Learn" };

const HOURS = Array.from({ length: 24 }, (_, i) => { const h = i % 12 || 12; return `${h}${i < 12 ? "a" : "p"}`; });
const HOURS_FULL = Array.from({ length: 24 }, (_, i) => { const h = i % 12 || 12; return `${h}:00 ${i < 12 ? "AM" : "PM"}`; });

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── Fonts & Global CSS ──────────────────────────────────────────────────────
const fl = document.createElement("link");
fl.href = "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@300;400;500&display=swap";
fl.rel = "stylesheet"; document.head.appendChild(fl);

const gs = document.createElement("style");
gs.textContent = `*{margin:0;padding:0;box-sizing:border-box}body{background:${C.bg};color:${C.text};font-family:'DM Sans',sans-serif;overflow:hidden}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes slideR{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}.fu{animation:fadeUp .35s ease forwards}.sr{animation:slideR .3s ease forwards}input,textarea,select{font-family:'DM Sans',sans-serif}canvas{touch-action:none}input[type=range]{accent-color:${C.blue}}`;
document.head.appendChild(gs);

// ─── Shared ──────────────────────────────────────────────────────────────────
const mono = { fontFamily: "'DM Mono',monospace" };
const S = {
  card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 14 },
  cardLabel: { ...mono, fontSize: 10, fontWeight: 500, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 12 },
  input: { background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px", color: C.text, fontSize: 13, outline: "none", width: "100%" },
  badge: (color) => ({ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: `${color}12`, color, border: `1px solid ${color}25`, ...mono }),
};

const Btn = ({ children, variant = "default", style, ...p }) => {
  const v = { primary: { background: C.blue, color: "#fff", border: "none" }, outline: { background: "transparent", border: `1px solid ${C.border}`, color: C.textSoft }, ghost: { background: "transparent", border: "none", color: C.textMuted }, danger: { background: "transparent", border: `1px solid ${C.rose}30`, color: C.rose }, default: { background: C.surfaceHover, color: C.text, border: `1px solid ${C.border}` } };
  return <button style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", transition: "all .15s", ...(v[variant] || v.default), ...style }} {...p}>{children}</button>;
};

const Card = ({ title, children, style, accent }) => (
  <div style={{ ...S.card, ...(accent ? { borderLeft: `3px solid ${accent}` } : {}), ...style }} className="fu">
    {title && <div style={S.cardLabel}>{title}</div>}{children}
  </div>
);

const Stat = ({ label, value, color = C.blue }) => (
  <div style={{ padding: "14px 18px", background: C.bgWarm, borderRadius: 10, border: `1px solid ${C.border}`, minWidth: 110, flex: 1 }}>
    <div style={{ ...mono, fontSize: 30, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6, fontWeight: 500 }}>{label}</div>
  </div>
);

const ScienceTip = ({ title, children, color = C.blue }) => (
  <Card accent={color} style={{ background: `${color}06` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ ...mono, fontSize: 10, color, fontWeight: 600, background: `${color}15`, padding: "2px 8px", borderRadius: 4 }}>SCIENCE</span>
      <span style={{ fontSize: 13, fontWeight: 600, color }}>{title}</span>
    </div>
    <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.75 }}>{children}</div>
  </Card>
);

const EmptyState = ({ icon, text }) => (
  <div style={{ padding: 48, textAlign: "center" }}>
    <div style={{ fontSize: 36, opacity: 0.15, marginBottom: 8 }}>{icon}</div>
    <div style={{ color: C.textDim, fontSize: 13 }}>{text}</div>
  </div>
);

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ todos, habits, pomodoroCount, notes }) {
  const done = todos.filter(t => t.done).length;
  const habitsToday = habits.filter(h => h.completedToday).length;
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const tips = [
    { title: "Ultradian Rhythms", text: "Your brain cycles in ~90-minute focus waves. Schedule deep work in 90-min blocks with 20-min recovery breaks.", color: C.blue },
    { title: "Implementation Intentions", text: "\"I will [ACTION] at [TIME] in [PLACE]\" — doubles follow-through rate (Peter Gollwitzer, NYU).", color: C.green },
    { title: "The Zeigarnik Effect", text: "Unfinished tasks create mental tension that aids memory. Start a task even briefly — your brain will keep processing it unconsciously.", color: C.lavender },
    { title: "Attention Residue", text: "Switching tasks leaves \"residue\" that impairs performance for 15+ minutes (Sophie Leroy). Batch similar tasks and use shutdown rituals.", color: C.amber },
    { title: "The Progress Principle", text: "Making progress on meaningful work is the #1 daily motivator (Teresa Amabile, Harvard). Track even small wins.", color: C.teal },
    { title: "Parkinson's Law", text: "Work expands to fill available time. Use Pomodoro timers to create artificial deadlines that sharpen focus.", color: C.rose },
  ];
  const tip = tips[now.getDate() % tips.length];
  const score = Math.min(100, Math.round(((done / Math.max(todos.length, 1)) * 35) + ((habitsToday / Math.max(habits.length, 1)) * 30) + (Math.min(pomodoroCount, 8) / 8 * 35)));
  const scoreColor = score > 70 ? C.green : score > 40 ? C.amber : C.textMuted;

  return (
    <div className="fu">
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" }}>{greeting}</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 20 }}>
        <Stat label="Tasks done" value={`${done}/${todos.length}`} color={C.green} />
        <Stat label="Habits" value={`${habitsToday}/${habits.length}`} color={C.blue} />
        <Stat label="Focus sessions" value={pomodoroCount} color={C.amber} />
        <Stat label="Notes" value={notes.length} color={C.lavender} />
      </div>
      <Card title="Daily Focus Score">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ position: "relative", width: 80, height: 80 }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke={C.border} strokeWidth="5" />
              <circle cx="40" cy="40" r="34" fill="none" stroke={scoreColor} strokeWidth="5" strokeDasharray={`${2*Math.PI*34}`} strokeDashoffset={`${2*Math.PI*34*(1-score/100)}`} strokeLinecap="round" transform="rotate(-90 40 40)" style={{ transition: "stroke-dashoffset .8s ease" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", ...mono, fontSize: 20, fontWeight: 700, color: scoreColor }}>{score}</div>
          </div>
          <div style={{ flex: 1, fontSize: 12, color: C.textSoft, lineHeight: 1.7 }}>
            Weighted: <strong style={{ color: C.green }}>tasks (35%)</strong>, <strong style={{ color: C.blue }}>habits (30%)</strong>, <strong style={{ color: C.amber }}>deep work (35%)</strong>. Aim for 70+.
          </div>
        </div>
      </Card>
      <ScienceTip title={tip.title} color={tip.color}>{tip.text}</ScienceTip>
      <Card title="Shutdown Ritual">
        <div style={{ fontSize: 12, color: C.textSoft, marginBottom: 10 }}>End-of-day checklist to close open loops (Cal Newport):</div>
        {["Review tasks & reschedule", "Process inbox to zero", "Check tomorrow's calendar", "Note today's biggest win", "Say \"Shutdown complete\""].map((t, i) => <CheckItem key={i} text={t} />)}
      </Card>
    </div>
  );
}

function CheckItem({ text }) {
  const [c, setC] = useState(false);
  return (
    <div onClick={() => setC(!c)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 3, background: c ? C.greenBg : "transparent", border: `1px solid ${c ? C.green + "25" : "transparent"}` }}>
      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${c ? C.green : C.border}`, background: c ? C.green + "25" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.green, flexShrink: 0 }}>{c ? "✓" : ""}</div>
      <span style={{ fontSize: 12, color: c ? C.green : C.textSoft, textDecoration: c ? "line-through" : "none" }}>{text}</span>
    </div>
  );
}

// ─── MIND MAP (with save/load) ───────────────────────────────────────────────
function MindMap() {
  const canvasRef = useRef(null);
  const [savedMaps, setSavedMaps] = useLocalStorage("mindmaps", [{ id: 1, name: "My First Mind Map", nodes: [{ id: 1, x: 400, y: 300, text: "Central Idea", color: C.blue, r: 58 }], edges: [], freeLines: [], created: new Date().toISOString() }]);
  const [activeMapId, setActiveMapId] = useState(1);
  const [nodes, setNodes] = useState([{ id: 1, x: 400, y: 300, text: "Central Idea", color: C.blue, r: 58 }]);
  const [edges, setEdges] = useState([]);
  const [freeLines, setFreeLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [editText, setEditText] = useState("");
  const [connecting, setConnecting] = useState(null);
  const [tool, setTool] = useState("select");
  const [penColor, setPenColor] = useState(C.blue);
  const [penSize, setPenSize] = useState(2);
  const [mapName, setMapName] = useState("My First Mind Map");
  const [showList, setShowList] = useState(false);
  const nextId = useRef(2);
  const palette = [C.blue, C.green, C.amber, C.rose, C.lavender, C.teal, "#e8e8e8"];

  // Load a map
  const loadMap = (map) => {
    setNodes(map.nodes); setEdges(map.edges); setFreeLines(map.freeLines || []);
    setActiveMapId(map.id); setMapName(map.name); setSelectedNode(null); setShowList(false);
    nextId.current = Math.max(...map.nodes.map(n => n.id), 0) + 1;
  };

  // Save current map
  const saveMap = () => {
    setSavedMaps(prev => prev.map(m => m.id === activeMapId ? { ...m, name: mapName, nodes, edges, freeLines, updated: new Date().toISOString() } : m));
  };

  // Create new map
  const newMap = () => {
    const id = Date.now();
    const map = { id, name: "Untitled Map", nodes: [{ id: 1, x: 400, y: 300, text: "Central Idea", color: C.blue, r: 58 }], edges: [], freeLines: [], created: new Date().toISOString() };
    setSavedMaps(prev => [...prev, map]);
    loadMap(map);
    setMapName("Untitled Map");
  };

  const deleteMap = (id) => {
    if (savedMaps.length <= 1) return;
    setSavedMaps(prev => prev.filter(m => m.id !== id));
    if (activeMapId === id) { const remaining = savedMaps.filter(m => m.id !== id); if (remaining.length) loadMap(remaining[0]); }
  };

  // Auto-save on changes
  useEffect(() => {
    const t = setTimeout(() => {
      setSavedMaps(prev => prev.map(m => m.id === activeMapId ? { ...m, name: mapName, nodes, edges, freeLines, updated: new Date().toISOString() } : m));
    }, 500);
    return () => clearTimeout(t);
  }, [nodes, edges, freeLines, mapName]);

  const getPos = useCallback((e) => { const r = canvasRef.current?.getBoundingClientRect(); if (!r) return { x: 0, y: 0 }; const t = e.touches ? e.touches[0] : e; return { x: t.clientX - r.left, y: t.clientY - r.top }; }, []);
  const findNode = useCallback((p) => nodes.find(n => Math.hypot(n.x - p.x, n.y - p.y) < n.r), [nodes]);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); const dpr = window.devicePixelRatio || 1;
    const rect = cv.getBoundingClientRect(); cv.width = rect.width * dpr; cv.height = rect.height * dpr;
    ctx.scale(dpr, dpr); ctx.clearRect(0, 0, rect.width, rect.height);
    // Dot grid
    ctx.fillStyle = C.textDim + "30";
    for (let x = 0; x < rect.width; x += 32) for (let y = 0; y < rect.height; y += 32) { ctx.beginPath(); ctx.arc(x, y, 0.8, 0, Math.PI * 2); ctx.fill(); }
    // Free lines
    [...freeLines, ...(currentLine ? [currentLine] : [])].forEach(line => {
      if (line.points.length < 2) return; ctx.beginPath(); ctx.strokeStyle = line.color; ctx.lineWidth = line.size; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.moveTo(line.points[0].x, line.points[0].y);
      for (let i = 1; i < line.points.length; i++) { const p0 = line.points[i-1], p1 = line.points[i]; ctx.quadraticCurveTo(p0.x, p0.y, (p0.x+p1.x)/2, (p0.y+p1.y)/2); } ctx.stroke();
    });
    // Edges
    edges.forEach(e => { const f = nodes.find(n => n.id === e.from), t = nodes.find(n => n.id === e.to); if (!f||!t) return; ctx.beginPath(); ctx.strokeStyle = C.textDim+"80"; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]); ctx.moveTo(f.x, f.y); ctx.quadraticCurveTo((f.x+t.x)/2+(t.y-f.y)*.12, (f.y+t.y)/2-(t.x-f.x)*.12, t.x, t.y); ctx.stroke(); ctx.setLineDash([]); });
    // Nodes
    nodes.forEach(n => {
      const sel = selectedNode === n.id;
      if (sel) { ctx.shadowColor = n.color; ctx.shadowBlur = 24; }
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI*2); ctx.fillStyle = n.color+"10"; ctx.fill();
      ctx.strokeStyle = n.color+(sel?"cc":"60"); ctx.lineWidth = sel?2.5:1.5; ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = n.color; ctx.font = `500 ${n.r>50?13:11}px 'DM Sans',sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const words = n.text.split(" "), lh = n.r>50?17:14; let lines=[], cur="";
      words.forEach(w => { const t = cur?cur+" "+w:w; if(ctx.measureText(t).width<n.r*1.4) cur=t; else{lines.push(cur);cur=w;} }); if(cur)lines.push(cur);
      const sy = n.y-((lines.length-1)*lh)/2; lines.forEach((l,i)=>ctx.fillText(l, n.x, sy+i*lh));
    });
  }, [nodes, edges, freeLines, currentLine, selectedNode]);

  const onDown = (e) => { e.preventDefault(); const p = getPos(e);
    if (tool==="draw"){setCurrentLine({points:[p],color:penColor,size:e.pressure?Math.max(1,penSize*e.pressure*2):penSize});return;}
    if (tool==="erase"){setFreeLines(prev=>prev.filter(l=>!l.points.some(pt=>Math.hypot(pt.x-p.x,pt.y-p.y)<15)));return;}
    const nd=findNode(p);
    if (tool==="connect"&&nd){if(connecting&&connecting!==nd.id){setEdges(prev=>[...prev,{from:connecting,to:nd.id}]);setConnecting(null);}else setConnecting(nd.id);return;}
    if(nd){setDragging({id:nd.id,ox:p.x-nd.x,oy:p.y-nd.y});setSelectedNode(nd.id);setEditText(nd.text);}else setSelectedNode(null);
  };
  const onMove=(e)=>{e.preventDefault();const p=getPos(e);if(tool==="draw"&&currentLine){setCurrentLine(prev=>({...prev,points:[...prev.points,p]}));return;}if(tool==="erase"&&e.buttons===1){setFreeLines(prev=>prev.filter(l=>!l.points.some(pt=>Math.hypot(pt.x-p.x,pt.y-p.y)<15)));return;}if(dragging)setNodes(prev=>prev.map(n=>n.id===dragging.id?{...n,x:p.x-dragging.ox,y:p.y-dragging.oy}:n));};
  const onUp=()=>{if(currentLine?.points.length>1)setFreeLines(prev=>[...prev,currentLine]);setCurrentLine(null);setDragging(null);};

  const addNode = () => {
    const id=nextId.current++;const a=Math.random()*Math.PI*2;const d=130+Math.random()*80;
    const parent=selectedNode?nodes.find(n=>n.id===selectedNode):nodes[0];
    const col=palette[Math.floor(Math.random()*palette.length)];
    setNodes(prev=>[...prev,{id,x:(parent?.x||400)+Math.cos(a)*d,y:(parent?.y||300)+Math.sin(a)*d,text:"New idea",color:col,r:42}]);
    if(parent)setEdges(prev=>[...prev,{from:parent.id,to:id}]);setSelectedNode(id);setEditText("New idea");
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }} className="fu">
      {/* Map management bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
        <Btn variant={showList?"primary":"outline"} onClick={() => setShowList(!showList)} style={{ fontSize: 11 }}>📁 Maps ({savedMaps.length})</Btn>
        <input style={{ ...S.input, width: 200 }} value={mapName} onChange={e => setMapName(e.target.value)} placeholder="Map name..." />
        <Btn variant="primary" onClick={saveMap} style={{ fontSize: 11 }}>💾 Save</Btn>
        <Btn variant="outline" onClick={newMap} style={{ fontSize: 11 }}>+ New Map</Btn>
        <div style={{ flex: 1 }} />
        <span style={{ ...mono, fontSize: 10, color: C.textDim }}>Auto-saves</span>
      </div>

      {/* Saved maps list */}
      {showList && (
        <div style={{ ...S.card, marginBottom: 10, maxHeight: 180, overflowY: "auto", padding: 12 }} className="sr">
          {savedMaps.map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, marginBottom: 3, cursor: "pointer", background: m.id===activeMapId ? C.blueBg : "transparent", border: `1px solid ${m.id===activeMapId ? C.blueBorder : "transparent"}` }}>
              <div onClick={() => loadMap(m)} style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: m.id===activeMapId?600:400, color: m.id===activeMapId?C.blue:C.textSoft }}>{m.name}</div>
                <div style={{ ...mono, fontSize: 10, color: C.textDim }}>{m.nodes.length} nodes · {new Date(m.updated||m.created).toLocaleDateString()}</div>
              </div>
              {savedMaps.length > 1 && <span onClick={() => deleteMap(m.id)} style={{ cursor: "pointer", color: C.textDim, fontSize: 14 }}>×</span>}
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
        {[{id:"select",l:"Select",i:"↖"},{id:"draw",l:"Draw",i:"✎"},{id:"connect",l:"Link",i:"⟷"},{id:"erase",l:"Erase",i:"◌"}].map(t => (
          <Btn key={t.id} variant={tool===t.id?"primary":"outline"} onClick={()=>setTool(t.id)} style={{minWidth:70}}>{t.i} {t.l}</Btn>
        ))}
        <div style={{width:1,height:24,background:C.border,margin:"0 6px"}} />
        <Btn variant="primary" onClick={addNode}>+ Node</Btn>
        {selectedNode&&selectedNode!==1&&<Btn variant="danger" onClick={()=>{setNodes(p=>p.filter(n=>n.id!==selectedNode));setEdges(p=>p.filter(e=>e.from!==selectedNode&&e.to!==selectedNode));setSelectedNode(null);}}>Delete</Btn>}
        {tool==="draw"&&<>{palette.map(c=><div key={c} onClick={()=>setPenColor(c)} style={{width:18,height:18,borderRadius:"50%",background:c,cursor:"pointer",border:penColor===c?"2px solid #fff":"2px solid transparent",marginLeft:2}}/>)}<select value={penSize} onChange={e=>setPenSize(+e.target.value)} style={{...S.input,width:60,padding:"4px 6px",fontSize:11}}><option value={1}>Thin</option><option value={2}>Med</option><option value={4}>Thick</option><option value={8}>Bold</option></select></>}
        {freeLines.length>0&&<Btn variant="ghost" onClick={()=>setFreeLines([])} style={{marginLeft:"auto",fontSize:11}}>Clear ink</Btn>}
      </div>

      {selectedNode&&tool==="select"&&(
        <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}} className="sr">
          <input style={{...S.input,flex:1,maxWidth:280}} value={editText} onChange={e=>setEditText(e.target.value)}
            onBlur={()=>editText.trim()&&setNodes(p=>p.map(n=>n.id===selectedNode?{...n,text:editText}:n))}
            onKeyDown={e=>e.key==="Enter"&&editText.trim()&&setNodes(p=>p.map(n=>n.id===selectedNode?{...n,text:editText}:n))} />
          {palette.map(c=><div key={c} onClick={()=>setNodes(p=>p.map(n=>n.id===selectedNode?{...n,color:c}:n))} style={{width:16,height:16,borderRadius:"50%",background:c,cursor:"pointer",border:nodes.find(n=>n.id===selectedNode)?.color===c?"2px solid #fff":"2px solid transparent"}}/>)}
        </div>
      )}

      <canvas ref={canvasRef} style={{flex:1,borderRadius:12,background:C.bg,border:`1px solid ${C.border}`,cursor:tool==="draw"?"crosshair":tool==="erase"?"cell":"default"}}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
        onDoubleClick={(e)=>{const p=getPos(e);if(!findNode(p)){const id=nextId.current++;setNodes(prev=>[...prev,{id,x:p.x,y:p.y,text:"New idea",color:palette[Math.floor(Math.random()*palette.length)],r:42}]);setSelectedNode(id);setEditText("New idea");}}} />
      <div style={{...mono,fontSize:10,color:C.textDim,marginTop:6,textAlign:"center"}}>Double-click to add nodes · Apple Pencil + pressure sensitivity in Draw mode · Auto-saves as you work</div>
    </div>
  );
}

// ─── NOTES ───────────────────────────────────────────────────────────────────
function Notes({ notes, setNotes }) {
  const [active, setActive] = useState(null);
  const [search, setSearch] = useState("");
  const colors = [C.blue, C.green, C.amber, C.lavender, C.teal];
  const addNote = () => { const n = { id: Date.now(), title: "Untitled", content: "", color: colors[Math.floor(Math.random()*colors.length)], created: new Date().toISOString() }; setNotes(p => [n,...p]); setActive(n.id); };
  const update = (id,f,v) => setNotes(p => p.map(n => n.id===id?{...n,[f]:v}:n));
  const del = (id) => { setNotes(p => p.filter(n => n.id!==id)); if(active===id) setActive(null); };
  const filtered = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase())||n.content.toLowerCase().includes(search.toLowerCase()));
  const cur = notes.find(n => n.id===active);

  return (
    <div style={{display:"flex",height:"100%",gap:16}} className="fu">
      <div style={{width:240,minWidth:240,display:"flex",flexDirection:"column",gap:8}}>
        <div style={{display:"flex",gap:6}}><input style={{...S.input,flex:1}} placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/><Btn variant="primary" onClick={addNote}>+</Btn></div>
        <div style={{flex:1,overflowY:"auto"}}>
          {filtered.map(n=>(
            <div key={n.id} onClick={()=>setActive(n.id)} style={{padding:"10px 12px",borderRadius:8,cursor:"pointer",marginBottom:3,background:active===n.id?C.blueBg:"transparent",border:`1px solid ${active===n.id?C.blueBorder:"transparent"}`,borderLeft:`3px solid ${n.color}`}}>
              <div style={{fontSize:13,fontWeight:active===n.id?600:400,color:active===n.id?C.text:C.textSoft,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.title||"Untitled"}</div>
              <div style={{fontSize:10,color:C.textDim,marginTop:2,...mono}}>{new Date(n.created).toLocaleDateString()}</div>
            </div>
          ))}
          {!filtered.length&&<div style={{fontSize:12,color:C.textDim,padding:12}}>No notes found</div>}
        </div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        {cur?(
          <>
            <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
              <input style={{...S.input,fontSize:20,fontWeight:700,border:"none",background:"transparent",padding:"4px 0"}} value={cur.title} onChange={e=>update(cur.id,"title",e.target.value)}/>
              <Btn variant="danger" onClick={()=>del(cur.id)} style={{fontSize:11}}>Delete</Btn>
            </div>
            <textarea style={{...S.input,flex:1,resize:"none",lineHeight:1.85,fontSize:14}} value={cur.content} onChange={e=>update(cur.id,"content",e.target.value)} placeholder="Start writing..."/>
            <div style={{...mono,fontSize:10,color:C.textDim,marginTop:6}}>{cur.content.split(/\s+/).filter(Boolean).length} words · {cur.content.length} chars</div>
          </>
        ):<EmptyState icon="▤" text="Select or create a note"/>}
      </div>
    </div>
  );
}

// ─── TIME BLOCK (Calendar View) ──────────────────────────────────────────────
function TimeBlock() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null); // null = calendar view, string = day view
  const [allBlocks, setAllBlocks] = useLocalStorage("timeblocks", () => {
    // Seed today with sample blocks
    const key = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
    return { [key]: [
      { id: 1, start: 9, end: 10.5, label: "Deep Work — Primary", color: C.blue },
      { id: 2, start: 10.5, end: 11, label: "Recovery Break", color: C.green },
      { id: 3, start: 11, end: 12.5, label: "Deep Work — Secondary", color: C.lavender },
      { id: 4, start: 13, end: 14.5, label: "Admin & Comms", color: C.amber },
      { id: 5, start: 15, end: 16.5, label: "Collaborative Work", color: C.teal },
    ]};
  });

  const [newB, setNewB] = useState({ start: 9, end: 10, label: "", color: C.blue });
  const [editing, setEditing] = useState(null);
  const bColors = [C.blue, C.green, C.amber, C.lavender, C.teal, C.rose];

  // Calendar helpers
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const dateKey = (d) => `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const isToday = (d) => d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };

  const blocks = selectedDate ? (allBlocks[selectedDate] || []) : [];
  const setBlocks = (fn) => {
    setAllBlocks(prev => {
      const current = prev[selectedDate] || [];
      const next = typeof fn === "function" ? fn(current) : fn;
      return { ...prev, [selectedDate]: next };
    });
  };

  const addBlock = () => {
    if (!newB.label.trim() || !selectedDate) return;
    setBlocks(prev => [...prev, { ...newB, id: Date.now() }].sort((a, b) => a.start - b.start));
    setNewB({ start: 9, end: 10, label: "", color: C.blue });
  };

  const copyPrevDay = () => {
    if (!selectedDate) return;
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    const prevKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const prevBlocks = allBlocks[prevKey];
    if (prevBlocks && prevBlocks.length) {
      setBlocks(prevBlocks.map(b => ({ ...b, id: Date.now() + Math.random() })));
    }
  };

  const hourH = 48, startH = 6, endH = 23;

  // Calendar view
  if (!selectedDate) {
    return (
      <div className="fu">
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Btn variant="outline" onClick={prevMonth}>←</Btn>
            <div style={{ ...mono, fontSize: 16, fontWeight: 600 }}>{MONTH_NAMES[viewMonth]} {viewYear}</div>
            <Btn variant="outline" onClick={nextMonth}>→</Btn>
          </div>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 }}>
            {DAY_NAMES.map(d => <div key={d} style={{ textAlign: "center", ...mono, fontSize: 10, color: C.textDim, padding: "4px 0" }}>{d}</div>)}
          </div>
          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {calendarDays.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />;
              const key = dateKey(d);
              const dayBlocks = allBlocks[key] || [];
              const hasBlocks = dayBlocks.length > 0;
              const td = isToday(d);
              return (
                <div key={key} onClick={() => setSelectedDate(key)} style={{
                  padding: "8px 4px", borderRadius: 10, cursor: "pointer", minHeight: 70,
                  background: td ? C.blueBg : C.bgWarm,
                  border: `1px solid ${td ? C.blueBorder : C.border}`,
                  transition: "all .15s",
                }}>
                  <div style={{ ...mono, fontSize: 12, fontWeight: td ? 700 : 400, color: td ? C.blue : C.textSoft, marginBottom: 4, textAlign: "center" }}>{d}</div>
                  {dayBlocks.slice(0, 3).map(b => (
                    <div key={b.id} style={{ fontSize: 9, padding: "1px 4px", borderRadius: 3, marginBottom: 1, background: b.color + "18", color: b.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.label}</div>
                  ))}
                  {dayBlocks.length > 3 && <div style={{ fontSize: 9, color: C.textDim, textAlign: "center" }}>+{dayBlocks.length - 3} more</div>}
                </div>
              );
            })}
          </div>
        </Card>
        <Btn variant="outline" onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); setSelectedDate(dateKey(today.getDate())); }}>Jump to Today</Btn>
      </div>
    );
  }

  // Day schedule view
  const selectedDateObj = new Date(selectedDate + "T00:00:00");
  const dayLabel = selectedDateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="fu">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <Btn variant="outline" onClick={() => setSelectedDate(null)}>← Calendar</Btn>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{dayLabel}</div>
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" onClick={copyPrevDay} style={{ fontSize: 11 }}>Copy previous day</Btn>
      </div>

      {/* Add block */}
      <Card title="Add Time Block">
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input style={{ ...S.input, width: 180 }} placeholder="Block label..." value={newB.label} onChange={e => setNewB(p => ({ ...p, label: e.target.value }))} />
          <select style={{ ...S.input, width: 85 }} value={newB.start} onChange={e => setNewB(p => ({ ...p, start: +e.target.value }))}>
            {Array.from({ length: (endH - startH) * 2 }, (_, i) => startH + i * 0.5).map(h => <option key={h} value={h}>{HOURS_FULL[Math.floor(h)]?.replace(":00","")}{h % 1 ? ":30" : ":00"}</option>)}
          </select>
          <span style={{ color: C.textDim }}>→</span>
          <select style={{ ...S.input, width: 85 }} value={newB.end} onChange={e => setNewB(p => ({ ...p, end: +e.target.value }))}>
            {Array.from({ length: (endH - startH) * 2 }, (_, i) => startH + i * 0.5 + 0.5).map(h => <option key={h} value={h}>{HOURS_FULL[Math.floor(h)]?.replace(":00","")}{h % 1 ? ":30" : ":00"}</option>)}
          </select>
          <div style={{ display: "flex", gap: 4 }}>{bColors.map(c => <div key={c} onClick={() => setNewB(p => ({ ...p, color: c }))} style={{ width: 18, height: 18, borderRadius: "50%", background: c, cursor: "pointer", border: newB.color === c ? "2px solid #fff" : "2px solid transparent" }} />)}</div>
          <Btn variant="primary" onClick={addBlock}>Add</Btn>
        </div>
      </Card>

      {/* Timeline */}
      <Card title="Schedule">
        <div style={{ position: "relative", marginLeft: 60 }}>
          {Array.from({ length: endH - startH + 1 }, (_, i) => i + startH).map(h => (
            <div key={h} style={{ position: "absolute", top: (h - startH) * hourH, left: -60, right: 0, display: "flex", alignItems: "center" }}>
              <div style={{ width: 50, textAlign: "right", ...mono, fontSize: 10, color: C.textDim, paddingRight: 8 }}>{HOURS[h]}</div>
              <div style={{ flex: 1, height: 1, background: C.border + "60" }} />
            </div>
          ))}
          {blocks.map(b => (
            <div key={b.id} onClick={() => setEditing(editing === b.id ? null : b.id)} style={{
              position: "absolute", top: (b.start - startH) * hourH + 1, height: (b.end - b.start) * hourH - 2,
              left: 0, right: 0, borderRadius: 8, padding: "6px 12px",
              background: b.color + "12", borderLeft: `3px solid ${b.color}`,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: b.color }}>{b.label}</div>
                <div style={{ ...mono, fontSize: 10, color: C.textDim }}>{Math.floor(b.start)}:{b.start%1?"30":"00"} – {Math.floor(b.end)}:{b.end%1?"30":"00"}</div>
              </div>
              {editing === b.id && <Btn variant="danger" onClick={(e) => { e.stopPropagation(); setBlocks(prev => prev.filter(x => x.id !== b.id)); }} style={{ padding: "3px 8px", fontSize: 10 }}>✕</Btn>}
            </div>
          ))}
          <div style={{ height: (endH - startH) * hourH }} />
        </div>
      </Card>
    </div>
  );
}

// ─── POMODORO ────────────────────────────────────────────────────────────────
function Pomodoro({ pomodoroCount, setPomodoroCount }) {
  const [timeLeft, setTimeLeft] = useState(25*60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("work");
  const [cWork, setCWork] = useState(25);
  const [cShort, setCShort] = useState(5);
  const [cLong, setCLong] = useState(15);
  const [goal, setGoal] = useState("");
  const ref = useRef(null);
  const dur = { work: cWork*60, short: cShort*60, long: cLong*60 };
  const modeCol = { work: C.rose, short: C.green, long: C.blue };

  useEffect(() => {
    if (running) { ref.current = setInterval(() => { setTimeLeft(p => { if (p<=1) { setRunning(false); if(mode==="work") setPomodoroCount(c=>c+1); const next=mode==="work"?((pomodoroCount+1)%4===0?"long":"short"):"work"; setMode(next); return dur[next]; } return p-1; }); }, 1000); }
    return () => clearInterval(ref.current);
  }, [running, mode]);

  const switchM = (m) => { setMode(m); setTimeLeft(dur[m]); setRunning(false); };
  const m = Math.floor(timeLeft/60), s = timeLeft%60;
  const prog = 1-timeLeft/dur[mode]; const circ = 2*Math.PI*110;

  return (
    <div className="fu" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20,paddingTop:12}}>
      <div style={{display:"flex",gap:6}}>
        {[["work","Focus"],["short","Short Break"],["long","Long Break"]].map(([k,l])=>(
          <Btn key={k} variant={mode===k?"primary":"outline"} onClick={()=>switchM(k)} style={mode===k?{background:modeCol[k],color:"#fff"}:{}}>{l}</Btn>
        ))}
      </div>
      <input style={{...S.input,maxWidth:300,textAlign:"center"}} placeholder="What are you focusing on?" value={goal} onChange={e=>setGoal(e.target.value)}/>
      <div style={{position:"relative",width:260,height:260}}>
        <svg width="260" height="260" viewBox="0 0 260 260">
          <circle cx="130" cy="130" r="110" fill="none" stroke={C.border} strokeWidth="5"/>
          <circle cx="130" cy="130" r="110" fill="none" stroke={modeCol[mode]} strokeWidth="5" strokeDasharray={circ} strokeDashoffset={circ*(1-prog)} strokeLinecap="round" transform="rotate(-90 130 130)" style={{transition:"stroke-dashoffset .5s ease"}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{...mono,fontSize:52,fontWeight:700,color:modeCol[mode],letterSpacing:"-2px"}}>{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}</div>
          <div style={{...mono,fontSize:10,color:C.textDim,textTransform:"uppercase",letterSpacing:"2px",marginTop:4}}>{mode==="work"?"Deep Focus":mode==="short"?"Short Break":"Long Recovery"}</div>
        </div>
      </div>
      <div style={{display:"flex",gap:10}}>
        <Btn variant="primary" onClick={()=>setRunning(!running)} style={{background:modeCol[mode],minWidth:100,fontSize:14,padding:"10px 28px"}}>{running?"Pause":"Start"}</Btn>
        <Btn variant="outline" onClick={()=>{setTimeLeft(dur[mode]);setRunning(false);}}>Reset</Btn>
      </div>
      <div style={{display:"flex",gap:12,width:"100%",maxWidth:300}}>
        <Stat label="Sessions" value={pomodoroCount} color={C.rose}/>
        <Stat label="Focus min" value={pomodoroCount*cWork} color={C.amber}/>
      </div>
      <Card title="Customize Durations" style={{width:"100%",maxWidth:400}}>
        <div style={{display:"flex",gap:14}}>
          {[["Focus",cWork,setCWork,C.rose],["Short",cShort,setCShort,C.green],["Long",cLong,setCLong,C.blue]].map(([l,v,fn,col])=>(
            <div key={l} style={{flex:1,textAlign:"center"}}><div style={{...mono,fontSize:10,color:col,marginBottom:4,fontWeight:500}}>{l}</div><input type="number" min={1} max={120} style={{...S.input,textAlign:"center",...mono}} value={v} onChange={e=>fn(Math.max(1,+e.target.value))}/><div style={{fontSize:9,color:C.textDim,marginTop:2}}>min</div></div>
          ))}
        </div>
      </Card>
      <ScienceTip title="Pomodoro + Parkinson's Law" color={C.rose}>25-minute sprints create artificial deadlines. After 4 sessions, the longer break allows memory consolidation. Spaced work outperforms continuous marathons.</ScienceTip>
    </div>
  );
}

// ─── FOCUS SOUNDS (Binaural Beats & Isochronic Tones) ────────────────────────
function Soundscape() {
  const sounds = [
    { name: "Deep Focus (40Hz Gamma)", desc: "Binaural beats at 40Hz gamma frequency — associated with heightened focus, learning, and memory consolidation.", freq: "40Hz", type: "Binaural", color: C.blue, ytId: "jLAFLYfFaEM", link: "https://www.youtube.com/results?search_query=40hz+gamma+binaural+beats+focus" },
    { name: "Flow State (10Hz Alpha)", desc: "Alpha wave binaural beats promote relaxed alertness — the state associated with creative flow and effortless concentration.", freq: "10Hz", type: "Binaural", color: C.teal, ytId: "WTJhz5RZAOQ", link: "https://www.youtube.com/results?search_query=10hz+alpha+binaural+beats+flow+state" },
    { name: "Deep Work (4Hz Theta)", desc: "Theta frequency binaural beats for deep meditation and subconscious problem-solving. Best for creative ideation.", freq: "4Hz", type: "Binaural", color: C.lavender, ytId: "1ZYbU82GVz4", link: "https://www.youtube.com/results?search_query=4hz+theta+binaural+beats+deep+work" },
    { name: "High Focus Isochronic (15Hz Beta)", desc: "Isochronic tones at beta frequency — no headphones required. Rhythmic pulses entrain your brain into an alert, productive state.", freq: "15Hz", type: "Isochronic", color: C.amber, ytId: "hKvGvo3q4y4", link: "https://www.youtube.com/results?search_query=15hz+beta+isochronic+tones+focus" },
    { name: "Study & Memorize (14Hz SMR)", desc: "Sensorimotor rhythm isochronic tones enhance memory retention and are ideal for study sessions and absorbing new information.", freq: "14Hz", type: "Isochronic", color: C.green, ytId: "3Tke5HLkNqU", link: "https://www.youtube.com/results?search_query=14hz+smr+isochronic+tones+study" },
    { name: "Calm Concentration (6Hz Theta)", desc: "Gentle theta isochronic tones for sustained calm focus. Great for reading, writing, and reflective work.", freq: "6Hz", type: "Isochronic", color: C.rose, ytId: "u4IQmRj7nMU", link: "https://www.youtube.com/results?search_query=6hz+theta+isochronic+tones+calm+focus" },
  ];

  const [playing, setPlaying] = useState(null);

  return (
    <div className="fu">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Focus Sounds</div>
        <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.7 }}>
          Binaural beats require headphones (different frequencies in each ear create an auditory illusion). Isochronic tones work through speakers — no headphones needed. Click any card to find curated sessions on YouTube.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {sounds.map((s, i) => (
          <a key={i} href={s.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <div style={{
              ...S.card, borderLeft: `3px solid ${s.color}`, cursor: "pointer", marginBottom: 0,
              transition: "all .15s", background: C.surface,
            }}
              onMouseEnter={e => e.currentTarget.style.background = C.surfaceHover}
              onMouseLeave={e => e.currentTarget.style.background = C.surface}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: s.color }}>{s.name}</div>
                <span style={S.badge(s.color)}>{s.type}</span>
              </div>
              <div style={{ fontSize: 11, color: C.textSoft, lineHeight: 1.6, marginBottom: 8 }}>{s.desc}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ ...mono, fontSize: 10, color: s.color, background: s.color + "15", padding: "2px 8px", borderRadius: 4 }}>{s.freq}</span>
                <span style={{ fontSize: 10, color: C.textDim }}>▶ Open on YouTube</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      <ScienceTip title="Neural Entrainment" color={C.lavender}>
        Binaural beats work via frequency-following response — your brainwaves synchronize to the difference between two tones. A 2023 meta-analysis found that gamma (30-50Hz) beats significantly improved sustained attention, while theta (4-8Hz) enhanced creative ideation. Isochronic tones use rhythmic pulses and may be more effective for some people as they don't require stereo separation.
      </ScienceTip>

      <Card title="How to choose" accent={C.blue}>
        <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.75 }}>
          <strong style={{ color: C.blue }}>For coding/deep work:</strong> 40Hz Gamma or 15Hz Beta — keeps you alert and sharp.
          <br /><strong style={{ color: C.teal }}>For creative work:</strong> 10Hz Alpha — relaxed flow state.
          <br /><strong style={{ color: C.lavender }}>For brainstorming:</strong> 4-6Hz Theta — accesses subconscious connections.
          <br /><strong style={{ color: C.green }}>For study/memorization:</strong> 14Hz SMR — optimizes memory encoding.
          <br /><br />Start with 15-20 minutes. Pair with Pomodoro: play sounds during focus sessions, silence during breaks.
        </div>
      </Card>
    </div>
  );
}

// ─── TASKS ───────────────────────────────────────────────────────────────────
function Todos({ todos, setTodos }) {
  const [input, setInput] = useState(""); const [filter, setFilter] = useState("all"); const [priority, setPriority] = useState("medium");
  const pCol = { high: C.rose, medium: C.amber, low: C.green };
  const add = () => { if(!input.trim())return; setTodos(p=>[...p,{id:Date.now(),text:input,done:false,priority,created:new Date().toISOString()}]); setInput(""); };
  const toggle = (id) => setTodos(p=>p.map(t=>t.id===id?{...t,done:!t.done}:t));
  const remove = (id) => setTodos(p=>p.filter(t=>t.id!==id));
  const filtered = todos.filter(t=>filter==="all"?true:filter==="active"?!t.done:t.done);
  const sorted = [...filtered].sort((a,b)=>{const po={high:0,medium:1,low:2};if(a.done!==b.done)return a.done?1:-1;return po[a.priority]-po[b.priority];});

  return (
    <div className="fu">
      <Card title="Add Task">
        <div style={{display:"flex",gap:8}}><input style={{...S.input,flex:1}} placeholder="What needs to be done?" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()}/><select style={{...S.input,width:100}} value={priority} onChange={e=>setPriority(e.target.value)}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select><Btn variant="primary" onClick={add}>Add</Btn></div>
        <div style={{fontSize:11,color:C.textDim,marginTop:8}}>💡 <strong style={{color:C.amber}}>2-Minute Rule:</strong> If it takes less than 2 minutes, do it now.</div>
      </Card>
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {["all","active","done"].map(f=>(<Btn key={f} variant={filter===f?"primary":"outline"} onClick={()=>setFilter(f)} style={{textTransform:"capitalize",fontSize:11}}>{f} ({f==="all"?todos.length:f==="active"?todos.filter(t=>!t.done).length:todos.filter(t=>t.done).length})</Btn>))}
      </div>
      {sorted.map((t,i)=>(
        <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,borderLeft:`3px solid ${pCol[t.priority]}`,opacity:t.done?.45:1,marginBottom:4}} className="fu">
          <div onClick={()=>toggle(t.id)} style={{width:20,height:20,borderRadius:5,border:`2px solid ${t.done?C.green:C.border}`,background:t.done?C.green+"25":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:C.green,flexShrink:0}}>{t.done?"✓":""}</div>
          <span style={{flex:1,fontSize:13,textDecoration:t.done?"line-through":"none",color:t.done?C.textDim:C.text}}>{t.text}</span>
          <span style={S.badge(pCol[t.priority])}>{t.priority}</span>
          <span onClick={()=>remove(t.id)} style={{cursor:"pointer",color:C.textDim,fontSize:16}}>×</span>
        </div>
      ))}
      {!sorted.length&&<EmptyState icon="◇" text={filter==="done"?"No completed tasks":"All clear — enjoy the calm"}/>}
    </div>
  );
}

// ─── HABITS ──────────────────────────────────────────────────────────────────
function HabitTracker({ habits, setHabits }) {
  const [input, setInput] = useState(""); const [freq, setFreq] = useState("daily");
  const add = () => { if(!input.trim())return; setHabits(p=>[...p,{id:Date.now(),name:input,frequency:freq,streak:0,completedToday:false}]); setInput(""); };
  const toggle = (id) => setHabits(p=>p.map(h=>h.id===id?{...h,completedToday:!h.completedToday,streak:!h.completedToday?h.streak+1:Math.max(0,h.streak-1)}:h));

  return (
    <div className="fu">
      <Card title="Track a New Habit">
        <div style={{display:"flex",gap:8}}><input style={{...S.input,flex:1}} placeholder="e.g., Meditate 10 min..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()}/><select style={{...S.input,width:110}} value={freq} onChange={e=>setFreq(e.target.value)}><option value="daily">Daily</option><option value="weekday">Weekdays</option><option value="weekly">Weekly</option></select><Btn variant="primary" onClick={add}>Add</Btn></div>
      </Card>
      {habits.map(h=>(
        <div key={h.id} style={{...S.card,display:"flex",alignItems:"center",gap:14,padding:"14px 18px",borderLeft:`3px solid ${h.completedToday?C.green:C.border}`}}>
          <div onClick={()=>toggle(h.id)} style={{width:38,height:38,borderRadius:"50%",cursor:"pointer",border:`2px solid ${h.completedToday?C.green:C.border}`,background:h.completedToday?C.green+"18":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:C.green,flexShrink:0}}>{h.completedToday?"✓":""}</div>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:500}}>{h.name}</div><div style={{fontSize:11,color:C.textDim}}>{h.frequency}</div></div>
          <div style={{textAlign:"center"}}><div style={{...mono,fontSize:22,fontWeight:700,color:h.streak>0?C.amber:C.textDim}}>{h.streak}</div><div style={{...mono,fontSize:9,color:C.textDim,textTransform:"uppercase",letterSpacing:"1px"}}>streak</div></div>
          <span onClick={()=>setHabits(p=>p.filter(x=>x.id!==h.id))} style={{cursor:"pointer",color:C.textDim}}>×</span>
        </div>
      ))}
      {!habits.length&&<EmptyState icon="⟡" text="Average 66 days to form a habit (Phillippa Lally, UCL)"/>}
      <ScienceTip title="Habit Stacking — BJ Fogg" color={C.green}>Anchor new habits to existing ones: "After I [CURRENT HABIT], I will [NEW HABIT]." Visual streak tracking provides dopamine reinforcement for consistency.</ScienceTip>
    </div>
  );
}

// ─── Entry Log (collapsible, one row default) ───────────────────────────────
function EntryLog({ entries, removeEntry }) {
  const [expanded, setExpanded] = useState(false);
  const ROW_HEIGHT = 32; // approx height of one entry chip + gap
  
  return (
    <Card title={`Entries (${entries.length})`}>
      <div style={{ position: "relative", overflow: "hidden", maxHeight: expanded ? "none" : ROW_HEIGHT, transition: "max-height 0.3s ease" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {entries.map(e => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: C.bgWarm, borderRadius: 6, border: `1px solid ${C.border}` }}>
              <span style={{ ...mono, fontSize: 11, color: C.textSoft }}>{HOURS_FULL[e.hour]}</span>
              <span style={{ ...mono, fontSize: 11, color: C.blue, fontWeight: 600 }}>{e.energy}/10</span>
              <span onClick={() => removeEntry(e.id)} style={{ cursor: "pointer", color: C.textDim, fontSize: 12, marginLeft: 2 }}>×</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <div style={{ ...mono, fontSize: 10, color: C.textDim }}>Same-hour entries are averaged on the graph.</div>
        {entries.length > 4 && (
          <Btn variant="ghost" onClick={() => setExpanded(!expanded)} style={{ fontSize: 11, padding: "4px 10px" }}>
            {expanded ? "Show less ▴" : `Show all ${entries.length} entries ▾`}
          </Btn>
        )}
      </div>
    </Card>
  );
}

// ─── ENERGY MAP (Fixed: 24hr axis, averaged entries) ─────────────────────────
function EnergyMap() {
  // Store all entries with their raw data
  const [entries, setEntries] = useLocalStorage("energy", [
    { id: 1, hour: 8, energy: 6 }, { id: 2, hour: 10, energy: 9 },
    { id: 3, hour: 12, energy: 5 }, { id: 4, hour: 14, energy: 7 },
    { id: 5, hour: 16, energy: 6 }, { id: 6, hour: 18, energy: 4 },
  ]);
  const [newH, setNewH] = useState(9); const [newE, setNewE] = useState(5);
  const nextEntryId = useRef(7);

  const add = () => {
    setEntries(p => [...p, { id: nextEntryId.current++, hour: newH, energy: newE }]);
  };

  const removeEntry = (id) => setEntries(p => p.filter(e => e.id !== id));

  // Compute averaged data per hour (0-23)
  const avgByHour = {};
  entries.forEach(e => {
    if (!avgByHour[e.hour]) avgByHour[e.hour] = { total: 0, count: 0 };
    avgByHour[e.hour].total += e.energy;
    avgByHour[e.hour].count += 1;
  });

  // Build 24-hour chart data
  const chartData = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    avg: avgByHour[h] ? avgByHour[h].total / avgByHour[h].count : null,
  }));

  // Only plot hours that have data
  const filledPoints = chartData.filter(d => d.avg !== null);

  const chartW = 600, chartH = 200, padL = 40, padR = 10, padT = 15, padB = 30;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const hourToX = (h) => padL + (h / 23) * plotW;
  const valToY = (v) => padT + plotH - (v / 10) * plotH;

  return (
    <div className="fu">
      <Card title="Log Energy Level">
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select style={{ ...S.input, width: 100 }} value={newH} onChange={e => setNewH(+e.target.value)}>
            {Array.from({ length: 24 }, (_, i) => i).map(h => <option key={h} value={h}>{HOURS_FULL[h]}</option>)}
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ ...mono, fontSize: 11, color: C.textDim }}>Energy:</span>
            <input type="range" min={1} max={10} value={newE} onChange={e => setNewE(+e.target.value)} style={{ width: 100 }} />
            <span style={{ ...mono, fontSize: 14, color: C.blue, fontWeight: 600 }}>{newE}</span>
          </div>
          <Btn variant="primary" onClick={add}>Log</Btn>
        </div>
      </Card>

      {/* Entry log — collapsed to one row by default */}
      {entries.length > 0 && (
        <EntryLog entries={entries} removeEntry={removeEntry} />
      )}

      <Card title="Energy Curve (24-Hour Average)">
        {filledPoints.length >= 2 ? (
          <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", maxWidth: 620 }}>
            {/* Horizontal grid */}
            {[2, 4, 6, 8, 10].map(v => (
              <g key={v}>
                <line x1={padL} y1={valToY(v)} x2={chartW - padR} y2={valToY(v)} stroke={C.border} strokeWidth={0.5} />
                <text x={padL - 6} y={valToY(v) + 3} fill={C.textDim} fontSize={9} textAnchor="end" fontFamily="'DM Mono',monospace">{v}</text>
              </g>
            ))}
            {/* Hour labels (every 3 hours) */}
            {[0, 3, 6, 9, 12, 15, 18, 21].map(h => (
              <g key={h}>
                <line x1={hourToX(h)} y1={padT} x2={hourToX(h)} y2={padT + plotH} stroke={C.border} strokeWidth={0.3} />
                <text x={hourToX(h)} y={chartH - 4} fill={C.textDim} fontSize={8} textAnchor="middle" fontFamily="'DM Mono',monospace">{HOURS[h]}</text>
              </g>
            ))}
            {/* Area fill */}
            <defs>
              <linearGradient id="eGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.blue} stopOpacity="0.2" />
                <stop offset="100%" stopColor={C.blue} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`M${filledPoints.map(d => `${hourToX(d.hour)},${valToY(d.avg)}`).join(" L")} L${hourToX(filledPoints[filledPoints.length-1].hour)},${padT+plotH} L${hourToX(filledPoints[0].hour)},${padT+plotH} Z`} fill="url(#eGrad)" />
            {/* Line */}
            <polyline points={filledPoints.map(d => `${hourToX(d.hour)},${valToY(d.avg)}`).join(" ")} fill="none" stroke={C.blue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {/* Points */}
            {filledPoints.map(d => (
              <g key={d.hour}>
                <circle cx={hourToX(d.hour)} cy={valToY(d.avg)} r={4} fill={C.blue} stroke={C.surface} strokeWidth={2} />
                <text x={hourToX(d.hour)} y={valToY(d.avg) - 10} fill={C.blue} fontSize={9} textAnchor="middle" fontFamily="'DM Mono',monospace" fontWeight="600">{d.avg.toFixed(1)}</text>
              </g>
            ))}
          </svg>
        ) : <div style={{ fontSize: 12, color: C.textDim, padding: 20 }}>Log at least 2 different hours to see your curve</div>}
      </Card>

      <ScienceTip title="Chronotype-Aware Scheduling" color={C.teal}>
        Track your energy for a week to find your chronotype. Schedule deep work during peaks (usually mid-morning), admin during dips (early afternoon). This alone can boost output 20-30%.
      </ScienceTip>
    </div>
  );
}

// ─── JOURNAL ─────────────────────────────────────────────────────────────────
function Journal() {
  const [entries, setEntries] = useLocalStorage("journal", []);
  const [cur, setCur] = useState({ grateful:"", win:"", improve:"", energy:5, mood:"neutral" });
  const moods = [{key:"great",label:"Great",color:C.green},{key:"good",label:"Good",color:C.blue},{key:"neutral",label:"Okay",color:C.textMuted},{key:"low",label:"Low",color:C.amber},{key:"rough",label:"Rough",color:C.rose}];
  const save = () => { setEntries(p=>[{...cur,id:Date.now(),date:new Date().toISOString()},...p]); setCur({grateful:"",win:"",improve:"",energy:5,mood:"neutral"}); };

  return (
    <div className="fu">
      <Card title="Daily Reflection">
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><div style={S.cardLabel}>How are you feeling?</div><div style={{display:"flex",gap:8}}>
            {moods.map(m=>(<div key={m.key} onClick={()=>setCur(p=>({...p,mood:m.key}))} style={{padding:"10px 16px",borderRadius:10,cursor:"pointer",textAlign:"center",fontSize:12,fontWeight:500,background:cur.mood===m.key?m.color+"18":"transparent",border:`1px solid ${cur.mood===m.key?m.color+"40":C.border}`,color:cur.mood===m.key?m.color:C.textMuted}}>{m.label}</div>))}
          </div></div>
          <div><div style={S.cardLabel}>Energy: <span style={{color:C.blue}}>{cur.energy}/10</span></div><input type="range" min={1} max={10} value={cur.energy} onChange={e=>setCur(p=>({...p,energy:+e.target.value}))} style={{width:"100%"}}/></div>
          {[["grateful","What are you grateful for?"],["win","What's one win from today?"],["improve","What would you improve tomorrow?"]].map(([k,l])=>(
            <div key={k}><div style={S.cardLabel}>{l}</div><textarea style={{...S.input,minHeight:48,resize:"vertical",lineHeight:1.7}} value={cur[k]} onChange={e=>setCur(p=>({...p,[k]:e.target.value}))}/></div>
          ))}
          <Btn variant="primary" onClick={save} style={{alignSelf:"flex-start"}}>Save Entry</Btn>
        </div>
      </Card>
      {entries.map(e=>(
        <Card key={e.id}>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
            <span style={{...mono,fontSize:11,color:C.textDim}}>{new Date(e.date).toLocaleDateString()}</span>
            <span style={S.badge(moods.find(m=>m.key===e.mood)?.color||C.textMuted)}>{moods.find(m=>m.key===e.mood)?.label}</span>
            <span style={{...mono,fontSize:10,color:C.textDim}}>Energy {e.energy}/10</span>
          </div>
          {e.grateful&&<div style={{fontSize:12,color:C.textSoft,marginBottom:3}}>🙏 {e.grateful}</div>}
          {e.win&&<div style={{fontSize:12,color:C.green,marginBottom:3}}>⭐ {e.win}</div>}
          {e.improve&&<div style={{fontSize:12,color:C.amber}}>↻ {e.improve}</div>}
        </Card>
      ))}
      <ScienceTip title="Gratitude Journaling" color={C.green}>Robert Emmons (UC Davis) found daily gratitude practice increases well-being by 25%. The "Win of the Day" leverages the Progress Principle — the #1 motivator for knowledge work.</ScienceTip>
    </div>
  );
}

// ─── WEEKLY REVIEW (now saves entries) ───────────────────────────────────────
function WeeklyReview() {
  const [savedReviews, setSavedReviews] = useLocalStorage("weeklyreviews", []);
  const [cur, setCur] = useState({ wins: "", lessons: "", stuck: "", nextWeek: "", drop: "", gratitude: "" });
  const [viewingId, setViewingId] = useState(null);

  const questions = [
    { key: "wins", q: "What were your top 3 wins this week?", color: C.green },
    { key: "lessons", q: "What did you learn or discover?", color: C.blue },
    { key: "stuck", q: "Where did you feel stuck or blocked?", color: C.rose },
    { key: "nextWeek", q: "Top 3 priorities for next week?", color: C.amber },
    { key: "drop", q: "What should you stop doing or delegate?", color: C.lavender },
    { key: "gratitude", q: "Who helped you this week? How?", color: C.teal },
  ];

  const save = () => {
    const hasContent = Object.values(cur).some(v => v.trim());
    if (!hasContent) return;
    setSavedReviews(p => [{ ...cur, id: Date.now(), date: new Date().toISOString() }, ...p]);
    setCur({ wins: "", lessons: "", stuck: "", nextWeek: "", drop: "", gratitude: "" });
  };

  const viewing = viewingId ? savedReviews.find(r => r.id === viewingId) : null;

  return (
    <div className="fu">
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Weekly Review</div>
        <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>GTD's weekly review clears mental clutter and recalibrates priorities. Set aside 30 minutes every Friday or Sunday.</div>
      </div>

      {/* Current review form */}
      <Card title="This Week's Review">
        {questions.map(({ key, q, color }) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color, marginBottom: 4 }}>{q}</div>
            <textarea style={{ ...S.input, minHeight: 50, resize: "vertical", lineHeight: 1.7 }}
              value={cur[key]} onChange={e => setCur(p => ({ ...p, [key]: e.target.value }))}
              placeholder="Reflect honestly..." />
          </div>
        ))}
        <Btn variant="primary" onClick={save}>Save Weekly Review</Btn>
      </Card>

      {/* Saved reviews */}
      {savedReviews.length > 0 && (
        <Card title={`Past Reviews (${savedReviews.length})`}>
          {savedReviews.map(r => (
            <div key={r.id} onClick={() => setViewingId(viewingId === r.id ? null : r.id)} style={{
              padding: "10px 14px", borderRadius: 8, cursor: "pointer", marginBottom: 4,
              background: viewingId === r.id ? C.blueBg : C.bgWarm,
              border: `1px solid ${viewingId === r.id ? C.blueBorder : C.border}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ ...mono, fontSize: 12, color: viewingId === r.id ? C.blue : C.textSoft, fontWeight: 500 }}>
                  Week of {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
                <span style={{ fontSize: 10, color: C.textDim }}>{viewingId === r.id ? "▾" : "▸"}</span>
              </div>
              {viewingId === r.id && (
                <div style={{ marginTop: 12 }} className="fu">
                  {questions.map(({ key, q, color }) => (
                    r[key]?.trim() ? (
                      <div key={key} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10, color, fontWeight: 600, marginBottom: 2, textTransform: "uppercase", letterSpacing: "1px" }}>{q}</div>
                        <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{r[key]}</div>
                      </div>
                    ) : null
                  ))}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      <ScienceTip title="The Weekly Review" color={C.lavender}>Structured weekly reflection improves goal attainment by 42% (Harvard Business School). It closes "open loops" — unfinished tasks that drain cognitive resources even when you're not thinking about them.</ScienceTip>
    </div>
  );
}

// ─── GUIDE ───────────────────────────────────────────────────────────────────
function Guide() {
  const [open, setOpen] = useState("overview");
  const sections = [
    { id: "overview", title: "Getting Started", color: C.blue },
    { id: "mindmap", title: "Mind Map", color: C.green },
    { id: "notes", title: "Notes", color: C.lavender },
    { id: "timeblock", title: "Time Blocking", color: C.blue },
    { id: "pomodoro", title: "Pomodoro Timer", color: C.rose },
    { id: "soundscape", title: "Focus Sounds", color: C.lavender },
    { id: "tasks", title: "Tasks & GTD", color: C.amber },
    { id: "habits", title: "Habit Tracker", color: C.green },
    { id: "energy", title: "Energy Mapping", color: C.teal },
    { id: "journal", title: "Journaling", color: C.green },
    { id: "weekly", title: "Weekly Review", color: C.lavender },
    { id: "workflow", title: "Recommended Workflow", color: C.amber },
  ];
  const P = ({children,...p}) => <p style={{marginTop:10,...p.style}}>{children}</p>;

  const content = {
    overview: (<><p>FlowState is organized into four workflow phases: <strong style={{color:C.blue}}>General</strong> (capture), <strong style={{color:C.green}}>Plan</strong> (structure), <strong style={{color:C.amber}}>Execute</strong> (focus), and <strong style={{color:C.lavender}}>Reflect</strong> (learn). Start with 2-3 features and add more as each becomes habitual.</p><P>The color system uses blue for focus, green for calm, amber for energy, and rose for alertness — based on Lund University research and Angela Wright's color psychology framework.</P></>),
    mindmap: (<><p><strong>Mind maps</strong> leverage radial thinking — how your brain naturally associates concepts. Now with save/load so you can maintain multiple maps.</p><P>1. Click <strong>+ Node</strong> or double-click canvas to add ideas. Select a node first to branch from it.</P><P>2. Use <strong>Draw mode</strong> with Apple Pencil — pressure sensitivity creates natural strokes.</P><P>3. Maps <strong>auto-save</strong> as you work. Use the 📁 Maps button to switch between or create new maps.</P><P><strong>Pro tip:</strong> Color-code by category. Blue for tasks, green for ideas, amber for questions.</P></>),
    notes: (<><p>Your "external brain" — getting thoughts out frees up working memory for deeper thinking.</p><P>Search filters across titles and content. Word counts update live.</P><P><strong>Pro tip:</strong> Use "progressive summarization" (Tiago Forte) — write freely first, then bold key insights on later passes.</P></>),
    timeblock: (<><p>Now with a <strong>full calendar view</strong>. Click any day to plan its schedule. Every hour has a purpose — Cal Newport found this can increase productivity by up to 50%.</p><P>Use "Copy previous day" to quickly replicate your schedule. Color-code: blue for deep work, green for breaks, amber for admin.</P><P><strong>Pro tip:</strong> Follow ultradian rhythms — 90 min deep work + 20 min recovery. Schedule hardest tasks during peak energy (see Energy Map).</P></>),
    pomodoro: (<><p>25-minute focus sprints with enforced breaks. Leverages Parkinson's Law and spaced practice.</p><P>Write your focus goal — this creates an implementation intention. The timer auto-cycles through 4 work sessions then a long break.</P><P><strong>Pro tip:</strong> Pair with Focus Sounds. Play binaural beats during sessions, silence during breaks.</P></>),
    soundscape: (<><p><strong>Binaural beats</strong> require headphones — different frequencies in each ear create a neural entrainment effect. <strong>Isochronic tones</strong> work through speakers.</p><P>40Hz Gamma for coding/deep work. 10Hz Alpha for creative flow. 4-6Hz Theta for brainstorming. 14Hz SMR for memorization.</P><P>Start with 15-20 minute sessions and pair with your Pomodoro timer.</P></>),
    tasks: (<><p>Priority-sorted task management using GTD principles. Apply the <strong>2-Minute Rule</strong>: if it takes under 2 min, do it now.</p><P>Each evening pick your <strong>MIT (Most Important Task)</strong> for tomorrow. Start the day with it before checking email.</P></>),
    habits: (<><p>Streak-based tracking. Phillippa Lally's research: average 66 days to form a habit. Start impossibly small.</p><P>Use <strong>habit stacking</strong>: "After I [EXISTING], I will [NEW]." Build the neural pathway first, then scale.</P></>),
    energy: (<><p>The <strong>24-hour energy curve</strong> now shows every hour and averages multiple entries for the same time. Log energy 3-4 times daily for a week to find your chronotype.</p><P>Schedule deep work at peaks, admin at dips. Most people peak 10-11 AM and dip 1-3 PM.</P></>),
    journal: (<><p>Gratitude practice (Robert Emmons — 25% wellbeing boost) + Progress Principle (Teresa Amabile — #1 workplace motivator).</p><P>Journal at the same time daily. One sentence per prompt is enough. Entries are saved and reviewable.</P></>),
    weekly: (<><p>The cornerstone of GTD. Harvard research: structured weekly reflection improves goal attainment by 42%. Reviews are now <strong>saved</strong> so you can track your progress over time.</p><P>Set aside 30 min every Friday. The "stop doing" question is the most powerful — we add tasks but rarely subtract.</P></>),
    workflow: (<><p style={{fontWeight:600,color:C.amber,fontSize:15,marginBottom:14}}>Recommended Daily Workflow</p><P><strong style={{color:C.blue}}>Morning (5 min):</strong> Dashboard → Focus Score → Time Block schedule → identify MIT.</P><P><strong style={{color:C.green}}>Deep Work (90 min):</strong> Pomodoro + Focus Sounds → work on MIT. No email.</P><P><strong style={{color:C.teal}}>Mid-Morning:</strong> 20-min break → mark habits → handle 2-minute tasks.</P><P><strong style={{color:C.amber}}>Afternoon:</strong> Second deep work block → admin during dip → log Energy Map.</P><P><strong style={{color:C.lavender}}>End of Day (10 min):</strong> Shutdown Ritual → Journal → review tomorrow.</P><P><strong style={{color:C.rose}}>Friday (30 min):</strong> Weekly Review → adjust Time Blocks → celebrate streaks.</P><p style={{marginTop:16,padding:14,background:C.blueBg,borderRadius:10,border:`1px solid ${C.blueBorder}`,color:C.textSoft,fontSize:12,lineHeight:1.7}}>Start with Dashboard + Tasks + Pomodoro. Add more as each becomes habitual.</p></>),
  };

  return (
    <div className="fu" style={{display:"flex",gap:20,height:"100%"}}>
      <div style={{width:200,minWidth:200,overflowY:"auto"}}>
        {sections.map(s=>(<div key={s.id} onClick={()=>setOpen(s.id)} style={{padding:"9px 12px",borderRadius:8,cursor:"pointer",marginBottom:3,fontSize:12,fontWeight:open===s.id?600:400,color:open===s.id?s.color:C.textMuted,background:open===s.id?s.color+"10":"transparent",borderLeft:`2px solid ${open===s.id?s.color:"transparent"}`}}>{s.title}</div>))}
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        <Card><div style={{fontSize:18,fontWeight:700,marginBottom:16,color:sections.find(s=>s.id===open)?.color}}>{sections.find(s=>s.id===open)?.title}</div><div style={{fontSize:13,color:C.textSoft,lineHeight:1.85}}>{content[open]}</div></Card>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [notes, setNotes] = useLocalStorage("notes", [{ id: 1, title: "Welcome to FlowState", content: "Your science-backed productivity command center.\n\nExplore each tab or check the Guide (❖) for a full walkthrough.", color: C.blue, created: new Date().toISOString() }]);
  const [todos, setTodos] = useLocalStorage("todos", [
    { id: 1, text: "Read the Guide tab", done: false, priority: "high", created: new Date().toISOString() },
    { id: 2, text: "Set up time blocks for today", done: false, priority: "medium", created: new Date().toISOString() },
    { id: 3, text: "Complete a Pomodoro session", done: false, priority: "medium", created: new Date().toISOString() },
  ]);
  const [habits, setHabits] = useLocalStorage("habits", [
    { id: 1, name: "Morning meditation (10 min)", frequency: "daily", streak: 0, completedToday: false },
    { id: 2, name: "Read 20 pages", frequency: "daily", streak: 0, completedToday: false },
  ]);
  const [pomos, setPomos] = useLocalStorage("pomos", 0);
  const curTab = TABS.find(t => t.id === tab);
  const groups = [...new Set(TABS.map(t => t.group))];

  const render = () => {
    switch (tab) {
      case "dashboard": return <Dashboard todos={todos} habits={habits} pomodoroCount={pomos} notes={notes} />;
      case "mindmap": return <MindMap />;
      case "notes": return <Notes notes={notes} setNotes={setNotes} />;
      case "timeblock": return <TimeBlock />;
      case "pomodoro": return <Pomodoro pomodoroCount={pomos} setPomodoroCount={setPomos} />;
      case "soundscape": return <Soundscape />;
      case "todos": return <Todos todos={todos} setTodos={setTodos} />;
      case "habits": return <HabitTracker habits={habits} setHabits={setHabits} />;
      case "energy": return <EnergyMap />;
      case "journal": return <Journal />;
      case "weekly": return <WeeklyReview />;
      case "guide": return <Guide />;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: C.bg }}>
      {/* Sidebar */}
      <div style={{ width: collapsed ? 54 : 220, minWidth: collapsed ? 54 : 220, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", transition: "all .25s ease", overflow: "hidden" }}>
        <div style={{ padding: collapsed ? "16px 10px" : "16px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", minHeight: 56 }}>
          {collapsed ? <div onClick={() => setCollapsed(false)} style={{ cursor: "pointer", ...mono, fontSize: 18, fontWeight: 700, color: C.blue }}>F</div> : (
            <><div><div style={{ ...mono, fontSize: 16, fontWeight: 700, letterSpacing: "-0.5px" }}><span style={{ color: C.blue }}>FLOW</span><span style={{ color: C.text }}>STATE</span></div><div style={{ ...mono, fontSize: 8, color: C.textDim, letterSpacing: "2.5px", marginTop: 2, textTransform: "uppercase" }}>Productivity OS</div></div><div onClick={() => setCollapsed(true)} style={{ cursor: "pointer", color: C.textDim, fontSize: 14, padding: 4 }}>◁</div></>
          )}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: collapsed ? "8px 4px" : "8px 8px" }}>
          {groups.map(g => (
            <div key={g}>
              {!collapsed && <div style={{ ...mono, fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: "2px", padding: "12px 10px 4px", fontWeight: 500 }}>{GROUP_LABELS[g]}</div>}
              {TABS.filter(t => t.group === g).map(t => (
                <div key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "8px 0" : "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12.5, marginBottom: 1, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? C.blue : C.textMuted, background: tab === t.id ? C.blueBg : "transparent", border: `1px solid ${tab === t.id ? C.blueBorder : "transparent"}`, justifyContent: collapsed ? "center" : "flex-start", transition: "all .15s" }} title={t.label}>
                  <span style={{ fontSize: 15, width: 20, textAlign: "center", flexShrink: 0 }}>{t.icon}</span>{!collapsed && t.label}
                </div>
              ))}
            </div>
          ))}
        </div>
        {!collapsed && <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.textDim, lineHeight: 1.6 }}>
          <div style={{ marginBottom: 6 }}>💾 Data saves automatically to your browser.</div>
          <span onClick={() => { if (window.confirm("This will erase ALL your data (notes, tasks, habits, journal, etc). Are you sure?")) { Object.keys(localStorage).filter(k => k.startsWith("flowstate_")).forEach(k => localStorage.removeItem(k)); window.location.reload(); }}} style={{ cursor: "pointer", color: C.rose, fontSize: 10 }}>Reset all data</span>
        </div>}
      </div>
      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "12px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 52, background: C.surface }}>
          <div style={{ ...mono, fontSize: 13, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: C.blue }}>{curTab?.icon}</span> {curTab?.label}</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ ...mono, fontSize: 11, color: C.textDim }}>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            <span style={S.badge(C.rose)}>{pomos} sessions</span>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 24, paddingBottom: 48 }}>{render()}</div>
      </div>
    </div>
  );
}

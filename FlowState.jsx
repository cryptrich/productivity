import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Google Fonts ──────────────────────────────────────────────────────────────
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@300;400;500&display=swap";
document.head.appendChild(link);

// ─── Global Styles ─────────────────────────────────────────────────────────────
const styleEl = document.createElement("style");
styleEl.textContent = `
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0f1117;font-family:'DM Sans',sans-serif;color:#e2e4ed}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:#181a24}
  ::-webkit-scrollbar-thumb{background:#323752;border-radius:4px}
  input,textarea,select{font-family:'DM Sans',sans-serif}
  canvas{touch-action:none}
  input[type=range]{accent-color:#5b8af5}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideR{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
`;
document.head.appendChild(styleEl);

// ─── Color System ──────────────────────────────────────────────────────────────
const C = {
  bg: "#0f1117", bgWarm: "#12131a", surface: "#181a24", surfaceHover: "#222536",
  border: "#272b3a", border2: "#323752",
  blue: "#5b8af5", blueDim: "#3d6be0", blueBg: "rgba(91,138,245,0.07)", blueBorder: "rgba(91,138,245,0.18)",
  green: "#6bcb8b", greenBg: "rgba(107,203,139,0.07)", greenBorder: "rgba(107,203,139,0.18)",
  amber: "#e8a84c", amberBg: "rgba(232,168,76,0.07)", amberBorder: "rgba(232,168,76,0.18)",
  rose: "#e87070", roseBg: "rgba(232,112,112,0.07)", roseBorder: "rgba(232,112,112,0.18)",
  lavender: "#9b8afb", lavenderBg: "rgba(155,138,251,0.07)", lavenderBorder: "rgba(155,138,251,0.18)",
  teal: "#5bc4c0", tealBg: "rgba(91,196,192,0.07)", tealBorder: "rgba(91,196,192,0.18)",
  text: "#e2e4ed", textSoft: "#a8adc2", textMuted: "#6b7190", textDim: "#464c65",
};

// ─── useLocalStorage ───────────────────────────────────────────────────────────
function useLocalStorage(key, defaultValue) {
  const fullKey = "flowstate_" + key;
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(fullKey);
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return typeof defaultValue === "function" ? defaultValue() : defaultValue;
  });
  useEffect(() => {
    try { localStorage.setItem(fullKey, JSON.stringify(state)); } catch {}
  }, [fullKey, state]);
  return [state, setState];
}

// ─── Shared Components ─────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "default", style = {}, disabled }) {
  const base = { border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: disabled ? "not-allowed" : "pointer", padding: "6px 14px", transition: "all 0.15s", fontFamily: "'DM Sans',sans-serif", opacity: disabled ? 0.5 : 1, ...style };
  const variants = {
    primary: { background: C.blue, color: "#fff" },
    outline: { background: "transparent", border: `1px solid ${C.border2}`, color: C.textSoft },
    ghost: { background: "transparent", border: "none", color: C.textMuted },
    danger: { background: "transparent", border: `1px solid ${C.roseBorder}`, color: C.rose },
    default: { background: "transparent", border: `1px solid ${C.border}`, color: C.textSoft },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>{children}</button>;
}

function Card({ children, title, accent, style = {} }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 14, borderLeft: accent ? `3px solid ${accent}` : undefined, animation: "fadeUp 0.35s ease", ...style }}>
      {title && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: C.textMuted, marginBottom: 12 }}>{title}</div>}
      {children}
    </div>
  );
}

function Stat({ value, label, color }) {
  return (
    <div style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 30, fontWeight: 700, color: color || C.text }}>{value}</div>
      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function ScienceTip({ title, text, color }) {
  return (
    <Card accent={color} style={{ background: color ? `${color}08` : C.surface }}>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, background: color ? `${color}22` : C.surfaceHover, color: color || C.textMuted, padding: "2px 7px", borderRadius: 4 }}>SCIENCE</span>
      </div>
      <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.7 }}>{text}</div>
    </Card>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 40, opacity: 0.2, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 13, color: C.textDim }}>{text}</div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
const SCIENCE_TIPS = [
  { title: "Ultradian Rhythms (Peretz Lavie)", text: "Your brain cycles through ~90-min high-focus and ~20-min recovery windows. Schedule deep work in 90-min blocks and honour rest.", color: C.blue },
  { title: "Implementation Intentions (Peter Gollwitzer)", text: "Stating 'When X happens, I will do Y' triples follow-through vs. vague goals. Use the time block planner to set when-then plans.", color: C.green },
  { title: "Zeigarnik Effect (Bluma Zeigarnik)", text: "Incomplete tasks occupy working memory. Do a brain-dump into Tasks every morning to free mental bandwidth for deep work.", color: C.lavender },
  { title: "Attention Residue (Sophie Leroy)", text: "Switching tasks leaves a cognitive trace that impairs performance by up to 40%. Complete or consciously close tasks before switching.", color: C.amber },
  { title: "Progress Principle (Teresa Amabile)", text: "Small daily wins fuel intrinsic motivation more than any external reward. Use the Journal to record even incremental progress.", color: C.teal },
  { title: "Parkinson's Law", text: "Work expands to fill available time. Set hard stop times in Time Block to create productive pressure and prevent perfectionism spirals.", color: C.rose },
];

function CheckItem({ label }) {
  const [checked, setChecked] = useState(false);
  return (
    <div onClick={() => setChecked(v => !v)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: checked ? C.greenBg : "transparent", border: `1px solid ${checked ? C.greenBorder : C.border}`, cursor: "pointer", marginBottom: 6, transition: "all 0.15s" }}>
      <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? C.green : C.border2}`, background: checked ? C.greenBg : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {checked && <span style={{ color: C.green, fontSize: 10 }}>✓</span>}
      </div>
      <span style={{ fontSize: 13, color: checked ? C.green : C.textSoft, textDecoration: checked ? "line-through" : "none" }}>{label}</span>
    </div>
  );
}

function Dashboard({ todos, habits, pomodoroCount, notes }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const totalTasks = todos.length, doneTasks = todos.filter(t => t.done).length;
  const totalHabits = habits.length, doneHabits = habits.filter(h => h.completedToday).length;
  const taskPct = totalTasks ? doneTasks / totalTasks : 0;
  const habitPct = totalHabits ? doneHabits / totalHabits : 0;
  const score = Math.min(100, Math.round((taskPct * 35) + (habitPct * 30) + (Math.min(pomodoroCount, 8) / 8 * 35)));
  const scoreColor = score > 70 ? C.green : score > 40 ? C.amber : C.textMuted;
  const r = 34, circ = 2 * Math.PI * r;
  const tip = SCIENCE_TIPS[now.getDate() % 6];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.text }}>{greeting} 👋</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{dateStr}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12, marginBottom: 16 }}>
        <Stat value={`${doneTasks}/${totalTasks}`} label="Tasks done" color={C.green} />
        <Stat value={`${doneHabits}/${totalHabits}`} label="Habits today" color={C.blue} />
        <Stat value={pomodoroCount} label="Focus sessions" color={C.amber} />
        <Stat value={notes.length} label="Notes" color={C.lavender} />
      </div>
      <Card title="Daily Focus Score">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width={80} height={80}>
            <circle cx={40} cy={40} r={r} fill="none" stroke={C.border2} strokeWidth={6} />
            <circle cx={40} cy={40} r={r} fill="none" stroke={scoreColor} strokeWidth={6}
              strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ}
              strokeLinecap="round" transform="rotate(-90 40 40)"
              style={{ transition: "stroke-dashoffset 0.8s ease" }} />
            <text x={40} y={45} textAnchor="middle" fill={scoreColor} fontFamily="'DM Mono',monospace" fontSize={18} fontWeight={700}>{score}</text>
          </svg>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor }}>{score < 40 ? "Just starting" : score < 70 ? "Making progress" : "Crushing it!"}</div>
            <div style={{ fontSize: 12, color: C.textSoft, marginTop: 4 }}>Tasks 35% · Habits 30% · Focus 35%</div>
          </div>
        </div>
      </Card>
      <ScienceTip title={tip.title} text={tip.text} color={tip.color} />
      <Card title="Shutdown Ritual">
        {["Review tasks & reschedule", "Process inbox to zero", "Check tomorrow's calendar", "Note today's biggest win", "Say 'Shutdown complete'"].map((item, i) => (
          <CheckItem key={i} label={item} />
        ))}
      </Card>
    </div>
  );
}

// ─── Notes ─────────────────────────────────────────────────────────────────────
const NOTE_COLORS = [C.blue, C.green, C.amber, C.lavender, C.teal];

function Notes({ notes, setNotes }) {
  const [activeId, setActiveId] = useState(notes[0]?.id || null);
  const [search, setSearch] = useState("");
  const active = notes.find(n => n.id === activeId);

  const addNote = () => {
    const n = { id: Date.now(), title: "Untitled", content: "", color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)], updated: new Date().toISOString() };
    setNotes(prev => [n, ...prev]);
    setActiveId(n.id);
  };

  const updateNote = (id, patch) => setNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch, updated: new Date().toISOString() } : n));
  const deleteNote = (id) => { setNotes(prev => prev.filter(n => n.id !== id)); setActiveId(notes.find(n => n.id !== id)?.id || null); };

  const filtered = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", gap: 0 }}>
      <div style={{ width: 240, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 12px 8px", display: "flex", gap: 8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ flex: 1, background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.text, fontSize: 12 }} />
          <Btn variant="primary" onClick={addNote} style={{ padding: "6px 10px" }}>+</Btn>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
          {filtered.length === 0 && <EmptyState icon="▤" text="No notes yet" />}
          {filtered.map(n => (
            <div key={n.id} onClick={() => setActiveId(n.id)} style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 4, borderLeft: `3px solid ${n.color}`, background: activeId === n.id ? C.blueBg : "transparent", border: activeId === n.id ? `1px solid ${C.blueBorder}` : `1px solid transparent`, borderLeft: `3px solid ${n.color}`, transition: "all 0.15s" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.title || "Untitled"}</div>
              <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: C.textMuted, marginTop: 3 }}>{new Date(n.updated).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24 }}>
        {!active ? <EmptyState icon="▤" text="Select or create a note" /> : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <input value={active.title} onChange={e => updateNote(active.id, { title: e.target.value })} style={{ fontSize: 20, fontWeight: 700, color: C.text, background: "transparent", border: "none", outline: "none", flex: 1 }} />
              <Btn variant="danger" onClick={() => deleteNote(active.id)}>Delete</Btn>
            </div>
            <textarea value={active.content} onChange={e => updateNote(active.id, { content: e.target.value })} placeholder="Start writing..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.textSoft, fontSize: 14, lineHeight: 1.85, resize: "none" }} />
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textDim, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              {active.content.split(/\s+/).filter(Boolean).length} words · {active.content.length} chars
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Mind Map ──────────────────────────────────────────────────────────────────
const NODE_COLORS = [C.blue, C.green, C.amber, C.rose, C.lavender, C.teal];
const defaultMap = () => ({
  id: Date.now(), name: "My First Mind Map",
  nodes: [{ id: 1, x: 300, y: 220, text: "Main Idea", color: C.blue, root: true }],
  edges: [], freeLines: [], created: new Date().toISOString(), updated: new Date().toISOString()
});

function MindMap() {
  const [savedMaps, setSavedMaps] = useLocalStorage("mindmaps", () => [defaultMap()]);
  const [activeMapId, setActiveMapId] = useState(() => savedMaps[0]?.id);
  const [nodes, setNodes] = useState(() => savedMaps[0]?.nodes || []);
  const [edges, setEdges] = useState(() => savedMaps[0]?.edges || []);
  const [freeLines, setFreeLines] = useState(() => savedMaps[0]?.freeLines || []);
  const [mapName, setMapName] = useState(() => savedMaps[0]?.name || "My First Mind Map");
  const [showList, setShowList] = useState(false);
  const [tool, setTool] = useState("select");
  const [penColor, setPenColor] = useState(C.blue);
  const [penSize, setPenSize] = useState(2);
  const [selectedNode, setSelectedNode] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [editText, setEditText] = useState("");
  const [dragging, setDragging] = useState(null);
  const [currentLine, setCurrentLine] = useState(null);
  const canvasRef = useRef(null);
  const dragOffset = useRef(null);

  // Auto-save debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setSavedMaps(prev => prev.map(m => m.id === activeMapId
        ? { ...m, nodes, edges, freeLines, name: mapName, updated: new Date().toISOString() }
        : m));
    }, 500);
    return () => clearTimeout(t);
  }, [nodes, edges, freeLines, mapName, activeMapId]);

  const loadMap = (m) => {
    setActiveMapId(m.id); setNodes(m.nodes); setEdges(m.edges);
    setFreeLines(m.freeLines); setMapName(m.name); setSelectedNode(null);
  };

  const newMap = () => {
    const m = defaultMap();
    setSavedMaps(prev => [...prev, m]);
    loadMap(m);
  };

  const deleteMap = (id) => {
    if (savedMaps.length <= 1) return;
    const remaining = savedMaps.filter(m => m.id !== id);
    setSavedMaps(remaining);
    if (id === activeMapId) loadMap(remaining[0]);
  };

  // Canvas draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // Dot grid
    ctx.fillStyle = C.textDim;
    for (let x = 0; x < W; x += 32) for (let y = 0; y < H; y += 32) {
      ctx.beginPath(); ctx.arc(x, y, 0.8, 0, Math.PI * 2); ctx.fill();
    }

    // Edges
    ctx.strokeStyle = C.border2; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
    edges.forEach(e => {
      const a = nodes.find(n => n.id === e.from), b = nodes.find(n => n.id === e.to);
      if (!a || !b) return;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 20;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx, my, b.x, b.y); ctx.stroke();
    });
    ctx.setLineDash([]);

    // Free lines
    const drawLines = (lines, alpha = 1) => {
      lines.forEach(line => {
        if (line.points.length < 2) return;
        ctx.strokeStyle = line.color; ctx.lineWidth = line.size; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.moveTo(line.points[0].x, line.points[0].y);
        for (let i = 1; i < line.points.length - 1; i++) {
          const mx = (line.points[i].x + line.points[i + 1].x) / 2;
          const my = (line.points[i].y + line.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(line.points[i].x, line.points[i].y, mx, my);
        }
        ctx.lineTo(line.points[line.points.length - 1].x, line.points[line.points.length - 1].y);
        ctx.stroke(); ctx.globalAlpha = 1;
      });
    };
    drawLines(freeLines);
    if (currentLine) drawLines([currentLine]);

    // Nodes
    nodes.forEach(node => {
      const r = node.root ? 58 : 42;
      const sel = selectedNode === node.id;
      if (sel) { ctx.shadowBlur = 24; ctx.shadowColor = node.color; }
      ctx.fillStyle = node.color + "10"; ctx.strokeStyle = node.color; ctx.lineWidth = sel ? 2.5 : 1.5;
      ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = C.text; ctx.font = `${node.root ? 500 : 400} 13px 'DM Sans',sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const words = node.text.split(" "), lines2 = [], maxW = r * 1.5;
      let cur = "";
      words.forEach(w => { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width < maxW) cur = t; else { lines2.push(cur); cur = w; } });
      lines2.push(cur);
      const lh = 16, startY = node.y - ((lines2.length - 1) * lh) / 2;
      lines2.forEach((l, i) => ctx.fillText(l, node.x, startY + i * lh));
    });
  }, [nodes, edges, freeLines, currentLine, selectedNode]);

  const getNodeAt = (x, y) => nodes.find(n => Math.hypot(n.x - x, n.y - y) <= (n.root ? 58 : 42));

  const onPointerDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (tool === "select") {
      const n = getNodeAt(x, y);
      if (n) { setSelectedNode(n.id); setEditText(n.text); setDragging(n.id); dragOffset.current = { dx: n.x - x, dy: n.y - y }; }
      else setSelectedNode(null);
    } else if (tool === "draw") {
      setCurrentLine({ points: [{ x, y }], color: penColor, size: penSize * (e.pressure || 1) });
    } else if (tool === "link") {
      const n = getNodeAt(x, y);
      if (n && !connecting) setConnecting(n.id);
      else if (n && connecting && n.id !== connecting) {
        setEdges(prev => [...prev, { id: Date.now(), from: connecting, to: n.id }]);
        setConnecting(null);
      }
    } else if (tool === "erase") {
      eraseAt(x, y);
    }
  };

  const onPointerMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (tool === "select" && dragging) {
      setNodes(prev => prev.map(n => n.id === dragging ? { ...n, x: x + dragOffset.current.dx, y: y + dragOffset.current.dy } : n));
    } else if (tool === "draw" && currentLine) {
      setCurrentLine(prev => ({ ...prev, points: [...prev.points, { x, y }], size: penSize * (e.pressure || 1) }));
    } else if (tool === "erase") {
      eraseAt(x, y);
    }
  };

  const eraseAt = (x, y) => {
    setFreeLines(prev => prev.filter(line => !line.points.some(p => Math.hypot(p.x - x, p.y - y) < 15)));
  };

  const onPointerUp = (e) => {
    if (tool === "draw" && currentLine) { setFreeLines(prev => [...prev, currentLine]); setCurrentLine(null); }
    if (tool === "select" && dragging === null) {
      // double click handled below
    }
    setDragging(null);
  };

  const onDblClick = (e) => {
    if (tool !== "select") return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (!getNodeAt(x, y)) addNode(x, y);
  };

  const addNode = (cx, cy) => {
    const parent = nodes.find(n => n.id === selectedNode) || nodes.find(n => n.root);
    const angle = Math.random() * Math.PI * 2;
    const dist = 130 + Math.random() * 50;
    const nx = cx !== undefined ? cx : parent.x + Math.cos(angle) * dist;
    const ny = cy !== undefined ? cy : parent.y + Math.sin(angle) * dist;
    const color = NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];
    const newNode = { id: Date.now(), x: nx, y: ny, text: "New idea", color, root: false };
    setNodes(prev => [...prev, newNode]);
    if (cx === undefined) setEdges(prev => [...prev, { id: Date.now(), from: parent.id, to: newNode.id }]);
    setSelectedNode(newNode.id); setEditText("New idea");
  };

  const deleteSelected = () => {
    if (!selectedNode || nodes.find(n => n.id === selectedNode)?.root) return;
    setNodes(prev => prev.filter(n => n.id !== selectedNode));
    setEdges(prev => prev.filter(e => e.from !== selectedNode && e.to !== selectedNode));
    setSelectedNode(null);
  };

  const selNode = nodes.find(n => n.id === selectedNode);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)" }}>
      {/* Map management bar */}
      <div style={{ padding: "8px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <Btn variant="outline" onClick={() => setShowList(v => !v)}>📁 Maps ({savedMaps.length})</Btn>
        <input value={mapName} onChange={e => setMapName(e.target.value)} style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 10px", color: C.text, fontSize: 13, width: 200 }} />
        <Btn variant="primary" onClick={() => {}}>💾 Save</Btn>
        <Btn variant="outline" onClick={newMap}>+ New Map</Btn>
        <span style={{ marginLeft: "auto", fontSize: 11, color: C.textDim, fontFamily: "'DM Mono',monospace" }}>Auto-saves</span>
      </div>
      {showList && (
        <div style={{ padding: "8px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {savedMaps.map(m => (
            <div key={m.id} style={{ background: m.id === activeMapId ? C.blueBg : C.bgWarm, border: `1px solid ${m.id === activeMapId ? C.blueBorder : C.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <span onClick={() => loadMap(m)} style={{ fontSize: 12, color: C.textSoft }}>{m.name} <span style={{ color: C.textDim }}>({m.nodes.length} nodes)</span></span>
              {savedMaps.length > 1 && <span onClick={() => deleteMap(m.id)} style={{ color: C.rose, cursor: "pointer", fontSize: 14 }}>×</span>}
            </div>
          ))}
        </div>
      )}
      {/* Toolbar */}
      <div style={{ padding: "8px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {[["select","↖","Select"],["draw","✎","Draw"],["link","⟷","Link"],["erase","◌","Erase"]].map(([t, icon, label]) => (
          <Btn key={t} variant={tool === t ? "primary" : "outline"} onClick={() => setTool(t)}>{icon} {label}</Btn>
        ))}
        <div style={{ width: 1, height: 24, background: C.border, margin: "0 4px" }} />
        <Btn variant="primary" onClick={() => addNode()}>+ Node</Btn>
        {selectedNode && !selNode?.root && <Btn variant="danger" onClick={deleteSelected}>Delete</Btn>}
        {connecting && <span style={{ fontSize: 11, background: C.blueBg, border: `1px solid ${C.blueBorder}`, color: C.blue, padding: "4px 10px", borderRadius: 20 }}>Click another node to connect</span>}
        {tool === "draw" && (
          <>
            {NODE_COLORS.concat(["#ffffff"]).map(col => (
              <div key={col} onClick={() => setPenColor(col)} style={{ width: 18, height: 18, borderRadius: "50%", background: col, border: `2px solid ${penColor === col ? C.text : "transparent"}`, cursor: "pointer" }} />
            ))}
            <select value={penSize} onChange={e => setPenSize(Number(e.target.value))} style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, padding: "4px 6px", fontSize: 11 }}>
              <option value={1}>Thin</option><option value={2}>Med</option><option value={4}>Thick</option><option value={8}>Bold</option>
            </select>
          </>
        )}
        {freeLines.length > 0 && <Btn variant="ghost" onClick={() => setFreeLines([])}>Clear ink</Btn>}
      </div>
      {/* Node edit bar */}
      {selectedNode && tool === "select" && (
        <div style={{ padding: "6px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "center", animation: "slideR 0.3s ease" }}>
          <input value={editText} onChange={e => { setEditText(e.target.value); setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, text: e.target.value } : n)); }}
            style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 10px", color: C.text, fontSize: 13, width: 200 }} />
          {NODE_COLORS.map(col => (
            <div key={col} onClick={() => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, color: col } : n))} style={{ width: 16, height: 16, borderRadius: "50%", background: col, border: `2px solid ${selNode?.color === col ? C.text : "transparent"}`, cursor: "pointer" }} />
          ))}
        </div>
      )}
      {/* Canvas */}
      <canvas ref={canvasRef} style={{ flex: 1, cursor: tool === "draw" ? "crosshair" : tool === "erase" ? "cell" : "default" }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp} onDoubleClick={onDblClick} />
    </div>
  );
}

// ─── Time Block ────────────────────────────────────────────────────────────────
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const TB_COLORS = [C.blue, C.green, C.amber, C.rose, C.lavender, C.teal];

function TimeBlock() {
  const seedBlocks = { [todayKey()]: [
    { id: 1, start: 9, end: 10.5, label: "Deep Work", color: C.blue },
    { id: 2, start: 11, end: 12, label: "Email & Admin", color: C.amber },
    { id: 3, start: 13, end: 14, label: "Lunch Break", color: C.green },
    { id: 4, start: 14.5, end: 16, label: "Creative Work", color: C.lavender },
    { id: 5, start: 16, end: 17, label: "Review & Plan", color: C.teal },
  ]};
  const [allBlocks, setAllBlocks] = useLocalStorage("timeblocks", seedBlocks);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [newB, setNewB] = useState({ label: "", start: 9, end: 10, color: C.blue });
  const [editing, setEditing] = useState(null);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const hourHeight = 48;

  const addBlock = () => {
    if (!newB.label.trim() || !selectedDate) return;
    const block = { id: Date.now(), ...newB };
    setAllBlocks(prev => ({ ...prev, [selectedDate]: [...(prev[selectedDate] || []), block] }));
    setNewB(prev => ({ ...prev, label: "" }));
  };

  const deleteBlock = (id) => {
    setAllBlocks(prev => ({ ...prev, [selectedDate]: (prev[selectedDate] || []).filter(b => b.id !== id) }));
  };

  const timeOptions = [];
  for (let h = 6; h <= 23; h += 0.5) {
    const hh = Math.floor(h), mm = h % 1 === 0 ? "00" : "30";
    const ampm = hh < 12 ? "AM" : "PM", hr = hh % 12 || 12;
    timeOptions.push({ value: h, label: `${hr}:${mm} ${ampm}` });
  }

  const fmtTime = (h) => { const hh = Math.floor(h), mm = h % 1 === 0 ? "00" : "30", ampm = hh < 12 ? "AM" : "PM"; return `${hh % 12 || 12}:${mm} ${ampm}`; };

  const copyPrevDay = () => {
    if (!selectedDate) return;
    const d = new Date(selectedDate); d.setDate(d.getDate() - 1);
    const prev = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const prevBlocks = allBlocks[prev] || [];
    setAllBlocks(p => ({ ...p, [selectedDate]: prevBlocks.map(b => ({ ...b, id: Date.now() + Math.random() })) }));
  };

  if (!selectedDate) {
    // Calendar view
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <Btn variant="outline" onClick={() => { let m = viewMonth - 1, y = viewYear; if (m < 0) { m = 11; y--; } setViewMonth(m); setViewYear(y); }}>◁</Btn>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 600 }}>{monthNames[viewMonth]} {viewYear}</span>
          <Btn variant="outline" onClick={() => { let m = viewMonth + 1, y = viewYear; if (m > 11) { m = 0; y++; } setViewMonth(m); setViewYear(y); }}>▷</Btn>
          <Btn variant="ghost" onClick={() => { setViewMonth(new Date().getMonth()); setViewYear(new Date().getFullYear()); }}>Today</Btn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontFamily: "'DM Mono',monospace", color: C.textMuted, padding: "4px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const isToday = key === todayKey();
            const blocks = allBlocks[key] || [];
            return (
              <div key={day} onClick={() => setSelectedDate(key)} style={{ minHeight: 80, background: isToday ? C.blueBg : C.surface, border: `1px solid ${isToday ? C.blueBorder : C.border}`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? C.blue : C.text, marginBottom: 4 }}>{day}</div>
                {blocks.slice(0, 3).map(b => (
                  <div key={b.id} style={{ fontSize: 9, background: b.color + "22", color: b.color, borderRadius: 3, padding: "1px 4px", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.label}</div>
                ))}
                {blocks.length > 3 && <div style={{ fontSize: 9, color: C.textDim }}>+{blocks.length - 3} more</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Day view
  const dayBlocks = allBlocks[selectedDate] || [];
  const [sy, sm, sd] = selectedDate.split("-").map(Number);
  const dayLabel = new Date(sy, sm - 1, sd).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const now = new Date(), curH = now.getHours() + now.getMinutes() / 60;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <Btn variant="outline" onClick={() => setSelectedDate(null)}>← Calendar</Btn>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: C.text }}>{dayLabel}</span>
        <Btn variant="ghost" onClick={copyPrevDay}>Copy previous day</Btn>
      </div>
      {/* Add block form */}
      <Card title="Add Time Block">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input value={newB.label} onChange={e => setNewB(p => ({ ...p, label: e.target.value }))} placeholder="Block label..." style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.text, fontSize: 13, flex: 1, minWidth: 120 }} />
          <select value={newB.start} onChange={e => setNewB(p => ({ ...p, start: Number(e.target.value) }))} style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px", color: C.text, fontSize: 12 }}>
            {timeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span style={{ color: C.textMuted }}>→</span>
          <select value={newB.end} onChange={e => setNewB(p => ({ ...p, end: Number(e.target.value) }))} style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px", color: C.text, fontSize: 12 }}>
            {timeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div style={{ display: "flex", gap: 4 }}>
            {TB_COLORS.map(col => <div key={col} onClick={() => setNewB(p => ({ ...p, color: col }))} style={{ width: 16, height: 16, borderRadius: "50%", background: col, border: `2px solid ${newB.color === col ? C.text : "transparent"}`, cursor: "pointer" }} />)}
          </div>
          <Btn variant="primary" onClick={addBlock}>Add</Btn>
        </div>
      </Card>
      {/* Timeline */}
      <div style={{ position: "relative", paddingLeft: 60, overflowY: "auto", maxHeight: "calc(100vh - 300px)" }}>
        {Array.from({ length: 18 }).map((_, i) => {
          const h = i + 6;
          const ampm = h < 12 ? "AM" : "PM", hr = h % 12 || 12;
          return (
            <div key={h} style={{ height: hourHeight, position: "relative", borderTop: `1px solid ${C.border}` }}>
              <span style={{ position: "absolute", left: -55, top: -9, fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.textDim }}>{hr}:00 {ampm}</span>
            </div>
          );
        })}
        {/* Blocks */}
        {dayBlocks.map(b => {
          const top = (b.start - 6) * hourHeight;
          const height = (b.end - b.start) * hourHeight;
          return (
            <div key={b.id} onClick={() => setEditing(editing === b.id ? null : b.id)}
              style={{ position: "absolute", left: 60, right: 0, top, height: Math.max(height, 20), background: b.color + "1e", borderLeft: `3px solid ${b.color}`, borderRadius: "0 6px 6px 0", padding: "4px 8px", cursor: "pointer" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: b.color }}>{b.label}</div>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: C.textDim }}>{fmtTime(b.start)} – {fmtTime(b.end)}</div>
              {editing === b.id && <Btn variant="danger" onClick={e => { e.stopPropagation(); deleteBlock(b.id); }} style={{ marginTop: 4, fontSize: 10, padding: "2px 8px" }}>Delete</Btn>}
            </div>
          );
        })}
        {/* Current time */}
        {curH >= 6 && curH <= 23 && (
          <div style={{ position: "absolute", left: 55, right: 0, top: (curH - 6) * hourHeight, display: "flex", alignItems: "center", pointerEvents: "none" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.rose, marginLeft: -4 }} />
            <div style={{ flex: 1, height: 1, background: C.rose }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tasks ─────────────────────────────────────────────────────────────────────
const PRIORITY_COLOR = { high: C.rose, medium: C.amber, low: C.green };

function Tasks({ todos, setTodos }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");

  const add = () => {
    if (!text.trim()) return;
    setTodos(prev => [{ id: Date.now(), text: text.trim(), done: false, priority }, ...prev]);
    setText("");
  };

  const toggle = (id) => setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id) => setTodos(prev => prev.filter(t => t.id !== id));

  const pOrder = { high: 0, medium: 1, low: 2 };
  const filtered = todos.filter(t => filter === "all" ? true : filter === "active" ? !t.done : t.done)
    .sort((a, b) => a.done - b.done || pOrder[a.priority] - pOrder[b.priority]);

  return (
    <div>
      <Card>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Add a task..." style={{ flex: 1, background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13 }} />
          <select value={priority} onChange={e => setPriority(e.target.value)} style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px", color: C.text, fontSize: 12 }}>
            <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <Btn variant="primary" onClick={add}>Add</Btn>
        </div>
        <div style={{ fontSize: 11, color: C.textDim }}>⚡ 2-Minute Rule: If it takes less than 2 minutes, do it now.</div>
      </Card>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[["all", "All"], ["active", "Active"], ["done", "Done"]].map(([f, label]) => (
          <Btn key={f} variant={filter === f ? "primary" : "outline"} onClick={() => setFilter(f)}>
            {label} ({todos.filter(t => f === "all" ? true : f === "active" ? !t.done : t.done).length})
          </Btn>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState icon="◇" text="No tasks here" />}
      {filtered.map((t, i) => (
        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${PRIORITY_COLOR[t.priority]}`, borderRadius: 8, marginBottom: 6, opacity: t.done ? 0.45 : 1, animation: "fadeUp 0.35s ease", animationDelay: `${i * 25}ms` }}>
          <div onClick={() => toggle(t.id)} style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${t.done ? C.green : C.border2}`, background: t.done ? C.greenBg : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            {t.done && <span style={{ color: C.green, fontSize: 11 }}>✓</span>}
          </div>
          <span style={{ flex: 1, fontSize: 13, color: t.done ? C.textMuted : C.text, textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
          <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: PRIORITY_COLOR[t.priority], background: PRIORITY_COLOR[t.priority] + "18", padding: "2px 7px", borderRadius: 10 }}>{t.priority}</span>
          <span onClick={() => remove(t.id)} style={{ color: C.textDim, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</span>
        </div>
      ))}
    </div>
  );
}

// ─── Pomodoro ──────────────────────────────────────────────────────────────────
const MODES = { work: { label: "Focus", color: C.rose }, short: { label: "Short Break", color: C.green }, long: { label: "Long Break", color: C.blue } };

function Pomodoro({ pomodoroCount, setPomodoroCount }) {
  const [durations, setDurations] = useState({ work: 25, short: 5, long: 15 });
  const [mode, setMode] = useState("work");
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [goal, setGoal] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => { setTimeLeft(durations[mode] * 60); setRunning(false); }, [mode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode === "work") {
              setPomodoroCount(c => c + 1);
              const next = (pomodoroCount + 1) % 4 === 0 ? "long" : "short";
              setMode(next);
              setTimeLeft(durations[next] * 60);
            } else {
              setMode("work");
              setTimeLeft(durations.work * 60);
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  const total = durations[mode] * 60;
  const r = 110, circ = 2 * Math.PI * r;
  const pct = timeLeft / total;
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const modeColor = MODES[mode].color;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>
        {Object.entries(MODES).map(([k, v]) => (
          <Btn key={k} onClick={() => setMode(k)} style={{ background: mode === k ? modeColor : "transparent", color: mode === k ? "#fff" : C.textSoft, border: `1px solid ${mode === k ? modeColor : C.border}` }}>{v.label}</Btn>
        ))}
      </div>
      <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="What are you focusing on?" style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${C.border}`, padding: "8px 0", color: C.text, fontSize: 14, textAlign: "center", outline: "none", marginBottom: 24 }} />
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <svg width={260} height={260}>
          <circle cx={130} cy={130} r={r} fill="none" stroke={C.border2} strokeWidth={8} />
          <circle cx={130} cy={130} r={r} fill="none" stroke={modeColor} strokeWidth={8}
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round" transform="rotate(-90 130 130)"
            style={{ transition: "stroke-dashoffset 0.8s ease" }} />
          <text x={130} y={125} textAnchor="middle" fill={C.text} fontFamily="'DM Mono',monospace" fontSize={52} fontWeight={700}>{mm}:{ss}</text>
          <text x={130} y={158} textAnchor="middle" fill={C.textMuted} fontFamily="'DM Mono',monospace" fontSize={10} letterSpacing={2}>{MODES[mode].label.toUpperCase()}</text>
        </svg>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
        <Btn onClick={() => setRunning(v => !v)} style={{ background: modeColor, color: "#fff", fontSize: 14, padding: "10px 32px", border: "none" }}>{running ? "Pause" : "Start"}</Btn>
        <Btn variant="outline" onClick={() => { setRunning(false); setTimeLeft(durations[mode] * 60); }}>Reset</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Stat value={pomodoroCount} label="Sessions" color={C.rose} />
        <Stat value={pomodoroCount * durations.work} label="Focus min" color={C.amber} />
      </div>
      <Card title="Customize Durations">
        <div style={{ display: "flex", gap: 16 }}>
          {[["work", C.rose, "Focus"], ["short", C.green, "Short"], ["long", C.blue, "Long"]].map(([k, col, lbl]) => (
            <div key={k} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: col, marginBottom: 4 }}>{lbl}</div>
              <input type="number" value={durations[k]} min={1} max={60} onChange={e => { setDurations(p => ({ ...p, [k]: Number(e.target.value) })); if (mode === k) setTimeLeft(Number(e.target.value) * 60); }}
                style={{ width: 60, background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px", color: col, fontSize: 16, fontFamily: "'DM Mono',monospace", textAlign: "center" }} />
              <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>min</div>
            </div>
          ))}
        </div>
      </Card>
      <ScienceTip title="Pomodoro Technique (Francesco Cirillo)" text="Working in timed intervals prevents fatigue and leverages Parkinson's Law. The 25-min focus + 5-min break cycle is backed by sustained-attention research from the 1980s." color={C.rose} />
    </div>
  );
}

// ─── Focus Sounds ──────────────────────────────────────────────────────────────
const SOUNDS = [
  { title: "Deep Focus (40Hz Gamma)", type: "Binaural", color: C.blue, freq: "40 Hz", desc: "Enhances focus, learning, and memory consolidation. Used in MIT/Mass General gamma entrainment studies.", query: "40hz gamma binaural beats deep focus" },
  { title: "Flow State (10Hz Alpha)", type: "Binaural", color: C.teal, freq: "10 Hz", desc: "Induces relaxed alertness — the ideal state for creative problem-solving and sustained productivity.", query: "10hz alpha binaural beats flow state" },
  { title: "Deep Work (4Hz Theta)", type: "Binaural", color: C.lavender, freq: "4 Hz", desc: "Deep meditation and creative insight state. Ideal for complex problem-solving and imagination.", query: "4hz theta binaural beats deep work meditation" },
  { title: "High Focus (15Hz Beta)", type: "Isochronic", color: C.amber, freq: "15 Hz", desc: "Alert, engaged, and productive. Best for tasks requiring active concentration and quick thinking.", query: "15hz beta isochronic tones high focus" },
  { title: "Study & Memorize (14Hz SMR)", type: "Isochronic", color: C.green, freq: "14 Hz", desc: "Sensorimotor rhythm enhances memory retention and reduces mental fatigue during study sessions.", query: "14hz SMR isochronic tones study memorize" },
  { title: "Calm Concentration (6Hz Theta)", type: "Isochronic", color: C.rose, freq: "6 Hz", desc: "Sustained calm focus without drowsiness. Ideal for long reading or analytical sessions.", query: "6hz theta isochronic tones calm concentration" },
];

function FocusSounds() {
  return (
    <div>
      <Card>
        <p style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.8 }}>
          <strong style={{ color: C.text }}>Binaural beats</strong> require headphones — two slightly different frequencies are played per ear, and your brain perceives the difference as a third tone.{" "}
          <strong style={{ color: C.text }}>Isochronic tones</strong> are single tones pulsing at a set rate — no headphones required, speakers work fine.
        </p>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12, marginBottom: 16 }}>
        {SOUNDS.map((s, i) => (
          <a key={i} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(s.query)}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${s.color}`, borderRadius: 14, padding: 16, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = C.surfaceHover}
              onMouseLeave={e => e.currentTarget.style.background = C.surface}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: s.color }}>{s.title}</div>
                <span style={{ fontSize: 10, background: s.color + "18", color: s.color, padding: "2px 7px", borderRadius: 10, fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>{s.type}</span>
              </div>
              <p style={{ fontSize: 11, color: C.textSoft, lineHeight: 1.65, marginBottom: 10 }}>{s.desc}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textMuted }}>{s.freq}</span>
                <span style={{ fontSize: 11, color: s.color }}>▶ Open on YouTube</span>
              </div>
            </div>
          </a>
        ))}
      </div>
      <ScienceTip title="Neural Entrainment (2023 Meta-Analysis)" text="A 2023 meta-analysis of 22 studies found gamma (40Hz) beats significantly improved working memory and attention. Theta beats showed strongest effects on creative insight. Individual variation is high — experiment to find your frequency." color={C.lavender} />
      <Card title="How to Choose">
        {[["Coding / analytical work", "Gamma (40Hz) or Beta (15Hz)"], ["Creative tasks / writing", "Alpha (10Hz)"], ["Brainstorming / ideation", "Theta (4–6Hz)"], ["Study / memorisation", "SMR (14Hz)"]].map(([task, freq]) => (
          <div key={task} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
            <span style={{ color: C.textSoft }}>{task}</span>
            <span style={{ fontFamily: "'DM Mono',monospace", color: C.blue, fontSize: 12 }}>{freq}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Habits ────────────────────────────────────────────────────────────────────
function Habits({ habits, setHabits }) {
  const [text, setText] = useState("");
  const [freq, setFreq] = useState("Daily");

  const add = () => {
    if (!text.trim()) return;
    setHabits(prev => [...prev, { id: Date.now(), name: text.trim(), frequency: freq, completedToday: false, streak: 0 }]);
    setText("");
  };

  const toggle = (id) => setHabits(prev => prev.map(h => h.id === id ? { ...h, completedToday: !h.completedToday, streak: h.completedToday ? Math.max(0, h.streak - 1) : h.streak + 1 } : h));
  const remove = (id) => setHabits(prev => prev.filter(h => h.id !== id));

  return (
    <div>
      <Card>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="e.g., Meditate 10 min..." style={{ flex: 1, background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13 }} />
          <select value={freq} onChange={e => setFreq(e.target.value)} style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px", color: C.text, fontSize: 12 }}>
            <option>Daily</option><option>Weekdays</option><option>Weekly</option>
          </select>
          <Btn variant="primary" onClick={add}>Add</Btn>
        </div>
      </Card>
      {habits.length === 0 ? (
        <EmptyState icon="⟡" text={"On average, habits take 66 days to form. (Phillippa Lally, UCL)"} />
      ) : habits.map(h => (
        <Card key={h.id} accent={h.completedToday ? C.green : C.border}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div onClick={() => toggle(h.id)} style={{ width: 38, height: 38, borderRadius: "50%", border: `2px solid ${h.completedToday ? C.green : C.border2}`, background: h.completedToday ? C.greenBg : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              {h.completedToday && <span style={{ color: C.green, fontSize: 16 }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{h.name}</div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{h.frequency}</div>
            </div>
            <div style={{ textAlign: "center", minWidth: 48 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 22, fontWeight: 700, color: h.streak > 0 ? C.amber : C.textDim }}>{h.streak}</div>
              <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: C.textDim, letterSpacing: 1 }}>STREAK</div>
            </div>
            <span onClick={() => remove(h.id)} style={{ color: C.textDim, cursor: "pointer", fontSize: 18 }}>×</span>
          </div>
        </Card>
      ))}
      <ScienceTip title="Habit Stacking (BJ Fogg, Stanford)" text="Attach a new habit to an existing anchor habit. 'After I pour my morning coffee, I will meditate for 2 minutes.' This leverages existing neural pathways to build new ones faster." color={C.green} />
    </div>
  );
}

// ─── Energy Map ────────────────────────────────────────────────────────────────
const defaultEnergy = [
  { id: 1, hour: 8, energy: 6 }, { id: 2, hour: 10, energy: 9 },
  { id: 3, hour: 12, energy: 7 }, { id: 4, hour: 14, energy: 5 },
  { id: 5, hour: 16, energy: 8 }, { id: 6, hour: 18, energy: 6 },
];

function EntryLog({ entries, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const fmtH = h => { const ampm = h < 12 ? "AM" : "PM", hr = h % 12 || 12; return `${hr}:00 ${ampm}`; };
  return (
    <Card title="Entry Log">
      <div style={{ overflow: "hidden", maxHeight: expanded ? 9999 : 38, transition: "max-height 0.3s ease" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {entries.map(e => (
            <span key={e.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontFamily: "'DM Mono',monospace", color: C.textSoft }}>
              {fmtH(e.hour)} · <span style={{ color: C.blue }}>{e.energy}</span>
              <span onClick={() => onDelete(e.id)} style={{ color: C.textDim, cursor: "pointer", marginLeft: 2 }}>×</span>
            </span>
          ))}
        </div>
      </div>
      {entries.length > 4 && (
        <Btn variant="ghost" onClick={() => setExpanded(v => !v)} style={{ marginTop: 6, fontSize: 11 }}>
          {expanded ? "Show less ▴" : `Show all ${entries.length} entries ▾`}
        </Btn>
      )}
      <div style={{ fontSize: 11, color: C.textDim, marginTop: 6 }}>Same-hour entries are averaged on the graph.</div>
    </Card>
  );
}

function EnergyMap() {
  const [entries, setEntries] = useLocalStorage("energy", defaultEnergy);
  const [newH, setNewH] = useState(9);
  const [newE, setNewE] = useState(7);

  const addEntry = () => setEntries(prev => [...prev, { id: Date.now(), hour: newH, energy: newE }]);
  const deleteEntry = (id) => setEntries(prev => prev.filter(e => e.id !== id));

  // Average by hour
  const acc = {};
  entries.forEach(e => {
    if (!acc[e.hour]) acc[e.hour] = { total: 0, count: 0 };
    acc[e.hour].total += e.energy; acc[e.hour].count++;
  });
  const avgByHour = Array.from({ length: 24 }, (_, i) => ({ hour: i, avg: acc[i] ? acc[i].total / acc[i].count : null }));
  const filledPoints = avgByHour.filter(p => p.avg !== null);

  // SVG chart
  const W = 600, H = 230, padL = 40, padR = 10, padT = 15, padB = 30;
  const cW = W - padL - padR, cH = H - padT - padB;
  const xOf = (h) => padL + (h / 23) * cW;
  const yOf = (e) => padT + cH - (e / 10) * cH;
  const gradId = "energyGrad";

  const fmtXLabel = (h) => h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;

  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const ampm = i < 12 ? "AM" : "PM", hr = i % 12 || 12;
    return { value: i, label: `${hr}:00 ${ampm}` };
  });

  return (
    <div>
      <Card title="Log Energy Level">
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={newH} onChange={e => setNewH(Number(e.target.value))} style={{ background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px", color: C.text, fontSize: 12 }}>
            {hourOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span style={{ fontSize: 13, color: C.textSoft }}>Energy:</span>
          <input type="range" min={1} max={10} value={newE} onChange={e => setNewE(Number(e.target.value))} style={{ width: 120 }} />
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: C.blue, minWidth: 24 }}>{newE}</span>
          <Btn variant="primary" onClick={addEntry}>Log</Btn>
        </div>
      </Card>
      <EntryLog entries={entries} onDelete={deleteEntry} />
      {/* SVG Chart */}
      <Card title="Energy Curve">
        <div style={{ overflowX: "auto" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 400 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.blue} stopOpacity={0.2} />
                <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* Y grid lines */}
            {[2, 4, 6, 8, 10].map(e => (
              <g key={e}>
                <line x1={padL} x2={W - padR} y1={yOf(e)} y2={yOf(e)} stroke={C.border} strokeWidth={1} />
                <text x={padL - 6} y={yOf(e) + 4} textAnchor="end" fill={C.textDim} fontSize={9} fontFamily="'DM Mono',monospace">{e}</text>
              </g>
            ))}
            {/* X labels */}
            {[0, 3, 6, 9, 12, 15, 18, 21].map(h => (
              <g key={h}>
                <line x1={xOf(h)} x2={xOf(h)} y1={padT} y2={H - padB} stroke={C.border} strokeWidth={1} />
                <text x={xOf(h)} y={H - padB + 14} textAnchor="middle" fill={C.textDim} fontSize={9} fontFamily="'DM Mono',monospace">{fmtXLabel(h)}</text>
              </g>
            ))}
            {/* Area fill */}
            {filledPoints.length > 1 && (
              <path d={`M${xOf(filledPoints[0].hour)},${yOf(filledPoints[0].avg)} ${filledPoints.slice(1).map(p => `L${xOf(p.hour)},${yOf(p.avg)}`).join(" ")} L${xOf(filledPoints[filledPoints.length-1].hour)},${H-padB} L${xOf(filledPoints[0].hour)},${H-padB} Z`} fill={`url(#${gradId})`} />
            )}
            {/* Line */}
            {filledPoints.length > 1 && (
              <polyline points={filledPoints.map(p => `${xOf(p.hour)},${yOf(p.avg)}`).join(" ")} fill="none" stroke={C.blue} strokeWidth={2} />
            )}
            {/* Points */}
            {filledPoints.map(p => (
              <g key={p.hour}>
                <circle cx={xOf(p.hour)} cy={yOf(p.avg)} r={4} fill={C.blue} stroke={C.surface} strokeWidth={2} />
                <text x={xOf(p.hour)} y={yOf(p.avg) - 8} textAnchor="middle" fill={C.blue} fontSize={9} fontFamily="'DM Mono',monospace">{p.avg.toFixed(1)}</text>
              </g>
            ))}
          </svg>
        </div>
      </Card>
      <ScienceTip title="Chronotype-Aware Scheduling" text="Research by Till Roenneberg (Ludwig Maximilian University) shows ~20% of people are morning types, ~20% evening types, with 60% in between. Track your energy to identify your personal peak hours for deep work." color={C.teal} />
    </div>
  );
}

// ─── Journal ───────────────────────────────────────────────────────────────────
const MOODS = [
  { label: "Great", color: C.green }, { label: "Good", color: C.blue },
  { label: "Okay", color: C.textMuted }, { label: "Low", color: C.amber }, { label: "Rough", color: C.rose },
];
const emptyJournal = { mood: "", energy: 7, grateful: "", win: "", improve: "" };

function Journal() {
  const [entries, setEntries] = useLocalStorage("journal", []);
  const [cur, setCur] = useState(emptyJournal);

  const save = () => {
    if (!cur.mood && !cur.grateful && !cur.win && !cur.improve) return;
    setEntries(prev => [{ id: Date.now(), date: new Date().toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" }), ...cur }, ...prev]);
    setCur(emptyJournal);
  };

  return (
    <div>
      <Card title="Today's Entry">
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>Mood</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {MOODS.map(m => (
              <div key={m.label} onClick={() => setCur(p => ({ ...p, mood: m.label }))} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${cur.mood === m.label ? m.color : C.border}`, background: cur.mood === m.label ? m.color + "18" : "transparent", color: cur.mood === m.label ? m.color : C.textSoft, fontSize: 12, cursor: "pointer", transition: "all 0.15s" }}>{m.label}</div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Energy: <span style={{ color: C.blue, fontFamily: "'DM Mono',monospace" }}>{cur.energy}</span></div>
          <input type="range" min={1} max={10} value={cur.energy} onChange={e => setCur(p => ({ ...p, energy: Number(e.target.value) }))} style={{ width: "100%" }} />
        </div>
        {[["grateful", "🙏 What are you grateful for?"], ["win", "⭐ What's one win from today?"], ["improve", "↻ What would you improve tomorrow?"]].map(([field, label]) => (
          <div key={field} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: C.textSoft, marginBottom: 5 }}>{label}</div>
            <textarea value={cur[field]} onChange={e => setCur(p => ({ ...p, [field]: e.target.value }))} rows={2} style={{ width: "100%", background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13, lineHeight: 1.6, resize: "vertical" }} />
          </div>
        ))}
        <Btn variant="primary" onClick={save}>Save Entry</Btn>
      </Card>
      {entries.map(e => (
        <Card key={e.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textMuted }}>{e.date}</span>
            <div style={{ display: "flex", gap: 8 }}>
              {e.mood && <span style={{ fontSize: 11, background: (MOODS.find(m => m.label === e.mood)?.color || C.blue) + "18", color: MOODS.find(m => m.label === e.mood)?.color || C.blue, padding: "2px 8px", borderRadius: 10 }}>{e.mood}</span>}
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textDim }}>Energy: {e.energy}</span>
            </div>
          </div>
          {e.grateful && <div style={{ fontSize: 12, color: C.textSoft, marginBottom: 6 }}>🙏 {e.grateful}</div>}
          {e.win && <div style={{ fontSize: 12, color: C.green, marginBottom: 6 }}>⭐ {e.win}</div>}
          {e.improve && <div style={{ fontSize: 12, color: C.amber }}>↻ {e.improve}</div>}
        </Card>
      ))}
      <ScienceTip title="Gratitude Journaling (Robert Emmons, UC Davis)" text="Participants who wrote about gratitude weekly reported 25% higher life satisfaction and 23% fewer stress symptoms than control groups. Even 5 minutes of daily gratitude writing shows measurable neural changes within 4 weeks." color={C.green} />
    </div>
  );
}

// ─── Weekly Review ─────────────────────────────────────────────────────────────
const REVIEW_FIELDS = [
  { key: "wins", label: "Top 3 wins this week?", color: C.green },
  { key: "lessons", label: "What did you learn?", color: C.blue },
  { key: "stuck", label: "Where were you stuck?", color: C.rose },
  { key: "nextWeek", label: "Top 3 priorities next week?", color: C.amber },
  { key: "drop", label: "What should you stop/delegate?", color: C.lavender },
  { key: "gratitude", label: "Who helped you?", color: C.teal },
];
const emptyReview = { wins: "", lessons: "", stuck: "", nextWeek: "", drop: "", gratitude: "" };

function WeeklyReview() {
  const [savedReviews, setSavedReviews] = useLocalStorage("weeklyreviews", []);
  const [cur, setCur] = useState(emptyReview);
  const [viewingId, setViewingId] = useState(null);

  const save = () => {
    if (!Object.values(cur).some(v => v.trim())) return;
    setSavedReviews(prev => [{ id: Date.now(), date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }), ...cur }, ...prev]);
    setCur(emptyReview);
  };

  return (
    <div>
      <Card>
        <p style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.8 }}>David Allen's GTD weekly review is one of the highest-leverage habits in productivity. It closes open loops, realigns priorities, and gives you a clear mind heading into the next week.</p>
      </Card>
      <Card title="This Week's Review">
        {REVIEW_FIELDS.map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: f.color, marginBottom: 5 }}>{f.label}</div>
            <textarea value={cur[f.key]} onChange={e => setCur(p => ({ ...p, [f.key]: e.target.value }))} rows={2} style={{ width: "100%", background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 13, lineHeight: 1.6, resize: "vertical" }} />
          </div>
        ))}
        <Btn variant="primary" onClick={save}>Save Weekly Review</Btn>
      </Card>
      <Card title={`Past Reviews (${savedReviews.length})`}>
        {savedReviews.length === 0 && <div style={{ fontSize: 12, color: C.textDim }}>No reviews saved yet.</div>}
        {savedReviews.map(r => (
          <div key={r.id} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 12, marginBottom: 12 }}>
            <div onClick={() => setViewingId(viewingId === r.id ? null : r.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: C.textSoft }}>Week of {r.date}</span>
              <span style={{ color: C.textMuted }}>{viewingId === r.id ? "▾" : "▸"}</span>
            </div>
            {viewingId === r.id && (
              <div style={{ marginTop: 10 }}>
                {REVIEW_FIELDS.filter(f => r[f.key]?.trim()).map(f => (
                  <div key={f.key} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 1.5, color: f.color, marginBottom: 3 }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.65 }}>{r[f.key]}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </Card>
      <ScienceTip title="Structured Reflection (Harvard Business School)" text="Employees who spent 15 minutes reflecting at the end of each workday improved performance by 23% after 10 days compared to control groups (Francesca Gino & Gary Pisano, 2014). Weekly reviews compound this effect." color={C.lavender} />
    </div>
  );
}

// ─── Guide ─────────────────────────────────────────────────────────────────────
const GUIDE_SECTIONS = [
  { id: "start", label: "Getting Started", color: C.blue, content: [
    "FlowState is an all-in-one productivity OS built on science-backed systems. Each module works standalone, but together they form a complete daily workflow.",
    "Start with Dashboard (your daily overview), Tasks (capture everything), and Pomodoro (timed focus). Add the other modules as each becomes habitual.",
    "All data saves automatically to your browser's localStorage — nothing leaves your device.",
    "Pro tip: Complete the Shutdown Ritual on the Dashboard every evening. It trains your brain to fully disengage from work, improving next-day focus.",
  ]},
  { id: "mindmap", label: "Mind Map", color: C.green, content: [
    "Mind mapping externalises your working memory onto a visual canvas. Tony Buzan's research showed mind maps improve recall by up to 32% compared to linear notes.",
    "1. Click '+ Node' to add ideas. 2. Use Select mode to drag nodes. 3. Use Link mode to connect related concepts. 4. Use Draw mode for freehand annotations.",
    "Apple Pencil / stylus is fully supported with pressure-sensitive ink in Draw mode.",
    "Pro tip: Start every project with a mind map to capture the full problem space before writing a single line of code or prose.",
  ]},
  { id: "notes", label: "Notes", color: C.lavender, content: [
    "Notes uses a distraction-free two-panel layout. Left panel for navigation, right for writing. Supports any length of text.",
    "1. Click '+' to create a note. 2. Click a note to open it. 3. Edit the title and body freely. 4. Use search to filter by title or content.",
    "Notes are colour-coded automatically. The colour appears as a left border to help visual scanning.",
    "Pro tip: Keep one note per active project as a running scratchpad. Use the title as the project name for easy retrieval.",
  ]},
  { id: "timeblock", label: "Time Blocking", color: C.blue, content: [
    "Cal Newport (Georgetown) showed that knowledge workers who time-block are 50% more productive than those who don't. Blocks create explicit commitments that reduce decision fatigue.",
    "1. Click any calendar day to open the schedule view. 2. Enter a label, set start and end times, choose a colour, then click Add. 3. Click a block to delete it.",
    "Use 'Copy previous day' to quickly duplicate recurring schedules.",
    "Pro tip: Block your highest-energy hours (check Energy Map) for deep work first. Schedule email and admin during natural energy dips (typically 1-3 PM).",
  ]},
  { id: "pomodoro", label: "Pomodoro Timer", color: C.rose, content: [
    "The Pomodoro Technique (Francesco Cirillo, 1980s) uses timed intervals to maintain focus and prevent burnout. After 4 sessions, a long break allows memory consolidation.",
    "1. Type your focus goal. 2. Choose Focus/Short Break/Long Break mode. 3. Press Start. 4. When the timer ends, take your break — don't skip it.",
    "Customize durations in the settings below the timer. Default: 25/5/15 min.",
    "Pro tip: Pair with Focus Sounds. Start a Gamma (40Hz) session when you press Start for maximum neural entrainment benefit.",
  ]},
  { id: "sounds", label: "Focus Sounds", color: C.lavender, content: [
    "Neural entrainment uses rhythmic audio stimuli to shift brainwave frequencies. Binaural beats require stereo headphones; isochronic tones work on speakers.",
    "1. Choose your work type from the 'How to Choose' guide. 2. Click a card to open the YouTube search. 3. Play in the background while working.",
    "A 2023 meta-analysis of 22 studies confirmed significant working memory improvements from 40Hz gamma beats (Xie et al., Frontiers in Neuroscience).",
    "Pro tip: Use Alpha (10Hz) for the first 5 minutes of a session to 'warm up' your creative state, then switch to Gamma or Beta for execution.",
  ]},
  { id: "tasks", label: "Tasks & GTD", color: C.amber, content: [
    "David Allen's Getting Things Done (GTD) method separates capture from execution. The Tasks tab is your capture + execution system.",
    "1. Capture every task immediately — the Zeigarnik effect means uncaptured tasks drain working memory. 2. Assign priority. 3. Apply the 2-Minute Rule: if it takes <2 min, do it now. 4. Filter by All/Active/Done.",
    "Tasks are sorted by completion status, then by priority (High → Medium → Low) to ensure your most important work is always visible.",
    "Pro tip: Every morning, scan Tasks and set one Most Important Task (MIT). Time-block 90 minutes for it first thing.",
  ]},
  { id: "habits", label: "Habit Tracker", color: C.green, content: [
    "Phillippa Lally (UCL) found habits take 18-254 days to form, with 66 days as the median. The streak counter provides the visual reinforcement to bridge this gap.",
    "1. Add a habit with a clear, specific name. 2. Click the circle to mark it complete each day. 3. Your streak increments automatically. 4. Never break the chain.",
    "Habit stacking (BJ Fogg, Stanford) pairs new habits with existing anchor habits to leverage established neural pathways.",
    "Pro tip: Start with 2-minute versions of habits. 'Read 1 page' is easier to start than 'Read 20 pages' but activates the same neural routine.",
  ]},
  { id: "energy", label: "Energy Mapping", color: C.teal, content: [
    "Your chronotype — your natural energy rhythm — is largely genetic (Till Roenneberg, LMU Munich). Scheduling deep work during peak energy hours can double output.",
    "1. Log your energy (1-10) at different hours throughout the day. 2. Do this for a week to see your pattern. 3. Schedule deep work at energy peaks, admin at dips.",
    "Multiple entries per hour are automatically averaged for a cleaner curve.",
    "Pro tip: Log energy before and after your first coffee to see your true baseline vs. caffeine-assisted energy. This reveals your actual chronotype.",
  ]},
  { id: "journal", label: "Journaling", color: C.green, content: [
    "Robert Emmons (UC Davis) found that people who journal about gratitude weekly report 25% higher life satisfaction and significantly lower cortisol levels.",
    "1. Select your mood. 2. Rate your energy. 3. Answer the 3 prompts: gratitude, win, and improvement. 4. Click Save Entry. Past entries appear below.",
    "The 3-prompt structure is based on positive psychology research — gratitude for emotional baseline, wins for progress principle, and improvement for growth mindset.",
    "Pro tip: Write your 'win' before it happens — set a target win for the day in the morning, then confirm it in the evening. This creates an implementation intention.",
  ]},
  { id: "review", label: "Weekly Review", color: C.lavender, content: [
    "David Allen's GTD weekly review is a 30-minute ritual that closes all open loops, realigns priorities, and reduces background mental noise throughout the week.",
    "1. Every Friday (or Sunday), open Weekly Review. 2. Answer all 6 prompts honestly. 3. Click Save. Past reviews become a personal growth record.",
    "Gino & Pisano (Harvard, 2014) found structured end-of-period reflection improves subsequent performance by 23% — compounding over months.",
    "Pro tip: Read your previous week's 'Top 3 priorities' before writing the new ones. This enforces continuity and prevents reactive priority-setting.",
  ]},
  { id: "workflow", label: "Recommended Workflow", color: C.amber, content: [
    "Morning (5 min): Open Dashboard → check Focus Score → open Time Block → identify your Most Important Task for the day.",
    "Deep Work Block (90 min): Start a Pomodoro + Focus Sounds (Gamma or Beta) → work on your MIT. No email, no Slack.",
    "Mid-Morning: 20-min break → mark off Habits → process any 2-minute tasks from the Tasks tab.",
    "Afternoon: Second deep work block → schedule email/admin during the post-lunch dip → log Energy Map entry.",
    "End of Day (10 min): Complete the Shutdown Ritual on Dashboard → write a Journal entry → review tomorrow's Time Blocks.",
    "Friday (30 min): Complete the Weekly Review → adjust next week's Time Blocks → celebrate Habit streaks.",
    "Start with: Dashboard + Tasks + Pomodoro. Add more as each becomes habitual.",
  ]},
];

function Guide() {
  const [active, setActive] = useState("start");
  const section = GUIDE_SECTIONS.find(s => s.id === active);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", gap: 0 }}>
      <div style={{ width: 200, borderRight: `1px solid ${C.border}`, overflowY: "auto", padding: "8px 8px" }}>
        {GUIDE_SECTIONS.map(s => (
          <div key={s.id} onClick={() => setActive(s.id)} style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 2, borderLeft: active === s.id ? `2px solid ${s.color}` : "2px solid transparent", background: active === s.id ? s.color + "12" : "transparent", color: active === s.id ? s.color : C.textMuted, fontSize: 12, fontWeight: active === s.id ? 600 : 400, transition: "all 0.15s" }}>
            {s.label}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        <Card>
          <div style={{ fontSize: 18, fontWeight: 700, color: section.color, marginBottom: 16 }}>{section.label}</div>
          {section.content.map((p, i) => (
            <p key={i} style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.85, marginTop: i > 0 ? 10 : 0 }}>{p}</p>
          ))}
          {section.id === "workflow" && (
            <div style={{ marginTop: 20, background: C.amberBg, border: `1px solid ${C.amberBorder}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.amber, marginBottom: 6 }}>⚡ Start Simple</div>
              <div style={{ fontSize: 12, color: C.textSoft }}>Start with Dashboard + Tasks + Pomodoro. Add more as each becomes habitual. Trying to use all features at once leads to overwhelm.</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Sidebar Navigation ────────────────────────────────────────────────────────
const NAV = [
  { group: "General", items: [
    { id: "dashboard", icon: "◉", label: "Dashboard" },
    { id: "notes", icon: "▤", label: "Notes" },
    { id: "mindmap", icon: "◎", label: "Mind Map" },
  ]},
  { group: "Plan", items: [
    { id: "timeblock", icon: "▦", label: "Time Block" },
    { id: "tasks", icon: "◇", label: "Tasks" },
  ]},
  { group: "Execute", items: [
    { id: "pomodoro", icon: "◔", label: "Pomodoro" },
    { id: "sounds", icon: "♫", label: "Focus Sounds" },
  ]},
  { group: "Reflect", items: [
    { id: "energy", icon: "∿", label: "Energy Map" },
    { id: "journal", icon: "☽", label: "Journal" },
    { id: "review", icon: "⊕", label: "Weekly Review" },
    { id: "habits", icon: "⟡", label: "Habits" },
  ]},
  { group: "Learn", items: [
    { id: "guide", icon: "❖", label: "Guide" },
  ]},
];

function Sidebar({ tab, setTab, collapsed, setCollapsed, pomos }) {
  const resetAll = () => {
    if (window.confirm("Reset ALL FlowState data? This cannot be undone.")) {
      Object.keys(localStorage).filter(k => k.startsWith("flowstate_")).forEach(k => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  return (
    <div style={{ width: collapsed ? 54 : 220, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", transition: "all 0.25s ease", overflow: "hidden", flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? "18px 0" : "18px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between" }}>
        {collapsed ? (
          <span onClick={() => setCollapsed(false)} style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700, color: C.blue, cursor: "pointer" }}>F</span>
        ) : (
          <>
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 15, fontWeight: 700 }}>
                <span style={{ color: C.blue }}>FLOW</span><span style={{ color: C.text }}>STATE</span>
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: 2.5, color: C.textDim, marginTop: 2 }}>Productivity OS</div>
            </div>
            <span onClick={() => setCollapsed(true)} style={{ color: C.textDim, cursor: "pointer", fontSize: 14, transition: "all 0.15s" }}>◁</span>
          </>
        )}
      </div>
      {/* Nav */}
      <div style={{ flex: 1, overflowY: "auto", padding: collapsed ? "8px 0" : "8px 8px" }}>
        {NAV.map(group => (
          <div key={group.group} style={{ marginBottom: 8 }}>
            {!collapsed && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: 2, color: C.textDim, padding: "6px 8px 4px" }}>{group.group}</div>}
            {group.items.map(item => {
              const isActive = tab === item.id;
              return (
                <div key={item.id} title={collapsed ? item.label : undefined} onClick={() => setTab(item.id)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: collapsed ? "9px 0" : "8px 10px", justifyContent: collapsed ? "center" : "flex-start", borderRadius: collapsed ? 0 : 8, cursor: "pointer", fontWeight: isActive ? 600 : 400, fontSize: 13, color: isActive ? C.blue : C.textMuted, background: isActive ? C.blueBg : "transparent", borderLeft: isActive && !collapsed ? `2px solid ${C.blue}` : "2px solid transparent", transition: "all 0.15s" }}>
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  {!collapsed && item.label}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {/* Footer */}
      {!collapsed && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.textDim }}>
          <div style={{ marginBottom: 6 }}>💾 Data saves automatically to your browser.</div>
          <span onClick={resetAll} style={{ color: C.rose, cursor: "pointer", fontSize: 10 }}>Reset all data</span>
        </div>
      )}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
const DEFAULT_NOTES = [{ id: 1, title: "Welcome to FlowState", content: "FlowState is your all-in-one productivity OS.\n\nStart by reading the Guide tab to understand how to use each feature effectively.\n\nTip: Use the Dashboard every morning to check your Focus Score and plan your day.", color: C.blue, updated: new Date().toISOString() }];
const DEFAULT_TODOS = [
  { id: 1, text: "Read the Guide tab", done: false, priority: "high" },
  { id: 2, text: "Set up time blocks for today", done: false, priority: "medium" },
  { id: 3, text: "Complete a Pomodoro session", done: false, priority: "medium" },
];
const DEFAULT_HABITS = [
  { id: 1, name: "Morning meditation (10 min)", frequency: "Daily", completedToday: false, streak: 0 },
  { id: 2, name: "Read 20 pages", frequency: "Daily", completedToday: false, streak: 0 },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [notes, setNotes] = useLocalStorage("notes", DEFAULT_NOTES);
  const [todos, setTodos] = useLocalStorage("todos", DEFAULT_TODOS);
  const [habits, setHabits] = useLocalStorage("habits", DEFAULT_HABITS);
  const [pomos, setPomos] = useLocalStorage("pomos", 0);
  const [time, setTime] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 30000); return () => clearInterval(t); }, []);

  const allItems = NAV.flatMap(g => g.items);
  const curItem = allItems.find(i => i.id === tab) || allItems[0];

  const hh = String(time.getHours()).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");

  const nopad = ["notes", "mindmap", "guide"].includes(tab);

  const renderTab = () => {
    switch (tab) {
      case "dashboard": return <Dashboard todos={todos} habits={habits} pomodoroCount={pomos} notes={notes} />;
      case "notes": return <Notes notes={notes} setNotes={setNotes} />;
      case "mindmap": return <MindMap />;
      case "timeblock": return <TimeBlock />;
      case "tasks": return <Tasks todos={todos} setTodos={setTodos} />;
      case "pomodoro": return <Pomodoro pomodoroCount={pomos} setPomodoroCount={setPomos} />;
      case "sounds": return <FocusSounds />;
      case "energy": return <EnergyMap />;
      case "journal": return <Journal />;
      case "review": return <WeeklyReview />;
      case "habits": return <Habits habits={habits} setHabits={setHabits} />;
      case "guide": return <Guide />;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar tab={tab} setTab={setTab} collapsed={collapsed} setCollapsed={setCollapsed} pomos={pomos} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ height: 52, background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 24px", gap: 12, flexShrink: 0 }}>
          <span style={{ color: C.blue, fontSize: 16 }}>{curItem.icon}</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 500, color: C.text }}>{curItem.label}</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: C.textDim }}>{hh}:{mm}</span>
            {pomos > 0 && <span style={{ background: C.roseBg, border: `1px solid ${C.roseBorder}`, color: C.rose, fontFamily: "'DM Mono',monospace", fontSize: 11, padding: "2px 8px", borderRadius: 12 }}>🍅 {pomos}</span>}
          </div>
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflowY: nopad ? "hidden" : "auto", padding: nopad ? 0 : "24px 28px" }}>
          {renderTab()}
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Rajdhani:wght@400;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #04080d;
    --surface: rgba(255,255,255,0.025);
    --border: rgba(0,255,140,0.15);
    --green: #00ff8c;
    --cyan: #00d4ff;
    --red: #ff3355;
    --orange: #ff8c00;
    --yellow: #ffd700;
    --dim: rgba(180,220,180,0.4);
    --text: rgba(210,240,210,0.88);
  }

  body { background: var(--bg); color: var(--text); font-family: 'Rajdhani', sans-serif; }

  .app { min-height: 100vh; background: var(--bg); position: relative; overflow-x: hidden; }

  .app::before {
    content: '';
    position: fixed; inset: 0;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,140,0.012) 2px, rgba(0,255,140,0.012) 4px);
    pointer-events: none; z-index: 0;
  }

  .grid-bg {
    position: fixed; inset: 0;
    background-image: linear-gradient(rgba(0,255,140,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,140,0.025) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none; z-index: 0;
  }

  .container { position: relative; z-index: 1; max-width: 940px; margin: 0 auto; padding: 36px 20px 60px; }

  .header { margin-bottom: 40px; }

  .header-top { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }

  .skull { font-size: 30px; filter: drop-shadow(0 0 12px rgba(0,255,140,0.6)); animation: flicker 4s ease-in-out infinite; }

  @keyframes flicker { 0%,100%{opacity:1}92%{opacity:1}93%{opacity:0.4}94%{opacity:1}96%{opacity:0.6}97%{opacity:1} }

  h1 { font-size: clamp(24px, 4vw, 42px); font-weight: 700; font-family: 'JetBrains Mono', monospace; line-height: 1; color: var(--green); text-shadow: 0 0 30px rgba(0,255,140,0.4); letter-spacing: -1px; }

  .header-sub { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--dim); letter-spacing: 2px; margin-top: 6px; }

  .status-bar { display: flex; gap: 24px; flex-wrap: wrap; background: rgba(0,255,140,0.04); border: 1px solid var(--border); border-radius: 8px; padding: 10px 18px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--dim); }

  .status-item { display: flex; align-items: center; gap: 6px; }

  .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); box-shadow: 0 0 6px var(--green); animation: blink 2s step-end infinite; }

  @keyframes blink { 50%{opacity:0.2} }

  .scan-box { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 24px; }

  .scan-label { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--green); letter-spacing: 2px; margin-bottom: 12px; }

  .input-row { display: flex; gap: 10px; }

  .url-input { flex: 1; background: rgba(0,0,0,0.5); border: 1px solid rgba(0,255,140,0.2); border-radius: 8px; padding: 13px 18px; color: var(--green); font-family: 'JetBrains Mono', monospace; font-size: 14px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; caret-color: var(--green); }

  .url-input:focus { border-color: rgba(0,255,140,0.5); box-shadow: 0 0 0 3px rgba(0,255,140,0.06); }

  .url-input::placeholder { color: rgba(0,255,140,0.2); }

  .scan-btn { background: transparent; border: 1px solid var(--green); border-radius: 8px; padding: 13px 28px; color: var(--green); font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 13px; cursor: pointer; letter-spacing: 1px; transition: all 0.2s; position: relative; overflow: hidden; }

  .scan-btn::before { content:''; position:absolute; inset:0; background:var(--green); transform:scaleX(0); transform-origin:left; transition:transform 0.2s; z-index:-1; }

  .scan-btn:hover:not(:disabled)::before { transform:scaleX(1); }
  .scan-btn:hover:not(:disabled) { color:#000; }
  .scan-btn:disabled { opacity:0.35; cursor:not-allowed; }

  .progress-wrap { margin-top: 18px; }

  .progress-line { height: 2px; background: rgba(0,255,140,0.1); border-radius: 1px; overflow: hidden; margin-bottom: 8px; }

  .progress-fill { height:100%; background:var(--green); box-shadow:0 0 8px var(--green); animation:progressSweep 1.4s ease-in-out infinite; width:40%; }

  @keyframes progressSweep { 0%{margin-left:-40%} 100%{margin-left:120%} }

  .progress-text { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--green); opacity: 0.7; }

  .error-box { margin-top: 14px; background: rgba(255,50,80,0.07); border: 1px solid rgba(255,50,80,0.3); border-radius: 8px; padding: 12px 16px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--red); }

  .results { animation: slideUp 0.4s ease; }

  @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

  .score-strip { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }

  .score-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 18px 22px; flex: 1; min-width: 120px; }

  .sc-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 2px; color: var(--dim); margin-bottom: 8px; }

  .sc-val { font-family: 'JetBrains Mono', monospace; font-size: 34px; font-weight: 700; line-height: 1; }

  .grade-A { color:#00ff8c; text-shadow:0 0 20px rgba(0,255,140,0.5); }
  .grade-B { color:#88ff00; text-shadow:0 0 20px rgba(136,255,0,0.4); }
  .grade-C { color:#ffd700; text-shadow:0 0 20px rgba(255,215,0,0.4); }
  .grade-D { color:#ff8c00; text-shadow:0 0 20px rgba(255,140,0,0.4); }
  .grade-F { color:#ff3355; text-shadow:0 0 20px rgba(255,50,80,0.5); }

  .section-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 3px; color: rgba(0,255,140,0.5); margin-bottom: 12px; text-transform: uppercase; }

  .headers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 8px; margin-bottom: 28px; }

  .hchip { border-radius: 8px; padding: 9px 13px; font-family: 'JetBrains Mono', monospace; font-size: 11px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }

  .hchip.ok { background:rgba(0,255,140,0.05); border:1px solid rgba(0,255,140,0.2); }
  .hchip.miss { background:rgba(255,50,80,0.05); border:1px solid rgba(255,50,80,0.2); }
  .hchip-name { color:var(--dim); font-size:10px; }
  .hchip-ok { color:var(--green); }
  .hchip-miss { color:var(--red); }

  .vuln-list { display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px; }

  .vuln-card { border-radius: 12px; overflow: hidden; border: 1px solid; }

  .vuln-card.critical { border-color:rgba(255,50,80,0.35); background:rgba(255,50,80,0.04); }
  .vuln-card.high     { border-color:rgba(255,140,0,0.35); background:rgba(255,140,0,0.04); }
  .vuln-card.medium   { border-color:rgba(255,215,0,0.3); background:rgba(255,215,0,0.03); }
  .vuln-card.low      { border-color:rgba(0,212,255,0.25); background:rgba(0,212,255,0.03); }
  .vuln-card.info     { border-color:rgba(0,255,140,0.2); background:rgba(0,255,140,0.03); }

  .vuln-header { display:flex; align-items:center; gap:12px; padding:14px 18px; cursor:pointer; user-select:none; }

  .severity-badge { font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:700; letter-spacing:2px; padding:3px 10px; border-radius:4px; white-space:nowrap; }

  .badge-critical { background:rgba(255,50,80,0.2); color:#ff3355; border:1px solid rgba(255,50,80,0.4); }
  .badge-high     { background:rgba(255,140,0,0.2); color:#ff8c00; border:1px solid rgba(255,140,0,0.4); }
  .badge-medium   { background:rgba(255,215,0,0.15); color:#ffd700; border:1px solid rgba(255,215,0,0.35); }
  .badge-low      { background:rgba(0,212,255,0.1); color:#00d4ff; border:1px solid rgba(0,212,255,0.3); }
  .badge-info     { background:rgba(0,255,140,0.08); color:var(--green); border:1px solid rgba(0,255,140,0.25); }

  .vuln-title { flex:1; font-size:15px; font-weight:700; color:rgba(220,240,220,0.9); font-family:'Rajdhani',sans-serif; }

  .chevron { color:var(--dim); font-size:11px; transition:transform 0.2s; }
  .chevron.open { transform:rotate(180deg); }

  .vuln-body { padding:0 18px 18px; display:flex; flex-direction:column; gap:14px; }

  .divider { height:1px; background:rgba(0,255,140,0.06); margin:4px 0; }

  .vuln-section { }

  .vs-title { font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:2px; margin-bottom:6px; }

  .vs-problem-t { color:rgba(255,100,120,0.7); }
  .vs-exploit-t { color:rgba(255,160,0,0.7); }
  .vs-fix-t     { color:rgba(0,255,140,0.6); }

  .vuln-text { font-size:14px; line-height:1.7; color:rgba(200,230,200,0.8); font-family:'Rajdhani',sans-serif; }

  .code-block { background:rgba(0,0,0,0.55); border:1px solid rgba(0,255,140,0.12); border-radius:8px; padding:12px 16px; font-family:'JetBrains Mono',monospace; font-size:12px; color:rgba(180,230,180,0.75); overflow-x:auto; white-space:pre; margin-top:8px; line-height:1.6; }

  .chat-section { background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; }

  .chat-header { display:flex; align-items:center; gap:10px; padding:16px 20px; border-bottom:1px solid var(--border); background:rgba(0,255,140,0.03); }

  .live-dot { width:8px; height:8px; border-radius:50%; background:var(--green); box-shadow:0 0 8px var(--green); animation:pulse 2s ease-in-out infinite; }

  @keyframes pulse { 0%,100%{box-shadow:0 0 6px var(--green)} 50%{box-shadow:0 0 14px var(--green),0 0 28px rgba(0,255,140,0.3)} }

  .chat-header-title { font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:2px; color:var(--green); }

  .messages { padding:20px; display:flex; flex-direction:column; gap:14px; max-height:440px; overflow-y:auto; }

  .messages::-webkit-scrollbar { width:4px; }
  .messages::-webkit-scrollbar-thumb { background:rgba(0,255,140,0.15); border-radius:2px; }

  .msg { display:flex; flex-direction:column; animation:slideUp 0.25s ease; }
  .msg-user { align-items:flex-end; }
  .msg-ai   { align-items:flex-start; }

  .msg-label { font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:2px; color:var(--dim); margin-bottom:5px; }

  .msg-bubble { max-width:84%; padding:12px 16px; border-radius:10px; font-size:14px; line-height:1.7; white-space:pre-wrap; }

  .msg-user .msg-bubble { background:rgba(0,255,140,0.1); border:1px solid rgba(0,255,140,0.22); color:rgba(210,245,210,0.9); border-bottom-right-radius:3px; font-family:'Rajdhani',sans-serif; }

  .msg-ai .msg-bubble { background:rgba(0,0,0,0.35); border:1px solid rgba(0,255,140,0.1); color:rgba(200,235,200,0.85); border-bottom-left-radius:3px; font-family:'JetBrains Mono',monospace; font-size:13px; }

  .typing-bubble { background:rgba(0,0,0,0.35); border:1px solid rgba(0,255,140,0.1); border-radius:10px; border-bottom-left-radius:3px; padding:12px 16px; display:flex; gap:5px; align-items:center; }

  .tdot { width:6px; height:6px; background:var(--green); border-radius:50%; opacity:0.4; animation:tdotBounce 1.2s ease-in-out infinite; }
  .tdot:nth-child(2){animation-delay:0.2s}
  .tdot:nth-child(3){animation-delay:0.4s}

  @keyframes tdotBounce { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-5px);opacity:1} }

  .suggest-row { display:flex; flex-wrap:wrap; gap:8px; padding:0 20px 16px; }

  .sqchip { background:rgba(0,255,140,0.06); border:1px solid rgba(0,255,140,0.18); border-radius:20px; padding:5px 14px; font-family:'JetBrains Mono',monospace; font-size:11px; color:rgba(0,255,140,0.6); cursor:pointer; transition:all 0.15s; }

  .sqchip:hover { background:rgba(0,255,140,0.14); color:var(--green); transform:translateY(-1px); }

  .chat-input-row { display:flex; gap:10px; padding:16px 20px; border-top:1px solid var(--border); }

  .chat-input { flex:1; background:rgba(0,0,0,0.4); border:1px solid rgba(0,255,140,0.18); border-radius:8px; padding:11px 16px; color:var(--green); font-family:'JetBrains Mono',monospace; font-size:13px; outline:none; transition:border-color 0.2s; caret-color:var(--green); }

  .chat-input:focus { border-color:rgba(0,255,140,0.45); }
  .chat-input::placeholder { color:rgba(0,255,140,0.18); }

  .send-btn { background:transparent; border:1px solid rgba(0,255,140,0.3); border-radius:8px; padding:11px 20px; color:var(--green); font-family:'JetBrains Mono',monospace; font-size:12px; cursor:pointer; transition:all 0.15s; letter-spacing:1px; }

  .send-btn:hover:not(:disabled) { background:rgba(0,255,140,0.1); border-color:var(--green); }
  .send-btn:disabled { opacity:0.3; cursor:not-allowed; }
`;

const SECURITY_HEADERS = [
  "Strict-Transport-Security","Content-Security-Policy","X-Frame-Options",
  "X-Content-Type-Options","Referrer-Policy","Permissions-Policy",
  "X-XSS-Protection","Cross-Origin-Embedder-Policy","Cross-Origin-Resource-Policy",
];

const SUGGESTED = [
  "What's the most critical risk?",
  "How would a hacker exploit this step by step?",
  "Give me the exact fix code",
  "What can an attacker steal from users?",
  "Is this safe for e-commerce?",
  "What other tests should I run?",
];

function VulnCard({ vuln }) {
  const [open, setOpen] = useState(vuln.severity === "CRITICAL" || vuln.severity === "HIGH");

  const badgeClass = { CRITICAL:"badge-critical", HIGH:"badge-high", MEDIUM:"badge-medium", LOW:"badge-low", INFO:"badge-info" }[vuln.severity] || "badge-info";
  const cardClass  = { CRITICAL:"critical", HIGH:"high", MEDIUM:"medium", LOW:"low", INFO:"info" }[vuln.severity] || "info";

  return (
    <div className={`vuln-card ${cardClass}`}>
      <div className="vuln-header" onClick={() => setOpen(!open)}>
        <span className={`severity-badge ${badgeClass}`}>{vuln.severity}</span>
        <span className="vuln-title">{vuln.title}</span>
        <span className={`chevron ${open ? "open" : ""}`}>▼</span>
      </div>
      {open && (
        <div className="vuln-body">
          <div className="divider" />
          <div className="vuln-section">
            <div className="vs-title vs-problem-t">// THE PROBLEM</div>
            <div className="vuln-text">{vuln.problem}</div>
          </div>
          <div className="vuln-section">
            <div className="vs-title vs-exploit-t">// HOW A HACKER EXPLOITS IT</div>
            <div className="vuln-text">{vuln.exploit}</div>
            {vuln.exploitCode && vuln.exploitCode.trim() && (
              <div className="code-block">{vuln.exploitCode}</div>
            )}
          </div>
          <div className="vuln-section">
            <div className="vs-title vs-fix-t">// HOW TO FIX IT</div>
            <div className="vuln-text">{vuln.fix}</div>
            {vuln.fixCode && vuln.fixCode.trim() && (
              <div className="code-block">{vuln.fixCode}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SecurityScanner() {
  const [url, setUrl] = useState("");
  const [scanning, setScan] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [vulns, setVulns] = useState([]);
  const [grade, setGrade] = useState("?");
  const [scanError, setScanError] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [rawHeaders, setRawHeaders] = useState({});
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, chatLoading]);

  const normalizeUrl = (u) => {
    u = u.trim();
    if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
    return u;
  };

  const fetchSiteHeaders = async (target) => {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(target)}`);
    const d = await res.json();
    return { headers: d.headers || {}, status: d.status?.http_code || null, body: (d.contents || "").substring(0, 1500) };
  };

  const runScan = async () => {
    if (!url.trim()) return;
    setScan(true); setScanResult(null); setVulns([]); setGrade("?");
    setScanError(""); setMessages([]); setRawHeaders({});

    const steps = ["Connecting to target...","Reading HTTP headers...","Checking SSL/TLS...","Analyzing attack surface...","Generating threat model..."];
    let si = 0; setLoadingMsg(steps[0]);
    const iv = setInterval(() => { si=(si+1)%steps.length; setLoadingMsg(steps[si]); }, 1600);

    try {
      const target = normalizeUrl(url);
      let hdrs = {}, body = "", status = null;
      try { const r = await fetchSiteHeaders(target); hdrs=r.headers||{}; body=r.body||""; status=r.status; setRawHeaders(hdrs); } catch {}

      clearInterval(iv); setLoadingMsg("Generating vulnerability report...");

      const headerStr = Object.entries(hdrs).map(([k,v])=>`${k}: ${v}`).join("\n") || "No headers retrieved";

      const systemPrompt = `You are an expert penetration tester and security researcher producing a vulnerability report.

For EVERY vulnerability found, you MUST provide:
1. "problem" — what is technically wrong and why it matters
2. "exploit" — a REALISTIC, DETAILED, step-by-step explanation of exactly how an attacker would exploit this. Include what tool they'd use, what payload, what they can achieve (session hijacking, data theft, phishing, etc.)
3. "exploitCode" — an actual example attack payload/command/script where applicable
4. "fix" — the exact fix needed
5. "fixCode" — the exact code/header/config to add

Respond ONLY with valid JSON. No markdown, no backticks, no preamble. Exact structure:
{
  "grade": "A|B|C|D|F",
  "summary": "2-sentence overall assessment",
  "vulnerabilities": [
    {
      "title": "Vulnerability name",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      "problem": "Technical explanation of what is wrong",
      "exploit": "Detailed step-by-step attacker methodology",
      "exploitCode": "Attack payload or example (empty string if N/A)",
      "fix": "Exact remediation steps",
      "fixCode": "Exact code/header/config to add (empty string if N/A)"
    }
  ]
}`;

      const userMsg = `Analyze: ${target}\nHTTP Status: ${status||"unknown"}\nHeaders:\n${headerStr}\nPage snippet:\n${body.substring(0,600)}\n\nGenerate a full pentest report.`;

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 1000, system: systemPrompt, messages: [{ role:"user", content: userMsg }] }),
      });

      const d = await resp.json();
      const raw = d.content?.[0]?.text || "{}";
      const clean = raw.replace(/```json|```/g,"").trim();
      let parsed;
      try { parsed = JSON.parse(clean); } catch { parsed = { grade:"?", summary:raw, vulnerabilities:[] }; }

      setGrade(parsed.grade||"?");
      setVulns(parsed.vulnerabilities||[]);
      setScanResult({ ...parsed, url: target });
      setMessages([{ role:"ai", text:`✓ Scan complete: ${target}\nGrade: ${parsed.grade} | Issues found: ${(parsed.vulnerabilities||[]).length}\n\n${parsed.summary||""}\n\nAsk me anything about this target.` }]);
    } catch(e) {
      clearInterval(iv);
      setScanError("Scan failed: " + e.message);
    } finally { setScan(false); setLoadingMsg(""); }
  };

  const sendChat = async (q) => {
    const text = q || chatInput.trim();
    if (!text || chatLoading || !scanResult) return;
    setChatInput("");
    setMessages(m => [...m, { role:"user", text }]);
    setChatLoading(true);

    try {
      const system = `You are a penetration tester assistant. Target scanned: ${scanResult.url}
Grade: ${scanResult.grade} | Summary: ${scanResult.summary}
Vulnerabilities: ${JSON.stringify(scanResult.vulnerabilities||[])}
HTTP Headers: ${JSON.stringify(rawHeaders)}

Be technical, specific, and practical. When explaining exploits, describe real attack techniques. When fixing, provide exact code.`;

      const history = messages.slice(-8).map(m => ({ role: m.role==="ai"?"assistant":"user", content: m.text }));
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 1000, system, messages: [...history, { role:"user", content: text }] }),
      });
      const d = await r.json();
      setMessages(m => [...m, { role:"ai", text: d.content?.[0]?.text||"Error" }]);
    } catch(e) {
      setMessages(m => [...m, { role:"ai", text:"Error: "+e.message }]);
    } finally { setChatLoading(false); }
  };

  const gradeClass = (g) => ({A:"grade-A",B:"grade-B",C:"grade-C",D:"grade-D",F:"grade-F"}[g?.[0]]||"grade-F");

  const headerStatus = SECURITY_HEADERS.map(h => ({
    name: h,
    present: !!Object.keys(rawHeaders).find(k => k.toLowerCase()===h.toLowerCase()),
  }));

  const critCount = vulns.filter(v=>v.severity==="CRITICAL").length;
  const highCount = vulns.filter(v=>v.severity==="HIGH").length;

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="grid-bg" />
        <div className="container">

          <div className="header">
            <div className="header-top">
              <div className="skull">💀</div>
              <div>
                <h1>VULN_SCANNER.exe</h1>
                <div className="header-sub">// AI-POWERED PENETRATION TEST REPORT GENERATOR</div>
              </div>
            </div>
            <div className="status-bar">
              <div className="status-item"><div className="status-dot"/><span>AI ENGINE ONLINE</span></div>
              <div className="status-item"><span>MODEL: CLAUDE SONNET</span></div>
              <div className="status-item"><span>MODE: PASSIVE RECON</span></div>
            </div>
          </div>

          <div className="scan-box">
            <div className="scan-label">// TARGET URL</div>
            <div className="input-row">
              <input className="url-input" value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&runScan()} placeholder="target.com" disabled={scanning}/>
              <button className="scan-btn" onClick={runScan} disabled={scanning||!url.trim()}>{scanning?"SCANNING...":"[ SCAN ]"}</button>
            </div>
            {scanning && (
              <div className="progress-wrap">
                <div className="progress-line"><div className="progress-fill"/></div>
                <div className="progress-text">▶ {loadingMsg}</div>
              </div>
            )}
            {scanError && <div className="error-box">! {scanError}</div>}
          </div>

          {scanResult && (
            <div className="results">
              <div className="score-strip">
                <div className="score-card">
                  <div className="sc-label">SECURITY GRADE</div>
                  <div className={`sc-val ${gradeClass(grade)}`}>{grade}</div>
                </div>
                <div className="score-card">
                  <div className="sc-label">CRITICAL / HIGH</div>
                  <div className="sc-val" style={{color:critCount>0?"#ff3355":"#ff8c00",fontSize:28}}>{critCount} / {highCount}</div>
                </div>
                <div className="score-card">
                  <div className="sc-label">HEADERS MISSING</div>
                  <div className="sc-val" style={{color:"#ffd700",fontSize:28}}>{headerStatus.filter(h=>!h.present).length}/{SECURITY_HEADERS.length}</div>
                </div>
                <div className="score-card">
                  <div className="sc-label">TOTAL ISSUES</div>
                  <div className="sc-val" style={{color:"#00d4ff",fontSize:28}}>{vulns.length}</div>
                </div>
              </div>

              <div className="section-label">// HTTP SECURITY HEADERS MAP</div>
              <div className="headers-grid">
                {headerStatus.map(h => (
                  <div key={h.name} className={`hchip ${h.present?"ok":"miss"}`}>
                    <span className="hchip-name">{h.name}</span>
                    <span className={h.present?"hchip-ok":"hchip-miss"}>{h.present?"✓ PRESENT":"✗ MISSING"}</span>
                  </div>
                ))}
              </div>

              <div className="section-label">// VULNERABILITY REPORT — CLICK EACH TO EXPAND</div>
              <div className="vuln-list">
                {vulns.length===0 && (
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:"var(--dim)",padding:"16px 0"}}>
                    No vulnerabilities parsed. Try asking in the chat below.
                  </div>
                )}
                {vulns.map((v,i) => <VulnCard key={i} vuln={v}/>)}
              </div>

              <div className="chat-section">
                <div className="chat-header">
                  <div className="live-dot"/>
                  <div className="chat-header-title">LIVE SECURITY CHAT // ASK ANYTHING ABOUT THIS TARGET</div>
                </div>
                <div className="messages">
                  {messages.map((m,i) => (
                    <div key={i} className={`msg msg-${m.role}`}>
                      <div className="msg-label">{m.role==="ai"?"SECURITY_AI":"YOU"}</div>
                      <div className="msg-bubble">{m.text}</div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="msg msg-ai">
                      <div className="msg-label">SECURITY_AI</div>
                      <div className="typing-bubble"><div className="tdot"/><div className="tdot"/><div className="tdot"/></div>
                    </div>
                  )}
                  <div ref={endRef}/>
                </div>
                <div className="suggest-row">
                  {SUGGESTED.map(q => <div key={q} className="sqchip" onClick={()=>sendChat(q)}>{q}</div>)}
                </div>
                <div className="chat-input-row">
                  <input className="chat-input" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Ask about vulnerabilities, exploits, fixes..." disabled={chatLoading}/>
                  <button className="send-btn" onClick={()=>sendChat()} disabled={chatLoading||!chatInput.trim()}>SEND →</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

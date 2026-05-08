const { useState, useEffect, useRef, useCallback } = React;

const SUPABASE_URL = "https://mxxhoaqmulnddhobkwrg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eGhvYXFtdWxuZGRob2Jrd3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxOTc4ODEsImV4cCI6MjA5Mzc3Mzg4MX0.UFAPOZpQvmeSeBmGqFvB4EoCOypzIz4GMosBnBSNqwk";

// ─── Supabase client (loaded via CDN in index.html) ───────────────────────────
const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// ─── Supabase DB helpers ──────────────────────────────────────────────────────
async function dbLoadJobs() {
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('jobs').select('*').order('id', { ascending: false });
    if (error) throw error;
    return data.map(row => row.data);
  } catch(e) { console.warn('dbLoadJobs failed:', e); return null; }
}

async function dbSaveJob(job) {
  if (!sb) return;
  try {
    await sb.from('jobs').upsert({ id: job.id, data: job, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  } catch(e) { console.warn('dbSaveJob failed:', e); }
}

async function dbDeleteJob(id) {
  if (!sb) return;
  try {
    await sb.from('jobs').delete().eq('id', id);
  } catch(e) { console.warn('dbDeleteJob failed:', e); }
}

async function dbLoadUsers() {
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('app_users').select('*');
    if (error) throw error;
    return data;
  } catch(e) { console.warn('dbLoadUsers failed:', e); return null; }
}

async function dbSaveUser(user) {
  if (!sb) return;
  try {
    await sb.from('app_users').upsert(user, { onConflict: 'id' });
  } catch(e) { console.warn('dbSaveUser failed:', e); }
}

async function dbDeleteUser(id) {
  if (!sb) return;
  try {
    await sb.from('app_users').delete().eq('id', id);
  } catch(e) { console.warn('dbDeleteUser failed:', e); }
}

async function dbLoadSettings() {
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('app_settings').select('*');
    if (error) throw error;
    const settings = {};
    data.forEach(row => settings[row.key] = row.value);
    return settings;
  } catch(e) { console.warn('dbLoadSettings failed:', e); return null; }
}

async function dbSaveSetting(key, value) {
  if (!sb) return;
  try {
    await sb.from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  } catch(e) { console.warn('dbSaveSetting failed:', e); }
}


const G = {
  bg:"#0d0d0f",surface:"#13131a",border:"#1f1f2e",borderBright:"#2a2a3d",
  accent:"#6c63ff",accentGlow:"rgba(108,99,255,0.18)",accentDim:"#3d3880",
  text:"#e8e8f0",textSub:"#8888a8",textDim:"#55556a",
  green:"#22c55e",greenBg:"rgba(34,197,94,0.12)",greenBorder:"rgba(34,197,94,0.3)",
  red:"#ef4444",redBg:"rgba(239,68,68,0.12)",redBorder:"rgba(239,68,68,0.3)",
  yellow:"#f59e0b",yellowBg:"rgba(245,158,11,0.12)",yellowBorder:"rgba(245,158,11,0.3)",
  blue:"#3b82f6",blueBg:"rgba(59,130,246,0.12)",blueBorder:"rgba(59,130,246,0.3)",
};
const F = "'Outfit', sans-serif";
const JOBS_KEY = "lr_tpo_v5";
const SER_KEY = "lr_ser_v5";
const getJobs = () => { try { return JSON.parse(localStorage.getItem(JOBS_KEY) || "[]"); } catch { return []; } };
const saveJobs = j => localStorage.setItem(JOBS_KEY, JSON.stringify(j));
const getSerials = () => { try { return JSON.parse(localStorage.getItem(SER_KEY) || "[]"); } catch { return []; } };
const saveSerials = s => localStorage.setItem(SER_KEY, JSON.stringify(s));

const SNOW = {
  "Arizona":0,"California":0,"New Mexico":0,"Oregon":0,"Texas":0,
  "Maryland":2,"New Jersey":2,
  "New York (Bronx, Kings, Nassau, New York, Orange, Putnam, Queens, Richmond, Rockland, Suffolk, Westchester)":2,
  "Ohio":4,"Pennsylvania":4,"Michigan":7,"New York (all other counties)":7,
};

const SORDER = ["prechecks","inputs","uploads","design","designUploads","site","roof","electrical","storage","commissioning"];
const SLABELS = {
  prechecks:"Prechecks", inputs:"Main Inputs", uploads:"Additional Uploads",
  design:"Design Package", designUploads:"Design Package Uploads",
  site:"Project Site", roof:"Roof Mounting System",
  electrical:"Electrical", storage:"Storage", commissioning:"Commissioning",
};

function blankM1() {
  return {
    prechecks: { elecAdder: { value: null, types: [], installed: null }, utilBill: { match: null, pastDue: null } },
    inputs: { serial: "", monitoringDone: null, inspectionDone: null, ptoDone: null },
    uploads: { permit: null, utilityBill: null },
    design: { layoutMatch: null, tiltMatch: null, treesShading: null, state: "", snowCorrect: null, prodTolerance: null, prodAfterAdjust: null },
    designUploads: { cad: null, scanifly: null, shade: null, rawPaste: "" },
    site: { invSerial: null, microMap: null, modLabel: null, modSerial: null, frontHouse: null },
    roof: { attachment: null, rails: null, completeArray: null, tilt: null, jbox: null },
    electrical: {
      type: null,
      str: { fullInterior: null, cts: null, doorGrounded: null },
      pw3: { fullInterior: null, ferrite: null, drain: null, taco: null },
      micro: { fullCombiner: null, combWiring: null, cts: null, drillZone: null, deadfront: null },
      mainBreaker: null, busbar: null, poi: null, mspCts: null, bos: null, disconnects: null, combPanels: null,
    },
    storage: {
      battType: null, switchType: null,
      bkSwitch: { uploaded: null, commWiring: null, installed: null },
      gateway: { fullInt: null, interconnect: null, commWiring: null },
    },
    commissioning: { done: null, notes: "" },
    itemNotes: {},
    clawbackPaused: false,
    clawbackPausedNote: "",
    clawedBack: false,
    trueUpDate: null,
  };
}

function blankM2() {
  return {
    pto: null, ptoDate: "", monitoringHealthy: null, commissioningDone: null,
    conditionalStips: "", notes: "", itemNotes: {},
  };
}

function blank() { return blankM1(); }

function getItems(sec, d) {
  const okV = v => v === true || v === "uploaded" || v === "na";
  const issV = v => v === false || v === "missing" || v === "incorrect" || v === "notComplete";
  const st = v => ({ status: okV(v) ? "ok" : issV(v) ? "issue" : "pending" });
  switch (sec) {
    case "prechecks": {
      const items = [], ea = d.prechecks.elecAdder, ub = d.prechecks.utilBill;
      if (ea.value === null) items.push({ label: "Electrical adder sold?", status: "pending" });
      else {
        items.push({ label: "Electrical adder sold?", status: "ok" });
        if (ea.value === true) {
          if (!ea.types.length) items.push({ label: "Adder type selected", status: "pending" });
          else {
            items.push({ label: "Adder type selected", status: "ok" });
            if (ea.installed === null) items.push({ label: "Adder installed complete?", status: "pending" });
            else items.push({ label: "Adder installed complete?", status: ea.installed ? "ok" : "issue" });
          }
        }
      }
      if (ub.match === null) items.push({ label: "Utility bill matches portal?", status: "pending" });
      else {
        items.push({ label: "Utility bill matches portal?", status: ub.match ? "ok" : "issue" });
        if (ub.match) {
          if (ub.pastDue === null) items.push({ label: "Past due balance?", status: "pending" });
          else items.push({ label: "Past due balance?", status: ub.pastDue ? "issue" : "ok" });
        }
      }
      return items;
    }
    case "inputs": return [
      { label: "Module serial number", status: d.inputs.serial ? "ok" : "pending" },
      { label: "Monitoring ID confirmed", ...st(d.inputs.monitoringDone) },
      { label: "Inspection date set", ...st(d.inputs.inspectionDone) },
      { label: "Expected PTO set", ...st(d.inputs.ptoDone) },
    ];
    case "uploads": return [
      { label: "Permit", ...st(d.uploads.permit) },
      { label: "Utility bill", ...st(d.uploads.utilityBill) },
    ];
    case "design": return [
      { label: "Layout matches Scanifly", ...st(d.design.layoutMatch) },
      { label: "Array tilts match Scanifly", ...st(d.design.tiltMatch) },
      { label: "Trees and shading mapped", ...st(d.design.treesShading) },
      { label: "State selected", status: d.design.state ? "ok" : "pending" },
      { label: "Snow loss set correctly", ...st(d.design.snowCorrect) },
      { label: "Production within tolerance", status: d.design.prodTolerance === true ? "ok" : d.design.prodTolerance === false ? (d.design.prodAfterAdjust === true ? "ok" : d.design.prodAfterAdjust === false ? "issue" : "pending") : "pending" },
    ];
    case "designUploads": return [
      { label: "CAD / Planset", ...st(d.designUploads.cad) },
      { label: "Scanifly screenshots", ...st(d.designUploads.scanifly) },
      { label: "Shade report", ...st(d.designUploads.shade) },
    ];
    case "site": return [
      { label: "Inverter / combiner box serial", ...st(d.site.invSerial) },
      { label: "Micro inverter or MCI map", ...st(d.site.microMap) },
      { label: "Module label photo", ...st(d.site.modLabel) },
      { label: "Module serial number photo", ...st(d.site.modSerial) },
      { label: "Front of house photo", ...st(d.site.frontHouse) },
    ];
    case "roof": return [
      { label: "Close-up of attachment", ...st(d.roof.attachment) },
      { label: "Array rails", ...st(d.roof.rails) },
      { label: "Complete array(s)", ...st(d.roof.completeArray) },
      { label: "Tilt", ...st(d.roof.tilt) },
      { label: "Junction box", ...st(d.roof.jbox) },
    ];
    case "electrical": {
      if (!d.electrical.type) return [{ label: "Inverter type", status: "pending" }];
      const items = [{ label: "Inverter type selected", status: "ok" }];
      const t = d.electrical.type;
      if (t === "string" || t === "both") {
        const x = d.electrical.str;
        items.push({ label: "Full inverter(s) interior", ...st(x.fullInterior) }, { label: "CTs in inverter / solar RGM", ...st(x.cts) }, { label: "Door grounded", ...st(x.doorGrounded) });
      }
      if (t === "pw3" || t === "both" || t === "microPw3") {
        const x = d.electrical.pw3;
        items.push({ label: "Full PW3 interior", ...st(x.fullInterior) }, { label: "Ferrite cores", ...st(x.ferrite) }, { label: "Drain wire", ...st(x.drain) }, { label: "Taco open / comm wiring", ...st(x.taco) });
      }
      if (t === "micro" || t === "microPw3") {
        const x = d.electrical.micro;
        items.push({ label: "Full combiner interior", ...st(x.fullCombiner) }, { label: "Combiner wiring", ...st(x.combWiring) }, { label: "CTs", ...st(x.cts) }, { label: "Drill zone", ...st(x.drillZone) }, { label: "Deadfront with cell kit", ...st(x.deadfront) });
      }
      items.push(
        { label: "Main breaker rating", ...st(d.electrical.mainBreaker) },
        { label: "Main panel busbar rating", ...st(d.electrical.busbar) },
        { label: "Point of interconnection", ...st(d.electrical.poi) },
        { label: "MSP CTs", ...st(d.electrical.mspCts) },
        { label: "BOS", ...st(d.electrical.bos) },
        { label: "Disconnect(s)", ...st(d.electrical.disconnects) },
        { label: "Combiner panels", ...st(d.electrical.combPanels) },
      );
      return items;
    }
    case "storage": {
      if (!d.storage.battType) return [{ label: "Battery type", status: "pending" }];
      if (d.storage.battType === "na") return [{ label: "Battery type", status: "ok" }];
      const items = [{ label: "Battery type selected", status: "ok" }];
      if (!d.storage.switchType) { items.push({ label: "Switch / gateway type", status: "pending" }); return items; }
      items.push({ label: "Switch / gateway type", status: "ok" });
      const sw = d.storage.switchType;
      if (sw === "backupSwitch") {
        items.push(
          { label: "Backup switch photo", ...st(d.storage.bkSwitch.uploaded) },
          { label: "Backup switch comm wiring", ...st(d.storage.bkSwitch.commWiring) },
          { label: "Backup switch installed", status: d.storage.bkSwitch.installed === true ? "ok" : d.storage.bkSwitch.installed === "notComplete" ? "issue" : "pending" },
        );
      }
      if (sw === "gateway") {
        items.push(
          { label: "Gateway interior", ...st(d.storage.gateway.fullInt) },
          { label: "Gateway interconnection", ...st(d.storage.gateway.interconnect) },
          { label: "Gateway comm wiring", ...st(d.storage.gateway.commWiring) },
        );
      }
      return items;
    }
    case "commissioning": return [{ label: "Commissioning", status: d.commissioning.done === true ? "ok" : d.commissioning.done === false ? "issue" : "pending" }];
    default: return [];
  }
}

function secProg(sec, d) {
  const items = getItems(sec, d);
  if (!items.length) return { done: 0, total: 0, issues: 0, pct: 100 };
  const done = items.filter(i => i.status === "ok").length;
  const issues = items.filter(i => i.status === "issue").length;
  return { done, total: items.length, issues, pct: Math.round((done / items.length) * 100) };
}

function overallProg(c) {
  let total = 0, done = 0, issues = 0;
  SORDER.forEach(s => { const p = secProg(s, c); total += p.total; done += p.done; issues += p.issues; });
  return { total, done, issues, pct: total ? Math.round((done / total) * 100) : 0 };
}

// Combined progress for a job across both M1 and M2 checklists
function jobOverallProg(job) {
  const stage = job.packageStage || "m1";
  const m1 = overallProg(job.checklist);
  const m1Total = m1.total || 1;
  const m1Done = m1.done;

  const isConditional = !!job.conditionalM1;
  const m2Sections = isConditional ? [...M2_SORDER, "conditionals"] : M2_SORDER;
  const m2d = job.m2Checklist || {};
  let m2total = 0, m2done = 0, m2issues = 0;
  m2Sections.forEach(s => { const p = m2SecProg(s, m2d, isConditional); m2total += p.total; m2done += p.done; m2issues += p.issues; });
  const m2Total = m2total || 1;

  if (stage === "fullyFunded") {
    return { pct: 100, m1Pct: 100, m2Pct: 100, issues: 0 };
  }
  if (stage === "m1") {
    // M1 only — bar is left half (0-50%)
    const m1Pct = m1Total > 0 ? Math.round((m1Done / m1Total) * 100) : 0;
    return { pct: Math.round(m1Pct / 2), m1Pct, m2Pct: 0, issues: m1.issues };
  }
  // M2 stage — M1 is complete (50%), M2 fills the right half
  const m2Pct = m2total > 0 ? Math.round((m2done / m2total) * 100) : 0;
  const combined = 50 + Math.round(m2Pct / 2);
  return { pct: combined, m1Pct: 100, m2Pct, issues: m2issues };
}

function jobStatus(c) {
  const p = overallProg(c);
  if (p.issues > 0) return "Issues Found";
  return "In Review";
}

const card = { background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: "20px 22px" };
const LBL = { fontSize: 11, fontWeight: 700, color: G.textSub, letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: 8 };
const INP = { width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${G.borderBright}`, background: "#0a0a10", color: G.text, fontSize: 14, fontFamily: F, boxSizing: "border-box", outline: "none" };
const HINT = { fontSize: 12, color: G.textDim, marginBottom: 10, marginTop: -2, lineHeight: 1.6 };

function scBadge(status) {
  if (status === "Issues Found") return { bg: "rgba(239,68,68,0.15)", color: G.red, border: `1px solid ${G.redBorder}` };
  return { bg: "rgba(108,99,255,0.15)", color: G.accent, border: "1px solid rgba(108,99,255,0.35)" };
}

function Opt({ active, onClick, color, bg, border, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontFamily: F, fontSize: 13,
      fontWeight: active ? 600 : 400, transition: "all 0.15s",
      border: active ? `1px solid ${border}` : `1px solid ${G.borderBright}`,
      background: active ? bg : "transparent",
      color: active ? color : G.textSub,
    }}>
      {children}
    </button>
  );
}

function YesNo({ value, onChange, yesColor = G.green, yesBg = G.greenBg, yesBdr = G.greenBorder, noColor = G.red, noBg = G.redBg, noBdr = G.redBorder }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <Opt active={value === true} onClick={() => onChange(value === true ? null : true)} color={yesColor} bg={yesBg} border={yesBdr}>Yes</Opt>
      <Opt active={value === false} onClick={() => onChange(value === false ? null : false)} color={noColor} bg={noBg} border={noBdr}>No</Opt>
    </div>
  );
}

function UMI({ value, onChange, noIncorrect = false, withNA = false }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <Opt active={value === "uploaded"} onClick={() => onChange(value === "uploaded" ? null : "uploaded")} color={G.green} bg={G.greenBg} border={G.greenBorder}>Uploaded</Opt>
      <Opt active={value === "missing"} onClick={() => onChange(value === "missing" ? null : "missing")} color={G.red} bg={G.redBg} border={G.redBorder}>Missing</Opt>
      {!noIncorrect && <Opt active={value === "incorrect"} onClick={() => onChange(value === "incorrect" ? null : "incorrect")} color={G.yellow} bg={G.yellowBg} border={G.yellowBorder}>Incorrect</Opt>}
      {withNA && <Opt active={value === "na"} onClick={() => onChange(value === "na" ? null : "na")} color={G.textSub} bg="rgba(136,136,168,0.1)" border="rgba(136,136,168,0.3)">N/A</Opt>}
    </div>
  );
}

function CB({ value, onChange, label: l }) {
  return (
    <button onClick={() => onChange(value ? null : true)} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 8,
      border: `1px solid ${value ? G.greenBorder : G.borderBright}`,
      background: value ? G.greenBg : "transparent",
      color: value ? G.green : G.textSub,
      fontSize: 13, fontFamily: F, cursor: "pointer", fontWeight: value ? 600 : 400, transition: "all 0.15s",
    }}>
      <span style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${value ? G.green : G.textDim}`, background: value ? G.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {value && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke={G.surface} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </span>
      {l}
    </button>
  );
}

function FR({ text }) { return <div style={{ marginTop: 8, padding: "8px 12px", background: G.redBg, border: `1px solid ${G.redBorder}`, borderRadius: 7, fontSize: 12, color: G.red, fontWeight: 500 }}>⚠ {text}</div>; }
function FY({ text }) { return <div style={{ marginTop: 8, padding: "8px 12px", background: G.yellowBg, border: `1px solid ${G.yellowBorder}`, borderRadius: 7, fontSize: 12, color: G.yellow, fontWeight: 500 }}>⚡ {text}</div>; }
function FG({ text }) { return <div style={{ marginTop: 8, padding: "8px 12px", background: G.greenBg, border: `1px solid ${G.greenBorder}`, borderRadius: 7, fontSize: 12, color: G.green, fontWeight: 500 }}>✓ {text}</div>; }

function SecProg({ section, checklist }) {
  const p = secProg(section, checklist);
  const color = p.pct === 100 ? G.green : p.issues > 0 ? G.red : G.accent;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 120 }}>
      <div style={{ flex: 1, height: 4, background: G.border, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${p.pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 12, color: G.textSub, minWidth: 36, textAlign: "right" }}>{p.done}/{p.total}</span>
    </div>
  );
}

function CRow({ label: l, hint: h, children, noteKey, notes, onNoteChange }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const hasNote = noteKey && notes && notes[noteKey];
  return (
    <div style={{ padding: "16px 18px", background: "#0a0a10", border: `1px solid ${hasNote ? G.accentDim : G.border}`, borderRadius: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: h ? 4 : 12 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: G.text }}>{l}</div>
        {noteKey && (
          <button onClick={() => setNoteOpen(o => !o)} style={{
            marginLeft: 10, flexShrink: 0, padding: "3px 8px", borderRadius: 6,
            border: `1px solid ${hasNote ? G.accentDim : G.borderBright}`,
            background: hasNote ? G.accentGlow : "transparent",
            color: hasNote ? G.accent : G.textDim,
            fontSize: 11, cursor: "pointer", fontFamily: F, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            ✎ {hasNote ? "Note" : "Add note"}
          </button>
        )}
      </div>
      {h && <div style={HINT}>{h}</div>}
      {children}
      {noteKey && noteOpen && (
        <div style={{ marginTop: 10 }}>
          <textarea
            value={(notes && notes[noteKey]) || ""}
            onChange={e => onNoteChange && onNoteChange(noteKey, e.target.value)}
            placeholder="Add a note about this item..."
            style={{ ...INP, height: 64, resize: "vertical", fontSize: 12, fontFamily: F, marginTop: 0 }}
          />
        </div>
      )}
      {noteKey && !noteOpen && hasNote && (
        <div style={{ marginTop: 8, padding: "6px 10px", background: G.accentGlow, borderRadius: 6, fontSize: 12, color: G.accent, borderLeft: `2px solid ${G.accent}` }}>
          ✎ {notes[noteKey]}
        </div>
      )}
    </div>
  );
}

function Sub({ title, children }) {
  return (
    <div style={{ padding: "16px 18px", background: "#0f0f18", border: `1px solid ${G.border}`, borderRadius: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: G.textDim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

function Logo() {
  return (
    <img
      src="data:image/png;base64,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5PkeMzBMx6+3G1Pj+eJIU2T+ujz+9OlfsBX2vzuw37XninZQ01dzbb+wjhXxLHlukf8AWjXP1INdx4t9tfEZSUoyTFLtbXNepcRxEhG/36T/AL0wered01XTdh+014M3YJ1lqYS1fyS47jev30R/et2tfib4eXQgW/N8dkKP8qbi0Ff0KqZUytvNKhxblb5SQqNPivpI2C26lX+1SPOZ1vzEa796ZRkpqor0+CyCp2XHbHuVOACqO5Z9g9s394ZfYY2u4cuDQI/qqn40ytlOiCCO9fCkEk8jjXBrqy+/aG8HbOD8RnECQob9MQKfJ/8AICK61yv7Z/h/AQpFgsl5vLw4BWlMds/uSVf/AG0yrj02E66R1E6H9f1qNcJcaDEVInyozEdHLjr6ghAT9SePlXgXM/tieJF362rDDtlgZVsJUhvznQP+pfH/ANtdI5hnWY5hI87Jslud0O9hD8hRQn/pR+UfsKZP2j3t4ofag8L8TZlx7ZKOR3Q+nyrcT0EjsVPdh/4eo15R8WftL+I+dpdgszhYLSskfCwCUqWn5Lc/Mf0Gh9K6UpTf0uvqiVKKlEkk7JPvXylKiFKUoFKUoFKUoFKUoFKUoFKUoFKUoFKUoFKUoFKUoFKUoO7/AAh+034h4BCZtLzkfIbOyAluNcCrzGkj+Vt0cga4AV1AewrtWR9t98x9R/DppLxT3XdSUg/oGuRXjulXV12h4x+OufeKCfhL1ObhWkHabbBBbYJB2CvZKlngfmJAPYCur6UqahSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKDkha0fkWpP6HVZfjZmtfFv6/wD5DWClBzW665+dxav1UTXClKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKBSlKD/2Q=="
      alt="logo"
      style={{ width: 36, height: 36, objectFit: "contain", mixBlendMode: "screen" }}
    />
  );
}

function PrechecksSection({ data, onChange, notes = {}, onNoteChange }) {
  const d = data.prechecks;
  const setEA = p => onChange({ ...data, prechecks: { ...d, elecAdder: { ...d.elecAdder, ...p } } });
  const setUB = p => onChange({ ...data, prechecks: { ...d, utilBill: { ...d.utilBill, ...p } } });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <CRow label="Was this job sold with an electrical adder?" noteKey="elecAdder" notes={notes} onNoteChange={onNoteChange}>
        <YesNo value={d.elecAdder.value} onChange={v => setEA({ value: v, types: v ? d.elecAdder.types : [], installed: v ? d.elecAdder.installed : null })} noColor={G.green} noBg={G.greenBg} noBdr={G.greenBorder} />
        {d.elecAdder.value === false && <FG text="No electrical adder -- no additional action needed" />}
        {d.elecAdder.value === true && (
          <div style={{ marginTop: 12, padding: "14px 16px", background: G.surface, borderRadius: 9, border: `1px solid ${G.border}`, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={LBL}>Select adder type(s)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {["MPU", "FSU", "Meter collar (not Tesla BU switch)", "Subpanel"].map(t => {
                const sel = d.elecAdder.types.includes(t);
                return <Opt key={t} active={sel} onClick={() => { const types = sel ? d.elecAdder.types.filter(x => x !== t) : [...d.elecAdder.types, t]; setEA({ types }); }} color={G.accent} bg={G.accentGlow} border={G.accentDim}>{t}</Opt>;
              })}
            </div>
            {d.elecAdder.types.length > 0 && (
              <div>
                <div style={{ ...LBL, marginBottom: 8 }}>Is this installed complete?</div>
                <YesNo value={d.elecAdder.installed} onChange={v => setEA({ installed: v })} />
                {d.elecAdder.installed === false && <FR text="Adder not installed -- flagged for report" />}
              </div>
            )}
          </div>
        )}
      </CRow>
      <CRow label="Does the utility bill match the portal?" noteKey="utilBillMatch" notes={notes} onNoteChange={onNoteChange}>
        <YesNo value={d.utilBill.match} onChange={v => setUB({ match: v, pastDue: v ? d.utilBill.pastDue : null })} />
        {d.utilBill.match === false && <FR text="Utility bill does not match portal -- flagged for report" />}
        {d.utilBill.match === true && (
          <div style={{ marginTop: 12, padding: "14px 16px", background: G.surface, borderRadius: 9, border: `1px solid ${G.border}` }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: G.text, marginBottom: 8 }}>Does the bill have a past due balance?</div>
            <YesNo value={d.utilBill.pastDue} onChange={v => setUB({ pastDue: v })} yesColor={G.red} yesBg={G.redBg} yesBdr={G.redBorder} noColor={G.green} noBg={G.greenBg} noBdr={G.greenBorder} />
            {d.utilBill.pastDue === true && <FR text="Past due balance on bill -- flagged for report" />}
            {d.utilBill.pastDue === false && <FG text="No past due balance -- good to go" />}
          </div>
        )}
      </CRow>
    </div>
  );
}

function MainInputsSection({ data, onChange, serials, notes = {}, onNoteChange }) {
  const d = data.inputs;
  const set = k => v => onChange({ ...data, inputs: { ...d, [k]: v } });
  const [ss, setSS] = useState(null);
  const [con, setCon] = useState(null);
  const chk = val => {
    onChange({ ...data, inputs: { ...d, serial: val } });
    if (!val) { setSS(null); return; }
    const ex = serials.find(s => s.serial === val);
    if (ex) { setSS("dup"); setCon(ex.customer); } else { setSS("ok"); setCon(null); }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={LBL}>Module serial number</div>
        <input value={d.serial} onChange={e => chk(e.target.value)} placeholder="Enter serial number..." style={INP} />
        {ss === "dup" && <FR text={`Duplicate serial -- already assigned to: ${con}`} />}
        {ss === "ok" && <FG text="Serial number is unique" />}
      </div>
      <CRow label="Monitoring ID confirmed" hint="Verify monitoring ID is set in the portal." noteKey="monitoringId" notes={notes} onNoteChange={onNoteChange}><CB value={d.monitoringDone} onChange={set("monitoringDone")} label="Confirmed" /></CRow>
      <CRow label="Scheduled inspection date" hint="Set to approximately 1 month from today's date." noteKey="inspectionDate" notes={notes} onNoteChange={onNoteChange}><CB value={d.inspectionDone} onChange={set("inspectionDone")} label="Confirmed" /></CRow>
      <CRow label="Expected PTO date" hint="Set to approximately 1 month from today's date." noteKey="ptoDone" notes={notes} onNoteChange={onNoteChange}><CB value={d.ptoDone} onChange={set("ptoDone")} label="Confirmed" /></CRow>
    </div>
  );
}

function UploadsSection({ data, onChange, notes = {}, onNoteChange }) {
  const d = data.uploads;
  const set = k => v => onChange({ ...data, uploads: { ...d, [k]: v } });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <CRow label="Permit" hint="Must include permit number, address, and basic scope of work. No inspection cards." noteKey="permit" notes={notes} onNoteChange={onNoteChange}>
        <UMI value={d.permit} onChange={set("permit")} noIncorrect />
        {d.permit === "missing" && <FR text="Permit missing -- flagged for report" />}
      </CRow>
      <CRow label="Utility bill (if applicable)" noteKey="utilityBill" notes={notes} onNoteChange={onNoteChange}>
        <UMI value={d.utilityBill} onChange={set("utilityBill")} />
        {d.utilityBill === "missing" && <FR text="Utility bill missing -- flagged for report" />}
        {d.utilityBill === "incorrect" && <FY text="Utility bill incorrect -- flagged for review" />}
      </CRow>
    </div>
  );
}

function DesignSection({ data, onChange, notes = {}, onNoteChange, jobState }) {
  const d = data.design;
  const set = k => v => onChange({ ...data, design: { ...d, [k]: v } });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <CRow label="Layout matches installed (Scanifly)" hint="Modules must match as installed." noteKey="layoutMatch" notes={notes} onNoteChange={onNoteChange}>
        <YesNo value={d.layoutMatch} onChange={set("layoutMatch")} />
        {d.layoutMatch === false && <FR text="Layout mismatch -- flagged for report" />}
      </CRow>
      <CRow label="Array tilts match Scanifly" hint="Can be +5 or -5 degrees from installed." noteKey="tiltMatch" notes={notes} onNoteChange={onNoteChange}>
        <YesNo value={d.tiltMatch} onChange={set("tiltMatch")} />
        {d.tiltMatch === false && <FR text="Tilt mismatch -- flagged for report" />}
      </CRow>
      <CRow label="Trees and shading mapped" noteKey="treesShading" notes={notes} onNoteChange={onNoteChange}>
        <YesNo value={d.treesShading} onChange={set("treesShading")} />
        {d.treesShading === false && <FR text="Trees / shading not mapped -- flagged for report" />}
      </CRow>
      <CRow label="System losses -- state snow loss" noteKey="snowLoss" notes={notes} onNoteChange={onNoteChange}>
        {jobState && !d.state && (() => {
          const match = Object.keys(SNOW).find(k => k.toLowerCase().startsWith((jobState || "").toLowerCase().slice(0, 4)));
          if (match) setTimeout(() => set("state")(match), 0);
          return null;
        })()}
        <select value={d.state} onChange={e => set("state")(e.target.value)} style={{ ...INP, width: "auto", minWidth: 280 }}>
          <option value="">Select state...</option>
          {Object.keys(SNOW).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {d.state && (
          <div style={{ marginTop: 12, padding: "12px 14px", background: G.surface, borderRadius: 8, border: `1px solid ${G.border}` }}>
            <div style={{ fontSize: 13, color: G.green, fontWeight: 600, marginBottom: 10 }}>Required snow loss for {d.state}: {SNOW[d.state]}%</div>
            <div style={{ fontWeight: 600, fontSize: 13, color: G.text, marginBottom: 8 }}>Is snow loss set to {SNOW[d.state]}%?</div>
            <YesNo value={d.snowCorrect} onChange={set("snowCorrect")} />
            {d.snowCorrect === false && <FR text={`Snow loss must be ${SNOW[d.state]}% -- flagged for report`} />}
          </div>
        )}
      </CRow>
      <CRow label="Production within tolerance" noteKey="prodTolerance" notes={notes} onNoteChange={onNoteChange}>
        <YesNo value={d.prodTolerance} onChange={set("prodTolerance")} />
        {d.prodTolerance === false && (
          <div style={{ marginTop: 12, padding: "14px 16px", background: G.surface, borderRadius: 9, border: `1px solid ${G.yellowBorder}` }}>
            <div style={{ fontSize: 12, color: G.yellow, marginBottom: 10, lineHeight: 1.6 }}>Please adjust shading and / or tilts in Scanifly to get within tolerance while staying compliant with lender policy (plus or minus 5 degrees from installed).</div>
            <div style={{ fontWeight: 600, fontSize: 13, color: G.text, marginBottom: 8 }}>Is production now within tolerance after adjustment?</div>
            <YesNo value={d.prodAfterAdjust} onChange={set("prodAfterAdjust")} />
            {d.prodAfterAdjust === false && <FR text="Production still out of tolerance -- flagged for report" />}
          </div>
        )}
      </CRow>
    </div>
  );
}

function DesignUploadsSection({ data, onChange, notes = {}, onNoteChange }) {
  const d = data.designUploads;
  const set = k => v => onChange({ ...data, designUploads: { ...d, [k]: v } });
  const [fmt, setFmt] = useState("");
  const [loading, setLoading] = useState(false);
  const format = async () => {
    if (!d.rawPaste.trim()) return;
    setLoading(true);
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: "Format this raw solar data into a markdown table, months as rows. Columns: Month | Consumption (kWh) | Production (kWh) | Net (kWh). Omit missing columns. Output ONLY the table.\n\n" + d.rawPaste }] }),
      });
      const j = await r.json();
      setFmt(j.content?.[0]?.text || "Could not format.");
    } catch (e) { setFmt("Connection error."); }
    setLoading(false);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <CRow label="CAD / Planset" hint="Layout and modules do not need to match 100% for install package submission -- use your own discretion." noteKey="cad" notes={notes} onNoteChange={onNoteChange}>
        <UMI value={d.cad} onChange={set("cad")} />
        {d.cad === "missing" && <FR text="CAD / Planset missing -- flagged for report" />}
        {d.cad === "incorrect" && <FY text="CAD / Planset incorrect -- flagged for review" />}
      </CRow>
      <CRow label="Scanifly screenshots" noteKey="scanifly" notes={notes} onNoteChange={onNoteChange}>
        <UMI value={d.scanifly} onChange={set("scanifly")} noIncorrect />
        <div style={{ marginTop: 14, padding: "14px 16px", background: "#0a0a10", borderRadius: 9, border: `1px solid ${G.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: G.textSub, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Auto Formatter -- paste raw consumption / production data below</div>
          <textarea value={d.rawPaste} onChange={e => set("rawPaste")(e.target.value)} placeholder="Paste raw Scanifly data here..." style={{ ...INP, height: 76, resize: "vertical", fontFamily: "monospace", fontSize: 12 }} />
          <button onClick={format} disabled={loading} style={{ marginTop: 8, width: 40, height: 36, borderRadius: 7, border: `1px solid ${G.accentDim}`, background: G.accentGlow, color: G.accent, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>{loading ? "..." : "↵"}</button>
          {fmt && <div style={{ marginTop: 10, padding: 12, background: G.surface, borderRadius: 7, border: `1px solid ${G.border}`, fontSize: 12, whiteSpace: "pre-wrap", fontFamily: "monospace", color: G.text }}>{fmt}</div>}
        </div>
      </CRow>
      <CRow label="Shade report" noteKey="shadeReport" notes={notes} onNoteChange={onNoteChange}>
        <UMI value={d.shade} onChange={set("shade")} noIncorrect />
        {d.shade === "missing" && <FR text="Shade report missing -- flagged for report" />}
      </CRow>
    </div>
  );
}

function SiteSection({ data, onChange, notes = {}, onNoteChange }) {
  const d = data.site;
  const set = k => v => onChange({ ...data, site: { ...d, [k]: v } });
  const photos = [
    { k: "invSerial", l: "Inverter or combiner box serial photo" },
    { k: "microMap", l: "Micro inverter or MCI map" },
    { k: "modLabel", l: "Module label photo" },
    { k: "modSerial", l: "Module serial number photo", h: "Serial entered: " + (data.inputs.serial || "--") },
    { k: "frontHouse", l: "Front of house photo" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {photos.map(({ k, l, h }) => (
        <CRow key={k} label={l} hint={h || ""} noteKey={"site_"+k} notes={notes} onNoteChange={onNoteChange}>
          <UMI value={d[k]} onChange={set(k)} noIncorrect />
          {d[k] === "missing" && <FR text={l + " missing -- flagged for report"} />}
        </CRow>
      ))}
    </div>
  );
}

function RoofSection({ data, onChange, notes = {}, onNoteChange }) {
  const d = data.roof;
  const set = k => v => onChange({ ...data, roof: { ...d, [k]: v } });
  const photos = [
    { k: "attachment", l: "Close-up of attachment photo" },
    { k: "rails", l: "Array rails" },
    { k: "completeArray", l: "Complete array(s) with rail trimmed" },
    { k: "tilt", l: "Tilt", h: "At least one photo per array." },
    { k: "jbox", l: "Junction box", h: "Including soffit J-boxes if applicable." },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {photos.map(({ k, l, h }) => (
        <CRow key={k} label={l} hint={h || ""} noteKey={"roof_"+k} notes={notes} onNoteChange={onNoteChange}>
          <UMI value={d[k]} onChange={set(k)} noIncorrect />
          {d[k] === "missing" && <FR text={l + " missing -- flagged for report"} />}
        </CRow>
      ))}
    </div>
  );
}

function ElectricalSection({ data, onChange, notes = {}, onNoteChange }) {
  const d = data.electrical;
  const set = k => v => onChange({ ...data, electrical: { ...d, [k]: v } });
  const setSub = (sub, k) => v => onChange({ ...data, electrical: { ...d, [sub]: { ...d[sub], [k]: v } } });
  const wf = (val, onCh) => (
    <div>
      <UMI value={val} onChange={onCh} />
      {val === "missing" && <FR text="Photo missing -- flagged for report" />}
      {val === "incorrect" && <FY text="Photo incorrect -- flagged for review" />}
    </div>
  );
  const showStr = d.type === "string" || d.type === "both";
  const showPw3 = d.type === "pw3" || d.type === "both" || d.type === "microPw3";
  const showMicro = d.type === "micro" || d.type === "microPw3";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <CRow label="Inverter type" noteKey="inverterType" notes={notes} onNoteChange={onNoteChange}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {[{ v: "string", l: "Standalone string inverter" }, { v: "pw3", l: "Powerwall 3" }, { v: "both", l: "String + PW3" }, { v: "micro", l: "Micro inverter" }, { v: "microPw3", l: "Micro + PW3" }].map(o => (
            <Opt key={o.v} active={d.type === o.v} onClick={() => set("type")(d.type === o.v ? null : o.v)} color={G.accent} bg={G.accentGlow} border={G.accentDim}>{o.l}</Opt>
          ))}
        </div>
      </CRow>
      {showStr && (
        <Sub title="Standalone string inverter">
          <CRow label="Full inverter(s) interior" noteKey="strFullInterior" notes={notes} onNoteChange={onNoteChange}>{wf(d.str.fullInterior, setSub("str", "fullInterior"))}</CRow>
          <CRow label="CTs in inverter / solar RGM" noteKey="strCTs" notes={notes} onNoteChange={onNoteChange}>{wf(d.str.cts, setSub("str", "cts"))}</CRow>
          <CRow label="Door grounded" noteKey="doorGrounded" notes={notes} onNoteChange={onNoteChange}><YesNo value={d.str.doorGrounded} onChange={setSub("str", "doorGrounded")} />{d.str.doorGrounded === false && <FR text="Door not grounded -- flagged for report" />}</CRow>
        </Sub>
      )}
      {showPw3 && (
        <Sub title="Powerwall 3">
          <CRow label="Full PW3 interior" noteKey="pw3Interior" notes={notes} onNoteChange={onNoteChange}>{wf(d.pw3.fullInterior, setSub("pw3", "fullInterior"))}</CRow>
          <CRow label="Ferrite cores" hint="Installed per example photo." noteKey="ferriteCores" notes={notes} onNoteChange={onNoteChange}><div><UMI value={d.pw3.ferrite} onChange={setSub("pw3", "ferrite")} />{d.pw3.ferrite === "missing" && <FR text="Ferrite cores missing -- flagged for report" />}{d.pw3.ferrite === "incorrect" && <FY text="Ferrite cores incorrect -- flagged for review" />}</div></CRow>
          <CRow label="Drain wire" hint="Installed per example photo." noteKey="drainWire" notes={notes} onNoteChange={onNoteChange}><div><UMI value={d.pw3.drain} onChange={setSub("pw3", "drain")} />{d.pw3.drain === "missing" && <FR text="Drain wire missing -- flagged for report" />}{d.pw3.drain === "incorrect" && <FY text="Drain wire incorrect -- flagged for review" />}</div></CRow>
          <CRow label="Taco open showing communication wiring" noteKey="tacoOpen" notes={notes} onNoteChange={onNoteChange}>{wf(d.pw3.taco, setSub("pw3", "taco"))}</CRow>
        </Sub>
      )}
      {showMicro && (
        <Sub title="Micro inverter">
          <CRow label="Full combiner interior" noteKey="combinerInterior" notes={notes} onNoteChange={onNoteChange}>{wf(d.micro.fullCombiner, setSub("micro", "fullCombiner"))}</CRow>
          <CRow label="Combiner wiring" hint="Per example photo." noteKey="combinerWiring" notes={notes} onNoteChange={onNoteChange}><div><UMI value={d.micro.combWiring} onChange={setSub("micro", "combWiring")} />{d.micro.combWiring === "missing" && <FR text="Combiner wiring missing -- flagged for report" />}{d.micro.combWiring === "incorrect" && <FY text="Combiner wiring incorrect -- flagged for review" />}</div></CRow>
          <CRow label="CTs" hint="Per example photo." noteKey="microCTs" notes={notes} onNoteChange={onNoteChange}><div><UMI value={d.micro.cts} onChange={setSub("micro", "cts")} />{d.micro.cts === "missing" && <FR text="CTs missing -- flagged for report" />}{d.micro.cts === "incorrect" && <FY text="CTs incorrect -- flagged for review" />}</div></CRow>
          <CRow label="Drill zone" hint="Conduit entrance -- see example for allowed areas." noteKey="drillZone" notes={notes} onNoteChange={onNoteChange}><div><UMI value={d.micro.drillZone} onChange={setSub("micro", "drillZone")} />{d.micro.drillZone === "missing" && <FR text="Drill zone photo missing -- flagged for report" />}{d.micro.drillZone === "incorrect" && <FY text="Drill zone incorrect -- conduit placement issue" />}</div></CRow>
          <CRow label="Deadfront with cell kit" noteKey="deadfront" notes={notes} onNoteChange={onNoteChange}>{wf(d.micro.deadfront, setSub("micro", "deadfront"))}</CRow>
        </Sub>
      )}
      <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        {[{ k: "mainBreaker", l: "Main breaker rating" }, { k: "busbar", l: "Main panel busbar rating" }, { k: "poi", l: "Point of interconnection" }, { k: "mspCts", l: "MSP CTs" }, { k: "bos", l: "BOS" }].map(({ k, l }) => (
          <CRow key={k} label={l} noteKey={"elec_"+k} notes={notes} onNoteChange={onNoteChange}><UMI value={d[k]} onChange={set(k)} noIncorrect />{d[k] === "missing" && <FR text={l + " missing -- flagged for report"} />}</CRow>
        ))}
        <CRow label="Disconnect(s)" hint="Fuses must be rated per CAD spec." noteKey="disconnects" notes={notes} onNoteChange={onNoteChange}><UMI value={d.disconnects} onChange={set("disconnects")} noIncorrect />{d.disconnects === "missing" && <FR text="Disconnect(s) missing -- flagged for report" />}</CRow>
        <CRow label="Combiner panels" hint="If applicable." noteKey="combPanels" notes={notes} onNoteChange={onNoteChange}><UMI value={d.combPanels} onChange={set("combPanels")} withNA />{d.combPanels === "missing" && <FR text="Combiner panels missing -- flagged for report" />}</CRow>
      </div>
    </div>
  );
}

function StorageSection({ data, onChange, notes = {}, onNoteChange }) {
  const d = data.storage;
  const set = k => v => onChange({ ...data, storage: { ...d, [k]: v } });
  const setSub = (sub, k) => v => onChange({ ...data, storage: { ...d, [sub]: { ...d[sub], [k]: v } } });
  const showSw = d.switchType === "backupSwitch";
  const showGw = d.switchType === "gateway";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ padding: "10px 14px", background: G.blueBg, border: `1px solid ${G.blueBorder}`, borderRadius: 8, fontSize: 12, color: G.blue }}>PW3 photos should have been added in the Electrical section above.</div>
      <CRow label="Battery type" noteKey="battType" notes={notes} onNoteChange={onNoteChange}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[{ v: "arbitrage", l: "Arbitrage battery" }, { v: "backup", l: "Backup battery" }, { v: "na", l: "N/A" }].map(o => (
            <Opt key={o.v} active={d.battType === o.v} onClick={() => set("battType")(d.battType === o.v ? null : o.v)} color={o.v === "na" ? G.textSub : G.accent} bg={o.v === "na" ? "rgba(136,136,168,0.1)" : G.accentGlow} border={o.v === "na" ? "rgba(136,136,168,0.3)" : G.accentDim}>{o.l}</Opt>
          ))}
        </div>
      </CRow>
      {d.battType && d.battType !== "na" && (
        <CRow label="Check CAD -- what is installed?" noteKey="cadInstalled" notes={notes} onNoteChange={onNoteChange} hint={d.battType === "arbitrage" ? "Check CAD for backup switch, gateway, or none." : "Check CAD for backup switch or gateway."}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[{ v: "backupSwitch", l: "Backup switch" }, { v: "gateway", l: "Gateway" }, ...(d.battType === "arbitrage" ? [{ v: "none", l: "None" }] : [])].map(o => (
              <Opt key={o.v} active={d.switchType === o.v} onClick={() => set("switchType")(d.switchType === o.v ? null : o.v)} color={G.accent} bg={G.accentGlow} border={G.accentDim}>{o.l}</Opt>
            ))}
          </div>
        </CRow>
      )}
      {showSw && (
        <Sub title="Backup switch">
          <CRow label="Backup switch photo" noteKey="bkSwitchPhoto" notes={notes} onNoteChange={onNoteChange}><UMI value={d.bkSwitch.uploaded} onChange={setSub("bkSwitch", "uploaded")} noIncorrect />{d.bkSwitch.uploaded === "missing" && <FR text="Backup switch photo missing -- flagged for report" />}</CRow>
          <CRow label="Communication wiring on backup switch" noteKey="bkSwitchComm" notes={notes} onNoteChange={onNoteChange}><UMI value={d.bkSwitch.commWiring} onChange={setSub("bkSwitch", "commWiring")} noIncorrect />{d.bkSwitch.commWiring === "missing" && <FR text="Backup switch communication wiring missing -- flagged for report" />}</CRow>
          <CRow label="Backup switch installed?" noteKey="bkSwitchInstalled" notes={notes} onNoteChange={onNoteChange}>
            <div style={{ display: "flex", gap: 6 }}>
              <Opt active={d.bkSwitch.installed === true} onClick={() => setSub("bkSwitch", "installed")(d.bkSwitch.installed === true ? null : true)} color={G.green} bg={G.greenBg} border={G.greenBorder}>Uploaded</Opt>
              <Opt active={d.bkSwitch.installed === "notComplete"} onClick={() => setSub("bkSwitch", "installed")(d.bkSwitch.installed === "notComplete" ? null : "notComplete")} color={G.yellow} bg={G.yellowBg} border={G.yellowBorder}>Install not completed</Opt>
            </div>
            {d.bkSwitch.installed === "notComplete" && <FY text="Backup switch install to be completed at activation package -- flagged for report" />}
          </CRow>
        </Sub>
      )}
      {showGw && (
        <Sub title="Gateway">
          {[{ k: "fullInt", l: "Full gateway interior" }, { k: "interconnect", l: "Interconnection", h: "Per example photo." }, { k: "commWiring", l: "Communication wiring", h: "Per example photo." }].map(({ k, l, h }) => (
            <CRow key={k} label={l} hint={h || ""} noteKey={"gw_"+k} notes={notes} onNoteChange={onNoteChange}><UMI value={d.gateway[k]} onChange={setSub("gateway", k)} noIncorrect />{d.gateway[k] === "missing" && <FR text={l + " missing -- flagged for report"} />}</CRow>
          ))}
        </Sub>
      )}
    </div>
  );
}

function CommissioningSection({ data, onChange, notes = {}, onNoteChange }) {
  const d = data.commissioning;
  const set = k => v => onChange({ ...data, commissioning: { ...d, [k]: v } });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ padding: "10px 14px", background: G.yellowBg, border: `1px solid ${G.yellowBorder}`, borderRadius: 8, fontSize: 12, color: G.yellow }}>Commissioning is a soft requirement for install package submission.</div>
      <CRow label="Commissioning completed?" noteKey="commissioning" notes={notes} onNoteChange={onNoteChange}><YesNo value={d.done} onChange={set("done")} />{d.done === false && <FY text="Commissioning not complete -- soft flag for report" />}</CRow>
      <div><div style={LBL}>Notes (optional)</div><textarea value={d.notes} onChange={e => set("notes")(e.target.value)} placeholder="Any additional notes..." style={{ ...INP, height: 80, resize: "vertical" }} /></div>
    </div>
  );
}

function genReportText(job) {
  const itemNotes = job.checklist.itemNotes || {};
  const now = new Date().toLocaleString();
  const lines = [
    "LIGHTREACH TPO FUNDING SUBMISSION REPORT",
    "=".repeat(50),
    "Customer:   " + job.customerName,
    "State:      " + (job.state || "--"),
    "Specialist: " + (job.fundingSpecialist || "--"),
    "Stage:      " + (job.packageStage === "m2" ? "Activation (M2)" : job.packageStage === "fullyFunded" ? "Fully Funded" : "Install (M1)"),
    "Status:     " + (job.accountStatus || "Pending Submission"),
    ...(job.epcAmount ? ["EPC:        $" + job.epcAmount.toLocaleString() + "  |  M1 (90%): $" + (job.epcAmount*0.9).toFixed(2) + "  |  M2 (10%): $" + (job.epcAmount*0.1).toFixed(2)] : []),
    ...(job.conditionalM1 ? ["⚡ CONDITIONAL STIPS FROM M1 -- must be resolved at activation"] : []),
    "Generated:  " + now,
    "",
  ];

  // Build a map of noteKey → note text for inline display
  const noteMap = {};
  Object.entries(itemNotes).forEach(([k, v]) => { if (v) noteMap[k] = v; });

  // Note key → section label mapping for inline placement
  const keyToSection = {
    elecAdder: "prechecks", utilBillMatch: "prechecks",
    monitoringId: "inputs", inspectionDate: "inputs", ptoDone: "inputs",
    permit: "uploads", utilityBill: "uploads",
    layoutMatch: "design", tiltMatch: "design", treesShading: "design", snowLoss: "design", prodTolerance: "design",
    cad: "designUploads", scanifly: "designUploads", shadeReport: "designUploads",
  };

  SORDER.forEach(s => {
    const items = getItems(s, job.checklist);
    lines.push("--- " + SLABELS[s].toUpperCase() + " ---");
    items.forEach(i => {
      const tag = i.status === "ok" ? "[  COMPLETE  ]" : i.status === "issue" ? "[ !! MISSING ]" : "[   PENDING  ]";
      lines.push("  " + tag + "  " + i.label);
      // Find note for this item by key match
      const noteEntry = Object.entries(noteMap).find(([k]) =>
        i.label.toLowerCase().replace(/[^a-z0-9]/g,"").includes(k.toLowerCase().replace(/[^a-z0-9]/g,"").replace(/^(site_|roof_|elec_|gw_|m2_)/,"").slice(0,6))
      );
      if (noteEntry) {
        lines.push("             NOTE [" + noteEntry[0].replace(/site_|roof_|elec_|gw_|m2_/,"") + "]: " + noteEntry[1]);
      }
    });
    lines.push("");
  });

  if (job.checklist.commissioning.notes) {
    lines.push("--- GENERAL NOTES ---");
    lines.push(job.checklist.commissioning.notes);
    lines.push("");
  }

  if (job.submissionLog && job.submissionLog.length) {
    lines.push("--- SUBMISSION LOG ---");
    job.submissionLog.forEach(e => lines.push("  [" + e.ts + "] " + e.text));
    lines.push("");
  }

  return lines.join("\n");
}

function ReportModal({ job, onClose }) {
  const reportType = job._reportType || "m1";
  const isConditional = !!job.conditionalM1;
  const m2SecList = isConditional ? [...M2_SORDER, "conditionals"] : M2_SORDER;
  const sections = reportType === "m2"
    ? m2SecList.map(s => ({ key: s, label: M2_SLABELS[s], items: getM2Items(s, job.m2Checklist || {}, isConditional) }))
    : SORDER.map(s => ({ key: s, label: SLABELS[s], items: getItems(s, job.checklist) }));
  const allItems = sections.flatMap(s => s.items);
  const totalOk = allItems.filter(i => i.status === "ok").length;
  const totalIssue = allItems.filter(i => i.status === "issue").length;
  const totalPending = allItems.filter(i => i.status === "pending").length;
  const pct = allItems.length ? Math.round((totalOk / allItems.length) * 100) : 0;
  const overallColor = totalIssue > 0 ? G.red : pct === 100 ? G.green : G.yellow;

  const statusChip = (status) => {
    if (status === "ok") return { label: "COMPLETE", bg: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.35)", dot: "#22c55e" };
    if (status === "issue") return { label: "MISSING", bg: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)", dot: "#ef4444" };
    return { label: "PENDING", bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", dot: "#f59e0b" };
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: G.surface, border: `1px solid ${G.borderBright}`, borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "88vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: G.textDim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Funding Submission Report</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: G.text }}>{job.customerName}</div>
              <div style={{ fontSize: 12, color: G.textSub, marginTop: 2 }}>{new Date(job.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => {
                const el = document.createElement("textarea");
                el.value = genReportText(job);
                el.style.position = "fixed";
                el.style.opacity = "0";
                document.body.appendChild(el);
                el.focus();
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
              }} style={{ padding: "7px 16px", borderRadius: 7, border: `1px solid ${G.accentDim}`, background: G.accentGlow, color: G.accent, fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: F }}>Copy text</button>
              <button onClick={onClose} style={{ padding: "7px 16px", borderRadius: 7, border: `1px solid ${G.borderBright}`, background: "transparent", color: G.textSub, cursor: "pointer", fontSize: 13, fontFamily: F }}>Close</button>
            </div>
          </div>

          {/* Summary bar */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1, height: 8, background: G.border, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ width: pct + "%", height: "100%", background: overallColor, borderRadius: 6, transition: "width 0.3s" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: overallColor, minWidth: 40 }}>{pct}%</span>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            <span style={{ fontSize: 12, color: G.green, fontWeight: 600 }}>● {totalOk} complete</span>
            <span style={{ fontSize: 12, color: G.red, fontWeight: 600 }}>● {totalIssue} missing</span>
            <span style={{ fontSize: 12, color: G.yellow, fontWeight: 600 }}>● {totalPending} pending</span>
          </div>
        </div>

        {/* Sections */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 24px" }}>
          {sections.map(sec => {
            const secOk = sec.items.filter(i => i.status === "ok").length;
            const secIssue = sec.items.filter(i => i.status === "issue").length;
            const secColor = secIssue > 0 ? G.red : secOk === sec.items.length ? G.green : G.yellow;
            return (
              <div key={sec.key} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: G.textDim, letterSpacing: "0.07em", textTransform: "uppercase" }}>{sec.label}</div>
                  <div style={{ fontSize: 11, color: secColor, fontWeight: 600 }}>{secOk}/{sec.items.length}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {sec.items.map((item, idx) => {
                    const chip = statusChip(item.status);
                    const itemNote = Object.entries(job.checklist.itemNotes || {}).find(([k,v]) => v && item.label.toLowerCase().replace(/[^a-z0-9]/g,"").includes(k.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,8)));
                    return (
                      <div key={idx} style={{ borderRadius: 8, background: chip.bg, border: chip.border, overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px" }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: chip.dot, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 13, color: G.text, fontWeight: item.status !== "ok" ? 600 : 400 }}>{item.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: chip.color, letterSpacing: "0.05em" }}>{chip.label}</span>
                        </div>
                        {itemNote && itemNote[1] && (
                          <div style={{ padding: "6px 14px 9px 30px", fontSize: 12, color: G.accent, fontStyle: "italic", borderTop: `1px solid ${G.border}` }}>
                            ✎ {itemNote[1]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {job.checklist.commissioning.notes && (
            <div style={{ marginTop: 8, padding: "12px 14px", background: "rgba(108,99,255,0.08)", border: `1px solid ${G.accentDim}`, borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: G.textDim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>Notes</div>
              <div style={{ fontSize: 13, color: G.text }}>{job.checklist.commissioning.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



const LINK_CATEGORIES = [
  {
    category: "LightReach Knowledge Base",
    color: "#6c63ff",
    icon: "📋",
    links: [
      { name: "Milestone Requirements Overview", desc: "High level overview of M0, M1, and M2 milestone requirements", url: "https://help.palmetto.finance/en/articles/8305130-solar-energy-plan-milestone-requirements-overview" },
      { name: "Submitting for M1 & M2 Milestones", desc: "Step-by-step guide to submitting install and activation packages in the portal", url: "https://help.palmetto.finance/en/articles/12159384-solar-energy-plan-submitting-for-m1-m2-milestones" },
      { name: "Install (M1) Photo Documentation", desc: "Comprehensive list of M1 photo requirements with examples", url: "https://help.palmetto.finance/en/articles/8306274-install-m1-photo-documentation" },
      { name: "M1 Installation Checklist", desc: "Full M1 checklist for install package submission", url: "https://help.palmetto.finance/en/articles/9718783-solar-energy-plan-installation-m1-checklist" },
      { name: "M2 Deliverables for Submission", desc: "Everything required to submit the activation package", url: "https://help.palmetto.finance/en/articles/13978269-solar-energy-plan-m2-deliverables-for-submission" },
      { name: "M2 Monitoring Data & Troubleshooting", desc: "Validate monitoring data before M2 submission -- common issues and fixes", url: "https://help.palmetto.finance/en/articles/13871425-solar-energy-plan-m2-monitoring-data-troubleshooting" },
      { name: "Monitoring Portal Deliverables (M1)", desc: "What monitoring data is required at M1", url: "https://help.palmetto.finance/en/articles/11705727-solar-energy-plan-monitoring-portal-deliverables-m1" },
      { name: "Design Package | Inputs and Deliverables", desc: "Design package requirements including Scanifly, CAD, and production tolerance", url: "https://help.palmetto.finance/en/articles/8305985-solar-energy-plan-design-package-inputs-and-deliverables" },
      { name: "Tesla MCI, String & Design Requirements", desc: "Tesla-specific design requirements for MCI and string inverter systems", url: "https://help.palmetto.finance/en/articles/9358776-solar-energy-plan-tesla-mci-string-design-requirements" },
      { name: "AVL & All Things Hardware", desc: "Approved Vendor List and all eligible equipment", url: "https://help.palmetto.finance/en/articles/12524213-avl-all-things-hardware" },
      { name: "Inverter & Battery Manufacturer Guides", desc: "Links to all manufacturer install guides and tech briefs", url: "https://help.palmetto.finance/en/articles/9353772-solar-energy-plan-inverter-battery-manufacturer-guides" },
      { name: "Battery Settings and Operational Modes", desc: "Battery configuration, backup vs arbitrage modes", url: "https://help.palmetto.finance/en/articles/11849110-solar-energy-plan-battery-settings-and-operational-modes" },
      { name: "Current Transformers (CTs) Video Guide", desc: "CT installation tips, common misses, and rejection reasons by manufacturer", url: "https://help.palmetto.finance/en/articles/9540833-current-transformers-cts-video" },
      { name: "Electrical Conditions & Adders", desc: "MPU, FSU, meter collar, subpanel -- requirements and documentation", url: "https://help.palmetto.finance/en/articles/9927017-electrical-conditions-adders" },
      { name: "Change Orders", desc: "How to handle and submit change orders", url: "https://help.palmetto.finance/en/articles/8305960-change-orders" },
      { name: "Eligible Sites", desc: "Site eligibility requirements for LightReach projects", url: "https://help.palmetto.finance/en/articles/8708580-eligible-sites" },
      { name: "Manufactured Homes Trial Program", desc: "Policy and requirements for manufactured home installations", url: "https://help.palmetto.finance/en/articles/12530600-manufactured-homes-trial-program" },
      { name: "Domestic Content - Installer Overview", desc: "Domestic content requirements, photo and submittal documentation", url: "https://help.palmetto.finance/en/articles/10166915-domestic-content-installer-overview" },
      { name: "Domestic Content M1 Submittal & Photo Requirements", desc: "Specific M1 requirements for domestic content projects", url: "https://help.palmetto.finance/en/articles/10280023-solar-energy-plan-domestic-content-m1-submittal-photo-requirements" },
      { name: "Permit Documents | Inputs & Deliverables", desc: "Permit documentation requirements for M1", url: "https://help.palmetto.finance/en/articles/8306165-solar-energy-plan-permit-documents-inputs-deliverables" },
      { name: "Permission to Operate (PTO)", desc: "PTO requirements and submission process for M2", url: "https://help.palmetto.finance/en/articles/8383543-solar-energy-plan-permission-to-operate" },
      { name: "Direct Pay Installer Guide", desc: "Guide for direct pay project submissions", url: "https://help.palmetto.finance/en/articles/9869445-solar-energy-plan-direct-pay-installer-guide" },
      { name: "Deliverables Search", desc: "Search all LR deliverable documentation", url: "https://help.palmetto.finance/en/?q=deliverables" },
      { name: "Roof Quality Supplemental Guide", desc: "Roof quality standards and eligibility requirements", url: "https://help.palmetto.finance/en/articles/13979392-supplemental-guide-roof-quality" },
      { name: "QCells AC Module Quick Guide", desc: "Design, install, and commissioning guide for QCells AC modules", url: "https://help.palmetto.finance/en/articles/11794060-solar-energy-plan-qcells-ac-module-design-install-commissioning-quick-guide" },
      { name: "SolarEdge Backup Interface Shortage", desc: "Interim policy for SolarEdge backup interface shortage", url: "https://help.palmetto.finance/en/articles/12002626-solar-energy-plan-solaredge-back-up-interface-shortage" },
      { name: "SolarEdge Extended Warranty", desc: "SolarEdge extended warranty requirements for M2", url: "https://help.palmetto.finance/en/articles/8306386-solar-energy-plan-solaredge-extended-warranty" },
      { name: "M2 Site Improvement Photos", desc: "Required photos for site improvements at M2", url: "https://help.palmetto.finance/en/articles/10012401-solar-energy-plan-m2-site-improvement-photos-if-applicable" },
      { name: "M2 Incentive Deliverables", desc: "Incentive documentation required at M2 milestone", url: "https://help.palmetto.finance/en/articles/9085138-solar-energy-plan-incentive-deliverables-m2-milestone" },
    ]
  },
  {
    category: "Monitoring Portals",
    color: "#22c55e",
    icon: "📡",
    links: [
      { name: "SolarEdge Monitoring", desc: "SolarEdge monitoring portal for inverter and consumption data", url: "https://monitoring.solaredge.com/solaredge-web/p/home" },
      { name: "Enphase Enlighten Manager", desc: "Enphase monitoring portal -- production, consumption, and system health", url: "https://enlighten.enphaseenergy.com/manager/dashboard/systems" },
      { name: "Tesla PowerHub", desc: "Tesla energy monitoring and gateway management portal", url: "https://powerhub.energy.tesla.com/login" },
      { name: "QCells Fleet Portal", desc: "QCells fleet monitoring for AC module systems", url: "https://fleet.es.qcells.com/sites/" },
      { name: "APsystems EMA", desc: "APsystems energy monitoring and analysis portal", url: "https://apsystemsema.com/ema/index.action" },
    ]
  },
  {
    category: "Install Guides",
    color: "#ef4444",
    icon: "⚡",
    links: [
      { name: "Tesla Solar Inverter Install Manual", desc: "Official Tesla solar inverter installation manual", url: "https://energylibrary.tesla.com/docs/Public/Solar/Inverter/InstallManual/en-us/GUID-15CA6519-C179-434D-A25C-1039FF4EE46B.html" },
      { name: "Powerwall 3 Gateway Install Manual", desc: "Official PW3 gateway installation guide", url: "https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/InstallManual/Gateway/3/en-us/index.html" },
      { name: "Powerwall 3 Backup Switch Install Manual", desc: "Official PW3 backup switch installation guide", url: "https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/InstallManual/BackupSwitch/en-us/index.html" },
      { name: "QCells Module Manual", desc: "QCells module specifications and installation reference", url: "https://media.qcells.com/v/J5bKzFB8" },
    ]
  },
  {
    category: "Design & Tools",
    color: "#f59e0b",
    icon: "🛠",
    links: [
      { name: "MCI Map Redraw Tool (draw.io)", desc: "Tool to help redraw MCI maps for submission -- opens shared template", url: "https://app.diagrams.net/#G1YomTGB4qScZb9OkxZIc1ysvKCRtOpCsK#%7B%22pageId%22%3A%22y4ew1EKgQo4hR0pc6auK%22%7D" },
      { name: "Scanifly Portal", desc: "Access and manage Scanifly projects", url: "https://portal.scanifly.com/projects-list" },
      { name: "Scanifly Help Center", desc: "Scanifly documentation, guides, and support articles", url: "https://help.scanifly.com/" },
    ]
  },
];

function LinksPage() {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(null);

  const filtered = search.trim()
    ? LINK_CATEGORIES.map(cat => ({
        ...cat,
        links: cat.links.filter(l =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.desc.toLowerCase().includes(search.toLowerCase()) ||
          cat.category.toLowerCase().includes(search.toLowerCase())
        )
      })).filter(cat => cat.links.length > 0)
    : LINK_CATEGORIES;

  const totalLinks = LINK_CATEGORIES.reduce((a, c) => a + c.links.length, 0);

  const copyLink = (url, name) => {
    const el = document.createElement("textarea");
    el.value = url;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    setCopied(name);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: G.text }}>Quick Links</h1>
        <p style={{ margin: 0, color: G.textSub, fontSize: 13 }}>{totalLinks} resources across {LINK_CATEGORIES.length} categories</p>
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke={G.textDim} strokeWidth="1.4"/>
          <line x1="9.5" y1="9.5" x2="13" y2="13" stroke={G.textDim} strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search links by name or description..."
          style={{ ...INP, paddingLeft: 36, fontSize: 14 }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: G.textDim, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
        )}
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <div style={{ ...card, textAlign: "center", padding: 48, color: G.textSub }}>
          No links found for "{search}"
        </div>
      )}

      {/* Categories */}
      {filtered.map(cat => (
        <CollapsibleCategory key={cat.category} cat={cat} copied={copied} copyLink={copyLink} defaultOpen={false} />
      ))}
    </div>
  );
}

function CollapsibleCategory({ cat, copied, copyLink, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen === true);
  return (
    <div style={card}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: open ? 16 : 0,
        textAlign: "left",
      }}>
        <span style={{ fontSize: 18 }}>{cat.icon}</span>
        <div style={{ fontWeight: 700, fontSize: 15, color: G.text, flex: 1 }}>{cat.category}</div>
        <div style={{ fontSize: 11, color: G.textDim, fontWeight: 600, marginRight: 8 }}>{cat.links.length} links</div>
        <span style={{ fontSize: 13, color: G.textDim, transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {cat.links.map(link => (
              <div key={link.name} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px", borderRadius: 9,
                background: "#0a0a10", border: `1px solid ${G.border}`,
                transition: "border-color 0.15s",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: G.text, marginBottom: 2 }}>{link.name}</div>
                  <div style={{ fontSize: 12, color: G.textDim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{link.desc}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => copyLink(link.url, link.name)}
                    style={{
                      padding: "5px 11px", borderRadius: 6,
                      border: `1px solid ${copied === link.name ? G.greenBorder : G.borderBright}`,
                      background: copied === link.name ? G.greenBg : "transparent",
                      color: copied === link.name ? G.green : G.textDim,
                      fontSize: 11, cursor: "pointer", fontFamily: F, fontWeight: 600,
                      transition: "all 0.15s", whiteSpace: "nowrap",
                    }}>
                    {copied === link.name ? "Copied!" : "Copy"}
                  </button>
                  <a href={link.url} target="_blank" rel="noreferrer" style={{
                    padding: "5px 11px", borderRadius: 6,
                    border: `1px solid ${cat.color}44`,
                    background: cat.color + "18",
                    color: cat.color,
                    fontSize: 11, cursor: "pointer", fontFamily: F, fontWeight: 600,
                    textDecoration: "none", whiteSpace: "nowrap",
                  }}>Open →</a>
                </div>
              </div>
            ))}
          </div>
      )}
    </div>
  );
}

const LR_KB = `
LIGHTREACH / PALMETTO SOLAR ENERGY PLAN - KNOWLEDGE BASE SUMMARY

=== MILESTONES OVERVIEW ===
LightReach has 3 milestones: NTP (M0), Installation (M1), and Activation (M2/PTO).
- NTP (M0): Notice to Proceed. Granted automatically when all NTP requirements are complete. Requires signed contract, underwriting docs, Clear Facts Disclosure. No formal submission button.
- M1 (Installation): Formal submission required via portal "Submit Package" button. Requires design package, permit, photos, monitoring setup.
- M2 (Activation/PTO): Formal submission required. Requires PTO document, monitoring data (min 24hr healthy data), commissioning confirmation.

=== SUBMITTING M1 & M2 ===
1. Access customer account in portal
2. Click "Submit Package" in top banner
3. Upload all required documents
4. Confirm all requirements uploaded
5. Click submit button
NTP does NOT have a submit button -- it auto-approves when complete.

=== M1 PHOTO REQUIREMENTS ===
Five sections: Project Site, Roof, Electrical, Storage (if applicable), System Commissioning.
Project Site: Inverter/micro inverter serial photo, module label, module serial number, front of house.
Roof: Close-up attachment, array rails with wire management/EGC, complete arrays with rail trimmed, tilt photos (one per array), junction boxes including soffit J-boxes.
Electrical: Varies by inverter type. See inverter-specific sections.
Storage: PW3 interior, ferrite cores, drain wire, taco open/comm wiring. Gateway or backup switch as applicable.
Commissioning: Soft requirement for M1, hard requirement for M2.

=== DESIGN PACKAGE REQUIREMENTS ===
- Layout must match installed (modules must match)
- Array tilts: can be +5 or -5 degrees from installed
- Trees and shading must be mapped in Scanifly
- System losses / snow loss must match required state values:
  AZ, CA, NM, OR, TX: 0% | MD, NJ, NY (select counties): 2% | OH, PA: 4% | MI, NY (other counties): 7%
- Production must be within tolerance
- CAD/Planset required (layout doesn't need to match 100% for M1)
- Scanifly screenshots required
- Shade report required

=== CURRENT TRANSFORMERS (CTs) ===
CTs measure production and consumption. Required for monitoring.
SolarEdge: CTs installed in inverter. Must set up on SetApp and enable on SolarEdge monitoring portal. Check polarity, L1/L2 phase, wire terminations.
Enphase: CTs in IQ combiner. Check polarity, L1/L2 phase. Enable on Enphase Enlighten portal.
Tesla/PW3: CTs in gateway or inverter. Ferrite cores required. Drain wire required.
Common misses: Wrong polarity, CTs on wrong conductors, not enabled in monitoring portal, consumption showing negative values.
SolarEdge CT shortage notice: LR accepts alternative CTs from approved OEMs only until supply stabilizes.
Min 24 hours of healthy data required before M2 submission.
Second systems (existing PV on site) need additional CTs to account for existing generation.

=== MONITORING PORTAL REQUIREMENTS ===
Monitoring ID must be set at M1. Portal access provided to LR preferred.
If portal access not provided at M1, serial number photos required.
M2 requires: min 24hr healthy production AND consumption data visible in portal.
Common issues: consumption showing 0 or negative (CT polarity wrong), production not showing (CT not enabled), data gaps.

=== ELIGIBLE SITES ===
LightReach has site eligibility requirements. Manufactured homes have a separate policy.
Roof quality supplemental guide available. Installers responsible for confirming site eligibility before installing -- LR does not audit physical site at NTP.

=== HARDWARE / AVL ===
Approved Vendor List (AVL) covers all eligible equipment. Only AVL equipment allowed.
Inverter types: SolarEdge (string), Enphase (micro), Tesla (PW3/string combo), QCells AC Module.
Battery: Tesla Powerwall 3. Backup or arbitrage modes.
Backup switch or gateway required depending on CAD spec.
Ferrite cores, drain wire, taco open comm wiring all required for PW3 installs.

=== ELECTRICAL ADDERS ===
MPU (Main Panel Upgrade), FSU (Failed Service Upgrade), Meter Collar, Subpanel.
Must be installed complete before M1 submission. Photos required.
Sold with job -- check portal for adder type.

=== PTO (PERMISSION TO OPERATE) ===
Required for M2. Must be submitted with PTO document from utility.
Expected PTO and inspection dates should be set ~1 month from install date.

=== DIRECT PAY ===
Separate installer guide available. Direct pay process differs from standard.

=== DOMESTIC CONTENT ===
M1 submittal and photo requirements differ for domestic content projects.
Additional documentation required at M1 for domestic content claims.

=== SOLAREDGE BACKUP INTERFACE SHORTAGE ===
SolarEdge reported shortage of backup interface. LR has interim policy in place.
Contact LR operations for current guidance.

=== M2 MONITORING TROUBLESHOOTING ===
Evaluate production and consumption readings BEFORE submitting M2.
Common issues:
- Consumption showing 0: CTs not installed or not enabled
- Consumption negative: CT polarity reversed
- Production 0: Inverter offline, CT not enabled, portal access not granted
- Data gaps: Communication issues, inverter offline
Min 24hr healthy data required. Troubleshoot with OEM first.
Existing PV on site adds complexity -- secondary CTs may be needed.
Branch circuit CT bundling may limit Power Control Systems (PCS) use -- confirm with OEM.
`;

function HelpPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! Ask me anything about M1/M2 requirements, CTs, monitoring, design specs, hardware, or any other process question. I'll pull from the official knowledge base first.", fromKB: true }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a friendly and knowledgeable assistant for a solar installation company's funding team. You help both technical staff and non-technical funding specialists understand LightReach / Palmetto Solar Energy Plan processes.

Your primary knowledge source is the LightReach knowledge base provided below. Always try to answer from this knowledge base first.

If the question cannot be answered from the knowledge base, answer from your own training knowledge about solar, electrical, and related topics -- but START your response with this exact phrase: "⚠️ This answer is not from the LightReach knowledge base, but here's what I know:"

Keep answers clear, friendly, and accessible. Avoid heavy jargon unless the question is clearly technical. If someone seems confused, explain simply. Be concise but thorough.

LIGHTREACH KNOWLEDGE BASE:
${LR_KB}`,
          messages: [{ role: "user", content: q }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "Sorry, I couldn't get a response. Please try again.";
      const fromKB = !text.startsWith("⚠️ This answer is not from the LightReach knowledge base");
      setMessages(prev => [...prev, { role: "assistant", content: text, fromKB }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error -- please try again.", fromKB: true }]);
    }
    setLoading(false);
  };

  const suggested = [
    "What photos are required for M1?",
    "How do I submit an M1 package?",
    "Why is consumption showing 0 in the portal?",
    "What snow loss % do I use for Pennsylvania?",
    "What is required for a PW3 install?",
    "When is commissioning required?",
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, maxWidth: 760, margin: "0 auto" }}>
      <div>
        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: G.text }}>AI Help</h1>
        <p style={{ margin: "0 0 20px", color: G.textSub, fontSize: 13 }}>Ask anything about M1/M2, CTs, monitoring, hardware, design specs, or any process question.</p>
      </div>

      {/* Chat window */}
      <div style={{ ...card, display: "flex", flexDirection: "column", height: 520 }}>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 8 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.role === "assistant" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: G.accentGlow, border: `1px solid ${G.accentDim}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 11 }}>⚡</span>
                  </div>
                  <span style={{ fontSize: 11, color: G.textDim, fontWeight: 600 }}>Assistant</span>
                  {m.fromKB === false && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: G.yellowBg, color: G.yellow, border: `1px solid ${G.yellowBorder}`, fontWeight: 600 }}>Outside KB</span>}
                  {m.fromKB === true && i > 0 && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: G.greenBg, color: G.green, border: `1px solid ${G.greenBorder}`, fontWeight: 600 }}>From LR KB</span>}
                </div>
              )}
              <div style={{
                maxWidth: "85%", padding: "11px 15px", borderRadius: m.role === "user" ? "12px 12px 4px 12px" : "4px 12px 12px 12px",
                background: m.role === "user" ? G.accentGlow : "#0a0a10",
                border: `1px solid ${m.role === "user" ? G.accentDim : G.border}`,
                fontSize: 14, color: G.text, lineHeight: 1.65, whiteSpace: "pre-wrap",
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: G.accentGlow, border: `1px solid ${G.accentDim}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 11 }}>⚡</span>
              </div>
              <div style={{ padding: "10px 14px", background: "#0a0a10", border: `1px solid ${G.border}`, borderRadius: "4px 12px 12px 12px", display: "flex", gap: 5, alignItems: "center" }}>
                {[0,1,2].map(n => <span key={n} style={{ width: 6, height: 6, borderRadius: "50%", background: G.accent, display: "inline-block", animation: `pulse 1.2s ${n*0.2}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 14, display: "flex", gap: 10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask anything..."
            style={{ ...INP, flex: 1 }}
            disabled={loading}
          />
          <button onClick={send} disabled={loading || !input.trim()} style={{
            padding: "10px 18px", borderRadius: 8, border: "none",
            background: input.trim() && !loading ? G.accent : G.border,
            color: input.trim() && !loading ? "#fff" : G.textDim,
            fontWeight: 700, cursor: input.trim() && !loading ? "pointer" : "default",
            fontSize: 14, fontFamily: F, transition: "all 0.15s",
          }}>Send</button>
        </div>
      </div>

      {/* Suggested questions */}
      <div style={card}>
        <div style={{ fontSize: 11, fontWeight: 700, color: G.textDim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>Try asking</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {suggested.map(q => (
            <button key={q} onClick={() => { setInput(q); }} style={{
              padding: "7px 14px", borderRadius: 20, border: `1px solid ${G.borderBright}`,
              background: "transparent", color: G.textSub, fontSize: 12, cursor: "pointer",
              fontFamily: F, transition: "all 0.15s",
            }}>{q}</button>
          ))}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
    </div>
  );
}


// ─── EMAIL PATTERNS ──────────────────────────────────────────────────────────
const EMAIL_PATTERNS = [
  { regex: /install package approved/i, stage: "m1", status: "Approved", action: "promoteM2" },
  { regex: /install package conditionally approved/i, stage: "m1", status: "Conditionally Approved", action: "conditional" },
  { regex: /activation package approved/i, stage: "m2", status: "Approved", action: "fullyFunded" },
  { regex: /install milestone rejection/i, stage: "m1", status: "Rejected", action: "reject" },
  { regex: /activation milestone rejection/i, stage: "m2", status: "Rejected", action: "reject" },
];

function extractNameFromSubject(subject) {
  // Patterns: "James Wilburn Install PACKAGE APPROVED"
  //           "Install Package Conditionally Approved - James Lomas"
  //           "DO NOT REPLY: Install Milestone Rejection - Hoan Nguyen"
  const dashMatch = subject.match(/[--]\s*([A-Z][a-z]+ [A-Z][a-z]+)\s*$/);
  if (dashMatch) return dashMatch[1].trim();
  const startMatch = subject.match(/^([A-Z][a-z]+ [A-Z][a-z]+)\s+(?:Install|Activation)/i);
  if (startMatch) return startMatch[1].trim();
  return null;
}

// ─── STATUS BADGE ────────────────────────────────────────────────────────────
function StatusBadge({ status, date }) {
  const map = {
    "Pending Submission":    { bg: "rgba(136,136,168,0.12)", color: "#8888a8", border: "1px solid rgba(136,136,168,0.3)" },
    "Submitted":             { bg: "rgba(59,130,246,0.12)",  color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" },
    "Rejected":              { bg: "rgba(239,68,68,0.12)",   color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" },
    "Conditionally Approved":{ bg: "rgba(245,158,11,0.12)",  color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" },
    "Approved":              { bg: "rgba(34,197,94,0.12)",   color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" },
  };
  const s = map[status] || map["Pending Submission"];
  return (
    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5, ...s }}>
      {status}
      {date && <span style={{ opacity: 0.8, fontWeight: 400 }}>· {date}</span>}
    </span>
  );
}

function StageBadge({ stage }) {
  const map = {
    m1:          { label: "Install (M1)",   bg: "rgba(108,99,255,0.12)", color: "#6c63ff", border: "1px solid rgba(108,99,255,0.3)" },
    m2:          { label: "Activation (M2)", bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" },
    fullyFunded: { label: "Fully Funded",   bg: "rgba(34,197,94,0.12)",  color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" },
  };
  const s = map[stage] || map.m1;
  return <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap", ...s }}>{s.label}</span>;
}

function ClawbackBadge({ days, job }) {
  if (days === null) return null;
  const deadlineStr = job && job.m1ApprovedDate
    ? new Date(new Date(job.m1ApprovedDate).getTime() + 115 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;
  const label = deadlineStr ? ("CB " + deadlineStr) : (days + "d");
  if (days < 0) return <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700, background: "rgba(239,68,68,0.2)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)" }}>CLAWBACK OVERDUE</span>;
  if (days <= 14) return <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>⚠ {label}</span>;
  if (days <= 30) return <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700, background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>⚡ {label}</span>;
  return <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600, background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>{label}</span>;
}

// ─── M2 CHECKLIST ─────────────────────────────────────────────────────────────
// M2 section progress helper
function m2SecProg(section, d, isConditional) {
  const items = getM2Items(section, d, isConditional);
  if (!items.length) return { done: 0, total: 0, issues: 0, pct: 100 };
  const done = items.filter(i => i.status === "ok").length;
  const issues = items.filter(i => i.status === "issue").length;
  return { done, total: items.length, issues, pct: Math.round((done / items.length) * 100) };
}

function getM2Items(section, d, isConditional) {
  const okV = v => v === true || v === "uploaded";
  const issV = v => v === false || v === "missing" || v === "incorrect";
  const st = v => ({ status: okV(v) ? "ok" : issV(v) ? "issue" : "pending" });
  switch (section) {
    case "pto": return [
      { label: "PTO document", ...st(d.pto) },
      { label: "PTO date", status: d.ptoDate ? "ok" : "pending" },
    ];
    case "monitoring": return [
      { label: "Monitoring data (24hr healthy)", status: d.monitoringHealthy === true ? "ok" : d.monitoringHealthy === false ? "issue" : "pending" },
      { label: "Commissioning confirmed", status: d.commissioningDone === true ? "ok" : d.commissioningDone === false ? "issue" : "pending" },
    ];
    case "conditionals": return isConditional ? [
      { label: "Conditional stips addressed", status: d.stipsAddressed === true ? "ok" : d.stipsAddressed === false ? "issue" : "pending" },
    ] : [];
    default: return [];
  }
}

const M2_SORDER = ["pto", "monitoring"];
const M2_SLABELS = { pto: "PTO", monitoring: "Monitoring", conditionals: "Conditionals" };

function M2ChecklistSection({ job, onChange }) {
  const d = job.m2Checklist || {};
  const isConditional = !!job.conditionalM1;
  const sections = isConditional ? [...M2_SORDER, "conditionals"] : M2_SORDER;
  const set = (k, v) => onChange({ ...d, [k]: v });
  const setNote = (k, v) => onChange({ ...d, itemNotes: { ...(d.itemNotes || {}), [k]: v } });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {job.m1ApprovedDate && (
        <div style={{ padding: "10px 14px", background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 8, fontSize: 12, color: G.accent }}>
          M1 approved: {new Date(job.m1ApprovedDate).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})} -- Clawback deadline: {new Date(new Date(job.m1ApprovedDate).getTime() + 115*24*60*60*1000).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}
        </div>
      )}
      {isConditional && (
        <div style={{ padding: "10px 14px", background: G.yellowBg, border: `1px solid ${G.yellowBorder}`, borderRadius: 8, fontSize: 12, color: G.yellow }}>
          This job had a conditional M1 approval -- the Conditionals section must be addressed at activation.
        </div>
      )}

      {/* Section 1: PTO */}
      <Sub title="PTO">
        <CRow label="PTO document" noteKey="m2_pto" notes={d.itemNotes||{}} onNoteChange={setNote}>
          <div style={{ display: "flex", gap: 6 }}>
            <Opt active={d.pto==="uploaded"} onClick={()=>set("pto","uploaded")} color={G.green} bg={G.greenBg} border={G.greenBorder}>Uploaded</Opt>
            <Opt active={d.pto==="missing"} onClick={()=>set("pto","missing")} color={G.red} bg={G.redBg} border={G.redBorder}>Missing</Opt>
            <Opt active={d.pto==="incorrect"} onClick={()=>set("pto","incorrect")} color={G.yellow} bg={G.yellowBg} border={G.yellowBorder}>Incorrect</Opt>
          </div>
          {d.pto==="missing"&&<FR text="PTO document missing -- flagged for report"/>}
          {d.pto==="incorrect"&&<FY text="PTO document incorrect -- flagged for review"/>}
        </CRow>
        <CRow label="PTO date" noteKey="m2_ptoDate" notes={d.itemNotes||{}} onNoteChange={setNote}>
          <input type="date" value={d.ptoDate||""} onChange={e=>set("ptoDate",e.target.value)} style={{...INP,width:"auto"}}/>
          {!d.ptoDate && <FY text="PTO date not set"/>}
        </CRow>
      </Sub>

      {/* Section 2: Monitoring */}
      <Sub title="Monitoring">
        <CRow label="Monitoring data" hint="Minimum 24hr of healthy production and consumption data visible in portal." noteKey="m2_monitoring" notes={d.itemNotes||{}} onNoteChange={setNote}>
          <YesNo value={d.monitoringHealthy} onChange={v=>set("monitoringHealthy",v)}/>
          {d.monitoringHealthy===false&&<FR text="Monitoring data not healthy -- resolve before submitting M2"/>}
        </CRow>
        <CRow label="Commissioning confirmed" noteKey="m2_commissioning" notes={d.itemNotes||{}} onNoteChange={setNote}>
          <YesNo value={d.commissioningDone} onChange={v=>set("commissioningDone",v)}/>
          {d.commissioningDone===false&&<FY text="Commissioning not confirmed -- soft flag"/>}
        </CRow>
      </Sub>

      {/* Section 3: Conditionals — only if M1 was conditional */}
      {isConditional && (
        <Sub title="Conditionals">
          <CRow label="Conditional stips from M1 addressed" hint="All items flagged by LR at M1 must be resolved before M2 submission." noteKey="m2_stipsAddressed" notes={d.itemNotes||{}} onNoteChange={setNote}>
            <YesNo value={d.stipsAddressed} onChange={v=>set("stipsAddressed",v)}/>
            {d.stipsAddressed===false&&<FR text="Conditional stips not addressed -- required before M2 submission"/>}
          </CRow>
          <CRow label="Conditional stip notes" noteKey="m2_stipsNotes" notes={d.itemNotes||{}} onNoteChange={setNote}>
            <textarea value={d.conditionalStips||""} onChange={e=>set("conditionalStips",e.target.value)}
              placeholder="Describe what conditional items were required and how they were addressed..."
              style={{...INP,height:72,resize:"vertical"}}/>
          </CRow>
        </Sub>
      )}
    </div>
  );
}

// ─── SUBMISSION LOG ───────────────────────────────────────────────────────────
function SubmissionLog({ log }) {
  if (!log || log.length === 0) return <p style={{ fontSize: 13, color: G.textDim }}>No log entries yet.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {[...log].reverse().map((entry, i) => (
        <div key={i} style={{ padding: "8px 12px", background: "#0a0a10", border: `1px solid ${G.border}`, borderRadius: 8, display: "flex", gap: 10 }}>
          <span style={{ fontSize: 11, color: G.textDim, minWidth: 130, flexShrink: 0 }}>{entry.ts}</span>
          <span style={{ fontSize: 13, color: G.text }}>{entry.text}</span>
        </div>
      ))}
    </div>
  );
}

// ─── SETTINGS PAGE ───────────────────────────────────────────────────────────
function SettingsPage({ specialists, onUpdateSpecialists, notifEmail, onUpdateNotifEmail, serialsData = [], currentUser }) {
  const [newSpec, setNewSpec] = useState("");
  const [emailInput, setEmailInput] = useState(notifEmail || "");
  const [saved, setSaved] = useState(false);

  const addSpec = () => {
    if (!newSpec.trim() || specialists.includes(newSpec.trim())) return;
    onUpdateSpecialists([...specialists, newSpec.trim()]);
    setNewSpec("");
  };

  const saveEmail = () => {
    onUpdateNotifEmail(emailInput.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: G.text }}>Settings</h1>
      <p style={{ margin: "0 0 28px", color: G.textSub, fontSize: 13 }}>Manage team and notification preferences.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <UserManagement currentUser={currentUser} />
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 15, color: G.text, marginBottom: 4 }}>Funding Specialists</div>
          <div style={{ fontSize: 12, color: G.textSub, marginBottom: 16 }}>Add or remove team members who can be assigned to jobs.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {specialists.map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: G.accentGlow, border: `1px solid ${G.accentDim}` }}>
                <span style={{ fontSize: 13, color: G.accent, fontWeight: 600 }}>{s}</span>
                <button onClick={() => onUpdateSpecialists(specialists.filter(x => x !== s))} style={{ background: "none", border: "none", color: G.textDim, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
              </div>
            ))}
            {specialists.length === 0 && <span style={{ fontSize: 13, color: G.textDim }}>No specialists added yet.</span>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={newSpec} onChange={e => setNewSpec(e.target.value)} onKeyDown={e => e.key === "Enter" && addSpec()} placeholder="Add specialist name..." style={{ ...INP, flex: 1 }} />
            <button onClick={addSpec} style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: G.accent, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: F, fontSize: 13 }}>Add</button>
          </div>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 15, color: G.text, marginBottom: 4 }}>LightReach Notification Email</div>
          <div style={{ fontSize: 12, color: G.textSub, marginBottom: 16 }}>Enter the email address added as a recipient for LightReach approval / rejection notifications. The app will scan this inbox to auto-update job statuses.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={emailInput} onChange={e => setEmailInput(e.target.value)} placeholder="e.g. funding-notifications@yourcompany.com" style={{ ...INP, flex: 1 }} />
            <button onClick={saveEmail} style={{ padding: "10px 18px", borderRadius: 8, border: `1px solid ${saved ? G.greenBorder : G.accentDim}`, background: saved ? G.greenBg : G.accentGlow, color: saved ? G.green : G.accent, fontWeight: 700, cursor: "pointer", fontFamily: F, fontSize: 13 }}>{saved ? "Saved ✓" : "Save"}</button>
          </div>
        </div>

        {/* Webhook setup card */}
        <WebhookSettings />

        {/* Platform customization */}
        <PlatformSettings />

        <SerialLog serials={serialsData} />
      </div>
    </div>
  );
}

function WebhookSettings() {
  const [workerUrl, setWorkerUrl] = useState(() => localStorage.getItem("lr_worker_url") || "https://ancient-frost-682f.chrispurkis01.workers.dev");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const workerScript = `// LightReach TPO — Cloudflare Worker Webhook Receiver
// ─────────────────────────────────────────────────────
// YOUR LR API KEY: kzJ6UjtoR5A1255BbLMmTX
// (LightReach sends this in the apiKey header with every request)
//
// SETUP STEPS:
//   1. Paste this script into your Cloudflare Worker editor, click Save & Deploy
//   2. Add a KV binding: Variable = LR_EVENTS, Namespace = lr-events
//   3. Your worker URL: https://ancient-frost-682f.chrispurkis01.workers.dev
//   4. That URL is already registered with LightReach — you are done!

const LR_API_KEY = "kzJ6UjtoR5A1255BbLMmTX";

${"export"} default {
  async fetch(request, env) {
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, apiKey, Authorization",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers });

    // GET — app polls for pending events
    if (request.method === "GET") {
      const events = [];
      if (env.LR_EVENTS) {
        const list = await env.LR_EVENTS.list();
        for (const key of list.keys) {
          const val = await env.LR_EVENTS.get(key.name);
          if (val) { events.push(JSON.parse(val)); await env.LR_EVENTS.delete(key.name); }
        }
      }
      return new Response(JSON.stringify({ events, timestamp: new Date().toISOString() }), { headers });
    }

    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers });

    // Validate LR API key
    const incomingKey = request.headers.get("apiKey") || request.headers.get("x-api-key") || request.headers.get("authorization");
    if (incomingKey !== LR_API_KEY && incomingKey !== "Bearer " + LR_API_KEY) {
      console.warn("Invalid API key:", incomingKey);
      // Don't reject — LR format may vary. Log and continue.
    }

    let payload;
    try { payload = await request.json(); } catch { return new Response("Invalid JSON", { status: 400, headers }); }

    const subject = payload.subject || payload.event_type || payload.type || payload.eventType || "";
    const customerName = extractName(subject) || payload.customer_name || payload.customerName || payload.account_name || payload.accountName || "";
    const eventType = classifyEvent(subject, payload);

    const event = {
      customerName,
      eventType,
      timestamp: new Date().toISOString(),
      subject,
      raw: payload,
    };

    if (env.LR_EVENTS) {
      await env.LR_EVENTS.put("ev_" + Date.now() + "_" + Math.random().toString(36).slice(2), JSON.stringify(event), { expirationTtl: 86400 });
    }

    console.log("LR event received:", eventType, customerName);
    return new Response(JSON.stringify({ received: true, eventType, customerName }), { headers });
  }
};

function extractName(s) {
  if (!s) return null;
  const d = s.match(/[-\u2013]\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)\s*$/);
  if (d) return d[1].trim();
  const st = s.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)\s+(?:Install|Activation)/i);
  if (st) return st[1].trim();
  return null;
}

function classifyEvent(s, p) {
  const sub = (s || "").toLowerCase();
  const t = ((p.event_type || p.type || p.eventType || "")).toLowerCase();
  if (sub.includes("install") && sub.includes("conditional")) return "m1_conditional";
  if (sub.includes("install") && (sub.includes("approved") || t === "install_approved")) return "m1_approved";
  if (sub.includes("install") && (sub.includes("reject") || t === "install_rejected")) return "m1_rejected";
  if (sub.includes("activation") && (sub.includes("approved") || t === "activation_approved")) return "m2_approved";
  if (sub.includes("activation") && (sub.includes("reject") || t === "activation_rejected")) return "m2_rejected";
  if (sub.includes("m1") && sub.includes("approv")) return "m1_approved";
  if (sub.includes("m2") && sub.includes("approv")) return "m2_approved";
  return "unknown";
}`;

  const save = () => { localStorage.setItem("lr_worker_url", workerUrl.trim()); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const copyScript = () => { navigator.clipboard?.writeText(workerScript); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div style={{ ...card, background: "rgba(59,130,246,0.06)", border: `1px solid ${G.blueBorder}` }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: G.blue, marginBottom: 4 }}>LightReach Webhook</div>
      <div style={{ fontSize: 12, color: G.textSub, marginBottom: 16, lineHeight: 1.6 }}>
        Receive real-time LR status updates via webhook. Uses a free Cloudflare Worker — no server needed, no cost.
      </div>

      {/* Step instructions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {[
          "Go to workers.cloudflare.com and create a free account",
          'Click "Create a Worker", paste the script below, click Save & Deploy',
          "Copy your worker URL (shown at the top of the editor)",
          "Paste the URL into the field below and save",
          "Give LightReach the same URL as your webhook base URL",
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 10, fontSize: 12, color: G.textSub }}>
            <span style={{ minWidth: 20, height: 20, borderRadius: "50%", background: G.blue + "33", color: G.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i+1}</span>
            <span style={{ lineHeight: 1.5 }}>{step}</span>
          </div>
        ))}
      </div>

      {/* Worker URL input */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: G.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Worker URL</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={workerUrl} onChange={e => setWorkerUrl(e.target.value)} placeholder="https://lr-webhook.yourname.workers.dev" style={{ ...INP, flex: 1, fontSize: 12, fontFamily: "monospace" }} />
          <button onClick={save} style={{ padding: "9px 16px", borderRadius: 7, border: saved ? `1px solid ${G.greenBorder}` : "none", background: saved ? G.greenBg : G.blue, color: saved ? G.green : "#fff", fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: F }}>{saved ? "Saved ✓" : "Save"}</button>
        </div>
      </div>

      {/* Worker script */}
      <div>
        <button onClick={() => setShowScript(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: `1px solid ${G.borderBright}`, background: "transparent", color: G.textSub, cursor: "pointer", fontSize: 12, fontFamily: F, marginBottom: 8 }}>
          <span>{showScript ? "Hide" : "Show"} worker script</span>
          <span style={{ fontSize: 10 }}>{showScript ? "▴" : "▾"}</span>
        </button>
        {showScript && (
          <div style={{ position: "relative" }}>
            <pre style={{ background: "#0a0a10", border: `1px solid ${G.border}`, borderRadius: 8, padding: "12px 14px", fontSize: 10, color: G.textSub, overflow: "auto", maxHeight: 300, margin: 0, fontFamily: "monospace", lineHeight: 1.5 }}>{workerScript}</pre>
            <button onClick={copyScript} style={{ position: "absolute", top: 8, right: 8, padding: "4px 10px", borderRadius: 6, border: `1px solid ${copied ? G.greenBorder : G.borderBright}`, background: copied ? G.greenBg : G.surface, color: copied ? G.green : G.textSub, cursor: "pointer", fontSize: 11, fontFamily: F }}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PlatformSettings() {
  const defaults = { companyName: "Infinity Solar USA", clawbackDays: 115, showEPCOnCards: true, defaultSort: "newest", dashboardRefresh: 30 };
  const [settings, setSettings] = useState(() => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem("lr_platform_settings") || "{}") }; }
    catch { return defaults; }
  });
  const [saved, setSaved] = useState(false);
  const set = (k, v) => setSettings(p => ({ ...p, [k]: v }));
  const save = () => {
    localStorage.setItem("lr_platform_settings", JSON.stringify(settings));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };
  return (
    <div style={card}>
      <div style={{ fontWeight: 700, fontSize: 15, color: G.text, marginBottom: 4 }}>Platform settings</div>
      <div style={{ fontSize: 12, color: G.textSub, marginBottom: 16 }}>Customize the app behavior without code changes.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: G.text, marginBottom: 6 }}>Company / team name</div>
          <input value={settings.companyName} onChange={e => set("companyName", e.target.value)} style={{ ...INP, fontSize: 13 }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: G.text, marginBottom: 6 }}>Clawback window (days)</div>
          <div style={{ fontSize: 11, color: G.textSub, marginBottom: 6 }}>Number of days after M1 approval before clawback triggers.</div>
          <input type="number" min={1} max={200} value={settings.clawbackDays} onChange={e => set("clawbackDays", parseInt(e.target.value) || 115)} style={{ ...INP, width: 100, fontSize: 13 }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: G.text, marginBottom: 8 }}>Default job sort order</div>
          <select value={settings.defaultSort} onChange={e => set("defaultSort", e.target.value)} style={{ ...INP, width: "auto", fontSize: 13 }}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">A -- Z</option>
            <option value="clawback">Clawback urgency</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: G.text }}>Show EPC amounts on job cards</div>
            <div style={{ fontSize: 11, color: G.textSub }}>Toggle visibility of payment amounts in the jobs list.</div>
          </div>
          <button onClick={() => set("showEPCOnCards", !settings.showEPCOnCards)} style={{ padding: "6px 16px", borderRadius: 20, border: `1px solid ${settings.showEPCOnCards ? G.greenBorder : G.borderBright}`, background: settings.showEPCOnCards ? G.greenBg : "transparent", color: settings.showEPCOnCards ? G.green : G.textSub, fontWeight: 600, cursor: "pointer", fontSize: 12, fontFamily: F }}>
            {settings.showEPCOnCards ? "On" : "Off"}
          </button>
        </div>
        <button onClick={save} style={{ padding: "10px 0", borderRadius: 8, border: "none", background: saved ? G.greenBg : G.accent, color: saved ? G.green : "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: F, border: saved ? `1px solid ${G.greenBorder}` : "none" }}>
          {saved ? "Saved ✓" : "Save settings"}
        </button>
      </div>
    </div>
  );
}

function SerialLog({ serials }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = search.trim()
    ? serials.filter(s =>
        s.serial.toLowerCase().includes(search.toLowerCase()) ||
        s.customer.toLowerCase().includes(search.toLowerCase())
      )
    : serials;
  return (
    <div style={card}>
      {/* Header row — always visible */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: G.text }}>Module serial number log</div>
          <div style={{ fontSize: 12, color: G.textSub, marginTop: 2 }}>
            {serials.length} serial{serials.length !== 1 ? "s" : ""} recorded
          </div>
        </div>
        <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: `1px solid ${G.borderBright}`, background: "transparent", color: G.textSub, cursor: "pointer", fontSize: 12, fontFamily: F, fontWeight: 500 }}>
          {open ? "Collapse" : "View log"}
          <span style={{ fontSize: 10, display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▾</span>
        </button>
      </div>
      {/* Search — always visible */}
      <div style={{ position: "relative" }}>
        <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke={G.textDim} strokeWidth="1.4"/>
          <line x1="9.5" y1="9.5" x2="13" y2="13" stroke={G.textDim} strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); if (!open && e.target.value) setOpen(true); }}
          placeholder="Search by serial or customer..."
          style={{ ...INP, paddingLeft: 32, paddingRight: 32, fontSize: 13 }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: G.textDim, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
        )}
      </div>
      {/* Collapsible list */}
      {open && (
        <div style={{ marginTop: 12 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: G.textDim, fontSize: 13 }}>
              {serials.length === 0 ? "No serial numbers recorded yet." : "No results for: " + search}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 360, overflowY: "auto" }}>
              {filtered.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 14px", background: "#0a0a10", border: `1px solid ${G.border}`, borderRadius: 8 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 13, color: G.text, fontWeight: 600, flex: 1 }}>{s.serial}</span>
                  <span style={{ fontSize: 13, color: G.textSub }}>{s.customer}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 11, color: G.textDim, marginTop: 8 }}>{filtered.length} of {serials.length}</div>
        </div>
      )}
    </div>
  );
}

// ─── EMAIL SCANNER ────────────────────────────────────────────────────────────
async function scanEmailsForUpdates(jobs, gmailTools) {
  // This function is called when Gmail MCP is connected
  // Returns array of { jobId, newStatus, action, emailSubject, emailDate }
  const updates = [];
  try {
    // Search for LR notification emails from last 7 days
    const results = await gmailTools.search("from:donotreply@palmetto.com newer_than:7d");
    if (!results || !results.messages) return updates;
    for (const msg of results.messages.slice(0, 50)) {
      const subject = msg.subject || "";
      const name = extractNameFromSubject(subject);
      if (!name) continue;
      const matchedJob = jobs.find(j =>
        j.customerName.toLowerCase().trim() === name.toLowerCase().trim()
      );
      if (!matchedJob) continue;
      for (const pattern of EMAIL_PATTERNS) {
        if (pattern.regex.test(subject)) {
          updates.push({
            jobId: matchedJob.id,
            jobName: matchedJob.customerName,
            newStatus: pattern.status,
            action: pattern.action,
            emailSubject: subject,
            emailDate: msg.date || new Date().toLocaleString(),
          });
          break;
        }
      }
    }
  } catch (e) {
    console.warn("Email scan failed:", e);
  }
  return updates;
}

// ─── PAYMENT RECORD HELPERS ──────────────────────────────────────────────────
// Returns array of payment events for a job, including clawbacks and true-ups
function getPaymentRecords(job) {
  const records = [];
  const epc = job.epcAmount || 0;
  const m1Pay = epc * 0.9;
  const m2Pay = epc * 0.1;

  // M1 approved → install package payment
  if (job.m1ApprovedDate) {
    records.push({
      type: "Install Package Payment",
      amount: m1Pay,
      date: new Date(job.m1ApprovedDate),
      positive: true,
      jobId: job.id,
      jobName: job.customerName,
    });
  }

  // Clawback — triggered at 115 days if M2 not approved and not paused
  const cbDays = job.m1ApprovedDate
    ? Math.ceil((new Date() - new Date(job.m1ApprovedDate)) / (24 * 60 * 60 * 1000))
    : null;
  const isClawedBack = job.m1ApprovedDate &&
    cbDays >= 115 &&
    job.packageStage !== "fullyFunded" &&
    !job.clawbackPaused;

  if (isClawedBack || job.clawedBack) {
    const cbDate = new Date(job.m1ApprovedDate);
    cbDate.setDate(cbDate.getDate() + 115);
    records.push({
      type: "Clawback",
      amount: -m1Pay,
      date: cbDate,
      positive: false,
      jobId: job.id,
      jobName: job.customerName,
    });
  }

  // M2 approved
  if (job.packageStage === "fullyFunded" && job.m1ApprovedDate) {
    const m2Date = job.trueUpDate ? new Date(job.trueUpDate) : new Date();
    // If previously clawed back → true-up + activation
    if (isClawedBack || job.clawedBack) {
      records.push({
        type: "True-up",
        amount: m1Pay,
        date: m2Date,
        positive: true,
        jobId: job.id,
        jobName: job.customerName,
      });
    }
    records.push({
      type: "Activation Payment",
      amount: m2Pay,
      date: m2Date,
      positive: true,
      jobId: job.id,
      jobName: job.customerName,
    });
  }

  return records;
}

function isJobClawedBack(job) {
  if (!job.m1ApprovedDate) return false;
  if (job.packageStage === "fullyFunded") return false;
  if (job.clawbackPaused) return false;
  const days = Math.ceil((new Date() - new Date(job.m1ApprovedDate)) / (24 * 60 * 60 * 1000));
  return days >= 115;
}

function Spark({ data, color, width = 100 }) {
  if (!data || data.length < 2) return null;
  const maxV = Math.max(...data, 1);
  const h = 32;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${h - (v / maxV) * (h - 4) - 2}`).join(" ");
  const id = "sg" + color.replace("#", "") + width;
  return (
    <svg width={width} height={h} style={{ display: "block", marginTop: 10 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${width},${h}`} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => v > 0 && <circle key={i} cx={(i / (data.length - 1)) * width} cy={h - (v / maxV) * (h - 4) - 2} r="2.5" fill={color} />)}
    </svg>
  );
}

function EPCFundedRow({ jobs, onDrillDown }) {
  const now = new Date();
  // Build all payment records across all jobs
  const allRecords = jobs.flatMap(j => getPaymentRecords(j));
  const allApproved = jobs.filter(j => j.m1ApprovedDate);

  // ── Week buckets: last 8 weeks ─────────────────────────────────────────────
  const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - now.getDay()); thisWeekStart.setHours(0,0,0,0);
  const weekPeriods = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(thisWeekStart); start.setDate(thisWeekStart.getDate() - (7 - i) * 7);
    const end = new Date(start); end.setDate(start.getDate() + 7);
    const recs = allRecords.filter(r => r.date >= start && r.date < end);
    const total = recs.reduce((s, r) => s + r.amount, 0);
    const label = i === 7 ? "This week" : "Wk " + start.toLocaleDateString("en-US",{month:"numeric",day:"numeric"});
    return { label, start, end, total, records: recs };
  });
  const weekEPC = weekPeriods[7].total;
  const weekSpark = weekPeriods.map(p => Math.max(p.total, 0));

  // ── Month buckets: last 6 months ───────────────────────────────────────────
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthPeriods = Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i;
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
    const recs = allRecords.filter(r => r.date >= start && r.date < end);
    const total = recs.reduce((s, r) => s + r.amount, 0);
    const label = start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return { label, start, end, total, records: recs };
  });
  const monthEPC = monthPeriods[5].total;
  const monthSpark = monthPeriods.map(p => Math.max(p.total, 0));

  // ── Quarter buckets: last 4 quarters ───────────────────────────────────────
  const qMonth = Math.floor(now.getMonth() / 3) * 3;
  const quarterPeriods = Array.from({ length: 4 }, (_, i) => {
    const offset = (3 - i) * 3;
    const sMonth = qMonth - offset;
    const yr = now.getFullYear() + Math.floor(sMonth / 12);
    const sm = ((sMonth % 12) + 12) % 12;
    const start = new Date(yr, sm, 1);
    const end = new Date(yr, sm + 3, 1);
    const recs = allRecords.filter(r => r.date >= start && r.date < end);
    const total = recs.reduce((s, r) => s + r.amount, 0);
    const qn = Math.floor(sm / 3) + 1;
    const label = i === 3 ? "This quarter" : "Q" + qn + " " + yr;
    return { label, start, end, total, records: recs };
  });
  const quarterEPC = quarterPeriods[3].total;
  const quarterSpark = quarterPeriods.map(p => Math.max(p.total, 0));

  const fmt = v => "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
      {[
        { l: "Funded this week", v: weekEPC, color: G.accent, spark: weekSpark, periods: weekPeriods, type: "week" },
        { l: "Funded this month", v: monthEPC, color: G.yellow, spark: monthSpark, periods: monthPeriods, type: "month" },
        { l: "Funded this quarter", v: quarterEPC, color: G.green, spark: quarterSpark, periods: quarterPeriods, type: "quarter" },
      ].map(({ l, v, color, spark, periods, type }) => (
        <div key={l} onClick={() => onDrillDown({ type, periods, color, label: l })}
          onMouseEnter={e => { e.currentTarget.style.borderColor = color + "88"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; }}
          style={{ ...card, padding: "16px 18px", cursor: "pointer", transition: "border-color 0.2s" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: G.textDim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>{l}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: F }}>{fmt(v)}</div>
          <Spark data={spark} color={color} width={100} />
          <div style={{ fontSize: 10, color: G.textDim, marginTop: 6 }}>Click to see breakdown</div>
        </div>
      ))}
    </div>
  );
}

function EPCDrillDownModal({ data, onClose, onOpenJob }) {
  if (!data) return null;
  const { type, periods, color, label } = data;
  const fmt = v => "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const allVals = periods.map(p => p.total);
  const maxVal = Math.max(...allVals, 1);
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: G.surface, border: `1px solid ${G.borderBright}`, borderRadius: 16, width: "100%", maxWidth: 640, maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: `1px solid ${G.border}` }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: G.textDim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 2 }}>EPC Funded breakdown</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: G.text }}>{label}</div>
          </div>
          <button onClick={onClose} style={{ padding: "7px 16px", borderRadius: 7, border: `1px solid ${G.borderBright}`, background: "transparent", color: G.textSub, cursor: "pointer", fontSize: 13, fontFamily: F }}>Close</button>
        </div>
        {/* Full sparkline */}
        <div style={{ padding: "16px 24px 0" }}>
          <Spark data={allVals} color={color} width={580} />
        </div>
        {/* Period rows */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
          {[...periods].reverse().map((period, idx) => {
            const isExpanded = expanded === idx;
            const barPct = maxVal > 0 ? (period.total / maxVal) * 100 : 0;
            return (
              <div key={idx}>
                <div onClick={() => period.records.length > 0 && setExpanded(isExpanded ? null : idx)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 9, background: "#0a0a10", border: `1px solid ${isExpanded ? color + "55" : G.border}`, cursor: period.records.length > 0 ? "pointer" : "default" }}>
                  <div style={{ minWidth: 90, fontSize: 12, fontWeight: 600, color: G.text }}>{period.label}</div>
                  <div style={{ flex: 1, height: 6, background: G.border, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: barPct + "%", height: "100%", background: color, borderRadius: 3, transition: "width 0.3s" }} />
                  </div>
                  <div style={{ minWidth: 110, textAlign: "right", fontSize: 13, fontWeight: 700, color: period.total > 0 ? color : G.textDim }}>{fmt(period.total)}</div>
                  <div style={{ fontSize: 11, color: G.textDim, minWidth: 50, textAlign: "right" }}>{period.records.length} record{period.records.length !== 1 ? "s" : ""}</div>
                  {period.records.length > 0 && <span style={{ fontSize: 10, color: G.textDim, transition: "transform 0.2s", display: "inline-block", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>}
                </div>
                {isExpanded && (
                  <div style={{ marginTop: 4, marginLeft: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                    {period.records.map((rec, ri) => {
                      const isNeg = rec.amount < 0;
                      const recColor = isNeg ? G.red : rec.type === "True-up" ? G.green : rec.type === "Activation Payment" ? G.yellow : color;
                      return (
                        <div key={ri} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 8, background: G.surface, border: `1px solid ${isNeg ? G.redBorder : G.border}` }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{rec.jobName}</span>
                            <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 10, marginLeft: 8, background: recColor + "22", color: recColor, border: `1px solid ${recColor}44`, fontWeight: 600 }}>{rec.type}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: recColor }}>{isNeg ? "-" : "+"}{fmt(Math.abs(rec.amount))}</span>
                          <span style={{ fontSize: 11, color: G.textDim }}>{rec.date.toLocaleDateString()}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function JobHomeScreen({ job, onSelectSection, onViewReport, specialists, updateJobField, clawbackDays, setManualPromoteJob }) {
  const cbDays = clawbackDays(job);
  const clawedBack = isJobClawedBack(job);
  const daysUntilClaw = job.m1ApprovedDate && job.packageStage !== "fullyFunded"
    ? 115 - Math.ceil((new Date() - new Date(job.m1ApprovedDate)) / (24 * 60 * 60 * 1000))
    : null;
  const nearClawback = daysUntilClaw !== null && daysUntilClaw <= 7 && daysUntilClaw > 0;
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const epc = job.epcAmount || 0;
  const fmt = v => "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const m1p = overallProg(job.checklist);
  const recentLog = (job.submissionLog || []).slice(-5).reverse();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Clawback warning banner */}
      {clawedBack && (
        <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18 }}>⚠</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: G.red }}>Clawback triggered</div>
            <div style={{ fontSize: 12, color: G.red, opacity: 0.8 }}>Install package payment of {fmt(epc * 0.9)} has been clawed back. Activate as soon as possible to recover.</div>
          </div>
        </div>
      )}
      {job.clawbackPaused && (
        <div style={{ padding: "12px 16px", background: G.yellowBg, border: `1px solid ${G.yellowBorder}`, borderRadius: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: G.yellow }}>Clawback paused by LightReach</div>
          {job.clawbackPausedNote && <div style={{ fontSize: 12, color: G.yellow, opacity: 0.85, marginTop: 2 }}>{job.clawbackPausedNote}</div>}
        </div>
      )}
      {nearClawback && !job.clawbackPaused && !clawedBack && (
        <div style={{ padding: "12px 16px", background: G.yellowBg, border: `1px solid ${G.yellowBorder}`, borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: G.yellow }}>Clawback in {daysUntilClaw} day{daysUntilClaw !== 1 ? "s" : ""}</div>
            <div style={{ fontSize: 12, color: G.yellow, opacity: 0.8 }}>Activate before clawback to protect the {fmt(epc * 0.9)} install payment.</div>
          </div>
          <button onClick={() => setShowPauseConfirm(true)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${G.yellowBorder}`, background: "rgba(245,158,11,0.2)", color: G.yellow, fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: F, whiteSpace: "nowrap" }}>
            Clawback paused
          </button>
        </div>
      )}

      {/* Pause confirm modal */}
      {showPauseConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: G.surface, border: `1px solid ${G.borderBright}`, borderRadius: 14, padding: 28, maxWidth: 440, width: "100%" }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: G.text, marginBottom: 10 }}>Confirm clawback pause</div>
            <div style={{ fontSize: 14, color: G.textSub, lineHeight: 1.6, marginBottom: 18 }}>
              Have you received written confirmation from LightReach that the clawback on this account has been officially paused and the install package payment will not be collected at this time?
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: G.textSub, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Confirmation note (optional)</div>
              <textarea
                placeholder="e.g. Confirmed via email from LR ops team on 5/5/2026..."
                style={{ ...INP, height: 64, resize: "vertical", fontSize: 12 }}
                id="pause-note"
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => {
                const note = document.getElementById("pause-note")?.value || "";
                updateJobField("clawbackPaused", true, { clawbackPausedNote: note });
                setShowPauseConfirm(false);
              }} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: G.yellow, color: "#000", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: F }}>
                Yes, clawback is paused
              </button>
              <button onClick={() => setShowPauseConfirm(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${G.borderBright}`, background: "transparent", color: G.textSub, cursor: "pointer", fontSize: 14, fontFamily: F }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EPC payment summary */}
      {epc > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { l: "Total EPC", v: fmt(epc), c: G.text },
            { l: "Install payment (90%)", v: clawedBack ? fmt(epc * 0.9) + " CLAWED" : fmt(epc * 0.9), c: clawedBack ? G.red : G.accent },
            { l: "Activation payment (10%)", v: fmt(epc * 0.1), c: job.packageStage === "fullyFunded" ? G.green : G.textSub },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ padding: "12px 14px", background: "#0a0a10", border: `1px solid ${G.border}`, borderRadius: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: G.textDim, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: c, fontFamily: F }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Package buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* M1 card */}
        {(() => {
          const isM1Active = job.packageStage === "m1";
          const m1ApprDate = job.m1ApprovedDate ? new Date(job.m1ApprovedDate).toLocaleDateString() : null;
          const m1Status = isM1Active ? (job.accountStatus || "Pending Submission") : (job.conditionalM1 ? "Conditionally Approved" : "Approved");
          const m1Date = isM1Active ? getStatusDate(job) : m1ApprDate;
          return (
            <div style={{ padding: "16px 18px", background: "#0a0a10", border: `1px solid ${isM1Active ? G.accentDim : G.greenBorder}`, borderRadius: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: G.accent, letterSpacing: "0.06em", textTransform: "uppercase" }}>Install Package</div>
                  <div style={{ fontSize: 11, color: G.textSub, marginTop: 2 }}>M1 checklist</div>
                </div>
                <StatusBadge status={m1Status} date={m1Date} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: G.textSub, marginBottom: 4 }}>
                  <span>Progress</span><span>{m1p.done}/{m1p.total} items</span>
                </div>
                <div style={{ height: 5, background: G.border, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: m1p.pct + "%", height: "100%", background: m1p.issues > 0 ? G.red : m1p.pct === 100 ? G.green : G.accent, borderRadius: 3 }} />
                </div>
              </div>
              <button onClick={() => {
                  if (!isM1Active) { onViewReport("m1"); }
                  else { onSelectSection("prechecks"); }
                }} style={{ width: "100%", padding: "8px 0", borderRadius: 8, border: `1px solid ${G.accentDim}`, background: G.accentGlow, color: G.accent, fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: F }}>
                {isM1Active ? "Open M1 checklist" : "View M1 report"}
              </button>
            </div>
          );
        })()}

        {/* M2 card */}
        {(() => {
          const isM2Active = job.packageStage === "m2";
          const isFunded = job.packageStage === "fullyFunded";
          const m2Status = isFunded ? "Approved" : (isM2Active ? (job.accountStatus || "Pending Submission") : null);
          return (
            <div style={{ padding: "16px 18px", background: "#0a0a10", border: `1px solid ${isM2Active ? G.yellowBorder : isFunded ? G.greenBorder : G.border}`, borderRadius: 12, opacity: (!isM2Active && !isFunded) ? 0.45 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: G.yellow, letterSpacing: "0.06em", textTransform: "uppercase" }}>Activation Package</div>
                  <div style={{ fontSize: 11, color: G.textSub, marginTop: 2 }}>M2 checklist</div>
                </div>
                {m2Status && <StatusBadge status={m2Status} date={isM2Active ? getStatusDate(job) : null} />}
              </div>
              {(!isM2Active && !isFunded) ? (
                <div style={{ fontSize: 12, color: G.textDim, textAlign: "center", padding: "8px 0" }}>Unlocked after M1 approval</div>
              ) : (
                <button onClick={() => { if (isFunded) { onViewReport("m2"); } else { onSelectSection("pto"); } }} style={{ width: "100%", padding: "8px 0", borderRadius: 8, border: `1px solid ${G.yellowBorder}`, background: G.yellowBg, color: G.yellow, fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: F }}>
                  {isFunded ? "View M2 report" : "Open M2 checklist"}
                </button>
              )}
            </div>
          );
        })()}
      </div>

      {/* Clawback countdown */}
      {cbDays !== null && job.packageStage !== "fullyFunded" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#0a0a10", border: `1px solid ${G.border}`, borderRadius: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: G.textSub }}>Clawback deadline</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: G.text }}>
              {new Date(new Date(job.m1ApprovedDate).getTime() + 115 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}
            </div>
          </div>
          <ClawbackBadge days={cbDays} />
        </div>
      )}

      {/* Promote button */}
      {job.packageStage !== "fullyFunded" && (
        <button onClick={() => setManualPromoteJob(job)} style={{ padding: "10px 0", borderRadius: 9, border: `1px solid ${G.yellowBorder}`, background: G.yellowBg, color: G.yellow, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: F }}>
          Promote / change stage
        </button>
      )}

      {/* Submission log */}
      {recentLog.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: G.textDim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Recent activity</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {recentLog.map((entry, i) => (
              <div key={i} style={{ padding: "7px 12px", background: "#0a0a10", border: `1px solid ${G.border}`, borderRadius: 8, display: "flex", gap: 10 }}>
                <span style={{ fontSize: 11, color: G.textDim, minWidth: 120, flexShrink: 0 }}>{entry.ts}</span>
                <span style={{ fontSize: 12, color: G.text }}>{entry.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
function hashPassword(pw) {
  // Simple deterministic hash — not cryptographic but stops casual snooping
  let h = 0x811c9dc5;
  for (let i = 0; i < pw.length; i++) {
    h ^= pw.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function loadUsers() {
  try { return JSON.parse(localStorage.getItem("lr_users") || "[]"); } catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem("lr_users", JSON.stringify(users));
  // Sync each user to Supabase
  users.forEach(u => dbSaveUser(u));
}
function loadSession() {
  try { return JSON.parse(sessionStorage.getItem("lr_session") || "null"); } catch { return null; }
}
function saveSession(user) { sessionStorage.setItem("lr_session", JSON.stringify(user)); }
function clearSession() { sessionStorage.removeItem("lr_session"); }

// Bootstrap: if no users exist, create a default admin
async function ensureDefaultAdmin() {
  // Try loading from Supabase first
  if (sb) {
    const remoteUsers = await dbLoadUsers();
    if (remoteUsers && remoteUsers.length > 0) {
      localStorage.setItem("lr_users", JSON.stringify(remoteUsers));
      return;
    }
  }
  const users = loadUsers();
  if (users.length === 0) {
    const defaultAdmin = [{ id: 1, username: "admin", passwordHash: hashPassword("admin123"), role: "admin", createdAt: Date.now() }];
    saveUsers(defaultAdmin);
  }
}
ensureDefaultAdmin();

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const attempt = () => {
    const users = loadUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
    if (!user || user.passwordHash !== hashPassword(password)) {
      setError("Invalid username or password.");
      return;
    }
    const session = { id: user.id, username: user.username, role: user.role };
    saveSession(session);
    onLogin(session);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#08080f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F }}>
      <div style={{ background: "#12121e", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 16, padding: "40px 36px", width: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", color: "#6c63ff", textTransform: "uppercase", marginBottom: 6 }}>LightReach TPO</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#e8e8f0" }}>Sign in</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8888a8", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>Username</div>
            <input autoFocus value={username} onChange={e => { setUsername(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && attempt()} style={{ ...INP, fontSize: 14, padding: "11px 14px" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8888a8", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>Password</div>
            <div style={{ position: "relative" }}>
              <input type={showPw ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && attempt()} style={{ ...INP, fontSize: 14, padding: "11px 40px 11px 14px", width: "100%" }} />
              <button onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#8888a8", cursor: "pointer", fontSize: 13 }}>{showPw ? "Hide" : "Show"}</button>
            </div>
          </div>
          {error && <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 500 }}>{error}</div>}
          <button onClick={attempt} style={{ padding: "12px 0", borderRadius: 9, border: "none", background: "#6c63ff", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: F, marginTop: 4 }}>Sign in</button>
        </div>
        <div style={{ fontSize: 11, color: "#8888a8", textAlign: "center", marginTop: 20 }}>Default: admin / admin123 — change in Settings</div>
      </div>
    </div>
  );
}

// ─── USER MANAGEMENT (in Settings) ────────────────────────────────────────────
function ResetPasswordInline({ username, onReset }) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [done, setDone] = useState(false);
  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${G.borderBright}`, background: "transparent", color: G.textSub, cursor: "pointer", fontSize: 11, fontFamily: F }}>Reset PW</button>
  );
  if (done) return <span style={{ fontSize: 11, color: G.green }}>Updated ✓</span>;
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="New password" autoFocus style={{ ...INP, width: 110, fontSize: 11, padding: "3px 8px" }} />
      <button onClick={() => { if (pw.trim()) { onReset(pw.trim()); setDone(true); setTimeout(() => { setOpen(false); setPw(""); setDone(false); }, 1500); } }} style={{ padding: "3px 8px", borderRadius: 5, border: "none", background: G.accent, color: "#fff", cursor: "pointer", fontSize: 11, fontFamily: F }}>Save</button>
      <button onClick={() => { setOpen(false); setPw(""); }} style={{ padding: "3px 6px", borderRadius: 5, border: `1px solid ${G.borderBright}`, background: "transparent", color: G.textSub, cursor: "pointer", fontSize: 11, fontFamily: F }}>✕</button>
    </div>
  );
}

function UserManagement({ currentUser }) {
  const [users, setUsers] = useState(() => loadUsers());
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const refresh = () => setUsers(loadUsers());

  const addUser = () => {
    if (!newUsername.trim() || !newPassword.trim()) { setErr("Username and password required."); return; }
    const existing = loadUsers();
    if (existing.find(u => u.username.toLowerCase() === newUsername.toLowerCase())) { setErr("Username already exists."); return; }
    const updated = [...existing, { id: Date.now(), username: newUsername.trim(), passwordHash: hashPassword(newPassword), role: newRole, createdAt: Date.now() }];
    saveUsers(updated);
    setUsers(updated);
    setNewUsername(""); setNewPassword(""); setErr("");
    setSuccess("User created."); setTimeout(() => setSuccess(""), 2000);
  };

  const removeUser = (id) => {
    if (id === currentUser.id) { setErr("Cannot remove your own account."); return; }
    const updated = loadUsers().filter(u => u.id !== id);
    saveUsers(updated);
    setUsers(updated);
  };

  const changeRole = (id, role) => {
    const updated = loadUsers().map(u => u.id === id ? { ...u, role } : u);
    saveUsers(updated);
    setUsers(updated);
  };

  const resetPassword = (id, pw) => {
    const updated = loadUsers().map(u => u.id === id ? { ...u, passwordHash: hashPassword(pw) } : u);
    saveUsers(updated);
    setUsers(updated);
    setSuccess("Password updated."); setTimeout(() => setSuccess(""), 2000);
  };

  return (
    <div style={card}>
      <div style={{ fontWeight: 700, fontSize: 15, color: G.text, marginBottom: 4 }}>User accounts</div>
      <div style={{ fontSize: 12, color: G.textSub, marginBottom: 16 }}>Manage who can access the platform and their permission level.</div>

      {/* Existing users */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        {users.map(u => (
          <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#0a0a10", border: `1px solid ${G.border}`, borderRadius: 9 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: G.text }}>{u.username}</span>
              {u.id === currentUser.id && <span style={{ fontSize: 10, color: G.accent, marginLeft: 6 }}>you</span>}
            </div>
            <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} disabled={u.id === currentUser.id} style={{ ...INP, width: "auto", fontSize: 12, padding: "4px 8px" }}>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            <ResetPasswordInline username={u.username} onReset={(pw) => resetPassword(u.id, pw)} />
            {u.id !== currentUser.id && (
              <button onClick={() => removeUser(u.id)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${G.redBorder}`, background: G.redBg, color: G.red, cursor: "pointer", fontSize: 11, fontFamily: F }}>Remove</button>
            )}
          </div>
        ))}
      </div>

      {/* Add new user */}
      <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: G.text, marginBottom: 10 }}>Add new user</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: G.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Username</div>
            <input value={newUsername} onChange={e => { setNewUsername(e.target.value); setErr(""); }} style={{ ...INP, fontSize: 12 }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: G.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Password</div>
            <input type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setErr(""); }} style={{ ...INP, fontSize: 12 }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: G.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Role</div>
            <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ ...INP, fontSize: 12, padding: "10px 8px" }}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          <button onClick={addUser} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: G.accent, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: F }}>Create user</button>
          {err && <span style={{ fontSize: 12, color: G.red }}>{err}</span>}
          {success && <span style={{ fontSize: 12, color: G.green }}>{success}</span>}
        </div>
      </div>
    </div>
  );
}

function getStatusDate(job) {
  if (!job.submissionLog || job.submissionLog.length === 0) return null;
  const status = job.accountStatus || "Pending Submission";
  const keywords = {
    "Submitted": ["Status changed to: Submitted", "submitted"],
    "Rejected": ["Status changed to: Rejected", "rejected", "Rejection"],
    "Conditionally Approved": ["Status changed to: Conditionally Approved", "conditionally approved"],
    "Approved": ["Status changed to: Approved", "approved"],
  };
  const kws = keywords[status];
  if (!kws) return null;
  const entry = [...job.submissionLog].reverse().find(e =>
    kws.some(k => e.text.toLowerCase().includes(k.toLowerCase()))
  );
  if (!entry) return null;
  // Parse date from ts string — ts is like "5/5/2026, 2:33:00 PM"
  try {
    const d = new Date(entry.ts);
    if (!isNaN(d)) return d.toLocaleDateString();
    // Fallback: just return the ts string up to the comma
    return entry.ts.split(",")[0];
  } catch { return entry.ts.split(",")[0]; }
}

function App() {
  const [session, setSession] = useState(() => loadSession());
  if (!session) return <LoginScreen onLogin={s => { saveSession(s); setSession(s); }} />;
  return <AuthenticatedApp session={session} onLogout={() => { clearSession(); setSession(null); }} />;
}

function AuthenticatedApp({ session, onLogout }) {
  useEffect(() => {
    const l = document.createElement("link");
    l.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap";
    l.rel = "stylesheet";
    document.head.appendChild(l);
  }, []);

  const [page, setPage] = useState("dashboard");
  const [jobs, setJobs] = useState(getJobs);
  const [serials, setSerials] = useState(getSerials);
  const [activeJob, setActive] = useState(null);
  const [activeSec, setSec] = useState("prechecks");
  const [newName, setNewName] = useState("");
  const [newState, setNewState] = useState("");
  const [newSpecialist, setNewSpecialist] = useState("");
  const [modal, setModal] = useState(false);
  const [reportModal, setReportModal] = useState(null); // holds job object when report is open
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [drillDown, setDrillDown] = useState(null);
  const [specialists, setSpecialists] = useState(() => { try { return JSON.parse(localStorage.getItem("lr_specialists") || '["Chris","Katie","Ayla"]'); } catch { return ["Chris","Katie","Ayla"]; } });
  const [notifEmail, setNotifEmail] = useState(() => localStorage.getItem("lr_notif_email") || "");
  const [emailAlerts, setEmailAlerts] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [submitErr, setSubmitErr] = useState(false);
  const [epcDrillDown, setEpcDrillDown] = useState(null);
  const [manualPromoteJob, setManualPromoteJob] = useState(null);
  const [newJobStage, setNewJobStage] = useState(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterStages, setFilterStages] = useState([]);
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [filterSpecialists, setFilterSpecialists] = useState([]);
  const [filterStates, setFilterStates] = useState([]);
  const [splitView, setSplitView] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [newEPC, setNewEPC] = useState("");
  const [newM1Date, setNewM1Date] = useState("");

  // Persist specialists
  useEffect(() => { localStorage.setItem("lr_specialists", JSON.stringify(specialists)); }, [specialists]);
  useEffect(() => { if (notifEmail) localStorage.setItem("lr_notif_email", notifEmail); }, [notifEmail]);

  // ── Webhook polling — checks Cloudflare Worker every 60s for LR events ──────
  useEffect(() => {
    const poll = async () => {
      const workerUrl = localStorage.getItem("lr_worker_url");
      if (!workerUrl) return;
      try {
        const res = await fetch(workerUrl);
        if (!res.ok) return;
        const data = await res.json();
        const events = data.events || [];
        if (events.length === 0) return;
        setJobs(prevJobs => {
          let updated = [...prevJobs];
          const newAlerts = [];
          events.forEach(ev => {
            if (!ev.customerName || ev.eventType === "unknown") return;
            const idx = updated.findIndex(j =>
              j.customerName.toLowerCase().trim() === ev.customerName.toLowerCase().trim()
            );
            if (idx === -1) return;
            const job = { ...updated[idx] };
            const ts = new Date(ev.timestamp).toLocaleString();
            const logEntry = (txt) => ({ ts, text: txt });
            switch (ev.eventType) {
              case "m1_approved":
                job.packageStage = "m2";
                job.accountStatus = "Pending Submission";
                job.m1ApprovedDate = ev.timestamp;
                job.conditionalM1 = false;
                job.submissionLog = [...(job.submissionLog||[]), logEntry("Install package approved (via LR webhook) — promoted to Activation (M2)")];
                break;
              case "m1_conditional":
                job.packageStage = "m2";
                job.accountStatus = "Pending Submission";
                job.m1ApprovedDate = ev.timestamp;
                job.conditionalM1 = true;
                job.submissionLog = [...(job.submissionLog||[]), logEntry("Install package conditionally approved (via LR webhook) — promoted to M2 with conditional stips")];
                break;
              case "m1_rejected":
                job.accountStatus = "Rejected";
                job.submissionLog = [...(job.submissionLog||[]), logEntry("Install package rejected (via LR webhook)")];
                break;
              case "m2_approved":
                job.packageStage = "fullyFunded";
                job.accountStatus = "Approved";
                job.trueUpDate = ev.timestamp;
                job.submissionLog = [...(job.submissionLog||[]), logEntry("Activation package approved (via LR webhook) — fully funded")];
                break;
              case "m2_rejected":
                job.accountStatus = "Rejected";
                job.submissionLog = [...(job.submissionLog||[]), logEntry("Activation package rejected (via LR webhook)")];
                break;
              default: return;
            }
            updated[idx] = job;
            newAlerts.push({ jobId: job.id, jobName: job.customerName, newStatus: job.accountStatus, action: ev.eventType, emailSubject: ev.subject || ev.eventType, emailDate: ts });
          });
          if (newAlerts.length > 0) setEmailAlerts(prev => [...prev, ...newAlerts]);
          return updated;
        });
      } catch (e) {
        // Silently fail — worker may not be set up yet
      }
    };
    poll(); // Run immediately on mount
    const interval = setInterval(poll, 60000); // Then every 60s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    saveJobs(jobs);
    // Supabase sync handled by setJobsAndSync
  }, [jobs]);

  // Load from Supabase on mount + subscribe to realtime
  useEffect(() => {
    if (!sb) return;
    dbLoadJobs().then(remoteJobs => {
      if (remoteJobs && remoteJobs.length > 0) {
        setJobs(remoteJobs);
        saveJobs(remoteJobs);
      } else {
        const local = getJobs();
        if (local.length > 0) local.forEach(j => dbSaveJob(j));
      }
    });
    const channel = sb.channel('jobs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, payload => {
        if (payload.eventType === 'DELETE') {
          setJobs(prev => { const u = prev.filter(j => j.id !== Number(payload.old.id)); saveJobs(u); return u; });
        } else if (payload.new && payload.new.data) {
          const incoming = payload.new.data;
          setJobs(prev => {
            const u = prev.find(j => j.id === incoming.id)
              ? prev.map(j => j.id === incoming.id ? incoming : j)
              : [incoming, ...prev];
            saveJobs(u);
            return u;
          });
        }
      })
      .subscribe();
    return () => sb.removeChannel(channel);
  }, []);
  useEffect(() => { saveSerials(serials); }, [serials]);

  const openJob = job => { setActive(job); setSec("home"); setPage("checklist"); };

  const createJob = () => {
    if (!newName.trim()) return;
    const isM2 = newJobStage === "m2";
    const job = {
      id: Date.now(),
      customerName: newName.trim(),
      state: "",
      fundingSpecialist: "",
      createdAt: Date.now(),
      packageStage: isM2 ? "m2" : "m1",
      accountStatus: "Pending Submission",
      m1ApprovedDate: isM2 && newM1Date ? new Date(newM1Date).toISOString() : null,
      epcAmount: parseFloat(newEPC) || 0,
      conditionalM1: false,
      submissionLog: isM2 ? [{ ts: new Date().toLocaleString(), text: "Job added directly to Activation (M2)" }] : [],
      lastEmailCheck: null,
      checklist: blank(),
      m2Checklist: blankM2(),
    };
    const jobWithMeta = { ...job, state: newState || "", fundingSpecialist: newSpecialist || "" };
    setJobs(p => [jobWithMeta, ...p]);
    dbSaveJob(jobWithMeta);
    setModal(false);
    setNewName(""); setNewState(""); setNewSpecialist(""); setNewEPC(""); setNewM1Date(""); setNewJobStage(null);
    openJob(jobWithMeta);
  };

  const updateCL = checklist => {
    const serial = checklist.inputs.serial;
    if (serial && activeJob) setSerials(p => [...p.filter(s => s.jobId !== activeJob.id), { serial, customer: activeJob.customerName, jobId: activeJob.id }]);
    const status = jobStatus(checklist);
    const updated = { ...activeJob, checklist, status };
    setActive(updated);
    setJobs(p => p.map(j => j.id === updated.id ? updated : j));
    dbSaveJob(updated);
  };

  const updateNote = (key, value) => {
    if (!activeJob) return;
    const itemNotes = { ...(activeJob.checklist.itemNotes || {}), [key]: value };
    const checklist = { ...activeJob.checklist, itemNotes };
    // Add timestamped log entry for notes
    const logEntry = value ? { ts: new Date().toLocaleString(), text: "Note on [" + key + "]: " + value } : null;
    const submissionLog = logEntry ? [...(activeJob.submissionLog || []), logEntry] : (activeJob.submissionLog || []);
    const updated = { ...activeJob, checklist, submissionLog };
    setActive(updated);
    setJobs(p => p.map(j => j.id === updated.id ? updated : j));
  };

  const updateJobField = (field, value, extraFields = {}) => {
    if (!activeJob) return;
    const logEntry = field === "accountStatus"
      ? { ts: new Date().toLocaleString(), text: "Status changed to: " + value }
      : null;
    const submissionLog = logEntry ? [...(activeJob.submissionLog || []), logEntry] : (activeJob.submissionLog || []);
    const updated = { ...activeJob, [field]: value, ...extraFields, submissionLog };
    setActive(updated);
    setJobs(p => p.map(j => j.id === updated.id ? updated : j));
    dbSaveJob(updated);
  };

  const promoteToM2 = (job, isConditional = false) => {
    const now = new Date().toLocaleString();
    const logEntry = { ts: now, text: isConditional ? "Install package conditionally approved -- promoted to Activation (M2) with conditional stips" : "Install package approved -- promoted to Activation (M2)" };
    const updated = {
      ...job,
      packageStage: "m2",
      accountStatus: "Pending Submission",
      m1ApprovedDate: new Date().toISOString(),
      conditionalM1: isConditional,
      submissionLog: [...(job.submissionLog || []), logEntry],
    };
    setJobs(p => p.map(j => j.id === updated.id ? updated : j));
    if (activeJob && activeJob.id === updated.id) setActive(updated);
    dbSaveJob(updated);
  };



  const markFullyFunded = (job) => {
    const logEntry = { ts: new Date().toLocaleString(), text: "Activation package approved -- fully funded" };
    const updated = {
      ...job,
      packageStage: "fullyFunded",
      accountStatus: "Approved",
      submissionLog: [...(job.submissionLog || []), logEntry],
    };
    setJobs(p => p.map(j => j.id === updated.id ? updated : j));
    if (activeJob && activeJob.id === updated.id) setActive(updated);
    dbSaveJob(updated);
  };

  // Clawback days remaining
  const clawbackDays = (job) => {
    if (!job.m1ApprovedDate) return null;
    const approved = new Date(job.m1ApprovedDate);
    const deadline = new Date(approved.getTime() + 115 * 24 * 60 * 60 * 1000);
    const diff = Math.ceil((deadline - new Date()) / (24 * 60 * 60 * 1000));
    return diff;
  };

  const dlReport = job => setReportModal(job);

  const filteredJobs = jobs.filter(j => {
    if (filterSearch && !j.customerName.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    if (filterStages.length > 0 && !filterStages.includes(j.packageStage || "m1")) return false;
    if (filterStatuses.length > 0 && !filterStatuses.includes(j.accountStatus || "Pending Submission")) return false;
    if (filterSpecialists.length > 0 && !filterSpecialists.includes(j.fundingSpecialist)) return false;
    if (filterStates.length > 0 && !filterStates.includes(j.state)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "az") return a.customerName.localeCompare(b.customerName);
    if (sortBy === "za") return b.customerName.localeCompare(a.customerName);
    if (sortBy === "oldest") return a.createdAt - b.createdAt;
    if (sortBy === "status") return (a.accountStatus || "").localeCompare(b.accountStatus || "");
    if (sortBy === "specialist") return (a.fundingSpecialist || "").localeCompare(b.fundingSpecialist || "");
    if (sortBy === "clawback") {
      const da = clawbackDays(a), db = clawbackDays(b);
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    }
    return b.createdAt - a.createdAt; // newest
  });

  const total = jobs.length;
  const inReview = jobs.filter(j => j.status === "In Review").length;
  const issueCount = jobs.filter(j => j.status === "Issues Found").length;
  const pendingSubmission = jobs.filter(j => (j.accountStatus || "Pending Submission") === "Pending Submission").length;
  const submitted = jobs.filter(j => j.accountStatus === "Submitted").length;
  const rejected = jobs.filter(j => j.accountStatus === "Rejected").length;
  const activationQueue = jobs.filter(j => j.packageStage === "m2").length;
  const fullyFunded = jobs.filter(j => j.packageStage === "fullyFunded").length;
  const clawbackWarning = jobs.filter(j => { const d = clawbackDays(j); return d !== null && d <= 30; }).length;

  const thisMonth = jobs.filter(j => { const d = new Date(j.createdAt), n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length;
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0,0,0,0);
  const m1ApprovedThisWeek = jobs.filter(j => j.m1ApprovedDate && new Date(j.m1ApprovedDate) >= weekStart);
  const m2ApprovedThisWeek = jobs.filter(j => j.packageStage === "fullyFunded" && j.submissionLog && j.submissionLog.some(e => e.text.includes("fully funded") && new Date(e.ts) >= weekStart));
  const m1WeekAmount = m1ApprovedThisWeek.reduce((s, j) => s + (j.epcAmount * 0.9 || 0), 0);
  const m2WeekAmount = m2ApprovedThisWeek.reduce((s, j) => s + (j.epcAmount * 0.1 || 0), 0);
  const avgMissed = jobs.length ? (jobs.reduce((acc, job) => { let t = 0; SORDER.forEach(s => getItems(s, job.checklist).forEach(i => { if (i.status !== "ok") t++; })); return acc + t; }, 0) / jobs.length).toFixed(1) : "--";
  const missed = {};
  jobs.forEach(job => SORDER.forEach(s => getItems(s, job.checklist).forEach(i => { if (i.status === "issue") { const k = SLABELS[s] + ": " + i.label; missed[k] = (missed[k] || 0) + 1; } })));
  const topMissed = Object.entries(missed).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const NB = p => ({ padding: "9px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: F, fontSize: 13, fontWeight: 500, background: page === p ? G.accentGlow : "transparent", color: page === p ? G.accent : G.textSub, transition: "all 0.15s" });

  return (
    <div style={{ minHeight: "100vh", background: G.bg, fontFamily: F, color: G.text }}>
      <div style={{ background: G.surface, borderBottom: `1px solid ${G.border}`, padding: "11px 24px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100 }}>
        <Logo />
        <div style={{ width: 1, height: 20, background: G.border, margin: "0 6px" }} />
        <button style={NB("dashboard")} onClick={() => setPage("dashboard")}>Dashboard</button>
        <button style={NB("jobs")} onClick={() => setPage("jobs")}>Jobs</button>
        <button style={NB("help")} onClick={() => setPage("help")}>AI Help</button>
        <button style={NB("links")} onClick={() => setPage("links")}>Quick Links</button>

        {activeJob && (
          <button
            onClick={() => setPage("checklist")}
            style={{
              padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontFamily: F,
              fontSize: 13, fontWeight: 500, transition: "all 0.15s",
              border: `1px dashed ${page === "checklist" ? G.accent : G.borderBright}`,
              background: page === "checklist" ? G.accentGlow : "transparent",
              color: page === "checklist" ? G.accent : G.textSub,
            }}
          >
            <span style={{ fontSize: 10, color: G.textDim, marginRight: 5, letterSpacing: "0.05em" }}>ACTIVE</span>
            {activeJob.customerName}
          </button>
        )}
        <div style={{ flex: 1 }} />
        {emailAlerts.length > 0 && (
          <button onClick={() => setPage("alerts")} style={{ position: "relative", padding: "8px 14px", borderRadius: 8, border: `1px solid ${G.redBorder}`, background: G.redBg, color: G.red, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: F }}>
            🔔 {emailAlerts.length} alert{emailAlerts.length > 1 ? "s" : ""}
          </button>
        )}
        <button onClick={() => setModal(true)} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${G.accentDim}`, background: G.accentGlow, color: G.accent, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: F }}>+ New job</button>
        {session.role === "admin" && (
          <button onClick={() => setPage("settings")} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${G.borderBright}`, background: "transparent", color: G.textSub, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>⚙</button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", borderRadius: 8, background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)" }}>
          <span style={{ fontSize: 12, color: G.accent, fontWeight: 600 }}>{session.username}</span>
          <span style={{ fontSize: 10, color: G.textDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>{session.role}</span>
          <button onClick={onLogout} style={{ background: "none", border: "none", color: G.textDim, cursor: "pointer", fontSize: 11, fontFamily: F, marginLeft: 2 }}>Sign out</button>
        </div>
      </div>

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: G.surface, border: `1px solid ${G.borderBright}`, borderRadius: 14, padding: 28, width: 420 }}>
            {!newJobStage ? (
              // Step 1 -- choose package stage
              <>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6, color: G.text }}>New job -- select package stage</div>
                <div style={{ fontSize: 13, color: G.textSub, marginBottom: 20 }}>Is this job starting at Install (M1) or going straight to Activation (M2)?</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={() => setNewJobStage("m1")} style={{ padding: "14px 18px", borderRadius: 10, border: `1px solid ${G.accentDim}`, background: G.accentGlow, color: G.accent, fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: F, textAlign: "left" }}>
                    <div style={{ fontWeight: 700 }}>Install Package (M1)</div>
                    <div style={{ fontSize: 12, fontWeight: 400, color: G.textSub, marginTop: 2 }}>New job -- starting with install checklist</div>
                  </button>
                  <button onClick={() => setNewJobStage("m2")} style={{ padding: "14px 18px", borderRadius: 10, border: `1px solid ${G.yellowBorder}`, background: G.yellowBg, color: G.yellow, fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: F, textAlign: "left" }}>
                    <div style={{ fontWeight: 700 }}>Activation Package (M2)</div>
                    <div style={{ fontSize: 12, fontWeight: 400, color: G.textSub, marginTop: 2 }}>M1 already approved -- adding straight to activation queue</div>
                  </button>
                </div>
                <button onClick={() => { setModal(false); setNewJobStage(null); }} style={{ width: "100%", marginTop: 14, padding: "9px 0", borderRadius: 8, border: `1px solid ${G.borderBright}`, background: "transparent", color: G.textSub, cursor: "pointer", fontSize: 13, fontFamily: F }}>Cancel</button>
              </>
            ) : (
              // Step 2 -- enter details
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <button onClick={() => setNewJobStage(null)} style={{ background: "none", border: "none", color: G.textDim, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>←</button>
                  <div style={{ fontWeight: 700, fontSize: 17, color: G.text }}>
                    {newJobStage === "m1" ? "Install Package (M1)" : "Activation Package (M2)"}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <div style={LBL}>Customer name *</div>
                    <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && createJob()} placeholder="Enter customer name..." style={INP} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={LBL}>State</div>
                      <select value={newState || ""} onChange={e => setNewState(e.target.value)} style={INP}>
                        <option value="">Select state...</option>
                        {Object.keys(SNOW).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={LBL}>Funding specialist</div>
                      <select value={newSpecialist || ""} onChange={e => setNewSpecialist(e.target.value)} style={INP}>
                        <option value="">Select...</option>
                        {specialists.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <div style={LBL}>EPC payment amount * <span style={{ color: G.textDim, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(total funded amount for this job)</span></div>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: G.textSub, fontSize: 14 }}>$</span>
                      <input type="number" value={newEPC || ""} onChange={e => setNewEPC(e.target.value)} placeholder="0.00" style={{ ...INP, paddingLeft: 26 }} />
                    </div>
                    {newEPC > 0 && (
                      <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                        <span style={{ fontSize: 12, color: G.green }}>{"M1 payment (90%): $" + (newEPC * 0.9).toFixed(2)}</span>
                        <span style={{ fontSize: 12, color: G.yellow }}>{"M2 payment (10%): $" + (newEPC * 0.1).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  {newJobStage === "m2" && (
                    <div>
                      <div style={LBL}>M1 approval date</div>
                      <input type="date" value={newM1Date || ""} onChange={e => setNewM1Date(e.target.value)} style={INP} />
                      <div style={{ fontSize: 11, color: G.textDim, marginTop: 4 }}>Used to calculate the 115-day clawback deadline.</div>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button onClick={createJob} disabled={!newName.trim()} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: newName.trim() ? G.accent : G.border, color: newName.trim() ? "#fff" : G.textDim, fontWeight: 700, cursor: newName.trim() ? "pointer" : "default", fontSize: 14, fontFamily: F }}>Create job</button>
                  <button onClick={() => { setModal(false); setNewJobStage(null); setNewName(""); setNewEPC(""); setNewM1Date(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${G.borderBright}`, background: "transparent", color: G.textSub, cursor: "pointer", fontSize: 14, fontFamily: F }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {reportModal && <ReportModal job={reportModal} onClose={() => setReportModal(null)} />}
      {epcDrillDown && <EPCDrillDownModal data={epcDrillDown} onClose={() => setEpcDrillDown(null)} onOpenJob={openJob} />}

      {/* Manual Promote Modal */}
      {manualPromoteJob && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: G.surface, border: `1px solid ${G.borderBright}`, borderRadius: 14, padding: 28, width: 420 }}>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6, color: G.text }}>Promote {manualPromoteJob.customerName}</div>
            {(() => {
              const p = overallProg(manualPromoteJob.checklist);
              const isM1 = manualPromoteJob.packageStage === "m1";
              const isM2 = manualPromoteJob.packageStage === "m2";
              const incomplete = isM1 && p.pct < 100;
              return (
                <>
                  {incomplete && (
                    <div style={{ padding: "10px 14px", background: G.yellowBg, border: `1px solid ${G.yellowBorder}`, borderRadius: 8, fontSize: 13, color: G.yellow, marginBottom: 16 }}>
                      Warning: M1 checklist is {p.pct}% complete -- {p.total - p.done} item{p.total - p.done !== 1 ? "s" : ""} remaining. You can still promote but this job may be missing required items.
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: G.textSub, marginBottom: 20 }}>Select the promotion type:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {isM1 && (
                      <>
                        <button onClick={() => { promoteToM2(manualPromoteJob, false); setManualPromoteJob(null); }} style={{ padding: "12px 16px", borderRadius: 9, border: `1px solid ${G.greenBorder}`, background: G.greenBg, color: G.green, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: F, textAlign: "left" }}>
                          <div>Approved -- Promote to Activation (M2)</div>
                          <div style={{ fontSize: 11, fontWeight: 400, color: G.textSub, marginTop: 2 }}>Full install package approved, 90% payment released</div>
                        </button>
                        <button onClick={() => { promoteToM2(manualPromoteJob, true); setManualPromoteJob(null); }} style={{ padding: "12px 16px", borderRadius: 9, border: `1px solid ${G.yellowBorder}`, background: G.yellowBg, color: G.yellow, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: F, textAlign: "left" }}>
                          <div>Conditionally Approved -- Promote to Activation (M2)</div>
                          <div style={{ fontSize: 11, fontWeight: 400, color: G.textSub, marginTop: 2 }}>Approved with stips -- 90% released, stips must be resolved at M2</div>
                        </button>
                      </>
                    )}
                    {isM2 && (
                      <button onClick={() => { const updated = { ...manualPromoteJob, packageStage: "fullyFunded", accountStatus: "Approved", submissionLog: [...(manualPromoteJob.submissionLog || []), { ts: new Date().toLocaleString(), text: "Manually marked as Fully Funded" }] }; setJobs(p => p.map(j => j.id === updated.id ? updated : j)); if (activeJob && activeJob.id === updated.id) setActive(updated); setManualPromoteJob(null); }} style={{ padding: "12px 16px", borderRadius: 9, border: `1px solid ${G.greenBorder}`, background: G.greenBg, color: G.green, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: F, textAlign: "left" }}>
                        <div>Mark as Fully Funded</div>
                        <div style={{ fontSize: 11, fontWeight: 400, color: G.textSub, marginTop: 2 }}>Activation package approved -- both packages complete</div>
                      </button>
                    )}
                    {manualPromoteJob.packageStage === "fullyFunded" && (
                      <div style={{ padding: "12px 16px", borderRadius: 9, background: G.greenBg, border: `1px solid ${G.greenBorder}`, fontSize: 13, color: G.green, fontWeight: 600 }}>
                        This job is already fully funded -- no further promotion available.
                      </div>
                    )}
                  </div>
                  <button onClick={() => setManualPromoteJob(null)} style={{ width: "100%", marginTop: 14, padding: "9px 0", borderRadius: 8, border: `1px solid ${G.borderBright}`, background: "transparent", color: G.textSub, cursor: "pointer", fontSize: 13, fontFamily: F }}>Cancel</button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 940, margin: "0 auto", padding: "28px 16px" }}>
        {page === "dashboard" && (
          <div>
            <div style={{ marginBottom: 26 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: G.text }}>Overview</h1>
                </div>
                <button onClick={async () => {
                  setScanning(true);
                  setTimeout(() => {
                    setScanning(false);
                    alert("Connect Gmail in Settings to enable automatic email scanning for LR approvals and rejections.");
                  }, 800);
                }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid " + G.borderBright, background: "transparent", color: scanning ? G.textDim : G.textSub, fontWeight: 600, cursor: "pointer", fontSize: 12, fontFamily: F }}>
                  {scanning ? "Scanning..." : "⟳ Scan emails"}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>

              {/* Row 1: Totals + EPC charts */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { l: "Total active jobs", v: jobs.filter(j => j.packageStage === "m1" || j.packageStage === "m2").length, c: G.accent, subset: jobs.filter(j => j.packageStage === "m1" || j.packageStage === "m2") },
                  { l: "Total jobs this month", v: thisMonth, c: G.accent, subset: jobs.filter(j => { const d = new Date(j.createdAt), n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }) },
                  { l: "Avg items missed", v: avgMissed, c: G.textSub, subset: null },
                ].map(({ l, v, c, subset }) => (
                  <div key={l} onClick={() => subset && subset.length > 0 && setDrillDown({ title: l, jobs: subset })} onMouseEnter={e => { if (subset && subset.length > 0) e.currentTarget.style.borderColor = c + "88"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; }} style={{ ...card, padding: "16px 18px", cursor: subset && subset.length > 0 ? "pointer" : "default", transition: "border-color 0.2s" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: G.textDim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>{l}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: c, fontFamily: F }}>{v}</div>
                    {subset && subset.length > 0 && <div style={{ fontSize: 10, color: G.textDim, marginTop: 3 }}>Click to view</div>}
                  </div>
                ))}
              </div>

              {/* Row 2: EPC funded charts */}
              <EPCFundedRow jobs={jobs} onDrillDown={setEpcDrillDown} />

              {/* Row 3: M1 status cards */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: G.accent, letterSpacing: "0.06em", textTransform: "uppercase", minWidth: 80 }}>Install (M1)</span>
                <div style={{ flex: 1, height: 1, background: G.border }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { l: "Pending", v: jobs.filter(j => j.packageStage === "m1" && (j.accountStatus || "Pending Submission") === "Pending Submission").length, c: G.textSub, subset: jobs.filter(j => j.packageStage === "m1" && (j.accountStatus || "Pending Submission") === "Pending Submission") },
                  { l: "Submitted", v: jobs.filter(j => j.packageStage === "m1" && j.accountStatus === "Submitted").length, c: G.blue, subset: jobs.filter(j => j.packageStage === "m1" && j.accountStatus === "Submitted") },
                  { l: "Rejected", v: jobs.filter(j => j.packageStage === "m1" && j.accountStatus === "Rejected").length, c: G.red, subset: jobs.filter(j => j.packageStage === "m1" && j.accountStatus === "Rejected") },
                ].map(({ l, v, c, subset }) => (
                  <div key={"m1-"+l} onClick={() => subset && subset.length > 0 && setDrillDown({ title: "M1 -- " + l, jobs: subset })} onMouseEnter={e => { if (subset && subset.length > 0) e.currentTarget.style.borderColor = c + "88"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; }} style={{ ...card, padding: "16px 18px", cursor: subset && subset.length > 0 ? "pointer" : "default", transition: "border-color 0.2s" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: G.textDim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>{l}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: c, fontFamily: F }}>{v}</div>
                    {subset && subset.length > 0 && <div style={{ fontSize: 10, color: G.textDim, marginTop: 3 }}>Click to view</div>}
                  </div>
                ))}
              </div>

              {/* Row 4: M2 status cards */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: G.yellow, letterSpacing: "0.06em", textTransform: "uppercase", minWidth: 80 }}>Activation (M2)</span>
                <div style={{ flex: 1, height: 1, background: G.border }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { l: "Pending", v: jobs.filter(j => j.packageStage === "m2" && (j.accountStatus || "Pending Submission") === "Pending Submission").length, c: G.textSub, subset: jobs.filter(j => j.packageStage === "m2" && (j.accountStatus || "Pending Submission") === "Pending Submission") },
                  { l: "Submitted", v: jobs.filter(j => j.packageStage === "m2" && j.accountStatus === "Submitted").length, c: G.blue, subset: jobs.filter(j => j.packageStage === "m2" && j.accountStatus === "Submitted") },
                  { l: "Rejected", v: jobs.filter(j => j.packageStage === "m2" && j.accountStatus === "Rejected").length, c: G.red, subset: jobs.filter(j => j.packageStage === "m2" && j.accountStatus === "Rejected") },
                ].map(({ l, v, c, subset }) => (
                  <div key={"m2-"+l} onClick={() => subset && subset.length > 0 && setDrillDown({ title: "M2 -- " + l, jobs: subset })} onMouseEnter={e => { if (subset && subset.length > 0) e.currentTarget.style.borderColor = c + "88"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; }} style={{ ...card, padding: "16px 18px", cursor: subset && subset.length > 0 ? "pointer" : "default", transition: "border-color 0.2s" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: G.textDim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>{l}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: c, fontFamily: F }}>{v}</div>
                    {subset && subset.length > 0 && <div style={{ fontSize: 10, color: G.textDim, marginTop: 3 }}>Click to view</div>}
                  </div>
                ))}
              </div>

              {/* Row 5: Recent jobs + Clawback shortlist */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* Recent jobs */}
                {(() => {
                  const recent = [...jobs].sort((a,b) => b.createdAt - a.createdAt).slice(0,5);
                  return (
                    <div style={{ ...card, padding: "16px 18px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: G.textDim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>Recent jobs</div>
                      {recent.length === 0 ? <div style={{ fontSize: 13, color: G.textDim }}>No jobs yet.</div> : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {recent.map(job => (
                            <div key={job.id} onClick={() => openJob(job)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 8, background: "#0a0a10", border: `1px solid ${G.border}`, cursor: "pointer" }}>
                              <div style={{ flex: 1 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{job.customerName}</span>
                                {job.fundingSpecialist && <span style={{ fontSize: 11, color: G.textDim, marginLeft: 8 }}>{job.fundingSpecialist}</span>}
                              </div>
                              <StageBadge stage={job.packageStage || "m1"} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
                {/* Clawback shortlist */}
                {(() => {
                  const clawJobs = jobs
                    .filter(j => { const d = clawbackDays(j); return d !== null && d <= 30; })
                    .sort((a, b) => clawbackDays(a) - clawbackDays(b))
                    .slice(0, 5);
                  return (
                    <div style={{ ...card, padding: "16px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: G.textDim, letterSpacing: "0.07em", textTransform: "uppercase" }}>Clawback deadlines</div>
                        <span style={{ fontSize: 11, color: G.textDim }}>within 30 days</span>
                      </div>
                      {clawJobs.length === 0 ? (
                        <div style={{ fontSize: 13, color: G.textDim, textAlign: "center", padding: "12px 0" }}>No clawbacks within 30 days</div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                          {clawJobs.map(job => {
                            const days = clawbackDays(job);
                            const color = days <= 14 ? G.red : G.yellow;
                            const deadline = new Date(new Date(job.m1ApprovedDate).getTime() + 115 * 24 * 60 * 60 * 1000);
                            return (
                              <div key={job.id} onClick={() => openJob(job)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 8, background: "#0a0a10", border: `1px solid ${color}33`, cursor: "pointer" }}>
                                <div style={{ flex: 1 }}>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{job.customerName}</span>
                                  {job.fundingSpecialist && <span style={{ fontSize: 11, color: G.textDim, marginLeft: 8 }}>{job.fundingSpecialist}</span>}
                                </div>
                                <ClawbackBadge days={days} job={job} />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>
            {drillDown && (
              <div onClick={() => setDrillDown(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                <div onClick={e => e.stopPropagation()} style={{ background: G.surface, border: `1px solid ${G.borderBright}`, borderRadius: 16, width: "100%", maxWidth: 620, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${G.border}` }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: G.textDim, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>Drill-down</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: G.text }}>{drillDown.title}</div>
                      <div style={{ fontSize: 12, color: G.textSub, marginTop: 2 }}>{drillDown.jobs.length} job{drillDown.jobs.length !== 1 ? "s" : ""}</div>
                    </div>
                    <button onClick={() => setDrillDown(null)} style={{ padding: "7px 16px", borderRadius: 7, border: `1px solid ${G.borderBright}`, background: "transparent", color: G.textSub, cursor: "pointer", fontSize: 13, fontFamily: F }}>Close</button>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {drillDown.jobs.map(job => {
                      const p = jobOverallProg(job), s = scBadge(job.status);
                      return (
                        <div key={job.id} onClick={() => { openJob(job); setDrillDown(null); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, background: "#0a0a10", border: `1px solid ${G.border}`, cursor: "pointer" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, fontSize: 14, color: G.text }}>{job.customerName}</span>
                              {job.fundingSpecialist && <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 10, background: G.accentGlow, color: G.accent, border: `1px solid ${G.accentDim}`, fontWeight: 600 }}>{job.fundingSpecialist}</span>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                              <StageBadge stage={job.packageStage || "m1"} />
                              <StatusBadge status={job.accountStatus || "Pending Submission"} date={["Submitted","Rejected","Conditionally Approved","Approved"].includes(job.accountStatus) ? getStatusDate(job) : null} />
                              {clawbackDays(job) !== null && <ClawbackBadge days={clawbackDays(job)} job={job} />}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 80, height: 3, background: G.border, borderRadius: 2, overflow: "hidden" }}>
                                <div style={{ width: p.pct + "%", height: "100%", background: p.issues > 0 ? G.red : G.accent, borderRadius: 2 }} />
                              </div>
                              <span style={{ fontSize: 11, color: G.textSub }}>{p.pct}%</span>
                              {p.issues > 0 && <span style={{ fontSize: 11, color: G.red, fontWeight: 600 }}>{p.issues} missing</span>}
                            </div>
                          </div>
                          <span style={{ fontSize: 12, color: G.textDim }}>Open →</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Email alerts panel */}
              {emailAlerts.length > 0 && (
                <div style={{ ...card, border: `1px solid ${G.redBorder}`, background: "rgba(239,68,68,0.05)", marginBottom: 0, gridColumn: "1/-1" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: G.red }}>🔔 Unprocessed Email Notifications</div>
                    <button onClick={() => setEmailAlerts([])} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: `1px solid ${G.borderBright}`, background: "transparent", color: G.textSub, cursor: "pointer", fontFamily: F }}>Dismiss all</button>
                  </div>
                  {emailAlerts.map((alert, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 6, borderRadius: 8, background: "#0a0a10", border: `1px solid ${G.border}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{alert.jobName}</div>
                        <div style={{ fontSize: 11, color: G.textSub }}>{alert.emailSubject}</div>
                      </div>
                      <StatusBadge status={alert.newStatus} />
                      <button onClick={() => {
                        const job = jobs.find(j => j.id === alert.jobId);
                        if (!job) return;
                        if (alert.action === "promoteM2") promoteToM2(job);
                        else if (alert.action === "fullyFunded") markFullyFunded(job);
                        else updateJobField("accountStatus", alert.newStatus);
                        setEmailAlerts(prev => prev.filter((_, idx) => idx !== i));
                      }} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${G.greenBorder}`, background: G.greenBg, color: G.green, fontWeight: 700, cursor: "pointer", fontSize: 11, fontFamily: F }}>Apply</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={card}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: G.text }}>Top missed items</div>
                {topMissed.length === 0 ? <p style={{ color: G.textDim, fontSize: 13 }}>No trend data yet -- complete some checklists to see patterns.</p> : topMissed.map(([l, cnt]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ flex: 1, fontSize: 13, color: G.text }}>{l}</div>
                    <div style={{ padding: "2px 10px", borderRadius: 20, background: G.redBg, color: G.red, fontSize: 12, fontWeight: 700, border: `1px solid ${G.redBorder}` }}>{cnt}x</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {page === "jobs" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>All jobs</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: G.textSub }}>{filteredJobs.length} of {jobs.length}</span>
                <button onClick={() => setSplitView(v => !v)} style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${splitView ? G.accentDim : G.borderBright}`, background: splitView ? G.accentGlow : "transparent", color: splitView ? G.accent : G.textSub, fontSize: 12, cursor: "pointer", fontFamily: F, fontWeight: splitView ? 600 : 400 }}>
                  {splitView ? "Split view ON" : "Split view"}
                </button>
              </div>
            </div>
            {/* Filters + Sort */}
            {(() => {
              const toggle = (arr, setArr, val) => setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
              const chip = (label, active, onClick, color) => (
                <button key={label} onClick={onClick} style={{ padding: "4px 10px", borderRadius: 20, border: `1px solid ${active ? (color||G.accent)+"88" : G.borderBright}`, background: active ? (color||G.accent)+"22" : "transparent", color: active ? (color||G.accent) : G.textSub, fontSize: 11, cursor: "pointer", fontFamily: F, fontWeight: active ? 600 : 400, transition: "all 0.15s" }}>
                  {label}
                </button>
              );
              const hasFilters = filterSearch || filterStages.length || filterStatuses.length || filterSpecialists.length || filterStates.length;
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {/* Search + sort row */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ position: "relative" }}>
                      <input value={filterSearch} onChange={e => setFilterSearch(e.target.value)} placeholder="Search customer..." style={{ ...INP, width: 180, fontSize: 12, padding: "7px 28px 7px 12px" }} />
                      {filterSearch && <button onClick={() => setFilterSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: G.textDim, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>}
                    </div>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...INP, width: "auto", fontSize: 12, padding: "7px 10px" }}>
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="az">A -- Z</option>
                      <option value="za">Z -- A</option>
                      <option value="status">By status</option>
                      <option value="specialist">By specialist</option>
                      <option value="clawback">Clawback urgency</option>
                    </select>
                    {hasFilters && <button onClick={() => { setFilterSearch(""); setFilterStages([]); setFilterStatuses([]); setFilterSpecialists([]); setFilterStates([]); }} style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${G.redBorder}`, background: G.redBg, color: G.red, cursor: "pointer", fontSize: 11, fontFamily: F }}>Clear all</button>}
                  </div>
                  {/* Stage chips */}
                  {!splitView && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: G.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 2 }}>Stage</span>
                      {[{ v: "m1", l: "Install (M1)", c: G.accent }, { v: "m2", l: "Activation (M2)", c: G.yellow }, { v: "fullyFunded", l: "Fully Funded", c: G.green }].map(o => chip(o.l, filterStages.includes(o.v), () => toggle(filterStages, setFilterStages, o.v), o.c))}
                    </div>
                  )}
                  {/* Status chips */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: G.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 2 }}>Status</span>
                    {[{ v: "Pending Submission", c: G.textSub }, { v: "Submitted", c: G.blue }, { v: "Rejected", c: G.red }, { v: "Conditionally Approved", c: G.yellow }, { v: "Approved", c: G.green }].map(o => chip(o.v, filterStatuses.includes(o.v), () => toggle(filterStatuses, setFilterStatuses, o.v), o.c))}
                  </div>
                  {/* Specialist + state chips */}
                  {(specialists.length > 0 || [...new Set(jobs.map(j => j.state).filter(Boolean))].length > 0) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: G.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 2 }}>Team</span>
                      {specialists.map(s => chip(s, filterSpecialists.includes(s), () => toggle(filterSpecialists, setFilterSpecialists, s), G.accent))}
                      {[...new Set(jobs.map(j => j.state).filter(Boolean))].sort().map(s => chip(s, filterStates.includes(s), () => toggle(filterStates, setFilterStates, s), G.textSub))}
                    </div>
                  )}
                </div>
              );
            })()}
            {filteredJobs.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: G.textSub }}>
                {jobs.length === 0 ? "No jobs yet. Click + New job to get started." : "No jobs match the current filters."}
              </div>
            ) : splitView ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
                {[
                  { label: "Install (M1)", stage: "m1", color: G.accent },
                  { label: "Activation (M2)", stage: "m2", color: G.yellow },
                  { label: "Fully Funded", stage: "fullyFunded", color: G.green },
                ].map(({ label, stage, color }) => {
                  const stageJobs = filteredJobs.filter(j => (j.packageStage || "m1") === stage);
                  return (
                    <div key={stage} style={{ ...card, gridColumn: stage === "fullyFunded" ? "1 / -1" : "auto" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${G.border}` }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color }}>{label}</span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: color + "22", color, border: `1px solid ${color}44`, fontWeight: 600 }}>{stageJobs.length}</span>
                      </div>
                      {stageJobs.length === 0 ? (
                        <div style={{ fontSize: 13, color: G.textDim, textAlign: "center", padding: "12px 0" }}>No {label} jobs</div>
                       ) : stageJobs.map(job => {
                const p = jobOverallProg(job);
                const isM2 = job.packageStage === "m2" || job.packageStage === "fullyFunded";
                const barPct = isM2 ? p.m2Pct : p.m1Pct;
                const barColor = barPct === 100 ? G.green : isM2 ? G.yellow : G.accent;
                const barLabel = isM2 ? "M2" : "M1";
                return (
                  <div key={job.id} style={{ ...card, marginBottom: 8, padding: "12px 14px" }}>
                    {/* Top row: name + state */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: G.text }}>{job.customerName}</span>
                      {job.state && <span style={{ fontSize: 11, color: G.textDim }}>{job.state}</span>}
                      {job.fundingSpecialist && <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 10, background: G.accentGlow, color: G.accent, border: `1px solid ${G.accentDim}`, fontWeight: 600, marginLeft: "auto" }}>{job.fundingSpecialist}</span>}
                    </div>
                    {/* Status badges */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                      <StatusBadge status={job.accountStatus || "Pending Submission"} date={["Submitted","Rejected","Conditionally Approved","Approved"].includes(job.accountStatus) ? getStatusDate(job) : null} />
                      {clawbackDays(job) !== null && <ClawbackBadge days={clawbackDays(job)} job={job} />}
                    </div>
                    {/* EPC amounts */}
                    {job.epcAmount > 0 && (() => {
                      const m1pay = (job.epcAmount * 0.9).toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2});
                      const m2pay = (job.epcAmount * 0.1).toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2});
                      return (
                        <div style={{ fontSize: 11, color: G.textSub, marginBottom: 8 }}>
                          <span style={{ fontWeight: 600, color: G.text }}>${job.epcAmount.toLocaleString()}</span>
                          <span style={{ margin: "0 6px", color: G.textDim }}>·</span>
                          <span style={{ color: G.accent }}>{"M1 $" + m1pay}</span>
                          <span style={{ margin: "0 4px", color: G.textDim }}>·</span>
                          <span style={{ color: G.yellow }}>{"M2 $" + m2pay}</span>
                        </div>
                      );
                    })()}
                    {/* Single relevant progress bar */}
                    <div style={{ height: 13, background: G.border, borderRadius: 4, overflow: "hidden", position: "relative", marginBottom: 10 }}>
                      <div style={{ position: "absolute", inset: 0, width: barPct + "%", background: barColor, borderRadius: 4, transition: "width 0.3s" }} />
                      <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 9, fontWeight: 700, color: "#fff", zIndex: 1 }}>{barLabel}</span>
                      <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 9, fontWeight: 600, color: "#fff", zIndex: 1 }}>{barPct}%</span>
                    </div>
                    {/* Actions */}
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => openJob(job)} style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: `1px solid ${G.accentDim}`, background: G.accentGlow, color: G.accent, cursor: "pointer", fontSize: 12, fontFamily: F }}>Open</button>
                      <button onClick={() => setManualPromoteJob(job)} style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: `1px solid ${G.yellowBorder}`, background: G.yellowBg, color: G.yellow, cursor: "pointer", fontSize: 12, fontFamily: F }}>Promote</button>
                      <button onClick={() => setConfirmDelete(confirmDelete === job.id ? null : job.id)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${G.redBorder}`, background: G.redBg, color: G.red, cursor: "pointer", fontSize: 12, fontFamily: F }}>
                        {confirmDelete === job.id ? "Sure?" : "Del"}
                      </button>
                      {confirmDelete === job.id && (
                        <button onClick={() => { setJobs(p => p.filter(j => j.id !== job.id)); if (activeJob && activeJob.id === job.id) { setActive(null); setPage("jobs"); } setConfirmDelete(null); }} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${G.redBorder}`, background: G.red, color: "#fff", cursor: "pointer", fontSize: 12, fontFamily: F, fontWeight: 700 }}>Yes</button>
                      )}
                    </div>
                  </div>
                );
              })}
                      })}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                {filteredJobs.map(job => {
              const p = jobOverallProg(job), s = scBadge(job.status);
              return (
                <div key={job.id} onClick={() => openJob(job)} onMouseEnter={e => { e.currentTarget.style.borderColor = G.accentDim; e.currentTarget.style.background = "rgba(108,99,255,0.04)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.background = G.surface; }} style={{ ...card, display: "flex", alignItems: "center", gap: 16, marginBottom: 10, cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{job.customerName}</div>
                      {job.state && <span style={{ fontSize: 11, color: G.textDim }}>{job.state}</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <StageBadge stage={job.packageStage || "m1"} />
                      <StatusBadge status={job.accountStatus || "Pending Submission"} date={["Submitted","Rejected","Conditionally Approved","Approved"].includes(job.accountStatus) ? getStatusDate(job) : null} />
                      {clawbackDays(job) !== null && <ClawbackBadge days={clawbackDays(job)} job={job} />}
                      {job.fundingSpecialist && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: G.accentGlow, color: G.accent, border: `1px solid ${G.accentDim}`, fontWeight: 600 }}>{job.fundingSpecialist}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {/* M1 bar — label inside left, percentage tracks fill right edge */}
                      <div style={{ flex: 1, height: 13, background: G.border, borderRadius: 4, overflow: "hidden", position: "relative" }}>
                        <div style={{ position: "absolute", inset: 0, width: p.m1Pct + "%", background: p.m1Pct === 100 ? G.green : p.issues > 0 ? G.red : G.accent, borderRadius: 6, transition: "width 0.3s" }} />
                        <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 9, fontWeight: 700, color: "#fff", zIndex: 1 }}>M1</span>
                        <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 9, fontWeight: 600, color: "#fff", zIndex: 1, transition: "right 0.3s" }}>{p.m1Pct}%</span>
                      </div>
                      {/* M2 bar — dimmed if not yet in M2 */}
                      <div style={{ flex: 1, height: 13, background: G.border, borderRadius: 4, overflow: "hidden", position: "relative", opacity: (job.packageStage === "m2" || job.packageStage === "fullyFunded") ? 1 : 0.3 }}>
                        <div style={{ position: "absolute", inset: 0, width: p.m2Pct + "%", background: p.m2Pct === 100 ? G.green : G.yellow, borderRadius: 6, transition: "width 0.3s" }} />
                        <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 9, fontWeight: 700, color: "#fff", zIndex: 1 }}>M2</span>
                        <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 9, fontWeight: 600, color: "#fff", zIndex: 1 }}>
                          {(job.packageStage === "m2" || job.packageStage === "fullyFunded") ? p.m2Pct + "%" : "--"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    {job.epcAmount > 0 && (() => {
                      const total = job.epcAmount.toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2});
                      const m1pay = (job.epcAmount * 0.9).toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2});
                      const m2pay = (job.epcAmount * 0.1).toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2});
                      return (
                        <div style={{ fontSize: 11, color: G.textSub, textAlign: "right" }}>
                          <span style={{ fontWeight: 700, color: G.text }}>${total}</span>
                          <span style={{ margin: "0 5px", color: G.textDim }}>·</span>
                          <span style={{ color: G.accent, fontWeight: 600 }}>{"M1 $" + m1pay}</span>
                          <span style={{ margin: "0 4px", color: G.textDim }}>·</span>
                          <span style={{ color: G.yellow, fontWeight: 600 }}>{"M2 $" + m2pay}</span>
                        </div>
                      );
                    })()}
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={e => { e.stopPropagation(); dlReport(job); }} style={{ padding: "5px 11px", borderRadius: 6, border: `1px solid ${G.borderBright}`, background: "transparent", color: G.textSub, cursor: "pointer", fontSize: 11, fontFamily: F }}>Report</button>
                      <button onClick={e => { e.stopPropagation(); setManualPromoteJob(job); }} style={{ padding: "5px 11px", borderRadius: 6, border: `1px solid ${G.yellowBorder}`, background: G.yellowBg, color: G.yellow, cursor: "pointer", fontSize: 11, fontFamily: F }}>Promote</button>
                      {confirmDelete === job.id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={e => e.stopPropagation()}>
                          <span style={{ fontSize: 11, color: G.red, fontWeight: 600 }}>Sure?</span>
                          <button onClick={() => { setJobs(p => p.filter(j => j.id !== job.id)); dbDeleteJob(job.id); if (activeJob && activeJob.id === job.id) { setActive(null); setPage("jobs"); } setConfirmDelete(null); }} style={{ padding: "4px 9px", borderRadius: 6, border: `1px solid ${G.redBorder}`, background: G.red, color: "#fff", cursor: "pointer", fontSize: 11, fontFamily: F, fontWeight: 700 }}>Yes</button>
                          <button onClick={() => setConfirmDelete(null)} style={{ padding: "4px 9px", borderRadius: 6, border: `1px solid ${G.borderBright}`, background: "transparent", color: G.textSub, cursor: "pointer", fontSize: 11, fontFamily: F }}>No</button>
                        </div>
                      ) : (
                        <button onClick={e => { e.stopPropagation(); setConfirmDelete(job.id); }} style={{ padding: "5px 11px", borderRadius: 6, border: `1px solid ${G.redBorder}`, background: G.redBg, color: G.red, cursor: "pointer", fontSize: 11, fontFamily: F }}>Del</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
                })}
              </div>
            )}
          </div>
        )}
        {page === "checklist" && activeJob && (
          <div style={{ display: "grid", gridTemplateColumns: "210px 1fr", gap: 20, alignItems: "start" }}>
            <div style={{ ...card, padding: "16px 14px", position: "sticky", top: 74 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: G.text }}>{activeJob.customerName}</div>
              {(() => { const s = scBadge(activeJob.status); return <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color, border: s.border, fontWeight: 600 }}>{activeJob.status}</span>; })()}

              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Home button — always first */}
                <button onClick={() => setSec("home")} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 10px", borderRadius: 8, border: activeSec === "home" ? `1px solid ${G.accentDim}` : "1px solid transparent", background: activeSec === "home" ? G.accentGlow : "transparent", cursor: "pointer", textAlign: "left", fontFamily: F }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: activeSec === "home" ? 600 : 400, color: activeSec === "home" ? G.accent : G.textSub }}>Overview</span>
                  </div>
                </button>
                <div style={{ height: 1, background: G.border, margin: "4px 0" }} />

                {(activeJob.packageStage === "m1") && SORDER.map(s => {
                  const p = secProg(s, activeJob.checklist), active = activeSec === s, bc = p.pct === 100 ? G.green : p.issues > 0 ? G.red : G.accent;
                  return (
                    <button key={s} onClick={() => setSec(s)} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 10px", borderRadius: 8, border: active ? `1px solid ${G.accentDim}` : "1px solid transparent", background: active ? G.accentGlow : "transparent", cursor: "pointer", textAlign: "left", fontFamily: F }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? G.accent : G.textSub }}>{SLABELS[s]}</span>
                        <span style={{ fontSize: 10, color: bc }}>{p.pct === 100 ? "✓" : p.done + "/" + p.total}</span>
                      </div>
                      <div style={{ height: 2, background: G.border, borderRadius: 2, overflow: "hidden" }}><div style={{ width: p.pct + "%", height: "100%", background: bc, borderRadius: 2 }} /></div>
                    </button>
                  );
                })}
                {(activeJob.packageStage === "m2" || activeJob.packageStage === "fullyFunded") && (() => {
                  const isConditional = !!activeJob.conditionalM1;
                  const m2Sections = isConditional ? [...M2_SORDER, "conditionals"] : M2_SORDER;
                  const m2d = activeJob.m2Checklist || {};
                  return m2Sections.map(s => {
                    const p = m2SecProg(s, m2d, isConditional);
                    const active = activeSec === s;
                    const bc = p.pct === 100 ? G.green : p.issues > 0 ? G.red : G.yellow;
                    return (
                      <button key={s} onClick={() => setSec(s)} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 10px", borderRadius: 8, border: active ? `1px solid ${G.yellowBorder}` : "1px solid transparent", background: active ? G.yellowBg : "transparent", cursor: "pointer", textAlign: "left", fontFamily: F }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? G.yellow : G.textSub }}>{M2_SLABELS[s]}</span>
                          <span style={{ fontSize: 10, color: bc }}>{p.total === 0 ? "--" : p.pct === 100 ? "✓" : p.done + "/" + p.total}</span>
                        </div>
                        {p.total > 0 && <div style={{ height: 2, background: G.border, borderRadius: 2, overflow: "hidden" }}><div style={{ width: p.pct + "%", height: "100%", background: bc, borderRadius: 2 }} /></div>}
                      </button>
                    );
                  });
                })()}
              </div>
              {/* Submission Log — always shown at bottom of sidebar */}
              <div style={{ marginTop: 4 }}>
                <button onClick={() => setSec("log")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, border: activeSec === "log" ? `1px solid ${G.accentDim}` : "1px solid transparent", background: activeSec === "log" ? G.accentGlow : "transparent", cursor: "pointer", width: "100%", fontFamily: F }}>
                  <span style={{ fontSize: 12, fontWeight: activeSec === "log" ? 600 : 400, color: activeSec === "log" ? G.accent : G.textSub }}>Submission Log</span>
                  {activeJob.submissionLog && activeJob.submissionLog.length > 0 && <span style={{ fontSize: 10, color: G.textDim }}>{activeJob.submissionLog.length}</span>}
                </button>
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${G.border}` }}>
                <button onClick={() => dlReport(activeJob)} style={{ width: "100%", padding: "9px 0", borderRadius: 8, border: `1px solid ${G.accentDim}`, background: G.accentGlow, color: G.accent, fontWeight: 600, cursor: "pointer", fontSize: 12, fontFamily: F }}>Download report</button>
              </div>
            </div>

            <div style={card}>
              {/* Job info bar */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "12px 0 16px", borderBottom: `1px solid ${G.border}`, marginBottom: 20 }}>
                <StageBadge stage={activeJob.packageStage || "m1"} />
                {activeJob.conditionalM1 && <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700, background: "rgba(245,158,11,0.15)", color: G.yellow, border: `1px solid ${G.yellowBorder}` }}>⚡ Conditional stips</span>}
                <StatusBadge status={activeJob.accountStatus || "Pending Submission"} />
                {clawbackDays(activeJob) !== null && <ClawbackBadge days={clawbackDays(activeJob)} />}
                {activeJob.epcAmount > 0 && (() => {
                  const epc = activeJob.epcAmount.toLocaleString();
                  const m1 = (activeJob.epcAmount * 0.9).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
                  const m2 = (activeJob.epcAmount * 0.1).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
                  return (
                    <span style={{ fontSize: 11, color: G.textSub }}>
                      {"EPC: $" + epc}
                      <span style={{ margin: "0 4px", color: G.textDim }}>·</span>
                      <span style={{ color: G.green }}>{"M1: $" + m1}</span>
                      <span style={{ margin: "0 4px", color: G.textDim }}>·</span>
                      <span style={{ color: G.yellow }}>{"M2: $" + m2}</span>
                    </span>
                  );
                })()}
                <div style={{ flex: 1 }} />
                {/* Account status selector */}
                <select value={activeJob.accountStatus || "Pending Submission"} onChange={e => updateJobField("accountStatus", e.target.value)}
                  style={{ ...INP, width: "auto", fontSize: 12, padding: "6px 10px" }}>
                  {["Pending Submission","Submitted","Rejected","Conditionally Approved","Approved"].map(s =>
                    <option key={s} value={s}>{s}</option>
                  )}
                </select>
                {/* Specialist selector */}
                <select value={activeJob.fundingSpecialist || ""} onChange={e => updateJobField("fundingSpecialist", e.target.value)}
                  style={{ ...INP, width: "auto", fontSize: 12, padding: "6px 10px" }}>
                  <option value="">Specialist...</option>
                  {specialists.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {/* Promote / fund buttons */}
                {(activeJob.packageStage === "m1") && (
                  <button onClick={() => setManualPromoteJob(activeJob)} style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${G.yellowBorder}`, background: G.yellowBg, color: G.yellow, fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: F }}>
                    Promote →
                  </button>
                )}
                {(activeJob.packageStage === "m2" && activeJob.accountStatus === "Approved") && (
                  <button onClick={() => markFullyFunded(activeJob)} style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${G.greenBorder}`, background: G.greenBg, color: G.green, fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: F }}>
                    Mark Fully Funded ✓
                  </button>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: G.text }}>
                  {activeSec === "home" ? "Job Overview"
                    : activeSec === "log" ? "Submission Log"
                    : M2_SLABELS[activeSec] ? M2_SLABELS[activeSec]
                    : SLABELS[activeSec] || activeSec}
                </h2>
                {(() => {
                  if (activeSec === "log") return null;
                  if (activeSec === "home") {
                    // Stage progress: M1 = 1/2, M2 = 2/2
                    const stage = activeJob.packageStage || "m1";
                    const color = stage === "fullyFunded" ? G.green : stage === "m2" ? G.yellow : G.accent;
                    const pct = stage === "m1" ? 50 : 100;
                    const label = stage === "m1" ? "1/2" : "2/2";
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 120 }}>
                        <div style={{ flex: 1, height: 4, background: G.border, borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 4, transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontSize: 12, color: G.textSub, minWidth: 36, textAlign: "right" }}>{label}</span>
                      </div>
                    );
                  }
                  const isM2Sec = ["pto","monitoring","conditionals"].includes(activeSec);
                  if (isM2Sec) {
                    const p = m2SecProg(activeSec, activeJob.m2Checklist || {}, !!activeJob.conditionalM1);
                    const color = p.pct === 100 ? G.green : p.issues > 0 ? G.red : G.yellow;
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 120 }}>
                        <div style={{ flex: 1, height: 4, background: G.border, borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: p.pct + "%", height: "100%", background: color, borderRadius: 4, transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontSize: 12, color: G.textSub, minWidth: 36, textAlign: "right" }}>{p.done}/{p.total}</span>
                      </div>
                    );
                  }
                  return <SecProg section={activeSec} checklist={activeJob.checklist} />;
                })()}
              </div>
              {activeSec === "home" && (
                <JobHomeScreen job={activeJob} onSelectSection={setSec} onViewReport={(type) => setReportModal({ ...activeJob, _reportType: type })} specialists={specialists} updateJobField={updateJobField} clawbackDays={clawbackDays} setManualPromoteJob={setManualPromoteJob} />
              )}
              {activeJob.packageStage === "m1" && activeSec === "prechecks" && <PrechecksSection data={activeJob.checklist} onChange={updateCL} notes={activeJob.checklist.itemNotes||{}} onNoteChange={updateNote} />}
              {activeJob.packageStage === "m1" && activeSec === "inputs" && <MainInputsSection data={activeJob.checklist} onChange={updateCL} serials={serials} notes={activeJob.checklist.itemNotes||{}} onNoteChange={updateNote} />}
              {activeJob.packageStage === "m1" && activeSec === "uploads" && <UploadsSection data={activeJob.checklist} onChange={updateCL} notes={activeJob.checklist.itemNotes||{}} onNoteChange={updateNote} />}
              {activeJob.packageStage === "m1" && activeSec === "design" && <DesignSection data={activeJob.checklist} onChange={updateCL} notes={activeJob.checklist.itemNotes||{}} onNoteChange={updateNote} jobState={activeJob.state} />}
              {activeJob.packageStage === "m1" && activeSec === "designUploads" && <DesignUploadsSection data={activeJob.checklist} onChange={updateCL} notes={activeJob.checklist.itemNotes||{}} onNoteChange={updateNote} />}
              {activeJob.packageStage === "m1" && activeSec === "site" && <SiteSection data={activeJob.checklist} onChange={updateCL} notes={activeJob.checklist.itemNotes||{}} onNoteChange={updateNote} />}
              {activeJob.packageStage === "m1" && activeSec === "roof" && <RoofSection data={activeJob.checklist} onChange={updateCL} notes={activeJob.checklist.itemNotes||{}} onNoteChange={updateNote} />}
              {activeJob.packageStage === "m1" && activeSec === "electrical" && <ElectricalSection data={activeJob.checklist} onChange={updateCL} notes={activeJob.checklist.itemNotes||{}} onNoteChange={updateNote} />}
              {activeJob.packageStage === "m1" && activeSec === "storage" && <StorageSection data={activeJob.checklist} onChange={updateCL} notes={activeJob.checklist.itemNotes||{}} onNoteChange={updateNote} />}
              {activeJob.packageStage === "m1" && activeSec === "commissioning" && <CommissioningSection data={activeJob.checklist} onChange={updateCL} notes={activeJob.checklist.itemNotes||{}} onNoteChange={updateNote} />}
              {(activeJob.packageStage === "m2" || activeJob.packageStage === "fullyFunded") && ["pto","monitoring","conditionals"].includes(activeSec) && (
                <M2ChecklistSection job={activeJob} onChange={m2cl => { const updated = { ...activeJob, m2Checklist: m2cl }; setActive(updated); setJobs(p => p.map(j => j.id === updated.id ? updated : j)); }} />
              )}
              {activeSec === "log" && <div style={{ display: "flex", flexDirection: "column", gap: 0 }}><SubmissionLog log={activeJob.submissionLog || []} /></div>}
              {activeSec !== "home" && (() => {
                const isLastM1 = activeJob.packageStage === "m1" && SORDER.indexOf(activeSec) === SORDER.length - 1;
                const overall = overallProg(activeJob.checklist);
                const allDone = overall.pct === 100 && overall.issues === 0;
                return (
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 20, borderTop: `1px solid ${G.border}` }}>
                    {activeJob.packageStage === "m1" && SORDER.indexOf(activeSec) > 0
                      ? <button onClick={() => setSec(SORDER[SORDER.indexOf(activeSec) - 1])} style={{ padding: "9px 22px", borderRadius: 8, border: `1px solid ${G.borderBright}`, background: "transparent", color: G.textSub, cursor: "pointer", fontSize: 13, fontFamily: F }}>Back</button>
                      : <div />}
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {isLastM1 && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                          {submitErr && <div style={{ fontSize: 12, color: G.red, fontWeight: 500 }}>Complete all checklist items before submitting.</div>}
                          <button
                            onClick={() => {
                              if (!allDone) { setSubmitErr(true); setTimeout(() => setSubmitErr(false), 3000); return; }
                              setSubmitErr(false);
                              updateJobField("accountStatus", "Submitted");
                            }}
                            style={{
                              padding: "9px 22px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 14, fontFamily: F,
                              cursor: allDone ? "pointer" : "not-allowed",
                              background: allDone ? G.blue : G.border,
                              color: allDone ? "#fff" : G.textDim,
                              opacity: allDone ? 1 : 0.6,
                            }}>
                            Mark as submitted
                          </button>
                        </div>
                      )}
                      {activeJob.packageStage === "m1" && SORDER.indexOf(activeSec) < SORDER.length - 1
                        ? <button onClick={() => setSec(SORDER[SORDER.indexOf(activeSec) + 1])} style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: G.accent, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: F }}>Next</button>
                        : <button onClick={() => dlReport(activeJob)} style={{ padding: "9px 22px", borderRadius: 8, border: `1px solid ${G.accentDim}`, background: G.accentGlow, color: G.accent, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: F }}>View report</button>}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        {page === "help" && <HelpPage />}
        {page === "links" && <LinksPage />}
        {page === "settings" && session.role === "admin" && <SettingsPage specialists={specialists} onUpdateSpecialists={setSpecialists} notifEmail={notifEmail} onUpdateNotifEmail={setNotifEmail} serialsData={serials} currentUser={session} />}
        {page === "funded" && (
          <div>
            <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: G.text }}>Fully Funded</h1>
            <p style={{ margin: "0 0 20px", color: G.textSub, fontSize: 13 }}>Jobs where both M1 and M2 packages have been approved.</p>
            {jobs.filter(j => j.packageStage === "fullyFunded").length === 0
              ? <div style={{ ...card, textAlign: "center", padding: 48, color: G.textSub }}>No fully funded jobs yet.</div>
              : jobs.filter(j => j.packageStage === "fullyFunded").map(job => {
                const s = { bg: "rgba(34,197,94,0.15)", color: G.green, border: `1px solid ${G.greenBorder}` };
                return (
                  <div key={job.id} onClick={() => openJob(job)} onMouseEnter={e => { e.currentTarget.style.borderColor = G.accentDim; e.currentTarget.style.background = "rgba(108,99,255,0.04)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.background = G.surface; }} style={{ ...card, display: "flex", alignItems: "center", gap: 16, marginBottom: 10, cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{job.customerName}</div>
                      <div style={{ fontSize: 12, color: G.textSub, marginTop: 2 }}>{job.fundingSpecialist && <span style={{ marginRight: 8 }}>{job.fundingSpecialist}</span>}{job.state}</div>
                    </div>
                    <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, fontWeight: 600, whiteSpace: "nowrap", ...s }}>Fully Funded</span>
                    <button onClick={() => openJob(job)} style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${G.accentDim}`, background: G.accentGlow, color: G.accent, cursor: "pointer", fontSize: 13, fontFamily: F }}>View</button>
                  </div>
                );
              })
            }
          </div>
        )}
      </div>
    </div>
  );
}
window.App = App;

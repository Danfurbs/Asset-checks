/* ═══════════════════════════════════════════════════════════════════
   Asset Family Tree Viewer — app.js
   Data logic preserved; rendering layer fully rewritten.
═══════════════════════════════════════════════════════════════════ */

// ─── DOM refs ────────────────────────────────────────────────────────
const fileInput               = document.getElementById("fileInput");
const filterInput             = document.getElementById("filterInput");
const groupFilter             = document.getElementById("groupFilter");
const itemNameFilter          = document.getElementById("itemNameFilter");
const elrFilter               = document.getElementById("elrFilter");
const assetClassFilter        = document.getElementById("assetClassFilter");
const statusFilter            = document.getElementById("statusFilter");
const hideObsoleteToggle      = document.getElementById("hideObsoleteToggle");
const errorOnlyToggle         = document.getElementById("errorOnlyToggle");
const assetList               = document.getElementById("assetList");
const listStatus              = document.getElementById("listStatus");
const triageView              = document.getElementById("triageView");
const focusView               = document.getElementById("focusView");
const triageTitle             = document.getElementById("triageTitle");
const triageSubtitle          = document.getElementById("triageSubtitle");
const triageStats             = document.getElementById("triageStats");
const triageIssueList         = document.getElementById("triageIssueList");
const backToTriage            = document.getElementById("backToTriage");
const prevIssue               = document.getElementById("prevIssue");
const nextIssue               = document.getElementById("nextIssue");
const issuePosition           = document.getElementById("issuePosition");
const referenceTreeSelect     = document.getElementById("referenceTreeSelect");
const ancestorSpine           = document.getElementById("ancestorSpine");
const focusCard               = document.getElementById("focusCard");
const focusChildren           = document.getElementById("focusChildren");
const focusChildrenControls   = document.getElementById("focusChildrenControls");
const focusTemplate           = document.getElementById("focusTemplate");
const templateChecklist       = document.getElementById("templateChecklist");
const templateSummary         = document.getElementById("templateSummary");
const focusWarnings           = document.getElementById("focusWarnings");
const changesTray             = document.getElementById("changesTray");
const trayToggle              = document.getElementById("trayToggle");
const trayLabel               = document.getElementById("trayLabel");
const trayBody                = document.getElementById("trayBody");
const trayList                = document.getElementById("trayList");
const exportButton            = document.getElementById("exportButton");
const parentSelectModal       = document.getElementById("parentSelectModal");
const parentSelectList        = document.getElementById("parentSelectList");
const parentSelectTitle       = document.getElementById("parentSelectTitle");
const parentSelectCancel      = document.getElementById("parentSelectCancel");
const placeholderSelectModal  = document.getElementById("placeholderSelectModal");
const placeholderSelectList   = document.getElementById("placeholderSelectList");
const placeholderSelectTitle  = document.getElementById("placeholderSelectTitle");
const placeholderSelectCancel = document.getElementById("placeholderSelectCancel");
const existingAssetSelectModal  = document.getElementById("existingAssetSelectModal");
const existingAssetSelectList   = document.getElementById("existingAssetSelectList");
const existingAssetSelectTitle  = document.getElementById("existingAssetSelectTitle");
const existingAssetSelectCancel = document.getElementById("existingAssetSelectCancel");
const existingAssetSearch       = document.getElementById("existingAssetSearch");
const existingAssetItemFilter   = document.getElementById("existingAssetItemFilter");
const orphanParentSelectModal   = document.getElementById("orphanParentSelectModal");
const orphanParentSelectList    = document.getElementById("orphanParentSelectList");
const orphanParentSelectTitle   = document.getElementById("orphanParentSelectTitle");
const orphanParentSelectCancel  = document.getElementById("orphanParentSelectCancel");
const orphanParentSearch        = document.getElementById("orphanParentSearch");
const undoToast                 = document.getElementById("undoToast");
const undoToastMessage          = document.getElementById("undoToastMessage");
const undoToastAction           = document.getElementById("undoToastAction");

// ─── State ───────────────────────────────────────────────────────────
let assets = [];
let assetMap = new Map();
let childrenMap = new Map();
let selectedAssetNumber = null;
let originalParentMap = new Map();
let changedAssets = new Set();
let initialMismatchAssets = new Set();
let placeholderAssets = [];
let placeholderMap = new Map();
let placeholderCounter = 0;
let lastRemovedPlaceholder = null;
let undoToastTimeoutId = null;
let undoToastHandler = null;

let referenceTrees = [];
let referenceNameCodes = [];
let referenceParentMap = new Map();
let referenceIgnoredCodes = new Set();
let referenceChildMap = new Map();
let referenceAssociatedMap = new Map();

// issue navigator state
let issueList = [];       // flat list of asset numbers with errors, for prev/next
let issueIndex = -1;

// children pagination
const CHILDREN_PAGE = 8;
let childrenOffset = 0;

// ─── Column aliases ───────────────────────────────────────────────────
const COLUMN_ALIASES = {
  assetNumber:           ["Asset Number","Asset No","Asset #"],
  parentAssetNumber:     ["Parent Asset Number","Parent Asset No","Parent Asset #"],
  assetStatus:           ["Asset Status","Status"],
  assetDesc1:            ["Asset Desc 1","Asset Description 1","Asset Desc"],
  assetDesc2:            ["Asset Desc 2","Asset Description 2"],
  elr:                   ["ELR","ELR Code"],
  assetClass:            ["Asset Class Code & Desc","Asset Class","Asset Class Code","Asset Class Description"],
  egiCodeDesc:           ["EGI Code & Desc","EGI Code and Desc","EGI Code Desc","EGI Code"],
  structuredPlantNumber: ["Structured Plant Number","Structured Plant No","Structured Plant #"],
  trackId:               ["Track ID","Track Id","TrackID"],
  assetStartMileage:     ["Asset Start Mileage","Start Mileage","Asset Start Mile"],
  assetEndMileage:       ["Asset End Mileage","End Mileage","Asset End Mile"],
  itemNameCodeDesc:      ["Item Name Code & Desc","Item Name Code and Desc","Item Name Code Desc"],
};

const EXPORT_HEADERS = [
  "EquipNo","EquipGrpId","EquipClass","PlantNo","PlantCode0","PlantCode1","PlantCode2",
  "PlantCode3","PlantCode4","PlantCode5","ParentEquipRef","ItemNameCode","EquipNoD1",
  "EquipNoD2","EquipStatus","Active Flag","Equipment Type (0)","Region (1)",
  "Maintenance Responsibility (2)","Sub Discipline (3)","Disclipline (4)",
  "Geographical Delivery Unit (5)","Route (6)","Position (7)","Special Equipment Status (8)",
  "Signal Sighting Cable Ride (9)","Maintaining Delivery Unit (10)","Asset Out Of Use Status (11)",
  "Maintenance Engineer (12)","Engineering Support Group (13)","External Ownership (14)",
  "Section Manager (15)","ConAstSegSt","ConAstSegEn","SegmentUom","CostSegLgth","InputBy",
  "OperatorId","DstrctCode","CostingFlag","EquipLocation","Colloquial_1","Colloquial_2",
  "Colloquial_3","Colloquial_4","Colloquial_5","Colloquial_6","RARUNID","RARDECID","RAILID",
  "WO_Grouping_Eqp_ID","Attrib_Name1","Attrib_Value1","Attrib_Name2","Attrib_Value2",
  "Attrib_Name3","Attrib_Value3","Attrib_Name4","Attrib_Value4","Attrib_Name5","Attrib_Value5",
  "Attrib_Name6","Attrib_Value6","Attrib_Name7","Attrib_Value7","Attrib_Name8","Attrib_Value8",
  "ADM_BatchRef","ADM_BatchRef_Seq","ASSETLAT","ASSETLONG","ASSETELAT","ASSETELONG",
  "Date of Installation","Date of Retirement","Year of Installation","Year of Retirement",
  "Result","Date / Time Stamp",
];

// ─── Column helpers ───────────────────────────────────────────────────
function normalizeHeader(v) {
  return String(v||"").replace(/\u00a0/g," ").replace(/[^a-z0-9]+/gi," ").replace(/\s+/g," ").trim().toLowerCase();
}
function findColumn(headers, candidates) {
  const norm = headers.map(normalizeHeader);
  for (const c of candidates) {
    const nc = normalizeHeader(c);
    const i = norm.indexOf(nc);
    if (i !== -1) return i;
    const j = norm.findIndex(h => h.includes(nc));
    if (j !== -1) return j;
  }
  return -1;
}
function findHeaderRow(rows, max=20) {
  for (let i=0; i<Math.min(rows.length,max); i++) {
    const h = rows[i]||[];
    if (findColumn(h,COLUMN_ALIASES.assetNumber)!==-1 && findColumn(h,COLUMN_ALIASES.parentAssetNumber)!==-1) return i;
  }
  return -1;
}

// ─── Build maps ───────────────────────────────────────────────────────
function buildMaps(rows, headers) {
  assetMap = new Map(); childrenMap = new Map();
  originalParentMap = new Map(); changedAssets = new Set();
  placeholderAssets = []; placeholderMap = new Map(); placeholderCounter = 0;

  const col = k => findColumn(headers, COLUMN_ALIASES[k]);
  const assetIdx  = col("assetNumber");
  const parentIdx = col("parentAssetNumber");
  if (assetIdx===-1||parentIdx===-1) throw new Error("Missing required columns: Asset Number and Parent Asset Number.");

  const idx = Object.fromEntries(Object.keys(COLUMN_ALIASES).map(k=>[k,col(k)]));

  assets = rows.map(row => {
    const assetNumber = row[assetIdx]?.toString().trim();
    if (!assetNumber) return null;
    const get = (k,i) => i!==-1 ? row[i]?.toString().trim()||"" : "";
    return {
      assetNumber,
      parentAssetNumber:     row[parentIdx]?.toString().trim()||null,
      assetStatus:           get("assetStatus",idx.assetStatus),
      assetDesc1:            get("assetDesc1",idx.assetDesc1),
      assetDesc2:            get("assetDesc2",idx.assetDesc2),
      elr:                   get("elr",idx.elr),
      assetClass:            get("assetClass",idx.assetClass),
      egiCodeDesc:           get("egiCodeDesc",idx.egiCodeDesc),
      structuredPlantNumber: get("structuredPlantNumber",idx.structuredPlantNumber),
      trackId:               get("trackId",idx.trackId),
      assetStartMileage:     get("assetStartMileage",idx.assetStartMileage),
      assetEndMileage:       get("assetEndMileage",idx.assetEndMileage),
      itemNameCodeDesc:      get("itemNameCodeDesc",idx.itemNameCodeDesc),
    };
  }).filter(Boolean);

  assets.forEach(a => {
    assetMap.set(a.assetNumber, a);
    originalParentMap.set(a.assetNumber, a.parentAssetNumber||null);
  });
  assets.forEach(a => {
    if (!a.parentAssetNumber) return;
    if (!childrenMap.has(a.parentAssetNumber)) childrenMap.set(a.parentAssetNumber,[]);
    childrenMap.get(a.parentAssetNumber).push(a.assetNumber);
  });
}

// ─── Asset helpers ────────────────────────────────────────────────────
function extractNameCode(v) {
  const m = String(v||"").trim().match(/^[A-Za-z0-9]+/);
  return m ? m[0].toUpperCase() : "";
}
function isObsolete(asset) { return asset?.assetStatus?.startsWith("OR"); }
function isOrphaned(asset) {
  if (!asset?.parentAssetNumber) return false;
  const p = assetMap.get(asset.parentAssetNumber);
  return p ? isObsolete(p) : false;
}
function isReferenceMismatch(asset, parentOverride=null) {
  const code = extractNameCode(asset.itemNameCodeDesc);
  if (!code||!referenceNameCodes.includes(code)) return false;
  if (referenceIgnoredCodes.has(code)) return false;
  const pNum = parentOverride!==null ? parentOverride : asset.parentAssetNumber;
  if (!pNum) return (referenceParentMap.get(code)||new Set()).size>0;
  const p = assetMap.get(pNum);
  if (!p) return true;
  const pCode = extractNameCode(p.itemNameCodeDesc);
  if (!pCode||!referenceNameCodes.includes(pCode)) return false;
  return !(referenceParentMap.get(code)||new Set()).has(pCode);
}
function getMissingReferenceChildGroups(asset) {
  const code = extractNameCode(asset.itemNameCodeDesc);
  if (!code||!referenceChildMap.has(code)) return [];
  const existing = getExistingChildCodes(asset.assetNumber);
  return (referenceChildMap.get(code)||[]).filter(g=>!g.optional && !Array.from(g.codes).some(c=>existing.has(c)));
}
function getMissingReferenceChildren(asset) {
  return getMissingReferenceChildGroups(asset).map(g=>Array.from(g.codes).join(" or "));
}
function getExistingChildCodes(parentNum) {
  const codes = new Set();
  (childrenMap.get(parentNum)||[]).forEach(n=>{
    const c = extractNameCode(assetMap.get(n)?.itemNameCodeDesc); if(c) codes.add(c);
  });
  (placeholderMap.get(parentNum)||[]).forEach(p=>{ if(p.itemNameCode) codes.add(p.itemNameCode); });
  return codes;
}
function hasError(asset) {
  return isReferenceMismatch(asset)||getMissingReferenceChildren(asset).length>0||isOrphaned(asset);
}
function shouldShowTick(asset) {
  return initialMismatchAssets.has(asset.assetNumber) && !isReferenceMismatch(asset);
}
function isDescendant(num, potentialParent) {
  if (!num||!potentialParent) return false;
  const ch = childrenMap.get(num)||[];
  return ch.includes(potentialParent)||ch.some(c=>isDescendant(c,potentialParent));
}

// ─── Ancestor chain ───────────────────────────────────────────────────
function buildAncestorChain(num) {
  const chain=[]; let cur=assetMap.get(num);
  if (!cur) return chain;
  chain.unshift(cur);
  while (cur?.parentAssetNumber) {
    const p=assetMap.get(cur.parentAssetNumber);
    if (!p) { chain.unshift({assetNumber:cur.parentAssetNumber,missing:true}); break; }
    chain.unshift(p); cur=p;
  }
  return chain;
}

// ─── Reference tree helpers ───────────────────────────────────────────
function getActiveReferenceTree() {
  if (!referenceTrees.length) return null;
  return referenceTrees.find(t=>t.id===referenceTreeSelect?.value)||referenceTrees[0]||null;
}
function findReferenceRootAssetNumber(num, rootCodes) {
  if (!num||!rootCodes?.length) return num;
  let cur=assetMap.get(num), fb=num;
  while (cur) {
    const c=extractNameCode(cur.itemNameCodeDesc);
    if (rootCodes.includes(c)) return cur.assetNumber;
    fb=cur.assetNumber;
    if (!cur.parentAssetNumber) break;
    cur=assetMap.get(cur.parentAssetNumber);
  }
  return fb;
}

// ─── Filters ──────────────────────────────────────────────────────────
function populateSelectFilter(sel, values, {allLabel,emptyLabel}) {
  const unique=new Set(); let hasEmpty=false;
  values.forEach(v=>{const t=v?.trim()||""; t?unique.add(t):(hasEmpty=true);});
  sel.innerHTML="";
  const all=document.createElement("option"); all.value="all"; all.textContent=allLabel; sel.appendChild(all);
  if (hasEmpty) { const e=document.createElement("option"); e.value="__empty__"; e.textContent=emptyLabel; sel.appendChild(e); }
  Array.from(unique).sort((a,b)=>a.localeCompare(b)).forEach(v=>{
    const o=document.createElement("option"); o.value=v; o.textContent=v; sel.appendChild(o);
  });
}
function populateFilters() {
  populateSelectFilter(itemNameFilter, assets.map(a=>a.itemNameCodeDesc), {allLabel:"All Item Name Codes",emptyLabel:"No Item Name Code"});
  populateSelectFilter(elrFilter, assets.map(a=>a.elr), {allLabel:"All ELRs",emptyLabel:"No ELR"});
  populateSelectFilter(assetClassFilter, assets.map(a=>a.assetClass), {allLabel:"All Asset Classes",emptyLabel:"No Asset Class"});
  populateSelectFilter(statusFilter, assets.map(a=>a.assetStatus), {allLabel:"All Statuses",emptyLabel:"No Status"});
}
function matchesFilters(asset) {
  const q=filterInput.value.trim().toLowerCase();
  const label=`${asset.assetNumber} ${asset.assetDesc1} ${asset.assetDesc2} ${asset.itemNameCodeDesc} ${asset.elr} ${asset.assetClass} ${asset.assetStatus}`.toLowerCase();
  if (q && !label.includes(q)) return false;
  const gv=groupFilter.value;
  if (gv==="sc-group") {
    const c=extractNameCode(asset.itemNameCodeDesc);
    if (!c||!referenceNameCodes.includes(c)) return false;
  }
  const check=(sel,val)=>{
    if (sel.value==="all") return true;
    const v=val?.trim()||"";
    if (sel.value==="__empty__") return !v;
    return v===sel.value;
  };
  if (!check(itemNameFilter,asset.itemNameCodeDesc)) return false;
  if (!check(elrFilter,asset.elr)) return false;
  if (!check(assetClassFilter,asset.assetClass)) return false;
  if (!check(statusFilter,asset.assetStatus)) return false;
  if (hideObsoleteToggle.checked && isObsolete(asset)) return false;
  if (errorOnlyToggle.checked && !hasError(asset)) return false;
  return true;
}

// ─── Left asset list ──────────────────────────────────────────────────
function renderAssetList() {
  assetList.innerHTML="";
  const filtered=assets.filter(matchesFilters).sort((a,b)=>a.assetNumber.localeCompare(b.assetNumber));
  listStatus.textContent=`${filtered.length}`;

  filtered.forEach(asset=>{
    const li=document.createElement("li");
    const btn=document.createElement("button");
    btn.type="button"; btn.className="asset-btn";
    if (asset.assetNumber===selectedAssetNumber) btn.classList.add("selected");

    if (isReferenceMismatch(asset))          { const b=badge("danger","!"); btn.appendChild(b); }
    else if (getMissingReferenceChildren(asset).length) { const b=badge("warn","!"); btn.appendChild(b); }
    else if (isOrphaned(asset))              { const b=badge("purple","!"); btn.appendChild(b); }
    else if (shouldShowTick(asset))          { const b=badge("success","✓"); btn.appendChild(b); }

    const lbl=document.createElement("span");
    lbl.className="asset-label";
    const desc=asset.assetDesc1||asset.assetDesc2||"";
    lbl.textContent=desc?`${asset.assetNumber} · ${desc}`:asset.assetNumber;
    btn.appendChild(lbl);
    btn.addEventListener("click",()=>selectAsset(asset.assetNumber));
    li.appendChild(btn); assetList.appendChild(li);
  });
}
function badge(type,text) {
  const s=document.createElement("span");
  s.className=`badge badge-${type}`; s.textContent=text; return s;
}

// ─── Select asset ─────────────────────────────────────────────────────
function selectAsset(num) {
  if (!num) return;
  selectedAssetNumber=num; childrenOffset=0;

  // update issue navigator index
  const i=issueList.indexOf(num);
  if (i!==-1) issueIndex=i;

  renderAssetList();
  showFocusView();
}

// ─── Triage view ──────────────────────────────────────────────────────
function buildIssueList() {
  issueList=assets.filter(hasError).map(a=>a.assetNumber);
}

function renderTriageView() {
  triageView.classList.remove("hidden");
  focusView.classList.add("hidden");
  selectedAssetNumber=null;
  renderAssetList();

  if (!assets.length) {
    triageTitle.textContent="Upload a file to begin";
    triageSubtitle.textContent="Your asset export will be validated against the selected reference tree.";
    triageStats.innerHTML=""; triageIssueList.innerHTML=""; return;
  }

  const mismatches=assets.filter(a=>isReferenceMismatch(a));
  const orphaned=assets.filter(a=>isOrphaned(a));
  const missingChildren=assets.filter(a=>getMissingReferenceChildren(a).length);
  const clean=assets.filter(a=>!hasError(a)&&referenceNameCodes.includes(extractNameCode(a.itemNameCodeDesc)));

  const tree=getActiveReferenceTree();
  triageTitle.textContent=`${assets.length} assets loaded`;
  triageSubtitle.textContent=tree?`Validating against: ${tree.label}`:"No reference tree selected.";

  triageStats.innerHTML="";
  [
    {num:mismatches.length,    label:"Hierarchy mismatches", cls:"stat-danger"},
    {num:orphaned.length,      label:"Orphaned assets",      cls:"stat-purple"},
    {num:missingChildren.length,label:"Missing children",   cls:"stat-warn"},
    {num:clean.length,         label:"Clean assets",         cls:"stat-ok"},
    {num:assets.length,        label:"Total assets",         cls:"stat-muted"},
  ].forEach(({num,label,cls})=>{
    const card=document.createElement("div");
    card.className=`stat-card ${cls}`;
    card.innerHTML=`<span class="stat-num">${num}</span><span class="stat-label">${label}</span>`;
    triageStats.appendChild(card);
  });

  triageIssueList.innerHTML="";
  const sections=[
    {title:"Hierarchy mismatches",items:mismatches,tag:"mismatch"},
    {title:"Orphaned assets",items:orphaned,tag:"orphaned"},
    {title:"Missing expected children",items:missingChildren,tag:"missing"},
  ];
  sections.forEach(({title,items,tag})=>{
    if (!items.length) return;
    const sec=document.createElement("div");
    sec.className="triage-section-title"; sec.textContent=`${title} (${items.length})`;
    triageIssueList.appendChild(sec);
    items.forEach(asset=>{
      triageIssueList.appendChild(buildIssueRow(asset,tag));
    });
  });
}

function buildIssueRow(asset,primaryTag) {
  const row=document.createElement("div");
  row.className="issue-row";

  const icon=document.createElement("div"); icon.className="issue-icon";
  const iconMap={mismatch:{bg:"#fee2e2",c:"#991b1b",t:"⚠"},orphaned:{bg:"#ede9fe",c:"#5b21b6",t:"⤴"},missing:{bg:"#fef3c7",c:"#92400e",t:"◻"}};
  const ic=iconMap[primaryTag]||iconMap.missing;
  icon.style.background=ic.bg; icon.style.color=ic.c; icon.textContent=ic.t;

  const body=document.createElement("div"); body.className="issue-body";
  const idEl=document.createElement("div"); idEl.className="issue-id"; idEl.textContent=asset.assetNumber;
  const desc=asset.assetDesc1||asset.assetDesc2||asset.itemNameCodeDesc||"";
  const descEl=document.createElement("div"); descEl.className="issue-desc"; descEl.textContent=desc;

  const tags=document.createElement("div"); tags.className="issue-tags";
  if (isReferenceMismatch(asset)) {
    const t=document.createElement("span"); t.className="issue-tag tag-mismatch"; t.textContent="Mismatch"; tags.appendChild(t);
  }
  if (isOrphaned(asset)) {
    const t=document.createElement("span"); t.className="issue-tag tag-orphaned"; t.textContent="Orphaned"; tags.appendChild(t);
  }
  getMissingReferenceChildren(asset).forEach(code=>{
    const t=document.createElement("span"); t.className="issue-tag tag-missing"; t.textContent=`Missing: ${code}`; tags.appendChild(t);
  });

  body.appendChild(idEl); body.appendChild(descEl); body.appendChild(tags);
  const arrow=document.createElement("span"); arrow.className="issue-arrow"; arrow.textContent="›";

  row.appendChild(icon); row.appendChild(body); row.appendChild(arrow);
  row.addEventListener("click",()=>selectAsset(asset.assetNumber));
  return row;
}

// ─── Focus view ───────────────────────────────────────────────────────
function showFocusView() {
  triageView.classList.add("hidden");
  focusView.classList.remove("hidden");
  renderFocusView();
}

function renderFocusView() {
  if (!selectedAssetNumber) { renderTriageView(); return; }
  const asset=assetMap.get(selectedAssetNumber);
  if (!asset) return;

  renderAncestorSpine(selectedAssetNumber);
  renderFocusCard(asset);
  renderFocusChildren(selectedAssetNumber);
  renderTemplateChecklist(asset);
  renderFocusWarnings(asset);
  updateIssueNav();
}

// Ancestor spine
function renderAncestorSpine(num) {
  ancestorSpine.innerHTML="";
  const chain=buildAncestorChain(num);
  chain.forEach((node,i)=>{
    if (i>0) { const sep=document.createElement("span"); sep.className="spine-sep"; sep.textContent="›"; ancestorSpine.appendChild(sep); }
    const chip=document.createElement("button");
    chip.type="button";
    chip.className=`spine-chip${node.missing?" missing":""}`;
    chip.textContent=node.assetNumber;
    if (node.assetNumber===num) chip.style.fontWeight="800";
    if (!node.missing) chip.addEventListener("click",()=>selectAsset(node.assetNumber));
    ancestorSpine.appendChild(chip);
  });
}

// Focus card
function renderFocusCard(asset) {
  focusCard.innerHTML="";
  const idEl=document.createElement("div"); idEl.className="focus-card-id"; idEl.textContent=asset.assetNumber;
  const desc=asset.assetDesc1||asset.assetDesc2||"";
  const nameEl=document.createElement("div"); nameEl.className="focus-card-name"; nameEl.textContent=desc||"—";

  const meta=document.createElement("div"); meta.className="focus-card-meta";
  const code=extractNameCode(asset.itemNameCodeDesc);
  if (code) { const p=pill(code,"type"); meta.appendChild(p); }
  if (asset.elr) { const p=pill(asset.elr,"elr"); meta.appendChild(p); }
  if (asset.assetStatus) {
    const p=pill(asset.assetStatus,isObsolete(asset)?"status-obsolete":"");
    meta.appendChild(p);
  }
  if (asset.trackId) meta.appendChild(pill(`Track: ${asset.trackId}`,""));

  const actions=document.createElement("div"); actions.className="focus-card-actions";
  if (isOrphaned(asset)) {
    const btn=document.createElement("button"); btn.type="button"; btn.className="btn-sm";
    btn.textContent="↺ Reassign parent";
    btn.addEventListener("click",()=>openOrphanParentSelectModal(asset.assetNumber));
    actions.appendChild(btn);
  }
  const missingGroups=getMissingReferenceChildGroups(asset);
  if (missingGroups.length) {
    const cands=getUnassignedAssetsForGroups(missingGroups,asset.assetNumber);
    if (cands.length) {
      const btn=document.createElement("button"); btn.type="button"; btn.className="btn-sm";
      btn.textContent="🔗 Link existing asset";
      btn.addEventListener("click",()=>openExistingAssetSelectModal(asset.assetNumber,missingGroups));
      actions.appendChild(btn);
    }
    const btnP=document.createElement("button"); btnP.type="button"; btnP.className="btn-sm";
    btnP.textContent="+ Add placeholder";
    btnP.addEventListener("click",()=>openPlaceholderSelectModal(asset.assetNumber,missingGroups));
    actions.appendChild(btnP);
  }

  focusCard.appendChild(idEl);
  focusCard.appendChild(nameEl);
  focusCard.appendChild(meta);
  if (actions.children.length) focusCard.appendChild(actions);
}

function pill(text,type) {
  const s=document.createElement("span");
  s.className=`meta-pill${type?` pill-${type}`:""}`;
  s.textContent=text; return s;
}

// Children grid
function renderFocusChildren(num) {
  focusChildren.innerHTML=""; focusChildrenControls.innerHTML="";
  const childNums=childrenMap.get(num)||[];
  const placeholders=placeholderMap.get(num)||[];
  const total=childNums.length+placeholders.length;
  if (!total) return;

  const lbl=document.createElement("div"); lbl.className="children-label";
  lbl.textContent=`Children (${total})`;
  focusChildren.parentElement.insertBefore(lbl, focusChildren);

  const page=childNums.slice(childrenOffset, childrenOffset+CHILDREN_PAGE);
  page.forEach(cn=>{
    const a=assetMap.get(cn); if(!a) return;
    focusChildren.appendChild(buildChildCard(a));
  });
  placeholders.forEach(ph=>{
    focusChildren.appendChild(buildPlaceholderCard(ph));
  });

  if (childNums.length>CHILDREN_PAGE) {
    if (childrenOffset>0) {
      const btn=document.createElement("button"); btn.type="button"; btn.className="btn-sm";
      btn.textContent="← Prev"; btn.addEventListener("click",()=>{ childrenOffset=Math.max(0,childrenOffset-CHILDREN_PAGE); renderFocusView(); });
      focusChildrenControls.appendChild(btn);
    }
    const info=document.createElement("span"); info.style.fontSize=".75rem"; info.style.color="var(--muted)";
    info.textContent=`${childrenOffset+1}–${Math.min(childrenOffset+CHILDREN_PAGE,childNums.length)} of ${childNums.length}`;
    focusChildrenControls.appendChild(info);
    if (childrenOffset+CHILDREN_PAGE<childNums.length) {
      const btn=document.createElement("button"); btn.type="button"; btn.className="btn-sm";
      btn.textContent="Next →"; btn.addEventListener("click",()=>{ childrenOffset+=CHILDREN_PAGE; renderFocusView(); });
      focusChildrenControls.appendChild(btn);
    }
  }
}

function buildChildCard(asset) {
  const card=document.createElement("div"); card.className="child-card";
  if (isObsolete(asset)) card.classList.add("obsolete");
  if (isOrphaned(asset)) card.classList.add("orphaned");

  const idEl=document.createElement("div"); idEl.className="child-id"; idEl.textContent=asset.assetNumber;
  const code=extractNameCode(asset.itemNameCodeDesc);
  const typeEl=document.createElement("div"); typeEl.className="child-type"; typeEl.textContent=code||"?";
  const nameEl=document.createElement("div"); nameEl.className="child-name";
  nameEl.textContent=asset.assetDesc1||asset.assetDesc2||"";

  card.appendChild(idEl); card.appendChild(typeEl); if(nameEl.textContent) card.appendChild(nameEl);
  card.addEventListener("click",()=>selectAsset(asset.assetNumber));
  return card;
}

function buildPlaceholderCard(ph) {
  const card=document.createElement("div"); card.className="child-card";
  card.style.borderStyle="dashed"; card.style.borderColor="#67e8f9"; card.style.background="#ecfeff";

  const lbl=document.createElement("div"); lbl.style.fontStyle="italic"; lbl.style.color="#0e7490";
  lbl.textContent="Placeholder";
  const typeEl=document.createElement("div"); typeEl.className="child-type"; typeEl.textContent=ph.itemNameCode;
  const rmBtn=document.createElement("button"); rmBtn.type="button"; rmBtn.className="btn-sm btn-danger";
  rmBtn.style.marginTop=".4rem"; rmBtn.textContent="Remove";
  rmBtn.addEventListener("click",(e)=>{ e.stopPropagation(); removePlaceholderAsset(ph.id,{offerUndo:true}); });

  card.appendChild(lbl); card.appendChild(typeEl); card.appendChild(rmBtn);
  return card;
}

// Reference template checklist
function renderTemplateChecklist(asset) {
  templateChecklist.innerHTML=""; templateSummary.textContent="";
  const tree=getActiveReferenceTree();
  if (!tree?.root) { focusTemplate.classList.add("hidden"); return; }
  focusTemplate.classList.remove("hidden");

  const code=extractNameCode(asset.itemNameCodeDesc);
  const groups=referenceChildMap.get(code)||[];
  if (!groups.length && !code) { templateChecklist.innerHTML=`<p style="color:var(--muted);font-size:.8rem">No reference template for this asset type.</p>`; return; }

  const existing=getExistingChildCodes(asset.assetNumber);
  let filled=0,missing=0,placeholders=0,optional=0;

  // also include own-code row (is this asset correctly placed?)
  const parentCheck=document.createElement("div");
  if (code&&referenceNameCodes.includes(code)) {
    const mismatch=isReferenceMismatch(asset);
    parentCheck.className=`checklist-row ${mismatch?"row-missing":"row-ok"}`;
    parentCheck.innerHTML=`<span class="check-icon">${mismatch?"✗":"✓"}</span>
      <div class="check-body">
        <div class="check-title">This asset</div>
        <div class="check-code">${code} · ${mismatch?"Incorrect parent":"Correctly placed"}</div>
      </div>`;
    templateChecklist.appendChild(parentCheck);
  }

  // build all child reference trees for this code
  const allRefChildren=[];
  function gatherRefChildren(node) {
    (node.nameCodes||[]).map(c=>c.toUpperCase()).forEach(nc=>{
      if (nc===code) { (node.children||[]).forEach(ch=>allRefChildren.push(ch)); }
    });
    (node.children||[]).forEach(gatherRefChildren);
  }
  gatherRefChildren(tree.root);

  const displayGroups=allRefChildren.length ? allRefChildren.map(ch=>({
    codes: new Set((ch.nameCodes||[]).map(c=>c.toUpperCase())),
    optional: Boolean(ch.optional),
    title: ch.title||"",
  })) : groups.map(g=>({...g,title:""}));

  displayGroups.forEach(g=>{
    const matched=Array.from(g.codes).filter(c=>existing.has(c));
    const isPlaceholder=!matched.length && Array.from(g.codes).some(c=>(placeholderMap.get(asset.assetNumber)||[]).some(p=>p.itemNameCode===c));
    const isFilled=matched.length>0;
    const isMissing=!isFilled&&!isPlaceholder&&!g.optional;

    let cls="checklist-row ";
    let icon="";
    if (isFilled)       { cls+="row-ok";          icon="✓"; filled++; }
    else if(isPlaceholder){cls+="row-placeholder"; icon="⊡"; placeholders++; }
    else if(isMissing)  { cls+="row-missing";      icon="✗"; missing++; }
    else                { cls+="row-optional";     icon="○"; optional++; }

    const row=document.createElement("div"); row.className=cls;

    const codeList=Array.from(g.codes).join(" / ");
    let assetLink="";
    if (isFilled) {
      const matchedNums=(childrenMap.get(asset.assetNumber)||[]).filter(cn=>{
        const cc=extractNameCode(assetMap.get(cn)?.itemNameCodeDesc);
        return matched.includes(cc);
      });
      assetLink=matchedNums.map(mn=>`<span class="check-asset" data-num="${mn}">${mn}</span>`).join(", ");
    }

    let actionsHtml="";
    if (!isFilled && !isPlaceholder) {
      const cands=getUnassignedAssetsForGroups([g],asset.assetNumber);
      if (cands.length) actionsHtml+=`<button type="button" data-action="link" class="btn-sm">Link existing</button>`;
      if (!g.optional)  actionsHtml+=`<button type="button" data-action="placeholder" class="btn-sm">Add placeholder</button>`;
    }
    if (isPlaceholder) actionsHtml+=`<button type="button" data-action="replace" class="btn-sm">Replace with asset</button>`;

    row.innerHTML=`<span class="check-icon">${icon}</span>
      <div class="check-body">
        <div class="check-title">${g.title||codeList}</div>
        <div class="check-code">${codeList}${g.optional?" · optional":""}</div>
        ${assetLink?`<div class="check-asset-row">${assetLink}</div>`:""}
        ${actionsHtml?`<div class="check-actions">${actionsHtml}</div>`:""}
      </div>`;

    // wire up actions
    row.querySelectorAll(".check-asset").forEach(el=>{
      el.addEventListener("click",()=>selectAsset(el.dataset.num));
    });
    const linkBtn=row.querySelector("[data-action=link]");
    if (linkBtn) linkBtn.addEventListener("click",()=>openExistingAssetSelectModal(asset.assetNumber,[g]));
    const phBtn=row.querySelector("[data-action=placeholder]");
    if (phBtn) phBtn.addEventListener("click",()=>openPlaceholderSelectModal(asset.assetNumber,[g]));
    const repBtn=row.querySelector("[data-action=replace]");
    if (repBtn) repBtn.addEventListener("click",()=>{
      const phId=(placeholderMap.get(asset.assetNumber)||[]).find(p=>g.codes.has(p.itemNameCode))?.id;
      openExistingAssetSelectModal(asset.assetNumber,[g],{allowAssigned:true,replacePlaceholderId:phId});
    });

    templateChecklist.appendChild(row);
  });

  templateSummary.textContent=`${filled} filled · ${missing} missing${placeholders?` · ${placeholders} placeholder`:""}`;
}

// Focus warnings
function renderFocusWarnings(asset) {
  focusWarnings.innerHTML="";
  const warnings=[];
  if (isReferenceMismatch(asset)) warnings.push({cls:"w-mismatch",msg:"Hierarchy mismatch — does not follow the reference tree."});
  if (isOrphaned(asset)) {
    const p=assetMap.get(asset.parentAssetNumber);
    warnings.push({cls:"w-orphaned",msg:`Orphaned — parent ${asset.parentAssetNumber}${p?` (${p.assetStatus})`:""}  is obsolete.`});
  }
  getMissingReferenceChildren(asset).forEach(code=>{
    warnings.push({cls:"w-missing",msg:`Expected child type missing: ${code}`});
  });
  warnings.forEach(({cls,msg})=>{
    const row=document.createElement("div"); row.className=`warning-row ${cls}`;
    const icon=document.createElement("span"); icon.className="w-icon"; icon.textContent="!";
    const text=document.createElement("span"); text.textContent=msg;
    row.appendChild(icon); row.appendChild(text); focusWarnings.appendChild(row);
  });
}

// Issue navigation
function updateIssueNav() {
  const total=issueList.length;
  prevIssue.disabled=issueIndex<=0||total===0;
  nextIssue.disabled=issueIndex>=total-1||total===0;
  issuePosition.textContent=total>0?`${issueIndex+1} / ${total} issues`:"";
}

// ─── Changes tray ─────────────────────────────────────────────────────
function updateChangesTray() {
  const totalChanges=changedAssets.size+placeholderAssets.length;
  exportButton.disabled=changedAssets.size===0&&placeholderAssets.length===0;

  if (totalChanges===0) {
    trayLabel.textContent="No pending changes";
    trayLabel.classList.remove("has-changes");
  } else {
    trayLabel.textContent=`${totalChanges} pending change${totalChanges>1?"s":""}`;
    trayLabel.classList.add("has-changes");
  }

  trayList.innerHTML="";
  Array.from(changedAssets).sort((a,b)=>a.localeCompare(b)).forEach(num=>{
    const a=assetMap.get(num); if(!a) return;
    const item=document.createElement("div"); item.className="tray-item";
    const lbl=document.createElement("span"); lbl.className="tray-item-label";
    lbl.textContent=`Reparent ${num} → ${a.parentAssetNumber||"(none)"}`;
    const rm=document.createElement("button"); rm.textContent="✕"; rm.title="Revert";
    rm.addEventListener("click",()=>{
      const orig=originalParentMap.get(num);
      updateAssetParent(num,orig,true);
    });
    item.appendChild(lbl); item.appendChild(rm); trayList.appendChild(item);
  });
  placeholderAssets.forEach(ph=>{
    const item=document.createElement("div"); item.className="tray-item";
    const lbl=document.createElement("span"); lbl.className="tray-item-label";
    lbl.textContent=`Placeholder ${ph.itemNameCode} under ${ph.parentAssetNumber}`;
    const rm=document.createElement("button"); rm.textContent="✕"; rm.title="Remove";
    rm.addEventListener("click",()=>removePlaceholderAsset(ph.id,{offerUndo:false}));
    item.appendChild(lbl); item.appendChild(rm); trayList.appendChild(item);
  });
}

trayToggle.addEventListener("click",()=>{
  changesTray.classList.toggle("collapsed");
  changesTray.classList.toggle("expanded");
});

// ─── Asset parent update ──────────────────────────────────────────────
function updateAssetParent(num, newParent, isRevert=false) {
  const asset=assetMap.get(num);
  if (!asset||!newParent||num===newParent||isDescendant(num,newParent)) return;
  const old=asset.parentAssetNumber||null;
  if (old===newParent) return;

  if (old&&childrenMap.has(old)) {
    const sib=childrenMap.get(old).filter(c=>c!==num);
    sib.length ? childrenMap.set(old,sib) : childrenMap.delete(old);
  }
  asset.parentAssetNumber=newParent;
  if (!childrenMap.has(newParent)) childrenMap.set(newParent,[]);
  if (!childrenMap.get(newParent).includes(num)) childrenMap.get(newParent).push(num);

  if (isRevert||originalParentMap.get(num)===newParent) changedAssets.delete(num);
  else changedAssets.add(num);

  buildIssueList();
  updateChangesTray();
  renderAssetList();
  if (selectedAssetNumber) renderFocusView();
}

// ─── Placeholders ─────────────────────────────────────────────────────
function addPlaceholderAsset(parentNum, itemNameCode) {
  if (!parentNum||!itemNameCode) return;
  const ph={id:`ph-${parentNum}-${itemNameCode}-${placeholderCounter++}`,parentAssetNumber:parentNum,itemNameCode};
  placeholderAssets.push(ph);
  if (!placeholderMap.has(parentNum)) placeholderMap.set(parentNum,[]);
  placeholderMap.get(parentNum).push(ph);
  buildIssueList(); updateChangesTray();
  if (selectedAssetNumber) renderFocusView();
}

function removePlaceholderAsset(id, {offerUndo=false}={}) {
  let removed=null;
  placeholderMap.forEach((items,pNum)=>{
    const i=items.findIndex(p=>p.id===id);
    if (i!==-1) { removed=items[i]; const f=items.filter(p=>p.id!==id); f.length?placeholderMap.set(pNum,f):placeholderMap.delete(pNum); }
  });
  if (!removed) return;
  placeholderAssets=placeholderAssets.filter(p=>p.id!==id);
  if (offerUndo) {
    lastRemovedPlaceholder=removed;
    showUndoToast(`Removed placeholder ${removed.itemNameCode}.`,()=>{
      if (!lastRemovedPlaceholder) return;
      const it=lastRemovedPlaceholder;
      placeholderAssets.push(it);
      if (!placeholderMap.has(it.parentAssetNumber)) placeholderMap.set(it.parentAssetNumber,[]);
      placeholderMap.get(it.parentAssetNumber).push(it);
      lastRemovedPlaceholder=null;
      buildIssueList(); updateChangesTray();
      if (selectedAssetNumber) renderFocusView();
    });
  }
  buildIssueList(); updateChangesTray();
  if (selectedAssetNumber) renderFocusView();
}

function showUndoToast(msg, onUndo) {
  if (!undoToast) return;
  undoToastMessage.textContent=msg; undoToast.classList.remove("hidden");
  if (undoToastHandler) undoToastAction.removeEventListener("click",undoToastHandler);
  undoToastHandler=()=>{
    if (undoToastTimeoutId) clearTimeout(undoToastTimeoutId);
    undoToast.classList.add("hidden"); undoToastHandler=null; onUndo?.();
  };
  undoToastAction.addEventListener("click",undoToastHandler);
  if (undoToastTimeoutId) clearTimeout(undoToastTimeoutId);
  undoToastTimeoutId=setTimeout(()=>{ undoToast.classList.add("hidden"); undoToastHandler=null; },6000);
}

// ─── Modal helpers ────────────────────────────────────────────────────
let existingAssetCandidates=[];
let existingAssetTargetParentNumber=null;
let existingAssetReplacementPlaceholderId=null;
let orphanParentCandidates=[];
let orphanTargetAssetNumber=null;

function getCandidateAssetsForGroups(missingGroups, parentNum, {allowAssigned=false}={}) {
  const allowed=new Set(); missingGroups.forEach(g=>g.codes.forEach(c=>allowed.add(c)));
  return assets.filter(a=>{
    if (!a) return false;
    if (!allowAssigned&&a.parentAssetNumber) return false;
    if (a.assetNumber===parentNum) return false;
    if (allowAssigned&&isDescendant(a.assetNumber,parentNum)) return false;
    const c=extractNameCode(a.itemNameCodeDesc); return c&&allowed.has(c);
  }).sort((a,b)=>a.assetNumber.localeCompare(b.assetNumber));
}
function getUnassignedAssetsForGroups(groups,parentNum) {
  return getCandidateAssetsForGroups(groups,parentNum,{allowAssigned:false});
}
function getParentCandidates(num) {
  return assets.filter(a=>a&&a.assetNumber!==num&&!isDescendant(num,a.assetNumber)&&!isObsolete(a))
    .sort((a,b)=>a.assetNumber.localeCompare(b.assetNumber));
}
function buildPlaceholderOptions(groups) {
  const opts=[]; groups.forEach(g=>{
    const codes=Array.from(g.codes).sort((a,b)=>a.localeCompare(b));
    codes.forEach(code=>opts.push({code,groupLabel:codes.join(" or ")}));
  }); return opts;
}

function buildAssetOptionButton(asset, onSelect) {
  const btn=document.createElement("button"); btn.type="button"; btn.className="modal-option";
  const t=document.createElement("span"); t.className="modal-option-title"; t.textContent=asset.assetNumber; btn.appendChild(t);
  const dl=document.createElement("dl"); dl.className="modal-option-details";
  [{label:"Item Name Code",value:asset.itemNameCodeDesc},{label:"Desc 1",value:asset.assetDesc1},
   {label:"ELR",value:asset.elr},{label:"Status",value:asset.assetStatus}].forEach(({label,value})=>{
    const dt=document.createElement("dt"); dt.textContent=label;
    const dd=document.createElement("dd"); dd.textContent=value||"—";
    dl.appendChild(dt); dl.appendChild(dd);
  });
  btn.appendChild(dl);
  btn.addEventListener("click",()=>onSelect(asset));
  return btn;
}

function openParentSelectModal(num, options) {
  parentSelectList.innerHTML="";
  if (parentSelectTitle) parentSelectTitle.textContent=`Select parent for ${num}`;
  options.forEach(pNum=>{
    const btn=document.createElement("button"); btn.type="button"; btn.className="modal-option";
    btn.textContent=pNum;
    const p=assetMap.get(pNum);
    if (p) { const s=document.createElement("small"); s.textContent=p.assetDesc1||p.itemNameCodeDesc; if(s.textContent) btn.appendChild(s); }
    btn.addEventListener("click",()=>{ closeModal(parentSelectModal); updateAssetParent(num,pNum); });
    parentSelectList.appendChild(btn);
  });
  openModal(parentSelectModal);
}

function openPlaceholderSelectModal(parentNum, groups) {
  placeholderSelectList.innerHTML="";
  if (placeholderSelectTitle) placeholderSelectTitle.textContent=`Add placeholder for ${parentNum}`;
  buildPlaceholderOptions(groups).forEach(opt=>{
    const btn=document.createElement("button"); btn.type="button"; btn.className="modal-option";
    btn.textContent=opt.code;
    const s=document.createElement("small"); s.textContent=`Group: ${opt.groupLabel}`; btn.appendChild(s);
    btn.addEventListener("click",()=>{ addPlaceholderAsset(parentNum,opt.code); closeModal(placeholderSelectModal); });
    placeholderSelectList.appendChild(btn);
  });
  openModal(placeholderSelectModal);
}
function closePlaceholderSelectModal() { closeModal(placeholderSelectModal); placeholderSelectList.innerHTML=""; }

function updateExistingAssetItemFilter(cands) {
  if (!existingAssetItemFilter) return;
  const codes=new Set(); cands.forEach(a=>{ const c=extractNameCode(a.itemNameCodeDesc); if(c) codes.add(c); });
  existingAssetItemFilter.innerHTML="";
  const all=document.createElement("option"); all.value="all"; all.textContent="All item codes"; existingAssetItemFilter.appendChild(all);
  Array.from(codes).sort().forEach(c=>{ const o=document.createElement("option"); o.value=c; o.textContent=c; existingAssetItemFilter.appendChild(o); });
}
function renderExistingAssetCandidateList() {
  existingAssetSelectList.innerHTML="";
  const q=(existingAssetSearch?.value||"").toLowerCase();
  const code=existingAssetItemFilter?.value||"all";
  const filtered=existingAssetCandidates.filter(a=>{
    const label=`${a.assetNumber} ${a.assetDesc1} ${a.assetDesc2} ${a.itemNameCodeDesc} ${a.elr}`.toLowerCase();
    if (q&&!label.includes(q)) return false;
    if (code!=="all"&&extractNameCode(a.itemNameCodeDesc)!==code) return false;
    return true;
  });
  if (!filtered.length) {
    const p=document.createElement("p"); p.className="modal-empty"; p.textContent="No matching assets found.";
    existingAssetSelectList.appendChild(p); return;
  }
  filtered.forEach(a=>existingAssetSelectList.appendChild(buildAssetOptionButton(a,selected=>{
    updateAssetParent(selected.assetNumber,existingAssetTargetParentNumber);
    if (existingAssetReplacementPlaceholderId) removePlaceholderAsset(existingAssetReplacementPlaceholderId,{offerUndo:false});
    closeExistingAssetSelectModal();
  })));
}
function openExistingAssetSelectModal(parentNum, groups, {allowAssigned=false,replacePlaceholderId=null}={}) {
  existingAssetTargetParentNumber=parentNum;
  existingAssetReplacementPlaceholderId=replacePlaceholderId;
  existingAssetCandidates=getCandidateAssetsForGroups(groups,parentNum,{allowAssigned});
  if (existingAssetSelectTitle) existingAssetSelectTitle.textContent=replacePlaceholderId?`Replace placeholder for ${parentNum}`:`Link existing asset for ${parentNum}`;
  if (existingAssetSearch) existingAssetSearch.value="";
  updateExistingAssetItemFilter(existingAssetCandidates);
  if (existingAssetItemFilter) existingAssetItemFilter.value="all";
  renderExistingAssetCandidateList();
  openModal(existingAssetSelectModal);
}
function closeExistingAssetSelectModal() {
  closeModal(existingAssetSelectModal);
  existingAssetCandidates=[]; existingAssetTargetParentNumber=null; existingAssetReplacementPlaceholderId=null;
}

function renderOrphanParentCandidateList() {
  orphanParentSelectList.innerHTML="";
  const q=(orphanParentSearch?.value||"").toLowerCase();
  const filtered=orphanParentCandidates.filter(a=>{
    if (!q) return true;
    return `${a.assetNumber} ${a.assetDesc1} ${a.assetDesc2} ${a.itemNameCodeDesc} ${a.elr}`.toLowerCase().includes(q);
  });
  if (!filtered.length) {
    const p=document.createElement("p"); p.className="modal-empty"; p.textContent="No matching assets."; orphanParentSelectList.appendChild(p); return;
  }
  filtered.forEach(a=>orphanParentSelectList.appendChild(buildAssetOptionButton(a,selected=>{
    if (orphanTargetAssetNumber) updateAssetParent(orphanTargetAssetNumber,selected.assetNumber);
    closeOrphanParentSelectModal();
  })));
}
function openOrphanParentSelectModal(num) {
  orphanTargetAssetNumber=num;
  if (orphanParentSelectTitle) orphanParentSelectTitle.textContent=`Assign new parent for ${num}`;
  orphanParentCandidates=getParentCandidates(num);
  if (orphanParentSearch) orphanParentSearch.value="";
  renderOrphanParentCandidateList();
  openModal(orphanParentSelectModal);
}
function closeOrphanParentSelectModal() {
  closeModal(orphanParentSelectModal); orphanParentCandidates=[]; orphanTargetAssetNumber=null;
}

function openModal(el) { el.classList.remove("hidden"); el.setAttribute("aria-hidden","false"); }
function closeModal(el) { el.classList.add("hidden"); el.setAttribute("aria-hidden","true"); }

// ─── Reference tree loading ───────────────────────────────────────────
function collectReferenceNameCodes(node) {
  const codes=[]; if(!node) return codes;
  if (node.nameCodes?.length) codes.push(...node.nameCodes.map(c=>c.toUpperCase()));
  (node.children||[]).forEach(ch=>codes.push(...collectReferenceNameCodes(ch)));
  return Array.from(new Set(codes));
}
function collectIgnoredNameCodes(node) {
  const codes=[]; if(!node) return codes;
  if (node.ignoreFromErrors&&node.nameCodes?.length) codes.push(...node.nameCodes.map(c=>c.toUpperCase()));
  (node.children||[]).forEach(ch=>codes.push(...collectIgnoredNameCodes(ch)));
  return new Set(codes);
}
function buildReferenceParentMap(node, parentCodes=[]) {
  const map=new Map(); if(!node) return map;
  const cur=(node.nameCodes||[]).map(c=>c.toUpperCase());
  cur.forEach(c=>{ if(!map.has(c)) map.set(c,new Set()); parentCodes.forEach(p=>map.get(c).add(p)); });
  (node.children||[]).forEach(ch=>{
    buildReferenceParentMap(ch,cur).forEach((v,k)=>{ if(!map.has(k)) map.set(k,new Set()); v.forEach(i=>map.get(k).add(i)); });
  });
  return map;
}
function buildReferenceChildMap(node) {
  const map=new Map(); if(!node) return map;
  const cur=(node.nameCodes||[]).map(c=>c.toUpperCase());
  const direct=[];
  (node.children||[]).forEach(ch=>{
    if (ch.nameCodes?.length) direct.push({codes:new Set(ch.nameCodes.map(c=>c.toUpperCase())),optional:Boolean(ch.optional)});
    buildReferenceChildMap(ch).forEach((v,k)=>{ if(!map.has(k)) map.set(k,[]); map.get(k).push(...v); });
  });
  if (cur.length&&direct.length) cur.forEach(c=>{ if(!map.has(c)) map.set(c,[]); map.get(c).push(...direct); });
  return map;
}
function buildReferenceAssociatedMap(assocs) {
  const map=new Map();
  (assocs||[]).forEach(link=>{
    const from=(link.fromCodes||[]).map(c=>c.toUpperCase());
    const to=(link.toCodes||[]).map(c=>c.toUpperCase());
    const bi=link.bidirectional!==false;
    from.forEach(f=>{ if(!map.has(f)) map.set(f,new Set()); to.forEach(t=>map.get(f).add(t)); });
    if (bi) to.forEach(t=>{ if(!map.has(t)) map.set(t,new Set()); from.forEach(f=>map.get(t).add(f)); });
  });
  return map;
}
function captureInitialMismatches() {
  initialMismatchAssets=new Set();
  assets.forEach(a=>{ if(isReferenceMismatch(a,originalParentMap.get(a.assetNumber)??null)) initialMismatchAssets.add(a.assetNumber); });
}

function updateReferenceTree(tree) {
  if (!tree?.root) return;
  referenceNameCodes=collectReferenceNameCodes(tree.root);
  referenceParentMap=buildReferenceParentMap(tree.root);
  referenceIgnoredCodes=collectIgnoredNameCodes(tree.root);
  referenceChildMap=buildReferenceChildMap(tree.root);
  referenceAssociatedMap=buildReferenceAssociatedMap(tree.associations||[]);
  captureInitialMismatches();
  buildIssueList();
  renderAssetList();
  renderTriageView();
}

function loadReferenceTrees() {
  fetch("reference-trees.json",{cache:"no-store"})
    .then(r=>{ if(!r.ok) throw new Error(); return r.json(); })
    .then(data=>{
      referenceTrees=Array.isArray(data?.trees)?data.trees:[];
      referenceTreeSelect.innerHTML="";
      referenceTrees.forEach(t=>{
        const o=document.createElement("option"); o.value=t.id; o.textContent=t.label; referenceTreeSelect.appendChild(o);
      });
      if (referenceTrees.length) { referenceTreeSelect.value=referenceTrees[0].id; updateReferenceTree(referenceTrees[0]); }
    })
    .catch(()=>{ /* silent — no reference trees */ });
}

// ─── Export ───────────────────────────────────────────────────────────
function buildExportRows() {
  const rows=[EXPORT_HEADERS];
  Array.from(changedAssets).sort().forEach(num=>{
    const a=assetMap.get(num); if(!a) return;
    const row=Array(EXPORT_HEADERS.length).fill("");
    row[0]=a.assetNumber; row[EXPORT_HEADERS.indexOf("ParentEquipRef")]=a.parentAssetNumber||"";
    rows.push(row);
  });
  placeholderAssets.slice().sort((a,b)=>{
    const pc=a.parentAssetNumber.localeCompare(b.parentAssetNumber); return pc||a.itemNameCode.localeCompare(b.itemNameCode);
  }).forEach(ph=>{
    const row=Array(EXPORT_HEADERS.length).fill("");
    row[EXPORT_HEADERS.indexOf("ItemNameCode")]=ph.itemNameCode; rows.push(row);
  });
  return rows;
}
function exportChanges() {
  if (changedAssets.size===0&&placeholderAssets.length===0) return;
  const ws=XLSX.utils.aoa_to_sheet(buildExportRows());
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"ParentChanges");
  XLSX.writeFile(wb,"asset-parent-changes.xlsx");
}

// ─── File handling ────────────────────────────────────────────────────
function handleFile(file) {
  const reader=new FileReader();
  reader.onload=e=>{
    const data=new Uint8Array(e.target.result);
    const wb=XLSX.read(data,{type:"array"});
    const sheet=wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:""});
    if (rows.length<2) { renderTriageView(); return; }
    const headerIdx=findHeaderRow(rows);
    if (headerIdx===-1) { triageTitle.textContent="Could not find header row"; renderTriageView(); return; }
    try { buildMaps(rows.slice(headerIdx+1), rows[headerIdx]); }
    catch(err) { triageTitle.textContent=err.message; renderTriageView(); return; }
    populateFilters(); captureInitialMismatches(); buildIssueList(); updateChangesTray();
    selectedAssetNumber=null; renderAssetList(); renderTriageView();
  };
  reader.readAsArrayBuffer(file);
}

// ─── Event wiring ─────────────────────────────────────────────────────
fileInput.addEventListener("change",e=>{ const f=e.target.files?.[0]; if(f) handleFile(f); });
[filterInput,groupFilter,itemNameFilter,elrFilter,assetClassFilter,statusFilter].forEach(el=>{
  el.addEventListener(el.tagName==="SELECT"?"change":"input",()=>renderAssetList());
});
hideObsoleteToggle.addEventListener("change",()=>renderAssetList());
errorOnlyToggle.addEventListener("change",()=>renderAssetList());

backToTriage.addEventListener("click",()=>{
  selectedAssetNumber=null; renderAssetList(); renderTriageView();
});
prevIssue.addEventListener("click",()=>{
  if (issueIndex>0) { issueIndex--; selectAsset(issueList[issueIndex]); }
});
nextIssue.addEventListener("click",()=>{
  if (issueIndex<issueList.length-1) { issueIndex++; selectAsset(issueList[issueIndex]); }
});

referenceTreeSelect.addEventListener("change",e=>{
  const t=referenceTrees.find(r=>r.id===e.target.value); if(t) updateReferenceTree(t);
});

exportButton.addEventListener("click",exportChanges);

parentSelectCancel.addEventListener("click",()=>closeModal(parentSelectModal));
parentSelectModal.addEventListener("click",e=>{ if(e.target===parentSelectModal||e.target.classList.contains("modal-backdrop")) closeModal(parentSelectModal); });

placeholderSelectCancel.addEventListener("click",closePlaceholderSelectModal);
placeholderSelectModal.addEventListener("click",e=>{ if(e.target===placeholderSelectModal||e.target.classList.contains("modal-backdrop")) closePlaceholderSelectModal(); });

existingAssetSelectCancel.addEventListener("click",closeExistingAssetSelectModal);
existingAssetSelectModal.addEventListener("click",e=>{ if(e.target===existingAssetSelectModal||e.target.classList.contains("modal-backdrop")) closeExistingAssetSelectModal(); });
existingAssetSearch.addEventListener("input",renderExistingAssetCandidateList);
existingAssetItemFilter.addEventListener("change",renderExistingAssetCandidateList);

orphanParentSelectCancel.addEventListener("click",closeOrphanParentSelectModal);
orphanParentSelectModal.addEventListener("click",e=>{ if(e.target===orphanParentSelectModal||e.target.classList.contains("modal-backdrop")) closeOrphanParentSelectModal(); });
orphanParentSearch.addEventListener("input",renderOrphanParentCandidateList);

document.addEventListener("keydown",e=>{
  if (e.key!=="Escape") return;
  [parentSelectModal,placeholderSelectModal,existingAssetSelectModal,orphanParentSelectModal]
    .forEach(m=>{ if(!m.classList.contains("hidden")) closeModal(m); });
});

// ─── Init ─────────────────────────────────────────────────────────────
loadReferenceTrees();
renderTriageView();

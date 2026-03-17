/* ═══════════════════════════════════════════════════════════════════
   Asset Family Tree Viewer — app.js
   SVG tree canvas with template overlay, side-by-side, associations.
═══════════════════════════════════════════════════════════════════ */

// ── DOM refs ─────────────────────────────────────────────────────────
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
const treeCanvasView          = document.getElementById("treeCanvasView");
const triageTitle             = document.getElementById("triageTitle");
const triageSubtitle          = document.getElementById("triageSubtitle");
const triageStats             = document.getElementById("triageStats");
const triageIssueList         = document.getElementById("triageIssueList");
const backToTriage            = document.getElementById("backToTriage");
const prevIssue               = document.getElementById("prevIssue");
const nextIssue               = document.getElementById("nextIssue");
const issuePosition           = document.getElementById("issuePosition");
const referenceTreeSelect     = document.getElementById("referenceTreeSelect");
const viewModeToggle          = document.getElementById("viewModeToggle");
const assocToggle             = document.getElementById("assocToggle");
const fitBtn                  = document.getElementById("fitBtn");
const canvasWrap              = document.getElementById("canvasWrap");
const treeSvg                 = document.getElementById("treeSvg");
const svgRoot                 = document.getElementById("svgRoot");
const zoomInBtn               = document.getElementById("zoomIn");
const zoomOutBtn              = document.getElementById("zoomOut");
const zoomLabel               = document.getElementById("zoomLabel");
const appBody                 = document.querySelector(".app-body");
const detailPanel             = document.getElementById("detailPanel");
const detailAssetId           = document.getElementById("detailAssetId");
const detailBody              = document.getElementById("detailBody");
const closeDetail             = document.getElementById("closeDetail");
const changesTray             = document.getElementById("changesTray");
const trayToggle              = document.getElementById("trayToggle");
const trayLabel               = document.getElementById("trayLabel");
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

// ── State ─────────────────────────────────────────────────────────────
let assets = [], assetMap = new Map(), childrenMap = new Map();
let selectedAssetNumber = null;
let originalParentMap = new Map(), changedAssets = new Set();
let initialMismatchAssets = new Set();
let placeholderAssets = [], placeholderMap = new Map(), placeholderCounter = 0;
let placeholderChildrenMap = new Map();
let lastRemovedPlaceholder = null, undoToastTimeoutId = null, undoToastHandler = null;
let referenceTrees = [], referenceNameCodes = [], referenceParentMap = new Map();
let referenceIgnoredCodes = new Set(), referenceChildMap = new Map(), referenceAssociatedMap = new Map();
let issueList = [], issueIndex = -1;
let viewMode = "template";   // "template" | "sidebyside"
let showAssoc = false;
let zoom = 1, panX = 0, panY = 0;
let isPanning = false, panStartX = 0, panStartY = 0, panOriginX = 0, panOriginY = 0;
let existingAssetCandidates = [], existingAssetTargetParentNumber = null, existingAssetReplacementPlaceholderId = null, existingAssetSourceTemplateTid = null;
let orphanParentCandidates = [], orphanTargetAssetNumber = null;
let activeSlotBar = null; // { node, element }
let ghostDropTargets = new Map();
let dragOverGhostTid = null;

// ── SVG namespace helper ──────────────────────────────────────────────
const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}, children = []) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  children.forEach(c => el.appendChild(c));
  return el;
}

// ── Layout constants ──────────────────────────────────────────────────
const NW = 172, NH = 80, HGAP = 28, VGAP = 72;

// ── Column aliases ────────────────────────────────────────────────────
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
const EXPORT_HEADERS = ["EquipNo","EquipGrpId","EquipClass","PlantNo","PlantCode0","PlantCode1","PlantCode2","PlantCode3","PlantCode4","PlantCode5","ParentEquipRef","ItemNameCode","EquipNoD1","EquipNoD2","EquipStatus","Active Flag","Equipment Type (0)","Region (1)","Maintenance Responsibility (2)","Sub Discipline (3)","Disclipline (4)","Geographical Delivery Unit (5)","Route (6)","Position (7)","Special Equipment Status (8)","Signal Sighting Cable Ride (9)","Maintaining Delivery Unit (10)","Asset Out Of Use Status (11)","Maintenance Engineer (12)","Engineering Support Group (13)","External Ownership (14)","Section Manager (15)","ConAstSegSt","ConAstSegEn","SegmentUom","CostSegLgth","InputBy","OperatorId","DstrctCode","CostingFlag","EquipLocation","Colloquial_1","Colloquial_2","Colloquial_3","Colloquial_4","Colloquial_5","Colloquial_6","RARUNID","RARDECID","RAILID","WO_Grouping_Eqp_ID","Attrib_Name1","Attrib_Value1","Attrib_Name2","Attrib_Value2","Attrib_Name3","Attrib_Value3","Attrib_Name4","Attrib_Value4","Attrib_Name5","Attrib_Value5","Attrib_Name6","Attrib_Value6","Attrib_Name7","Attrib_Value7","Attrib_Name8","Attrib_Value8","ADM_BatchRef","ADM_BatchRef_Seq","ASSETLAT","ASSETLONG","ASSETELAT","ASSETELONG","Date of Installation","Date of Retirement","Year of Installation","Year of Retirement","Result","Date / Time Stamp"];

// ── Column helpers ────────────────────────────────────────────────────
function normalizeHeader(v) { return String(v||"").replace(/\u00a0/g," ").replace(/[^a-z0-9]+/gi," ").replace(/\s+/g," ").trim().toLowerCase(); }
function findColumn(headers, candidates) {
  const norm = headers.map(normalizeHeader);
  for (const c of candidates) {
    const nc = normalizeHeader(c);
    const i = norm.indexOf(nc); if (i!==-1) return i;
    const j = norm.findIndex(h=>h.includes(nc)); if (j!==-1) return j;
  }
  return -1;
}
function findHeaderRow(rows,max=20) {
  for (let i=0;i<Math.min(rows.length,max);i++) {
    const h=rows[i]||[];
    if (findColumn(h,COLUMN_ALIASES.assetNumber)!==-1&&findColumn(h,COLUMN_ALIASES.parentAssetNumber)!==-1) return i;
  }
  return -1;
}

// ── Build maps ────────────────────────────────────────────────────────
function buildMaps(rows, headers) {
  assetMap=new Map(); childrenMap=new Map(); originalParentMap=new Map();
  changedAssets=new Set(); placeholderAssets=[]; placeholderMap=new Map(); placeholderChildrenMap=new Map(); placeholderCounter=0;
  const col=k=>findColumn(headers,COLUMN_ALIASES[k]);
  const ai=col("assetNumber"), pi=col("parentAssetNumber");
  if (ai===-1||pi===-1) throw new Error("Missing required columns.");
  const idx=Object.fromEntries(Object.keys(COLUMN_ALIASES).map(k=>[k,col(k)]));
  assets=rows.map(row=>{
    const assetNumber=row[ai]?.toString().trim(); if(!assetNumber) return null;
    const g=(k,i)=>i!==-1?row[i]?.toString().trim()||"":"";
    return { assetNumber, parentAssetNumber:row[pi]?.toString().trim()||null,
      assetStatus:g("assetStatus",idx.assetStatus), assetDesc1:g("assetDesc1",idx.assetDesc1),
      assetDesc2:g("assetDesc2",idx.assetDesc2), elr:g("elr",idx.elr),
      assetClass:g("assetClass",idx.assetClass), egiCodeDesc:g("egiCodeDesc",idx.egiCodeDesc),
      structuredPlantNumber:g("structuredPlantNumber",idx.structuredPlantNumber),
      trackId:g("trackId",idx.trackId), assetStartMileage:g("assetStartMileage",idx.assetStartMileage),
      assetEndMileage:g("assetEndMileage",idx.assetEndMileage),
      itemNameCodeDesc:g("itemNameCodeDesc",idx.itemNameCodeDesc) };
  }).filter(Boolean);
  assets.forEach(a=>{ assetMap.set(a.assetNumber,a); originalParentMap.set(a.assetNumber,a.parentAssetNumber||null); });
  assets.forEach(a=>{ if(!a.parentAssetNumber) return; if(!childrenMap.has(a.parentAssetNumber)) childrenMap.set(a.parentAssetNumber,[]); childrenMap.get(a.parentAssetNumber).push(a.assetNumber); });
}

// ── Asset helpers ─────────────────────────────────────────────────────
function extractNameCode(v) { const m=String(v||"").trim().match(/^[A-Za-z0-9]+/); return m?m[0].toUpperCase():""; }
function isObsolete(a)  { return a?.assetStatus?.startsWith("OR"); }
function isOrphaned(a)  { if(!a?.parentAssetNumber) return false; const p=assetMap.get(a.parentAssetNumber); return p?isObsolete(p):false; }
function isReferenceMismatch(asset,parentOverride=null) {
  const code=extractNameCode(asset.itemNameCodeDesc);
  if(!code||!referenceNameCodes.includes(code)) return false;
  if(referenceIgnoredCodes.has(code)) return false;
  const pNum=parentOverride!==null?parentOverride:asset.parentAssetNumber;
  if(!pNum) return (referenceParentMap.get(code)||new Set()).size>0;
  const p=assetMap.get(pNum); if(!p) return true;
  const pCode=extractNameCode(p.itemNameCodeDesc);
  if(!pCode||!referenceNameCodes.includes(pCode)) return false;
  return !(referenceParentMap.get(code)||new Set()).has(pCode);
}
function getExistingChildCodes(pNum) {
  const s=new Set();
  (childrenMap.get(pNum)||[]).forEach(n=>{ const c=extractNameCode(assetMap.get(n)?.itemNameCodeDesc); if(c) s.add(c); });
  (placeholderMap.get(pNum)||[]).forEach(p=>{ if(p.itemNameCode) s.add(p.itemNameCode); });
  return s;
}
function getMissingReferenceChildGroups(asset) {
  const code=extractNameCode(asset.itemNameCodeDesc);
  if(!code||!referenceChildMap.has(code)) return [];
  const ex=getExistingChildCodes(asset.assetNumber);
  return (referenceChildMap.get(code)||[]).filter(g=>!g.optional&&!Array.from(g.codes).some(c=>ex.has(c)));
}
function getMissingReferenceChildren(asset) { return getMissingReferenceChildGroups(asset).map(g=>Array.from(g.codes).join(" or ")); }
function hasError(asset) { return isReferenceMismatch(asset)||getMissingReferenceChildren(asset).length>0||isOrphaned(asset); }
function shouldShowTick(asset) { return initialMismatchAssets.has(asset.assetNumber)&&!isReferenceMismatch(asset); }
function isDescendant(num,pot) { if(!num||!pot) return false; const ch=childrenMap.get(num)||[]; return ch.includes(pot)||ch.some(c=>isDescendant(c,pot)); }
function isPlaceholderRef(ref){return typeof ref==="string"&&ref.startsWith("__ph__");}
function getPlaceholderIdFromRef(ref){return isPlaceholderRef(ref)?ref.slice(6):null;}
function getPlaceholderByRef(ref){const id=getPlaceholderIdFromRef(ref);return id?placeholderAssets.find(ph=>ph.id===id)||null:null;}
function getEffectiveParentNumber(parentRef){
  if(!parentRef) return null;
  if(!isPlaceholderRef(parentRef)) return parentRef;
  return getPlaceholderByRef(parentRef)?.parentAssetNumber||null;
}
function getParentCodeByRef(ref){if(!ref)return null;if(isPlaceholderRef(ref))return getPlaceholderByRef(ref)?.itemNameCode||null;return extractNameCode(assetMap.get(ref)?.itemNameCodeDesc);}
function getChildAssetIdsByParentRef(ref){if(!ref)return[];if(isPlaceholderRef(ref)){const id=getPlaceholderIdFromRef(ref);return id?(placeholderChildrenMap.get(id)||[]):[];}return childrenMap.get(ref)||[];}

function removeChildLink(parentNum, childNum){
  if(!parentNum||!childrenMap.has(parentNum)) return;
  const next=(childrenMap.get(parentNum)||[]).filter(n=>n!==childNum);
  next.length?childrenMap.set(parentNum,next):childrenMap.delete(parentNum);
}

function addChildLink(parentNum, childNum){
  if(!parentNum||!childNum) return;
  if(!childrenMap.has(parentNum)) childrenMap.set(parentNum,[]);
  const current=childrenMap.get(parentNum);
  if(!current.includes(childNum)) current.push(childNum);
}

function buildAncestorChain(num) {
  const chain=[]; let cur=assetMap.get(num); if(!cur) return chain;
  chain.unshift(cur);
  while(cur?.parentAssetNumber) { const p=assetMap.get(cur.parentAssetNumber); if(!p){chain.unshift({assetNumber:cur.parentAssetNumber,missing:true});break;} chain.unshift(p); cur=p; }
  return chain;
}

// find tree root for a given asset
function findTreeRoot(num) {
  let cur=assetMap.get(num);
  while(cur?.parentAssetNumber){
    if(assetMap.has(cur.parentAssetNumber)){
      cur=assetMap.get(cur.parentAssetNumber);
      continue;
    }
    if(isPlaceholderRef(cur.parentAssetNumber)){
      const ph=getPlaceholderByRef(cur.parentAssetNumber);
      if(ph&&assetMap.has(ph.parentAssetNumber)){
        cur=assetMap.get(ph.parentAssetNumber);
        continue;
      }
    }
    break;
  }
  return cur?.assetNumber||num;
}

// ── Layout engine ─────────────────────────────────────────────────────
function calcSubtreeWidth(id, cm) {
  const ch=cm.get(id)||[];
  if(!ch.length) return NW;
  const total=ch.reduce((s,c)=>s+calcSubtreeWidth(c,cm)+HGAP,0)-HGAP;
  return Math.max(total,NW);
}
function placeNodes(id, x, y, cm, positions, widths) {
  positions.set(id,{x,y});
  const ch=cm.get(id)||[]; if(!ch.length) return;
  const total=ch.reduce((s,c)=>s+(widths.get(c)||NW)+HGAP,0)-HGAP;
  let cx=x-total/2;
  ch.forEach(c=>{ placeNodes(c,cx+(widths.get(c)||NW)/2,y+NH+VGAP,cm,positions,widths); cx+=(widths.get(c)||NW)+HGAP; });
}
function layoutTree(rootId, cm) {
  const widths=new Map();
  function cw(id){ const w=calcSubtreeWidth(id,cm); widths.set(id,w); (cm.get(id)||[]).forEach(c=>cw(c)); }
  cw(rootId);
  const pos=new Map(); placeNodes(rootId,0,0,cm,pos,widths); return pos;
}

// ── Template tree builder ─────────────────────────────────────────────
let tplCounter=0;
function buildTemplateNode(refNode, match, parentAssetId=null, ctx={}) {
  const codes=(refNode.nameCodes||[]).map(c=>c.toUpperCase());
  const node={
    tid:`t${tplCounter++}`,
    refNode,
    assetId:match?.assetId||null,
    placeholderId:match?.placeholderId||null,
    parentAssetId:parentAssetId||null,
    codes,
    children:[]
  };
  const nodeRef=node.assetId||(node.placeholderId?`__ph__${node.placeholderId}`:null);
  const closestParentRef=nodeRef||parentAssetId||null;
  (refNode.children||[]).forEach(refChild=>{
    const childCodes=(refChild.nameCodes||[]).map(c=>c.toUpperCase());
    let childMatch=null;
    if(node.placeholderId){
      const phChildren=placeholderChildrenMap.get(node.placeholderId)||[];
      const directPlaceholderChild=phChildren.find(cid=>{
        if(ctx?.usedAssetIds?.has(cid)) return false;
        return childCodes.includes(extractNameCode(assetMap.get(cid)?.itemNameCodeDesc));
      });
      if(directPlaceholderChild){
        ctx?.usedAssetIds?.add(directPlaceholderChild);
        childMatch={assetId:directPlaceholderChild};
      }
    }
    if(!childMatch) childMatch=findTemplateMatch(childCodes,closestParentRef,ctx);
    node.children.push(buildTemplateNode(refChild,childMatch,closestParentRef,ctx));
  });
  return node;
}

function offsetPositions(pos, dx) {
  const shifted=new Map();
  pos.forEach(({x,y},id)=>shifted.set(id,{x:x+dx,y}));
  return shifted;
}

function findTemplateMatch(codes, parentRef, ctx) {
  if (!codes.length) return null;
  const { usedAssetIds = new Set(), usedPlaceholderIds = new Set(), scopeRootId = null } = ctx;
  const matchesCode = v => codes.includes(v);

  // 1. Direct child via childrenMap / placeholderChildrenMap
  const directChildren = getChildAssetIdsByParentRef(parentRef);
  const directAsset = directChildren.find(cid => {
    if (usedAssetIds.has(cid)) return false;
    return matchesCode(extractNameCode(assetMap.get(cid)?.itemNameCodeDesc));
  });
  if (directAsset) { usedAssetIds.add(directAsset); return { assetId: directAsset }; }

  // 2. Direct placeholder child
  const realParentId = isPlaceholderRef(parentRef)
    ? getPlaceholderByRef(parentRef)?.parentAssetNumber : parentRef;
  const directPlaceholder = (placeholderMap.get(realParentId) || [])
    .find(ph => !usedPlaceholderIds.has(ph.id) && matchesCode(ph.itemNameCode));
  if (directPlaceholder) { usedPlaceholderIds.add(directPlaceholder.id); return { placeholderId: directPlaceholder.id }; }

  // 3. Any asset in scope with matching code (includes mis-parented assets)
  const scopeIds = scopeRootId ? subtreeIds(scopeRootId) : new Set();
  const scopeAsset = assets.find(a => {
    if (!a || usedAssetIds.has(a.assetNumber)) return false;
    if (scopeIds.size && !scopeIds.has(a.assetNumber)) return false;
    return matchesCode(extractNameCode(a.itemNameCodeDesc));
  });
  if (scopeAsset) { usedAssetIds.add(scopeAsset.assetNumber); return { assetId: scopeAsset.assetNumber }; }

  // 4. Placeholder fallback across scope
  let fallbackPlaceholder = null;
  scopeIds.forEach(id => {
    if (fallbackPlaceholder) return;
    const ph = (placeholderMap.get(id) || [])
      .find(p => !usedPlaceholderIds.has(p.id) && matchesCode(p.itemNameCode));
    if (ph) fallbackPlaceholder = ph;
  });
  if (fallbackPlaceholder) { usedPlaceholderIds.add(fallbackPlaceholder.id); return { placeholderId: fallbackPlaceholder.id }; }

  return null;
}
function layoutTemplateTree(node) {
  const cm=new Map(); const widths=new Map();
  function buildCM(n){ cm.set(n.tid,n.children.map(c=>c.tid)); n.children.forEach(buildCM); }
  function cw(n){ const ch=n.children; if(!ch.length){widths.set(n.tid,NW);return NW;} const total=ch.reduce((s,c)=>s+cw(c)+HGAP,0)-HGAP; widths.set(n.tid,Math.max(total,NW)); return widths.get(n.tid); }
  buildCM(node); cw(node);
  const pos=new Map();
  function place(n,x,y){ pos.set(n.tid,{x,y}); const ch=n.children; if(!ch.length) return; const total=ch.reduce((s,c)=>s+(widths.get(c.tid)||NW)+HGAP,0)-HGAP; let cx=x-total/2; ch.forEach(c=>{ place(c,cx+(widths.get(c.tid)||NW)/2,y+NH+VGAP); cx+=(widths.get(c.tid)||NW)+HGAP; }); }
  place(node,0,0);
  return pos;
}

// ── SVG rendering helpers ─────────────────────────────────────────────
function nodeColors(asset, selected) {
  if(selected)          return {border:"#0ea5e9",bg:"#e0f2fe",text:"#0c4a6e",badge:"#0ea5e9"};
  if(!asset)            return {border:"#d1d5db",bg:"#f9fafb",text:"#6b7280",badge:"#9ca3af"};
  if(isObsolete(asset)) return {border:"#f87171",bg:"#fff1f2",text:"#991b1b",badge:"#f87171"};
  return               {border:"#6366f1",bg:"#eef2ff",text:"#3730a3",badge:"#6366f1"};
}

function makeNodeCard(asset, x, y, selected, {hasMissing=false,isMismatch=false,isOrph=false}={}) {
  const col=nodeColors(asset,selected);
  const cls=["tree-node-g"];
  if(asset?.parentAssetNumber?.startsWith("__ph__")) cls.push("placeholder-parented");
  const g=svgEl("g",{transform:`translate(${x-NW/2},${y})`,class:cls.join(" "),style:"cursor:pointer"});
  g.setAttribute("data-asset", asset?.assetNumber || "");

  // shadow + rect
  g.appendChild(svgEl("rect",{width:NW,height:NH,rx:10,fill:col.bg,stroke:col.border,"stroke-width":selected?2.5:1.5,filter:selected?"url(#selectedShadow)":"url(#nodeShadow)"}));

  // type-code badge pill
  const code=asset?extractNameCode(asset.itemNameCodeDesc):"?";
  g.appendChild(svgEl("rect",{x:8,y:8,width:46,height:17,rx:8,fill:col.badge,opacity:"0.18"}));
  g.appendChild(Object.assign(svgEl("text",{x:31,y:20,"text-anchor":"middle","font-size":10,"font-weight":700,fill:col.badge,"dominant-baseline":"middle"}),{textContent:code}));

  // asset number
  g.appendChild(Object.assign(svgEl("text",{x:62,y:20,"font-size":10,"font-weight":700,fill:col.text,"dominant-baseline":"middle"}),{textContent:asset?.assetNumber||"—"}));

  // description line
  const desc=(asset?.assetDesc1||asset?.assetDesc2||"").slice(0,24);
  g.appendChild(Object.assign(svgEl("text",{x:8,y:42,"font-size":10,fill:"#475569"}),{textContent:desc+(desc.length===24?"…":"")}));

  // bottom row: status + ELR
  if(asset?.assetStatus) g.appendChild(Object.assign(svgEl("text",{x:8,y:68,"font-size":9,fill:col.border,"font-weight":600}),{textContent:asset.assetStatus.slice(0,12)}));
  if(asset?.elr)         g.appendChild(Object.assign(svgEl("text",{x:NW-8,y:68,"font-size":9,fill:"#94a3b8","text-anchor":"end"}),{textContent:asset.elr}));

  // warning badges
  if(isMismatch)               { g.appendChild(svgEl("circle",{cx:NW-9,cy:9,r:7,fill:"#dc2626"})); g.appendChild(Object.assign(svgEl("text",{x:NW-9,y:13,"text-anchor":"middle","font-size":9,fill:"#fff","font-weight":700,"dominant-baseline":"middle"}),{textContent:"!"})); }
  else if(hasMissing||isOrph)  { g.appendChild(svgEl("circle",{cx:NW-9,cy:9,r:7,fill:"#f59e0b"})); g.appendChild(Object.assign(svgEl("text",{x:NW-9,y:13,"text-anchor":"middle","font-size":9,fill:"#fff","font-weight":700,"dominant-baseline":"middle"}),{textContent:"!"})); }

  return g;
}

function makeGhostCard(refNode, x, y, { variant="missing" }={}) {
  const codes=(refNode.nameCodes||[]).join("/");
  const optional=!!refNode.optional;
  const paletteByVariant={
    missing:{ optionalBg:"#f9fafb", requiredBg:"#fef3c7", optionalBorder:"#d1d5db", requiredBorder:"#fcd34d", optionalText:"#6b7280", requiredText:"#92400e", title:"Missing" },
    placeholder:{ optionalBg:"#f0f9ff", requiredBg:"#ecfeff", optionalBorder:"#7dd3fc", requiredBorder:"#22d3ee", optionalText:"#0369a1", requiredText:"#0e7490", title:"Placeholder" }
  };
  const palette=paletteByVariant[variant]||paletteByVariant.missing;
  const bg=optional?palette.optionalBg:palette.requiredBg;
  const border=optional?palette.optionalBorder:palette.requiredBorder;
  const text=optional?palette.optionalText:palette.requiredText;
  const g=svgEl("g",{transform:`translate(${x-NW/2},${y})`,class:"tree-node-g"});
  g.appendChild(svgEl("rect",{width:NW,height:NH,rx:10,fill:bg,stroke:border,"stroke-width":1.5,"stroke-dasharray":optional?"6,3":"none"}));
  g.appendChild(svgEl("rect",{x:8,y:8,width:46,height:17,rx:8,fill:border,opacity:"0.25"}));
  g.appendChild(Object.assign(svgEl("text",{x:31,y:20,"text-anchor":"middle","font-size":9,"font-weight":700,fill:border,"dominant-baseline":"middle"}),{textContent:codes.slice(0,8)}));
  g.appendChild(Object.assign(svgEl("text",{x:62,y:20,"font-size":10,"font-weight":700,fill:text,"dominant-baseline":"middle"}),{textContent:palette.title}));
  g.appendChild(Object.assign(svgEl("text",{x:8,y:42,"font-size":10,fill:text}),{textContent:(refNode.title||"").slice(0,24)}));
  g.appendChild(Object.assign(svgEl("text",{x:8,y:68,"font-size":9,fill:border,"font-weight":600}),{textContent:optional?"Optional":"Required"}));
  return g;
}

function makeGhostCardEditable(refNode,x,y){
  const g=makeGhostCard(refNode,x,y);
  g.classList.add("ghost-node-editable");
  g.setAttribute("aria-label",`Add missing ${(refNode.title||"asset").trim()||"asset"}`);
  return g;
}

function makePlaceholderCardEditable(placeholder,x,y){
  const ref={nameCodes:[placeholder.itemNameCode],title:"Placeholder"};
  const g=makeGhostCard(ref,x,y,{variant:"placeholder"});
  g.classList.add("ghost-node-editable");
  g.setAttribute("aria-label",`Manage placeholder ${placeholder.itemNameCode}`);
  return g;
}

function makeCurve(x1,y1,x2,y2,color="#94a3b8",dashed=false,width=1.5) {
  const my=(y1+y2)/2;
  return svgEl("path",{d:`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`,fill:"none",stroke:color,"stroke-width":width,"stroke-dasharray":dashed?"6,4":"none",opacity:dashed?"0.65":"0.45"});
}

function makeAssocLine(x1,y1,x2,y2) {
  // horizontal S-curve for same-level assoc
  const mx=(x1+x2)/2;
  return svgEl("path",{d:`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`,fill:"none",stroke:"#f59e0b","stroke-width":2,"stroke-dasharray":"7,4",opacity:"0.75"});
}

// collect all ids in subtree
function subtreeIds(rootId) {
  const ids=new Set();
  function walk(id){ ids.add(id); (childrenMap.get(id)||[]).forEach(walk); }
  walk(rootId); return ids;
}

function flashNodeSuccess(g) {
  if (!g) return;
  g.classList.add("node-flash-success");
  setTimeout(() => g.classList.remove("node-flash-success"), 500);
}

function clearGhostDragState() {
  if (!dragOverGhostTid) return;
  const prev = svgRoot.querySelector(`[data-template-tid="${dragOverGhostTid}"]`);
  prev?.classList.remove("drag-over-ghost");
  dragOverGhostTid = null;
}

function hitTestGhostDropTarget(clientX, clientY) {
  const rect = canvasWrap.getBoundingClientRect();
  const svgX = (clientX - rect.left - panX) / zoom;
  const svgY = (clientY - rect.top - panY) / zoom;
  let matched = null;
  ghostDropTargets.forEach(({ node, svgX: cx, svgY: topY }, tid) => {
    if (matched) return;
    if (svgX >= cx - NW / 2 && svgX <= cx + NW / 2 && svgY >= topY && svgY <= topY + NH) {
      matched = { tid, node };
    }
  });
  return matched;
}

// ── Main render ───────────────────────────────────────────────────────
function renderCanvas() {
  dismissSlotBar();
  ghostDropTargets = new Map();
  clearGhostDragState();
  svgRoot.innerHTML="";
  if(!selectedAssetNumber) return;
  const rootId=findTreeRoot(selectedAssetNumber);

  if(viewMode==="template") renderTemplateMode(rootId);
  else                      renderSideBySide(rootId);
}

function renderTemplateMode(rootId) {
  const tree=getActiveReferenceTree();
  if(!tree?.root) return;
  tplCounter=0;
  const rootCodes=(tree.root.nameCodes||[]).map(c=>c.toUpperCase());
  const rootAsset=assets.find(a=>rootCodes.includes(extractNameCode(a.itemNameCodeDesc))&&subtreeIds(rootId).has(a.assetNumber));
  const tmpl=buildTemplateNode(tree.root,{assetId:rootAsset?.assetNumber||null},null,{usedAssetIds:new Set(),usedPlaceholderIds:new Set(),scopeRootId:rootId});
  const pos=layoutTemplateTree(tmpl);

  const edges=svgEl("g"), nodes=svgEl("g");
  svgRoot.appendChild(edges); svgRoot.appendChild(nodes);

  function walk(n) {
    const p=pos.get(n.tid); if(!p) return;
    n.children.forEach(c=>{
      const cp=pos.get(c.tid); if(!cp) return;
      edges.appendChild(makeCurve(p.x,p.y+NH,cp.x,cp.y,"#94a3b8",!c.assetId&&!c.placeholderId));
    });
    const placeholder=n.placeholderId?placeholderAssets.find(p=>p.id===n.placeholderId):null;
    const card=placeholder?makePlaceholderCardEditable(placeholder,p.x,p.y):makeGhostCardEditable(n.refNode,p.x,p.y);
    card.setAttribute("data-template-tid", n.tid);
    if(n.parentAssetId){
      ghostDropTargets.set(n.tid, { node: n, svgX: p.x, svgY: p.y });
      card.addEventListener("click", e => {
        e.stopPropagation();
        if (p) showInlineSlotBar(n, p.x, p.y);
      });
    }
    nodes.appendChild(card);
    n.children.forEach(walk);
  }
  walk(tmpl);

  if(showAssoc) {
    const idsByCode=new Map();
    function collectCodes(n){ if(n.assetId){ const c=extractNameCode(assetMap.get(n.assetId)?.itemNameCodeDesc); if(c){if(!idsByCode.has(c))idsByCode.set(c,[]); idsByCode.get(c).push(n.tid);} } n.children.forEach(collectCodes); }
    collectCodes(tmpl);
    const drawn=new Set();
    idsByCode.forEach((tids,code)=>{
      const targets=referenceAssociatedMap.get(code)||new Set();
      targets.forEach(tCode=>{
        const ttids=idsByCode.get(tCode)||[];
        tids.forEach(ta=>ttids.forEach(tb=>{
          const key=[ta,tb].sort().join("|"); if(drawn.has(key)) return; drawn.add(key);
          const pa=pos.get(ta), pb=pos.get(tb);
          if(pa&&pb) edges.appendChild(makeAssocLine(pa.x,pa.y+NH/2,pb.x,pb.y+NH/2));
        }));
      });
    });
  }

  fitIfNeeded(pos);
}

function alignPositionsByDepth(posA, posB) {
  const sharedY = new Map();
  [posA, posB].forEach(pos => {
    pos.forEach(({ y }) => {
      const depth = Math.round(y / (NH + VGAP));
      const current = sharedY.get(depth) ?? 0;
      sharedY.set(depth, Math.max(current, y));
    });
  });
  const align = pos => {
    const out = new Map();
    pos.forEach(({ x, y }, key) => {
      const depth = Math.round(y / (NH + VGAP));
      out.set(key, { x, y: sharedY.get(depth) ?? y });
    });
    return out;
  };
  return { alignedA: align(posA), alignedB: align(posB) };
}

function drawCorrespondenceLines(tmplNode, tPos, realPos, tOffX, rOffX, edgesGroup) {
  if (tmplNode.assetId) {
    const tp = tPos.get(tmplNode.tid);
    const rp = realPos.get(tmplNode.assetId);
    if (tp && rp) {
      const x1 = tp.x + NW / 2 + tOffX;
      const y1 = tp.y + NH / 2;
      const x2 = rp.x - NW / 2 + rOffX;
      const y2 = rp.y + NH / 2;
      edgesGroup.appendChild(svgEl("line", {
        x1, y1, x2, y2,
        stroke: "#c7d2fe", "stroke-width": 1,
        "stroke-dasharray": "4,4", opacity: "0.6",
        "marker-end": "url(#corrArrow)"
      }));
    }
  }
  tmplNode.children.forEach(c => drawCorrespondenceLines(c, tPos, realPos, tOffX, rOffX, edgesGroup));
}

function buildActualTreeMaps() {
  const childMap = new Map();
  const parentMap = new Map();

  assets.forEach(a=>{
    if(!a?.assetNumber) return;
    if(!childMap.has(a.assetNumber)) childMap.set(a.assetNumber, []);
  });

  placeholderAssets.forEach(ph=>{
    const ref = `__ph__${ph.id}`;
    if(!childMap.has(ref)) childMap.set(ref, []);
  });

  assets.forEach(a=>{
    const parentRef = a?.parentAssetNumber;
    if(!parentRef) return;
    if(!childMap.has(parentRef)) return;
    const siblings = childMap.get(parentRef);
    if(!siblings.includes(a.assetNumber)) siblings.push(a.assetNumber);
    parentMap.set(a.assetNumber, parentRef);
  });

  placeholderAssets.forEach(ph=>{
    const parentRef = ph?.parentAssetNumber;
    const ref = `__ph__${ph.id}`;
    if(!parentRef || !childMap.has(parentRef)) return;
    const siblings = childMap.get(parentRef);
    if(!siblings.includes(ref)) siblings.push(ref);
    parentMap.set(ref, parentRef);
  });

  return { childMap, parentMap };
}

function renderSideBySide(rootId) {
  tplCounter=0;
  const tree=getActiveReferenceTree();
  const { childMap:actualChildMap, parentMap:actualParentMap } = buildActualTreeMaps();
  let realPos=layoutTree(rootId,actualChildMap);
  const SIDE_GAP=80;

  let tmpl=null;
  let tPos=null;
  if(tree?.root){
    const rootCodes=(tree.root.nameCodes||[]).map(c=>c.toUpperCase());
    const rootAsset=assets.find(a=>rootCodes.includes(extractNameCode(a.itemNameCodeDesc))&&subtreeIds(rootId).has(a.assetNumber));
    tmpl=buildTemplateNode(tree.root,{assetId:rootAsset?.assetNumber||null},null,{usedAssetIds:new Set(),usedPlaceholderIds:new Set(),scopeRootId:rootId});
    tPos=layoutTemplateTree(tmpl);
    const aligned=alignPositionsByDepth(tPos, realPos);
    tPos=aligned.alignedA;
    realPos=aligned.alignedB;
  }

  let minX=Infinity;
  realPos.forEach(({x})=>{minX=Math.min(minX,x-NW/2);});
  const rOffX=(SIDE_GAP/2)-minX;

  let tOffX=0;
  if(tPos){
    let tMaxX=-Infinity;
    tPos.forEach(({x})=>{tMaxX=Math.max(tMaxX,x+NW/2);});
    tOffX=(-SIDE_GAP/2)-tMaxX;
  }

  const corr=svgEl("g");
  const te=svgEl("g"), tn=svgEl("g");
  const re=svgEl("g"), rn=svgEl("g");

  if(tPos&&tmpl){
    function walkT(n){
      const p=tPos.get(n.tid); if(!p) return;
      n.children.forEach(c=>{ const cp=tPos.get(c.tid);if(!cp)return; te.appendChild(makeCurve(p.x+tOffX,p.y+NH,cp.x+tOffX,cp.y,"#94a3b8",!c.assetId&&!c.placeholderId)); });
      const placeholder=n.placeholderId?placeholderAssets.find(ph=>ph.id===n.placeholderId):null;
      const card=placeholder?makePlaceholderCardEditable(placeholder,p.x+tOffX,p.y):makeGhostCardEditable(n.refNode,p.x+tOffX,p.y);
      if(n.parentAssetId){
        card.setAttribute("data-template-tid", n.tid);
        ghostDropTargets.set(n.tid, { node: n, svgX: p.x + tOffX, svgY: p.y });
        card.addEventListener("click", e => {
          e.stopPropagation();
          if(p) showInlineSlotBar(n, p.x + tOffX, p.y);
        });
      }
      tn.appendChild(card);
      n.children.forEach(walkT);
    }
    walkT(tmpl);
    drawCorrespondenceLines(tmpl, tPos, realPos, tOffX, rOffX, corr);
    const lblT=Object.assign(svgEl("text",{"text-anchor":"middle","x":tOffX,"y":-20,"font-size":11,"font-weight":700,fill:"#94a3b8"}),{textContent:"Reference template"});
    tn.appendChild(lblT);
  }

  realPos.forEach(({x,y},id)=>{
    const parentRef=actualParentMap.get(id)||null;
    const parent=parentRef?realPos.get(parentRef):null;
    if(parent) re.appendChild(makeCurve(parent.x+rOffX,parent.y+NH,x+rOffX,y));

    if(isPlaceholderRef(id)){
      const placeholder=getPlaceholderByRef(id);
      if(!placeholder) return;
      const card=makePlaceholderCardEditable(placeholder,x+rOffX,y);
      rn.appendChild(card);
      return;
    }

    const asset=assetMap.get(id);
    if(!asset) return;
    const card=makeNodeCard(asset,x+rOffX,y,id===selectedAssetNumber,{hasMissing:getMissingReferenceChildren(asset).length>0,isMismatch:isReferenceMismatch(asset),isOrph:isOrphaned(asset)});
    card.addEventListener("click",()=>selectAsset(id));
    rn.appendChild(card);
  });
  const lblR=Object.assign(svgEl("text",{"text-anchor":"middle","x":rOffX,"y":-20,"font-size":11,"font-weight":700,fill:"#94a3b8"}),{textContent:"Actual assets"});
  rn.appendChild(lblR);

  let minY=Infinity,maxY=-Infinity;
  realPos.forEach(({y})=>{minY=Math.min(minY,y);maxY=Math.max(maxY,y+NH);});
  if(tPos) tPos.forEach(({y})=>{minY=Math.min(minY,y);maxY=Math.max(maxY,y+NH);});
  const divider=svgEl("line",{x1:0,y1:minY-30,x2:0,y2:maxY+20,stroke:"#e2e8f0","stroke-width":2,"stroke-dasharray":"6,4"});

  svgRoot.appendChild(corr);
  svgRoot.appendChild(te);
  svgRoot.appendChild(re);
  svgRoot.appendChild(divider);
  svgRoot.appendChild(tn);
  svgRoot.appendChild(rn);

  const combinedPos=offsetPositions(realPos,rOffX);
  if(tPos){
    offsetPositions(tPos,tOffX).forEach((value,key)=>combinedPos.set(`tpl-${key}`,value));
  }
  fitIfNeeded(combinedPos);
}

let hasFit=false;
let lastRootId=null;
let lastFitSignature=null;
function fitIfNeeded(pos) {
  if(hasFit) return;
  hasFit=true;
  setTimeout(()=>fitToScreen(pos),30);
}

function fitToScreen(pos) {
  if(!pos||!pos.size) return;
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  pos.forEach(({x,y})=>{minX=Math.min(minX,x-NW/2);minY=Math.min(minY,y);maxX=Math.max(maxX,x+NW/2);maxY=Math.max(maxY,y+NH);});
  const W=canvasWrap.clientWidth||800, H=canvasWrap.clientHeight||600;
  const tw=maxX-minX+80, th=maxY-minY+80;
  zoom=Math.min(1.2,Math.min(W/tw,H/th));
  // in sidebyside the tree is offset — centre on (0,0) which is the divider
  panX=W/2-(minX+(maxX-minX)/2)*zoom;
  panY=40-minY*zoom;
  applyTransform();
}

// ── Pan / zoom ────────────────────────────────────────────────────────
function applyTransform() {
  svgRoot.setAttribute("transform",`translate(${panX},${panY}) scale(${zoom})`);
  zoomLabel.textContent=`${Math.round(zoom*100)}%`;
}

canvasWrap.addEventListener("mousedown",e=>{
  if(e.button!==0) return;
  isPanning=true; panStartX=e.clientX; panStartY=e.clientY;
  panOriginX=panX; panOriginY=panY;
  canvasWrap.classList.add("panning");
});
window.addEventListener("mousemove",e=>{
  if(!isPanning) return;
  panX=panOriginX+(e.clientX-panStartX); panY=panOriginY+(e.clientY-panStartY);
  applyTransform();
});
window.addEventListener("mouseup",()=>{ isPanning=false; canvasWrap.classList.remove("panning"); });
canvasWrap.addEventListener("wheel",e=>{
  e.preventDefault();
  const factor=e.deltaY<0?1.1:0.9;
  const rect=canvasWrap.getBoundingClientRect();
  const mx=e.clientX-rect.left, my=e.clientY-rect.top;
  panX=mx-(mx-panX)*factor; panY=my-(my-panY)*factor;
  zoom=Math.max(0.15,Math.min(2.5,zoom*factor));
  applyTransform();
},{passive:false});

zoomInBtn.addEventListener("click",()=>{ zoom=Math.min(2.5,zoom*1.2); applyTransform(); });
zoomOutBtn.addEventListener("click",()=>{ zoom=Math.max(0.15,zoom*0.8); applyTransform(); });
fitBtn.addEventListener("click",()=>{ hasFit=false; renderCanvas(); });

canvasWrap.addEventListener("dragover", e => {
  const hasAssetPayload = e.dataTransfer?.types?.includes("application/x-asset-number");
  if (!hasAssetPayload || !ghostDropTargets.size) return;
  const hit = hitTestGhostDropTarget(e.clientX, e.clientY);
  clearGhostDragState();
  if (!hit) return;
  const targetEl = svgRoot.querySelector(`[data-template-tid="${hit.tid}"]`);
  if (targetEl) {
    targetEl.classList.add("drag-over-ghost");
    dragOverGhostTid = hit.tid;
  }
  e.preventDefault();
});

canvasWrap.addEventListener("dragleave", e => {
  if (e.target === canvasWrap) clearGhostDragState();
});

canvasWrap.addEventListener("drop", e => {
  const assetNumber = e.dataTransfer?.getData("application/x-asset-number");
  if (!assetNumber) return;
  const hit = hitTestGhostDropTarget(e.clientX, e.clientY);
  clearGhostDragState();
  if (!hit) return;
  e.preventDefault();

  const asset = assetMap.get(assetNumber);
  const groups = getTemplateNodeGroups(hit.node);
  const allowed = new Set();
  groups.forEach(g => g.codes.forEach(c => allowed.add(c)));
  const code = extractNameCode(asset?.itemNameCodeDesc);
  const targetEl = svgRoot.querySelector(`[data-template-tid="${hit.tid}"]`);

  if (!asset || !allowed.has(code)) {
    if (targetEl) {
      targetEl.classList.add("drag-invalid-ghost");
      setTimeout(() => targetEl.classList.remove("drag-invalid-ghost"), 600);
    }
    return;
  }

  flashNodeSuccess(targetEl);
  if (isPlaceholderRef(hit.node.parentAssetId)) {
    assignAssetToPlaceholder(assetNumber, getPlaceholderIdFromRef(hit.node.parentAssetId), { flashEl: targetEl });
  } else {
    updateAssetParent(assetNumber, hit.node.parentAssetId, false, { flashEl: targetEl });
  }
  selectAsset(assetNumber);
});

// ── Detail panel ──────────────────────────────────────────────────────
function openDetailPanel(num) {
  const asset=assetMap.get(num); if(!asset) return;
  detailAssetId.textContent=asset.assetNumber;
  detailBody.innerHTML="";
  appBody.classList.add("detail-open");

  // ── Status & type pills
  const pills=div("detail-pills");
  const code=extractNameCode(asset.itemNameCodeDesc);
  if(code) pills.appendChild(pill(code,"pill-code"));
  if(asset.assetStatus) pills.appendChild(pill(asset.assetStatus,isObsolete(asset)?"pill-obsolete":"pill-ok"));
  if(asset.elr) pills.appendChild(pill(asset.elr,"pill-elr"));
  appendSection(detailBody,"",pills);

  // ── Core fields
  const fields=[
    ["Asset Number",asset.assetNumber],
    ["Description",asset.assetDesc1||asset.assetDesc2||"—"],
    ["Item Name Code",asset.itemNameCodeDesc||"—"],
    ["Asset Class",asset.assetClass||"—"],
    ["EGI Code",asset.egiCodeDesc||"—"],
    ["Structured Plant No",asset.structuredPlantNumber||"—"],
    ["ELR",asset.elr||"—"],
    ["Track ID",asset.trackId||"—"],
    ["Start Mileage",asset.assetStartMileage||"—"],
    ["End Mileage",asset.assetEndMileage||"—"],
    ["Status",asset.assetStatus||"—"],
  ];
  const dl=document.createElement("dl"); dl.className="detail-grid";
  fields.forEach(([label,value])=>{
    const dt=document.createElement("dt"); dt.textContent=label;
    const dd=document.createElement("dd"); dd.textContent=value;
    dl.appendChild(dt); dl.appendChild(dd);
  });
  appendSection(detailBody,"Asset details",dl);

  // ── Hierarchy navigation
  const chain=buildAncestorChain(num);
  if(chain.length>1){
    const wrap=div("detail-nav-chips");
    chain.slice(0,-1).forEach(n=>{ const btn=navChip(n.assetNumber,()=>selectAsset(n.assetNumber)); wrap.appendChild(btn); });
    appendSection(detailBody,"Ancestors",wrap);
  }
  const children=childrenMap.get(num)||[];
  if(children.length){
    const wrap=div("detail-nav-chips");
    children.forEach(cid=>{ const ca=assetMap.get(cid); const btn=navChip(cid,()=>selectAsset(cid),isObsolete(ca)?"chip-obsolete":""); wrap.appendChild(btn); });
    appendSection(detailBody,`Children (${children.length})`,wrap);
  }

  // ── Associations
  const assocTargets=getAssocTargets(num);
  if(assocTargets.length){
    const wrap=div("detail-nav-chips");
    assocTargets.forEach(a=>{ const btn=navChip(`${a.assetNumber} · ${extractNameCode(a.itemNameCodeDesc)}`,()=>selectAsset(a.assetNumber),"chip-assoc"); wrap.appendChild(btn); });
    appendSection(detailBody,"Associated equipment",wrap);
  }

  // ── Warnings
  const warnings=[];
  if(isReferenceMismatch(asset)) warnings.push({cls:"w-mismatch",msg:"Hierarchy mismatch — parent does not follow the reference tree."});
  if(isOrphaned(asset)){const p=assetMap.get(asset.parentAssetNumber); warnings.push({cls:"w-orphaned",msg:`Orphaned — parent ${asset.parentAssetNumber}${p?` (${p.assetStatus})`:""}  is obsolete.`});}
  getMissingReferenceChildren(asset).forEach(code=>warnings.push({cls:"w-missing",msg:`Expected child missing: ${code}`}));
  if(warnings.length){
    const wrap=div(""); wrap.style.cssText="display:flex;flex-direction:column;gap:.3rem";
    warnings.forEach(({cls,msg})=>{
      const c=document.createElement("div"); c.className=`warning-chip ${cls}`;
      c.innerHTML=`<span>!</span>${msg}`; wrap.appendChild(c);
    });
    const wrapOuter=div("detail-section"); const h=document.createElement("div"); h.className="detail-section-title"; h.textContent="Warnings"; wrapOuter.appendChild(h); wrapOuter.appendChild(wrap);
    detailBody.appendChild(wrapOuter);
  }

  // ── Actions
  const actionWrap=div(""); actionWrap.style.cssText="display:flex;flex-wrap:wrap;gap:.4rem";
  const canReassignParent=isOrphaned(asset)||isReferenceMismatch(asset);
  if(canReassignParent){
    const btn=document.createElement("button");
    btn.className="btn-sm-action";
    btn.textContent=isOrphaned(asset)?"↺ Reassign parent":"↺ Correct parent";
    btn.addEventListener("click",()=>openOrphanParentSelectModal(num));
    actionWrap.appendChild(btn);
  }
  const canAssignToPlaceholder=!asset.parentAssetNumber||isReferenceMismatch(asset);
  if(canAssignToPlaceholder){
    getAssignablePlaceholdersForAsset(asset).forEach(ph=>{
      const btn=document.createElement("button");
      btn.className="btn-sm-action";
      btn.textContent=`Assign to ${ph.itemNameCode} placeholder`;
      btn.addEventListener("click",()=>assignAssetToPlaceholder(num,ph.id));
      actionWrap.appendChild(btn);
    });
  }
  const mg=getMissingReferenceChildGroups(asset);
  if(mg.length){
    const cands=getUnassignedAssetsForGroups(mg,num);
    if(cands.length){const btn=document.createElement("button");btn.className="btn-sm-action";btn.textContent="🔗 Link existing";btn.addEventListener("click",()=>openExistingAssetSelectModal(num,mg));actionWrap.appendChild(btn);}
    const btn=document.createElement("button");btn.className="btn-sm-action";btn.textContent="+ Placeholder";btn.addEventListener("click",()=>openPlaceholderSelectModal(num,mg));actionWrap.appendChild(btn);
  }
  if(actionWrap.children.length) appendSection(detailBody,"Actions",actionWrap);

  // ── Reference template checklist
  const tree=getActiveReferenceTree();
  if(tree?.root){
    function findRefNode(n){ if((n.nameCodes||[]).map(c=>c.toUpperCase()).includes(code)) return n; for(const c of n.children||[]){const r=findRefNode(c);if(r)return r;} return null; }
    const refNode=findRefNode(tree.root);
    const groups=refNode?.children||[];
    if(groups.length){
      const ex=getExistingChildCodes(num);
      const cl=div("checklist");
      groups.forEach(g=>{
        const codes=(g.nameCodes||[]).map(c=>c.toUpperCase());
        const filled=codes.some(c=>ex.has(c));
        const isPh=!filled&&codes.some(c=>(placeholderMap.get(num)||[]).some(p=>p.itemNameCode===c));
        const isMissing=!filled&&!isPh&&!g.optional;
        let cls="checklist-row ";
        let icon=filled?"✓":isPh?"⊡":g.optional?"○":"✗";
        cls+=filled?"row-ok":isPh?"row-placeholder":isMissing?"row-missing":"row-optional";
        const row=div(cls);
        const iconEl=document.createElement("span"); iconEl.className="check-icon"; iconEl.textContent=icon;
        const body=div("check-body");
        const title=document.createElement("div"); title.className="check-title"; title.textContent=g.title||codes.join("/");
        const codeEl=document.createElement("div"); codeEl.className="check-code"; codeEl.textContent=`${codes.join(" / ")}${g.optional?" · optional":""}`;
        body.appendChild(title); body.appendChild(codeEl);
        if(!filled&&!isPh){
          const acts=div("check-actions");
          const cands=getUnassignedAssetsForGroups([{codes:new Set(codes),optional:!!g.optional}],num);
          if(cands.length){const btn=document.createElement("button");btn.textContent="Link existing";btn.addEventListener("click",()=>openExistingAssetSelectModal(num,[{codes:new Set(codes),optional:!!g.optional}]));acts.appendChild(btn);}
          if(!g.optional){const btn=document.createElement("button");btn.textContent="Add placeholder";btn.addEventListener("click",()=>openPlaceholderSelectModal(num,[{codes:new Set(codes),optional:!!g.optional}]));acts.appendChild(btn);}
          body.appendChild(acts);
        }
        row.appendChild(iconEl); row.appendChild(body); cl.appendChild(row);
      });
      appendSection(detailBody,"Reference template",cl);
    }
  }
}

function getAssocTargets(num) {
  const asset=assetMap.get(num); if(!asset) return [];
  const code=extractNameCode(asset.itemNameCodeDesc);
  const targets=referenceAssociatedMap.get(code)||new Set();
  return assets.filter(a=>targets.has(extractNameCode(a.itemNameCodeDesc))&&a.assetNumber!==num);
}

function div(cls) { const d=document.createElement("div"); if(cls) d.className=cls; return d; }
function pill(text,cls) { const s=document.createElement("span"); s.className=`detail-pill ${cls}`; s.textContent=text; return s; }
function navChip(text,onClick,extraCls="") { const b=document.createElement("button"); b.type="button"; b.className=`nav-chip ${extraCls}`; b.textContent=text; b.addEventListener("click",onClick); return b; }
function appendSection(parent,title,content) {
  const sec=div("detail-section");
  if(title){const h=document.createElement("div");h.className="detail-section-title";h.textContent=title;sec.appendChild(h);}
  sec.appendChild(content); parent.appendChild(sec);
}

closeDetail.addEventListener("click",()=>{ appBody.classList.remove("detail-open"); selectedAssetNumber=null; renderAssetList(); renderCanvas(); });

// ── Select asset ──────────────────────────────────────────────────────
function selectAsset(num) {
  if(!num) return;
  const wasSelected=selectedAssetNumber===num;
  selectedAssetNumber=num;
  const i=issueList.indexOf(num); if(i!==-1) issueIndex=i;
  renderAssetList();

  if(triageView.classList.contains("hidden")===false) {
    // switch to canvas
    triageView.classList.add("hidden");
    treeCanvasView.classList.remove("hidden");
  }
  const newRootId=findTreeRoot(num);
  if(newRootId!==lastRootId){
    hasFit=false;
    lastRootId=newRootId;
    lastFitSignature=null;
  }
  renderCanvas();
  openDetailPanel(num);
  updateIssueNav();
}

// ── Asset list ────────────────────────────────────────────────────────
function populateSelectFilter(sel,values,{allLabel,emptyLabel}) {
  const unique=new Set(); let hasEmpty=false;
  values.forEach(v=>{const t=v?.trim()||"";t?unique.add(t):(hasEmpty=true);});
  sel.innerHTML="";
  const all=document.createElement("option");all.value="all";all.textContent=allLabel;sel.appendChild(all);
  if(hasEmpty){const e=document.createElement("option");e.value="__empty__";e.textContent=emptyLabel;sel.appendChild(e);}
  Array.from(unique).sort((a,b)=>a.localeCompare(b)).forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;sel.appendChild(o);});
}
function populateFilters() {
  populateSelectFilter(itemNameFilter,assets.map(a=>a.itemNameCodeDesc),{allLabel:"All Item Name Codes",emptyLabel:"No Item Name Code"});
  populateSelectFilter(elrFilter,assets.map(a=>a.elr),{allLabel:"All ELRs",emptyLabel:"No ELR"});
  populateSelectFilter(assetClassFilter,assets.map(a=>a.assetClass),{allLabel:"All Asset Classes",emptyLabel:"No Asset Class"});
  populateSelectFilter(statusFilter,assets.map(a=>a.assetStatus),{allLabel:"All Statuses",emptyLabel:"No Status"});
}
function matchesFilters(asset) {
  const q=filterInput.value.trim().toLowerCase();
  const label=`${asset.assetNumber} ${asset.assetDesc1} ${asset.assetDesc2} ${asset.itemNameCodeDesc} ${asset.elr} ${asset.assetClass} ${asset.assetStatus}`.toLowerCase();
  if(q&&!label.includes(q)) return false;
  if(groupFilter.value==="sc-group"){const c=extractNameCode(asset.itemNameCodeDesc);if(!c||!referenceNameCodes.includes(c)) return false;}
  const chk=(sel,val)=>{if(sel.value==="all")return true;const v=val?.trim()||"";return sel.value==="__empty__"?!v:v===sel.value;};
  if(!chk(itemNameFilter,asset.itemNameCodeDesc))return false;
  if(!chk(elrFilter,asset.elr))return false;
  if(!chk(assetClassFilter,asset.assetClass))return false;
  if(!chk(statusFilter,asset.assetStatus))return false;
  if(hideObsoleteToggle.checked&&isObsolete(asset))return false;
  if(errorOnlyToggle.checked&&!hasError(asset))return false;
  return true;
}
function renderAssetList() {
  assetList.innerHTML="";
  const filtered=assets.filter(matchesFilters).sort((a,b)=>a.assetNumber.localeCompare(b.assetNumber));
  listStatus.textContent=`${filtered.length}`;
  filtered.forEach(asset=>{
    const li=document.createElement("li");
    const btn=document.createElement("button"); btn.type="button"; btn.className="asset-btn";
    if(asset.assetNumber===selectedAssetNumber) btn.classList.add("selected");
    if(isReferenceMismatch(asset)){const b=mkBadge("danger","!");btn.appendChild(b);}
    else if(getMissingReferenceChildren(asset).length){const b=mkBadge("warn","!");btn.appendChild(b);}
    else if(isOrphaned(asset)){const b=mkBadge("purple","!");btn.appendChild(b);}
    else if(shouldShowTick(asset)){const b=mkBadge("success","✓");btn.appendChild(b);}
    const lbl=document.createElement("span"); lbl.className="asset-label";
    const desc=asset.assetDesc1||asset.assetDesc2||"";
    lbl.textContent=desc?`${asset.assetNumber} · ${desc}`:asset.assetNumber;
    btn.appendChild(lbl); btn.addEventListener("click",()=>selectAsset(asset.assetNumber));
    btn.draggable = true;
    btn.addEventListener("dragstart", e => {
      e.dataTransfer.setData("application/x-asset-number", asset.assetNumber);
      e.dataTransfer.effectAllowed = "move";
      btn.classList.add("dragging");
    });
    btn.addEventListener("dragend", () => { btn.classList.remove("dragging"); clearGhostDragState(); });
    li.appendChild(btn); assetList.appendChild(li);
  });
}
function mkBadge(type,text){const s=document.createElement("span");s.className=`badge badge-${type}`;s.textContent=text;return s;}

// ── Triage ────────────────────────────────────────────────────────────
function buildIssueList() { issueList=assets.filter(hasError).map(a=>a.assetNumber); }

function renderTriageView() {
  triageView.classList.remove("hidden"); treeCanvasView.classList.add("hidden");
  appBody.classList.remove("detail-open"); selectedAssetNumber=null; renderAssetList();
  if(!assets.length){triageTitle.textContent="Upload a file to begin";triageSubtitle.textContent="Your asset export will be validated against the selected reference tree.";triageStats.innerHTML="";triageIssueList.innerHTML="";return;}
  const mismatches=assets.filter(a=>isReferenceMismatch(a));
  const orphaned=assets.filter(a=>isOrphaned(a));
  const missingCh=assets.filter(a=>getMissingReferenceChildren(a).length);
  const clean=assets.filter(a=>!hasError(a)&&referenceNameCodes.includes(extractNameCode(a.itemNameCodeDesc)));
  const tree=getActiveReferenceTree();
  triageTitle.textContent=`${assets.length} assets loaded`;
  triageSubtitle.textContent=tree?`Validating against: ${tree.label}`:"No reference tree selected.";
  triageStats.innerHTML="";
  [{num:mismatches.length,label:"Hierarchy mismatches",cls:"stat-danger"},{num:orphaned.length,label:"Orphaned assets",cls:"stat-purple"},{num:missingCh.length,label:"Missing children",cls:"stat-warn"},{num:clean.length,label:"Clean assets",cls:"stat-ok"},{num:assets.length,label:"Total assets",cls:"stat-muted"}].forEach(({num,label,cls})=>{const card=document.createElement("div");card.className=`stat-card ${cls}`;card.innerHTML=`<div class="stat-num">${num}</div><div class="stat-label">${label}</div>`;triageStats.appendChild(card);});
  triageIssueList.innerHTML="";
  [{title:"Hierarchy mismatches",items:mismatches,tag:"mismatch"},{title:"Orphaned assets",items:orphaned,tag:"orphaned"},{title:"Missing expected children",items:missingCh,tag:"missing"}].forEach(({title,items,tag})=>{
    if(!items.length) return;
    const sec=document.createElement("div");sec.className="triage-section-title";sec.textContent=`${title} (${items.length})`;triageIssueList.appendChild(sec);
    items.forEach(asset=>{
      const row=document.createElement("div");row.className="issue-row";
      const iconMap={mismatch:{bg:"#fee2e2",c:"#991b1b",t:"⚠"},orphaned:{bg:"#ede9fe",c:"#5b21b6",t:"⤴"},missing:{bg:"#fef3c7",c:"#92400e",t:"◻"}};
      const ic=iconMap[tag];
      const icon=document.createElement("div");icon.className="issue-icon";icon.style.background=ic.bg;icon.style.color=ic.c;icon.textContent=ic.t;
      const body=document.createElement("div");body.className="issue-body";
      const idEl=document.createElement("div");idEl.className="issue-id";idEl.textContent=asset.assetNumber;
      const descEl=document.createElement("div");descEl.className="issue-desc";descEl.textContent=asset.assetDesc1||asset.assetDesc2||asset.itemNameCodeDesc||"";
      const tags=document.createElement("div");tags.className="issue-tags";
      if(isReferenceMismatch(asset)){const t=document.createElement("span");t.className="issue-tag tag-mismatch";t.textContent="Mismatch";tags.appendChild(t);}
      if(isOrphaned(asset)){const t=document.createElement("span");t.className="issue-tag tag-orphaned";t.textContent="Orphaned";tags.appendChild(t);}
      getMissingReferenceChildren(asset).forEach(code=>{const t=document.createElement("span");t.className="issue-tag tag-missing";t.textContent=`Missing: ${code}`;tags.appendChild(t);});
      body.appendChild(idEl);body.appendChild(descEl);body.appendChild(tags);
      const arrow=document.createElement("span");arrow.className="issue-arrow";arrow.textContent="›";
      row.appendChild(icon);row.appendChild(body);row.appendChild(arrow);
      row.addEventListener("click",()=>selectAsset(asset.assetNumber));
      triageIssueList.appendChild(row);
    });
  });
}

function updateIssueNav() {
  const total=issueList.length;
  prevIssue.disabled=issueIndex<=0||!total;
  nextIssue.disabled=issueIndex>=total-1||!total;
  issuePosition.textContent=total?`${issueIndex+1} / ${total} issues`:"";
}

// ── Changes tray ──────────────────────────────────────────────────────
function updateChangesTray() {
  const total=changedAssets.size+placeholderAssets.length;
  exportButton.disabled=!total;
  trayLabel.textContent=total?`${total} pending change${total>1?"s":""}`:  "No pending changes";
  trayLabel.classList.toggle("has-changes",total>0);
  trayList.innerHTML="";
  Array.from(changedAssets).sort().forEach(num=>{
    const a=assetMap.get(num);if(!a)return;
    const item=document.createElement("div");item.className="tray-item";
    const lbl=document.createElement("span");lbl.className="tray-item-label";lbl.textContent=`Reparent ${num} → ${a.parentAssetNumber||"(none)"}`;
    const rm=document.createElement("button");rm.textContent="✕";rm.addEventListener("click",()=>updateAssetParent(num,originalParentMap.get(num),true));
    item.appendChild(lbl);item.appendChild(rm);trayList.appendChild(item);
  });
  placeholderAssets.forEach(ph=>{
    const item=document.createElement("div");item.className="tray-item";
    const lbl=document.createElement("span");lbl.className="tray-item-label";lbl.textContent=`Placeholder ${ph.itemNameCode} under ${ph.parentAssetNumber}`;
    const rm=document.createElement("button");rm.textContent="✕";rm.addEventListener("click",()=>removePlaceholderAsset(ph.id,{offerUndo:false}));
    item.appendChild(lbl);item.appendChild(rm);trayList.appendChild(item);
  });
}
trayToggle.addEventListener("click",()=>{changesTray.classList.toggle("collapsed");changesTray.classList.toggle("expanded");});

function getTreeSignature(rootId) {
  let maxDepth = 0;
  let count = 0;
  function walk(id, depth) {
    count++;
    maxDepth = Math.max(maxDepth, depth);
    (childrenMap.get(id) || []).forEach(c => walk(c, depth + 1));
  }
  walk(rootId, 0);
  return `${rootId}:${maxDepth}:${count}`;
}

function refreshAfterHierarchyChange(focusAssetNumber = selectedAssetNumber) {
  if (focusAssetNumber) {
    const rootId = findTreeRoot(focusAssetNumber);
    const sig = getTreeSignature(rootId);
    if (sig !== lastFitSignature) {
      hasFit = false;
      lastFitSignature = sig;
    }
  }
  renderCanvas();
  if (focusAssetNumber) openDetailPanel(focusAssetNumber);
}

// ── Asset parent update ───────────────────────────────────────────────
function updateAssetParent(num,newParent,isRevert=false,{ flashEl=null }={}) {
  const asset=assetMap.get(num);if(!asset||!newParent||num===newParent||isDescendant(num,newParent))return;
  const old=asset.parentAssetNumber||null;if(old===newParent)return;
  const oldEffectiveParent=getEffectiveParentNumber(old);
  if(old?.startsWith("__ph__")){
    const oldPlaceholderId=old.slice(6);
    const existing=placeholderChildrenMap.get(oldPlaceholderId)||[];
    const filtered=existing.filter(c=>c!==num);
    filtered.length?placeholderChildrenMap.set(oldPlaceholderId,filtered):placeholderChildrenMap.delete(oldPlaceholderId);
  }
  removeChildLink(oldEffectiveParent,num);
  asset.parentAssetNumber=newParent;
  addChildLink(newParent,num);
  if(isRevert||originalParentMap.get(num)===newParent)changedAssets.delete(num);else changedAssets.add(num);
  buildIssueList();updateChangesTray();renderAssetList();
  flashNodeSuccess(flashEl);
  refreshAfterHierarchyChange(selectedAssetNumber);
}

// ── Placeholders ──────────────────────────────────────────────────────
function addPlaceholderAsset(parentNum,itemNameCode,{ flashEl=null }={}) {
  if(!parentNum||!itemNameCode)return;
  const phId=`ph-${placeholderCounter++}`;
  const ph={id:phId,assetNumber:`__ph__${phId}`,parentAssetNumber:parentNum,itemNameCode};
  placeholderAssets.push(ph);
  if(!placeholderMap.has(parentNum))placeholderMap.set(parentNum,[]);
  placeholderMap.get(parentNum).push(ph);
  buildIssueList();updateChangesTray();flashNodeSuccess(flashEl);
  refreshAfterHierarchyChange(selectedAssetNumber);
}
function removePlaceholderAsset(id,{offerUndo=false}={}) {
  let removed=null;
  placeholderMap.forEach((items,pNum)=>{const i=items.findIndex(p=>p.id===id);if(i!==-1){removed=items[i];const f=items.filter(p=>p.id!==id);f.length?placeholderMap.set(pNum,f):placeholderMap.delete(pNum);}});
  if(!removed)return;
  const assignedChildren=placeholderChildrenMap.get(id)||[];
  assignedChildren.forEach(num=>{
    const child=assetMap.get(num);
    if(removed?.parentAssetNumber) removeChildLink(removed.parentAssetNumber,num);
    if(child?.parentAssetNumber===`__ph__${id}`) child.parentAssetNumber=null;
    if(originalParentMap.get(num)===child?.parentAssetNumber) changedAssets.delete(num); else changedAssets.add(num);
  });
  placeholderChildrenMap.delete(id);
  placeholderAssets=placeholderAssets.filter(p=>p.id!==id);
  if(offerUndo){lastRemovedPlaceholder=removed;showUndoToast(`Removed placeholder ${removed.itemNameCode}.`,()=>{if(!lastRemovedPlaceholder)return;const it=lastRemovedPlaceholder;placeholderAssets.push(it);if(!placeholderMap.has(it.parentAssetNumber))placeholderMap.set(it.parentAssetNumber,[]);placeholderMap.get(it.parentAssetNumber).push(it);lastRemovedPlaceholder=null;buildIssueList();updateChangesTray();if(selectedAssetNumber)refreshAfterHierarchyChange(selectedAssetNumber);});}
  buildIssueList();updateChangesTray();if(selectedAssetNumber)refreshAfterHierarchyChange(selectedAssetNumber);
}
function assignAssetToPlaceholder(assetNumber, placeholderId,{ flashEl=null }={}) {
  const asset=assetMap.get(assetNumber);
  const placeholder=placeholderAssets.find(ph=>ph.id===placeholderId);
  if(!asset||!placeholder) return;
  if(assetNumber===placeholder.parentAssetNumber||isDescendant(assetNumber,placeholder.parentAssetNumber)) return;
  const prevParent=asset.parentAssetNumber||null;
  removeChildLink(getEffectiveParentNumber(prevParent),assetNumber);
  if(prevParent?.startsWith("__ph__")){
    const prevPlaceholderId=prevParent.slice(6);
    const prevChildren=placeholderChildrenMap.get(prevPlaceholderId)||[];
    const filtered=prevChildren.filter(c=>c!==assetNumber);
    filtered.length?placeholderChildrenMap.set(prevPlaceholderId,filtered):placeholderChildrenMap.delete(prevPlaceholderId);
  }
  asset.parentAssetNumber=`__ph__${placeholderId}`;
  addChildLink(placeholder.parentAssetNumber,assetNumber);
  const current=placeholderChildrenMap.get(placeholderId)||[];
  if(!current.includes(assetNumber)) placeholderChildrenMap.set(placeholderId,[...current,assetNumber]);
  if(originalParentMap.get(assetNumber)===asset.parentAssetNumber) changedAssets.delete(assetNumber); else changedAssets.add(assetNumber);
  buildIssueList(); updateChangesTray(); renderAssetList();
  flashNodeSuccess(flashEl);
  refreshAfterHierarchyChange(assetNumber);
}

function getAssignablePlaceholdersForAsset(asset) {
  if(!asset) return [];
  const code=extractNameCode(asset.itemNameCodeDesc);
  if(!code) return [];
  const rootId=findTreeRoot(asset.assetNumber);
  const inScope=subtreeIds(rootId);

  return placeholderAssets.filter(ph=>{
    let anchorId=ph.parentAssetNumber;
    if(isPlaceholderRef(anchorId)){
      const parent=getPlaceholderByRef(anchorId);
      anchorId=parent?.parentAssetNumber??null;
    }
    if(!anchorId||!inScope.has(anchorId)) return false;

    const phCode=(ph.itemNameCode||"").toUpperCase();
    const expectedChildren=referenceChildMap.get(phCode)||[];
    return expectedChildren.some(g=>g.codes.has(code));
  });
}

function showUndoToast(msg,onUndo) {
  undoToastMessage.textContent=msg;undoToast.classList.remove("hidden");
  if(undoToastHandler)undoToastAction.removeEventListener("click",undoToastHandler);
  undoToastHandler=()=>{if(undoToastTimeoutId)clearTimeout(undoToastTimeoutId);undoToast.classList.add("hidden");undoToastHandler=null;onUndo?.();};
  undoToastAction.addEventListener("click",undoToastHandler);
  if(undoToastTimeoutId)clearTimeout(undoToastTimeoutId);
  undoToastTimeoutId=setTimeout(()=>{undoToast.classList.add("hidden");undoToastHandler=null;},6000);
}

// ── Modal helpers ─────────────────────────────────────────────────────
function getCandidateAssetsForGroups(groups, parentNum, { allowAssigned = false } = {}) {
  const allowed = new Set();
  groups.forEach(g => g.codes.forEach(c => allowed.add(c)));
  return assets.filter(a => {
    if (!a || a.assetNumber === parentNum) return false;
    if (allowAssigned && isDescendant(a.assetNumber, parentNum)) return false;
    const c = extractNameCode(a.itemNameCodeDesc);
    if (!c || !allowed.has(c)) return false;
    if (!a.parentAssetNumber) return true;
    if (allowAssigned) return true;
    if (isReferenceMismatch(a)) return true;  // mis-parented — include as candidate
    return false;
  }).sort((a, b) => {
    const s = x => !x.parentAssetNumber ? 0 : isReferenceMismatch(x) ? 1 : 2;
    return s(a) - s(b) || a.assetNumber.localeCompare(b.assetNumber);
  });
}
function getUnassignedAssetsForGroups(groups,parentNum){return getCandidateAssetsForGroups(groups,parentNum,{allowAssigned:false});}
function getValidParentCodesForAsset(asset){
  const code=extractNameCode(asset?.itemNameCodeDesc);
  if(!code||!referenceNameCodes.includes(code)) return null;
  return new Set(referenceParentMap.get(code)||[]);
}
function getParentCandidates(num){
  const asset=assetMap.get(num);
  if(!asset) return [];
  const allowedParentCodes=getValidParentCodesForAsset(asset);
  if(allowedParentCodes&&allowedParentCodes.size===0) return [];
  return assets.filter(a=>{
    if(!a||a.assetNumber===num||isDescendant(num,a.assetNumber)||isObsolete(a)) return false;
    if(!allowedParentCodes) return true;
    const parentCode=extractNameCode(a.itemNameCodeDesc);
    return parentCode?allowedParentCodes.has(parentCode):false;
  }).sort((a,b)=>a.assetNumber.localeCompare(b.assetNumber));
}
function getReassignmentCandidates(num){
  const asset=assetMap.get(num);
  if(!asset) return [];
  const realParentCandidates=getParentCandidates(num).map(candidate=>({type:"asset",asset:candidate}));
  const placeholderCandidates=getAssignablePlaceholdersForAsset(asset).map(placeholder=>({type:"placeholder",placeholder}));
  return [...realParentCandidates,...placeholderCandidates];
}
function buildPlaceholderOptions(groups){const opts=[];groups.forEach(g=>{const codes=Array.from(g.codes).sort();codes.forEach(code=>opts.push({code,groupLabel:codes.join(" or ")}));});return opts;}
function getTemplateNodeGroups(node){
  const codes=(node?.codes||[]).filter(Boolean);
  if(!codes.length) return [];
  return [{codes:new Set(codes),optional:Boolean(node?.refNode?.optional)}];
}
function buildAssetOptionButton(asset, onSelect) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "modal-option";

  const title = document.createElement("span");
  title.className = "modal-option-title";
  title.textContent = asset.assetNumber;
  btn.appendChild(title);

  const tag = document.createElement("span");
  if (asset.parentAssetNumber) {
    tag.style.cssText = "font-size:.68rem;font-weight:600;padding:.1rem .4rem;border-radius:999px;background:#fee2e2;color:#991b1b;width:fit-content;display:block;margin-bottom:.2rem;";
    tag.textContent = `⚠ Currently under ${asset.parentAssetNumber}`;
  } else {
    tag.style.cssText = "font-size:.68rem;font-weight:600;padding:.1rem .4rem;border-radius:999px;background:#f0fdf4;color:#166534;width:fit-content;display:block;margin-bottom:.2rem;";
    tag.textContent = "Unassigned";
  }
  btn.appendChild(tag);

  const dl = document.createElement("dl");
  dl.className = "modal-option-details";
  [
    { label: "Item Name Code", value: asset.itemNameCodeDesc },
    { label: "Desc", value: asset.assetDesc1 },
    { label: "ELR", value: asset.elr },
    { label: "Status", value: asset.assetStatus },
    { label: "Track ID", value: asset.trackId },
  ].forEach(({ label, value }) => {
    if (!value) return;
    const dt = document.createElement("dt"); dt.textContent = label;
    const dd = document.createElement("dd"); dd.textContent = value;
    dl.appendChild(dt); dl.appendChild(dd);
  });
  btn.appendChild(dl);
  btn.addEventListener("click", () => onSelect(asset));
  return btn;
}
function buildPlaceholderOptionButton(placeholder, onSelect) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "modal-option";

  const title = document.createElement("span");
  title.className = "modal-option-title";
  title.textContent = `Placeholder ${placeholder.itemNameCode}`;
  btn.appendChild(title);

  const tag = document.createElement("span");
  tag.style.cssText = "font-size:.68rem;font-weight:600;padding:.1rem .4rem;border-radius:999px;background:#eef2ff;color:#3730a3;width:fit-content;display:block;margin-bottom:.2rem;";
  tag.textContent = `Placeholder under ${placeholder.parentAssetNumber}`;
  btn.appendChild(tag);

  const dl = document.createElement("dl");
  dl.className = "modal-option-details";
  [
    { label: "Type", value: placeholder.itemNameCode },
    { label: "Anchor Parent", value: placeholder.parentAssetNumber },
  ].forEach(({ label, value }) => {
    const dt = document.createElement("dt"); dt.textContent = label;
    const dd = document.createElement("dd"); dd.textContent = value;
    dl.appendChild(dt); dl.appendChild(dd);
  });
  btn.appendChild(dl);
  btn.addEventListener("click", () => onSelect(placeholder));
  return btn;
}

function openPlaceholderSelectModal(parentNum,groups,templateTid=null){
  placeholderSelectList.innerHTML="";
  if(placeholderSelectTitle)placeholderSelectTitle.textContent=`Add placeholder for ${parentNum}`;
  buildPlaceholderOptions(groups).forEach(opt=>{const btn=document.createElement("button");btn.type="button";btn.className="modal-option";btn.textContent=opt.code;const s=document.createElement("small");s.textContent=`Group: ${opt.groupLabel}`;btn.appendChild(s);btn.addEventListener("click",()=>{addPlaceholderAsset(parentNum,opt.code,{ flashEl: templateTid ? svgRoot.querySelector(`[data-template-tid="${templateTid}"]`) : null });closeModal(placeholderSelectModal);});placeholderSelectList.appendChild(btn);});
  openModal(placeholderSelectModal);
}
function dismissSlotBar(){
  if (activeSlotBar) { activeSlotBar.element.remove(); activeSlotBar = null; }
}

function showInlineSlotBar(templateNode, svgX, svgY) {
  dismissSlotBar();
  const parentNum = templateNode?.parentAssetId;
  if (!parentNum) return;
  const groups = getTemplateNodeGroups(templateNode);
  if (!groups.length) return;
  const placeholder = templateNode?.placeholderId ? placeholderAssets.find(p => p.id === templateNode.placeholderId) : null;
  const candidates = getCandidateAssetsForGroups(groups, parentNum, { allowAssigned: true });

  const bar = document.createElement("div");
  bar.className = "slot-action-bar";
  const screenX = svgX * zoom + panX;
  const screenY = (svgY + NH) * zoom + panY + 6;
  bar.style.left = `${screenX}px`;
  bar.style.top = `${screenY}px`;

  const title = document.createElement("div");
  title.className = "bar-title";
  title.textContent = placeholder ? `Placeholder ${placeholder.itemNameCode}` : (templateNode.refNode?.title || "Missing slot");
  bar.appendChild(title);

  if (candidates.length) {
    const linkBtn = document.createElement("button");
    linkBtn.type = "button";
    linkBtn.className = "bar-btn-primary";
    linkBtn.textContent = `Link asset (${candidates.length})`;
    linkBtn.addEventListener("click", () => {
      openExistingAssetSelectModal(parentNum, groups, { allowAssigned: true, replacePlaceholderId: placeholder?.id || null, sourceTemplateTid: templateNode.tid });
      dismissSlotBar();
    });
    bar.appendChild(linkBtn);
  }

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.textContent = "+ Placeholder";
  addBtn.addEventListener("click", () => {
    openPlaceholderSelectModal(parentNum, groups, templateNode.tid);
    dismissSlotBar();
  });
  bar.appendChild(addBtn);

  if (placeholder) {
    const rmBtn = document.createElement("button");
    rmBtn.type = "button";
    rmBtn.className = "bar-btn-danger";
    rmBtn.textContent = "Remove";
    rmBtn.addEventListener("click", () => {
      removePlaceholderAsset(placeholder.id, { offerUndo: true });
      dismissSlotBar();
    });
    bar.appendChild(rmBtn);
  }

  const dismissBtn = document.createElement("button");
  dismissBtn.type = "button";
  dismissBtn.className = "bar-dismiss";
  dismissBtn.textContent = "✕";
  dismissBtn.addEventListener("click", dismissSlotBar);
  bar.appendChild(dismissBtn);

  canvasWrap.appendChild(bar);
  activeSlotBar = { node: templateNode, element: bar };

  const closeOnOutside = e => {
    if (!activeSlotBar) return;
    if (activeSlotBar.element.contains(e.target)) return;
    dismissSlotBar();
  };
  canvasWrap.addEventListener("pointerdown", closeOnOutside, { once: true });
}

function updateExistingItemFilter(cands){if(!existingAssetItemFilter)return;const codes=new Set();cands.forEach(a=>{const c=extractNameCode(a.itemNameCodeDesc);if(c)codes.add(c);});existingAssetItemFilter.innerHTML="";const all=document.createElement("option");all.value="all";all.textContent="All item codes";existingAssetItemFilter.appendChild(all);Array.from(codes).sort().forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=c;existingAssetItemFilter.appendChild(o);});}
function renderExistingList(){
  existingAssetSelectList.innerHTML="";
  const q=(existingAssetSearch?.value||"").toLowerCase();
  const code=existingAssetItemFilter?.value||"all";
  const filtered=existingAssetCandidates.filter(a=>{
    const label=`${a.assetNumber} ${a.assetDesc1} ${a.assetDesc2} ${a.itemNameCodeDesc} ${a.elr}`.toLowerCase();
    if(q&&!label.includes(q)) return false;
    if(code!=="all"&&extractNameCode(a.itemNameCodeDesc)!==code) return false;
    return true;
  });
  if(!filtered.length){
    const p=document.createElement("p");
    p.className="modal-empty";
    p.textContent="No matching assets found.";
    existingAssetSelectList.appendChild(p);
    return;
  }
  filtered.forEach(a => existingAssetSelectList.appendChild(
    buildAssetOptionButton(a, selected => {
      const targetIsPlaceholder = isPlaceholderRef(existingAssetTargetParentNumber);
      const flashTarget = existingAssetSourceTemplateTid
        ? svgRoot.querySelector(`[data-template-tid="${existingAssetSourceTemplateTid}"]`)
        : svgRoot.querySelector(`[data-asset="${selected.assetNumber}"]`);

      if (existingAssetReplacementPlaceholderId) {
        const ph = placeholderAssets.find(p => p.id === existingAssetReplacementPlaceholderId);
        if (ph) updateAssetParent(selected.assetNumber, ph.parentAssetNumber, false, { flashEl: flashTarget });
        const phChildren = placeholderChildrenMap.get(existingAssetReplacementPlaceholderId) || [];
        phChildren.forEach(childNum => updateAssetParent(childNum, selected.assetNumber));
        placeholderChildrenMap.delete(existingAssetReplacementPlaceholderId);
        removePlaceholderAsset(existingAssetReplacementPlaceholderId, { offerUndo: false });
      } else if (targetIsPlaceholder) {
        assignAssetToPlaceholder(selected.assetNumber, getPlaceholderIdFromRef(existingAssetTargetParentNumber), { flashEl: flashTarget });
      } else {
        updateAssetParent(selected.assetNumber, existingAssetTargetParentNumber, false, { flashEl: flashTarget });
      }
      closeExistingAssetSelectModal();
    })
  ));
}
function openExistingAssetSelectModal(parentNum,groups,{allowAssigned=false,replacePlaceholderId=null,sourceTemplateTid=null}={}){existingAssetTargetParentNumber=parentNum;existingAssetReplacementPlaceholderId=replacePlaceholderId;existingAssetSourceTemplateTid=sourceTemplateTid;existingAssetCandidates=getCandidateAssetsForGroups(groups,parentNum,{allowAssigned});if(existingAssetSelectTitle)existingAssetSelectTitle.textContent=replacePlaceholderId?`Replace placeholder for ${parentNum}`:`Link existing asset for ${parentNum}`;if(existingAssetSearch)existingAssetSearch.value="";updateExistingItemFilter(existingAssetCandidates);if(existingAssetItemFilter)existingAssetItemFilter.value="all";renderExistingList();openModal(existingAssetSelectModal);}
function closeExistingAssetSelectModal(){closeModal(existingAssetSelectModal);existingAssetCandidates=[];existingAssetTargetParentNumber=null;existingAssetReplacementPlaceholderId=null;existingAssetSourceTemplateTid=null;}
function renderOrphanList(){
  orphanParentSelectList.innerHTML="";
  const q=(orphanParentSearch?.value||"").toLowerCase();
  const filtered=orphanParentCandidates.filter(candidate=>{
    if(!q) return true;
    if(candidate.type==="placeholder"){
      const ph=candidate.placeholder;
      return `${ph.itemNameCode} ${ph.parentAssetNumber}`.toLowerCase().includes(q);
    }
    const a=candidate.asset;
    return`${a.assetNumber} ${a.assetDesc1} ${a.assetDesc2} ${a.itemNameCodeDesc} ${a.elr}`.toLowerCase().includes(q);
  });
  if(!filtered.length){
    const p=document.createElement("p");
    p.className="modal-empty";
    p.textContent="No matching parents or placeholders.";
    orphanParentSelectList.appendChild(p);
    return;
  }

  const realAssets=filtered.filter(c=>c.type==="asset");
  const placeholders=filtered.filter(c=>c.type==="placeholder");

  function appendSectionLabel(text){
    const label=document.createElement("p");
    label.className="modal-section-label";
    label.textContent=text;
    orphanParentSelectList.appendChild(label);
  }

  if(realAssets.length){
    appendSectionLabel("Real assets");
    realAssets.forEach(candidate=>{
      orphanParentSelectList.appendChild(buildAssetOptionButton(candidate.asset,selected=>{
        if(orphanTargetAssetNumber) updateAssetParent(orphanTargetAssetNumber,selected.assetNumber);
        closeOrphanParentSelectModal();
      }));
    });
  }

  if(placeholders.length){
    appendSectionLabel("Placeholders");
    placeholders.forEach(candidate=>{
      orphanParentSelectList.appendChild(buildPlaceholderOptionButton(candidate.placeholder,selected=>{
        if(orphanTargetAssetNumber) assignAssetToPlaceholder(orphanTargetAssetNumber,selected.id);
        closeOrphanParentSelectModal();
      }));
    });
  }
}
function openOrphanParentSelectModal(num){
  orphanTargetAssetNumber=num;
  if(orphanParentSelectTitle)orphanParentSelectTitle.textContent=`Assign new parent for ${num}`;
  orphanParentCandidates=getReassignmentCandidates(num);
  if(orphanParentSearch)orphanParentSearch.value="";
  renderOrphanList();
  openModal(orphanParentSelectModal);
}
function closeOrphanParentSelectModal(){closeModal(orphanParentSelectModal);orphanParentCandidates=[];orphanTargetAssetNumber=null;}
const modalFocusReturnMap=new WeakMap();
function getFocusableElements(root){if(!root)return[];return Array.from(root.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(el=>!el.disabled&&el.offsetParent!==null);}
function openModal(el){
  if(!el)return;
  const opener=document.activeElement instanceof HTMLElement?document.activeElement:null;
  modalFocusReturnMap.set(el,opener);
  el.classList.remove("hidden");
  el.removeAttribute("inert");
  el.setAttribute("aria-hidden","false");
  const [firstFocusable]=getFocusableElements(el);
  if(firstFocusable)firstFocusable.focus();
}
function closeModal(el){
  if(!el)return;
  const active=document.activeElement;
  const containsActive=active instanceof HTMLElement&&el.contains(active);
  if(containsActive){
    const returnTarget=modalFocusReturnMap.get(el);
    if(returnTarget&&document.contains(returnTarget))returnTarget.focus();
    else if(document.body instanceof HTMLElement)document.body.focus();
    if(document.activeElement===active&&active instanceof HTMLElement)active.blur();
  }
  el.classList.add("hidden");
  el.setAttribute("inert","");
  el.setAttribute("aria-hidden","true");
}

// ── Reference trees ───────────────────────────────────────────────────
function getActiveReferenceTree(){if(!referenceTrees.length)return null;return referenceTrees.find(t=>t.id===referenceTreeSelect?.value)||referenceTrees[0]||null;}
function collectReferenceNameCodes(node){const codes=[];if(!node)return codes;if(node.nameCodes?.length)codes.push(...node.nameCodes.map(c=>c.toUpperCase()));(node.children||[]).forEach(ch=>codes.push(...collectReferenceNameCodes(ch)));return Array.from(new Set(codes));}
function collectIgnoredNameCodes(node){const codes=[];if(!node)return codes;if(node.ignoreFromErrors&&node.nameCodes?.length)codes.push(...node.nameCodes.map(c=>c.toUpperCase()));(node.children||[]).forEach(ch=>codes.push(...collectIgnoredNameCodes(ch)));return new Set(codes);}
function buildReferenceParentMap(node,parentCodes=[]){const map=new Map();if(!node)return map;const cur=(node.nameCodes||[]).map(c=>c.toUpperCase());cur.forEach(c=>{if(!map.has(c))map.set(c,new Set());parentCodes.forEach(p=>map.get(c).add(p));});(node.children||[]).forEach(ch=>{buildReferenceParentMap(ch,cur).forEach((v,k)=>{if(!map.has(k))map.set(k,new Set());v.forEach(i=>map.get(k).add(i));});});return map;}
function buildReferenceChildMap(node){const map=new Map();if(!node)return map;const cur=(node.nameCodes||[]).map(c=>c.toUpperCase());const direct=[];(node.children||[]).forEach(ch=>{if(ch.nameCodes?.length)direct.push({codes:new Set(ch.nameCodes.map(c=>c.toUpperCase())),optional:Boolean(ch.optional)});buildReferenceChildMap(ch).forEach((v,k)=>{if(!map.has(k))map.set(k,[]);map.get(k).push(...v);});});if(cur.length&&direct.length)cur.forEach(c=>{if(!map.has(c))map.set(c,[]);map.get(c).push(...direct);});return map;}
function buildReferenceAssociatedMap(assocs){const map=new Map();(assocs||[]).forEach(link=>{const from=(link.fromCodes||[]).map(c=>c.toUpperCase());const to=(link.toCodes||[]).map(c=>c.toUpperCase());const bi=link.bidirectional!==false;from.forEach(f=>{if(!map.has(f))map.set(f,new Set());to.forEach(t=>map.get(f).add(t));});if(bi)to.forEach(t=>{if(!map.has(t))map.set(t,new Set());from.forEach(f=>map.get(t).add(f));});});return map;}
function captureInitialMismatches(){initialMismatchAssets=new Set();assets.forEach(a=>{if(isReferenceMismatch(a,originalParentMap.get(a.assetNumber)??null))initialMismatchAssets.add(a.assetNumber);});}
function updateReferenceTree(tree){if(!tree?.root)return;referenceNameCodes=collectReferenceNameCodes(tree.root);referenceParentMap=buildReferenceParentMap(tree.root);referenceIgnoredCodes=collectIgnoredNameCodes(tree.root);referenceChildMap=buildReferenceChildMap(tree.root);referenceAssociatedMap=buildReferenceAssociatedMap(tree.associations||[]);captureInitialMismatches();buildIssueList();renderAssetList();renderTriageView();}
function loadReferenceTrees(){fetch("reference-trees.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error();return r.json();}).then(data=>{referenceTrees=Array.isArray(data?.trees)?data.trees:[];referenceTreeSelect.innerHTML="";referenceTrees.forEach(t=>{const o=document.createElement("option");o.value=t.id;o.textContent=t.label;referenceTreeSelect.appendChild(o);});if(referenceTrees.length){referenceTreeSelect.value=referenceTrees[0].id;updateReferenceTree(referenceTrees[0]);}}).catch(()=>{});}

// ── Export ────────────────────────────────────────────────────────────
function buildExportRows(){
  const rows=[EXPORT_HEADERS];
  const parentIdx=EXPORT_HEADERS.indexOf("ParentEquipRef");
  const itemIdx=EXPORT_HEADERS.indexOf("ItemNameCode");
  const noteIdx=EXPORT_HEADERS.indexOf("Colloquial_1");
  Array.from(changedAssets).sort().forEach(num=>{
    const a=assetMap.get(num);
    if(!a) return;
    const row=Array(EXPORT_HEADERS.length).fill("");
    row[0]=a.assetNumber;
    if(a.parentAssetNumber?.startsWith("__ph__")){
      const placeholderId=a.parentAssetNumber.slice(6);
      const placeholder=placeholderAssets.find(ph=>ph.id===placeholderId);
      row[parentIdx]="";
      row[itemIdx]=placeholder?.itemNameCode||"";
      if(noteIdx!==-1) row[noteIdx]=`Assigned to placeholder ${placeholder?.itemNameCode||placeholderId}; real parent required.`;
    } else {
      row[parentIdx]=a.parentAssetNumber||"";
    }
    rows.push(row);
  });
  placeholderAssets.slice().sort((a,b)=>{
    const pc=a.parentAssetNumber.localeCompare(b.parentAssetNumber);
    return pc||a.itemNameCode.localeCompare(b.itemNameCode);
  }).forEach(ph=>{
    const row=Array(EXPORT_HEADERS.length).fill("");
    row[itemIdx]=ph.itemNameCode;
    rows.push(row);
  });
  return rows;
}
function buildPlaceholderAssignmentRows() {
  const headers = ["Placeholder ID", "Placeholder Type", "Anchor Parent", "Assigned Asset Numbers"];
  const rows = [headers];
  placeholderAssets.forEach(ph => {
    const children = placeholderChildrenMap.get(ph.id) || [];
    rows.push([
      ph.id,
      ph.itemNameCode,
      ph.parentAssetNumber,
      children.join(", ") || "(none)"
    ]);
  });
  return rows;
}
function exportChanges(){
  if(changedAssets.size===0&&placeholderAssets.length===0)return;
  const ws=XLSX.utils.aoa_to_sheet(buildExportRows());
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"ParentChanges");
  const ws2=XLSX.utils.aoa_to_sheet(buildPlaceholderAssignmentRows());
  XLSX.utils.book_append_sheet(wb,ws2,"PlaceholderAssignments");
  XLSX.writeFile(wb,"asset-parent-changes.xlsx");
}

// ── File handling ─────────────────────────────────────────────────────
function handleFile(file){const reader=new FileReader();reader.onload=e=>{const data=new Uint8Array(e.target.result);const wb=XLSX.read(data,{type:"array"});const sheet=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:""});if(rows.length<2){renderTriageView();return;}const headerIdx=findHeaderRow(rows);if(headerIdx===-1){triageTitle.textContent="Could not find header row";renderTriageView();return;}try{buildMaps(rows.slice(headerIdx+1),rows[headerIdx]);}catch(err){triageTitle.textContent=err.message;renderTriageView();return;}populateFilters();captureInitialMismatches();buildIssueList();updateChangesTray();selectedAssetNumber=null;renderAssetList();renderTriageView();};reader.readAsArrayBuffer(file);}

// ── Event wiring ──────────────────────────────────────────────────────
fileInput.addEventListener("change",e=>{const f=e.target.files?.[0];if(f)handleFile(f);});
[filterInput,groupFilter,itemNameFilter,elrFilter,assetClassFilter,statusFilter].forEach(el=>el.addEventListener(el.tagName==="SELECT"?"change":"input",()=>renderAssetList()));
hideObsoleteToggle.addEventListener("change",()=>renderAssetList());
errorOnlyToggle.addEventListener("change",()=>renderAssetList());
backToTriage.addEventListener("click",renderTriageView);
prevIssue.addEventListener("click",()=>{if(issueIndex>0){issueIndex--;selectAsset(issueList[issueIndex]);}});
nextIssue.addEventListener("click",()=>{if(issueIndex<issueList.length-1){issueIndex++;selectAsset(issueList[issueIndex]);}});
referenceTreeSelect.addEventListener("change",e=>{const t=referenceTrees.find(r=>r.id===e.target.value);if(t)updateReferenceTree(t);});
viewModeToggle.querySelectorAll(".mode-btn").forEach(btn=>{btn.addEventListener("click",()=>{viewMode=btn.dataset.mode;viewModeToggle.querySelectorAll(".mode-btn").forEach(b=>b.classList.toggle("active",b===btn));hasFit=false;renderCanvas();});});
assocToggle.addEventListener("click",()=>{showAssoc=!showAssoc;assocToggle.classList.toggle("active",showAssoc);hasFit=false;renderCanvas();});
exportButton.addEventListener("click",exportChanges);
parentSelectCancel.addEventListener("click",()=>closeModal(parentSelectModal));
parentSelectModal.addEventListener("click",e=>{if(e.target===parentSelectModal||e.target.classList.contains("modal-backdrop"))closeModal(parentSelectModal);});
placeholderSelectCancel.addEventListener("click",()=>closeModal(placeholderSelectModal));
placeholderSelectModal.addEventListener("click",e=>{if(e.target===placeholderSelectModal||e.target.classList.contains("modal-backdrop"))closeModal(placeholderSelectModal);});
existingAssetSelectCancel.addEventListener("click",closeExistingAssetSelectModal);
existingAssetSelectModal.addEventListener("click",e=>{if(e.target===existingAssetSelectModal||e.target.classList.contains("modal-backdrop"))closeExistingAssetSelectModal();});
existingAssetSearch.addEventListener("input",renderExistingList);
existingAssetItemFilter.addEventListener("change",renderExistingList);
orphanParentSelectCancel.addEventListener("click",closeOrphanParentSelectModal);
orphanParentSelectModal.addEventListener("click",e=>{if(e.target===orphanParentSelectModal||e.target.classList.contains("modal-backdrop"))closeOrphanParentSelectModal();});
orphanParentSearch.addEventListener("input",renderOrphanList);
document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;dismissSlotBar();[parentSelectModal,placeholderSelectModal,existingAssetSelectModal,orphanParentSelectModal].forEach(m=>{if(m&&!m.classList.contains("hidden"))closeModal(m);});});

// ── Init ──────────────────────────────────────────────────────────────
loadReferenceTrees();
renderTriageView();

const fileInput = document.getElementById("fileInput");
const filterInput = document.getElementById("filterInput");
const groupFilter = document.getElementById("groupFilter");
const itemNameFilter = document.getElementById("itemNameFilter");
const elrFilter = document.getElementById("elrFilter");
const assetClassFilter = document.getElementById("assetClassFilter");
const statusFilter = document.getElementById("statusFilter");
const hideObsoleteToggle = document.getElementById("hideObsoleteToggle");
const errorOnlyToggle = document.getElementById("errorOnlyToggle");
const assetList = document.getElementById("assetList");
const listStatus = document.getElementById("listStatus");
const assetDetailsEmpty = document.getElementById("assetDetailsEmpty");
const assetDetailsList = document.getElementById("assetDetailsList");
const treeStatus = document.getElementById("treeStatus");
const treeContainer = document.getElementById("treeContainer");
const treeWarningsCount = document.getElementById("treeWarningsCount");
const treeWarningsStatus = document.getElementById("treeWarningsStatus");
const treeWarningsList = document.getElementById("treeWarningsList");
const referenceTreeSelect = document.getElementById("referenceTreeSelect");
const referenceTreeStatus = document.getElementById("referenceTreeStatus");
const referenceTree = document.getElementById("referenceTree");
const treeLevelsInput = document.getElementById("treeLevelsInput");
const treeLevelsWrapper = document.getElementById("treeLevelsWrapper");
const showAssociatedToggle = document.getElementById("showAssociatedToggle");
const warningsOnlyToggle = document.getElementById("warningsOnlyToggle");
const viewModeToggle = document.getElementById("viewModeToggle");
const treeSearchInput = document.getElementById("treeSearchInput");
const assetSearchOptions = document.getElementById("assetSearchOptions");
const fitToViewButton = document.getElementById("fitToViewButton");
const centerSelectionButton = document.getElementById("centerSelectionButton");
const historyBackButton = document.getElementById("historyBackButton");
const historyForwardButton = document.getElementById("historyForwardButton");
const hierarchySummary = document.getElementById("hierarchySummary");
const associationsPanel = document.getElementById("associationsPanel");
const associationsSearch = document.getElementById("associationsSearch");
const associationTypeChips = document.getElementById("associationTypeChips");
const treeBreadcrumbs = document.getElementById("treeBreadcrumbs");
const exportButton = document.getElementById("exportButton");
const parentSelectModal = document.getElementById("parentSelectModal");
const parentSelectList = document.getElementById("parentSelectList");
const parentSelectTitle = document.getElementById("parentSelectTitle");
const parentSelectCancel = document.getElementById("parentSelectCancel");
const placeholderSelectModal = document.getElementById("placeholderSelectModal");
const placeholderSelectList = document.getElementById("placeholderSelectList");
const placeholderSelectTitle = document.getElementById("placeholderSelectTitle");
const placeholderSelectCancel = document.getElementById("placeholderSelectCancel");
const existingAssetSelectModal = document.getElementById("existingAssetSelectModal");
const existingAssetSelectList = document.getElementById("existingAssetSelectList");
const existingAssetSelectTitle = document.getElementById("existingAssetSelectTitle");
const existingAssetSelectCancel = document.getElementById("existingAssetSelectCancel");
const existingAssetSearch = document.getElementById("existingAssetSearch");
const existingAssetItemFilter = document.getElementById("existingAssetItemFilter");
const orphanParentSelectModal = document.getElementById("orphanParentSelectModal");
const orphanParentSelectList = document.getElementById("orphanParentSelectList");
const orphanParentSelectTitle = document.getElementById("orphanParentSelectTitle");
const orphanParentSelectCancel = document.getElementById("orphanParentSelectCancel");
const orphanParentSearch = document.getElementById("orphanParentSearch");

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
let viewMode = "hierarchy";
let treeLevelsAbove = 1;
let showAssociatedEquipment = false;
let warningsOnlyMode = false;
let associationTypeFilter = new Set();
let pinnedAssociatedAssets = new Set();
let selectionHistory = [];
let selectionHistoryIndex = -1;
let expandedChildrenParents = new Set();
let expandedSiblingParents = new Set();
let existingAssetCandidates = [];
let existingAssetTargetParentNumber = null;
let orphanParentCandidates = [];
let orphanTargetAssetNumber = null;

let referenceTrees = [];
let referenceNameCodes = [];
let referenceParentMap = new Map();
let referenceIgnoredCodes = new Set();
let referenceChildMap = new Map();
let referenceAssociatedMap = new Map();

const COLUMN_ALIASES = {
  assetNumber: ["Asset Number", "Asset No", "Asset #"],
  parentAssetNumber: ["Parent Asset Number", "Parent Asset No", "Parent Asset #"],
  assetStatus: ["Asset Status", "Status"],
  assetDesc1: ["Asset Desc 1", "Asset Description 1", "Asset Desc"],
  assetDesc2: ["Asset Desc 2", "Asset Description 2"],
  elr: ["ELR", "ELR Code"],
  assetClass: [
    "Asset Class Code & Desc",
    "Asset Class",
    "Asset Class Code",
    "Asset Class Description",
  ],
  egiCodeDesc: ["EGI Code & Desc", "EGI Code and Desc", "EGI Code Desc", "EGI Code"],
  structuredPlantNumber: [
    "Structured Plant Number",
    "Structured Plant No",
    "Structured Plant #",
  ],
  trackId: ["Track ID", "Track Id", "TrackID"],
  assetStartMileage: ["Asset Start Mileage", "Start Mileage", "Asset Start Mile"],
  assetEndMileage: ["Asset End Mileage", "End Mileage", "Asset End Mile"],
  itemNameCodeDesc: [
    "Item Name Code & Desc",
    "Item Name Code and Desc",
    "Item Name Code Desc",
  ],
};

const ASSET_DETAIL_FIELDS = [
  { key: "assetNumber", label: "Asset Number" },
  { key: "assetClass", label: "Asset Class Code & Desc" },
  { key: "itemNameCodeDesc", label: "Item Name Code & Desc" },
  { key: "egiCodeDesc", label: "EGI Code & Desc" },
  { key: "assetDesc1", label: "Asset Desc 1" },
  { key: "assetDesc2", label: "Asset Desc 2" },
  { key: "structuredPlantNumber", label: "Structured Plant Number" },
  { key: "elr", label: "ELR" },
  { key: "trackId", label: "Track ID" },
  { key: "assetStartMileage", label: "Asset Start Mileage" },
  { key: "assetEndMileage", label: "Asset End Mileage" },
  { key: "assetStatus", label: "Asset Status" },
];

const EXPORT_HEADERS = [
  "EquipNo",
  "EquipGrpId",
  "EquipClass",
  "PlantNo",
  "PlantCode0",
  "PlantCode1",
  "PlantCode2",
  "PlantCode3",
  "PlantCode4",
  "PlantCode5",
  "ParentEquipRef",
  "ItemNameCode",
  "EquipNoD1",
  "EquipNoD2",
  "EquipStatus",
  "Active Flag",
  "Equipment Type (0)",
  "Region (1)",
  "Maintenance Responsibility (2)",
  "Sub Discipline (3)",
  "Disclipline (4)",
  "Geographical Delivery Unit (5)",
  "Route (6)",
  "Position (7)",
  "Special Equipment Status (8)",
  "Signal Sighting Cable Ride (9)",
  "Maintaining Delivery Unit (10)",
  "Asset Out Of Use Status (11)",
  "Maintenance Engineer (12)",
  "Engineering Support Group (13)",
  "External Ownership (14)",
  "Section Manager (15)",
  "ConAstSegSt",
  "ConAstSegEn",
  "SegmentUom",
  "CostSegLgth",
  "InputBy",
  "OperatorId",
  "DstrctCode",
  "CostingFlag",
  "EquipLocation",
  "Colloquial_1",
  "Colloquial_2",
  "Colloquial_3",
  "Colloquial_4",
  "Colloquial_5",
  "Colloquial_6",
  "RARUNID",
  "RARDECID",
  "RAILID",
  "WO_Grouping_Eqp_ID",
  "Attrib_Name1",
  "Attrib_Value1",
  "Attrib_Name2",
  "Attrib_Value2",
  "Attrib_Name3",
  "Attrib_Value3",
  "Attrib_Name4",
  "Attrib_Value4",
  "Attrib_Name5",
  "Attrib_Value5",
  "Attrib_Name6",
  "Attrib_Value6",
  "Attrib_Name7",
  "Attrib_Value7",
  "Attrib_Name8",
  "Attrib_Value8",
  "ADM_BatchRef",
  "ADM_BatchRef_Seq",
  "ASSETLAT",
  "ASSETLONG",
  "ASSETELAT",
  "ASSETELONG",
  "Date of Installation",
  "Date of Retirement",
  "Year of Installation",
  "Year of Retirement",
  "Result",
  "Date / Time Stamp",
];

function normalizeHeader(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findColumn(headers, candidates) {
  const normalizedHeaders = headers.map((header) => normalizeHeader(header));
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeHeader(candidate);
    const idx = normalizedHeaders.indexOf(normalizedCandidate);
    if (idx !== -1) {
      return idx;
    }
    const partialIdx = normalizedHeaders.findIndex((header) =>
      header.includes(normalizedCandidate)
    );
    if (partialIdx !== -1) {
      return partialIdx;
    }
  }
  return -1;
}

function findHeaderRow(rows, maxScan = 20) {
  const scanLimit = Math.min(rows.length, maxScan);
  for (let i = 0; i < scanLimit; i += 1) {
    const headers = rows[i] || [];
    const assetIdx = findColumn(headers, COLUMN_ALIASES.assetNumber);
    const parentIdx = findColumn(headers, COLUMN_ALIASES.parentAssetNumber);
    if (assetIdx !== -1 && parentIdx !== -1) {
      return i;
    }
  }
  return -1;
}

function buildMaps(rows, headers) {
  assetMap = new Map();
  childrenMap = new Map();
  originalParentMap = new Map();
  changedAssets = new Set();
  placeholderAssets = [];
  placeholderMap = new Map();
  placeholderCounter = 0;

  const assetIdx = findColumn(headers, COLUMN_ALIASES.assetNumber);
  const parentIdx = findColumn(headers, COLUMN_ALIASES.parentAssetNumber);
  const statusIdx = findColumn(headers, COLUMN_ALIASES.assetStatus);
  const desc1Idx = findColumn(headers, COLUMN_ALIASES.assetDesc1);
  const desc2Idx = findColumn(headers, COLUMN_ALIASES.assetDesc2);
  const elrIdx = findColumn(headers, COLUMN_ALIASES.elr);
  const assetClassIdx = findColumn(headers, COLUMN_ALIASES.assetClass);
  const egiCodeDescIdx = findColumn(headers, COLUMN_ALIASES.egiCodeDesc);
  const structuredPlantNumberIdx = findColumn(headers, COLUMN_ALIASES.structuredPlantNumber);
  const trackIdIdx = findColumn(headers, COLUMN_ALIASES.trackId);
  const assetStartMileageIdx = findColumn(headers, COLUMN_ALIASES.assetStartMileage);
  const assetEndMileageIdx = findColumn(headers, COLUMN_ALIASES.assetEndMileage);
  const itemNameIdx = findColumn(headers, COLUMN_ALIASES.itemNameCodeDesc);

  if (assetIdx === -1 || parentIdx === -1) {
    throw new Error(
      "Missing required columns. Ensure the file has Asset Number and Parent Asset Number columns."
    );
  }

  assets = rows
    .map((row) => {
      const assetNumber = row[assetIdx]?.toString().trim();
      if (!assetNumber) {
        return null;
      }

      const parentAssetNumber = row[parentIdx]?.toString().trim() || null;
      const assetStatus = statusIdx !== -1 ? row[statusIdx]?.toString().trim() : "";
      const assetDesc1 = desc1Idx !== -1 ? row[desc1Idx]?.toString().trim() : "";
      const assetDesc2 = desc2Idx !== -1 ? row[desc2Idx]?.toString().trim() : "";
      const elr = elrIdx !== -1 ? row[elrIdx]?.toString().trim() : "";
      const assetClass = assetClassIdx !== -1 ? row[assetClassIdx]?.toString().trim() : "";
      const egiCodeDesc =
        egiCodeDescIdx !== -1 ? row[egiCodeDescIdx]?.toString().trim() : "";
      const structuredPlantNumber =
        structuredPlantNumberIdx !== -1
          ? row[structuredPlantNumberIdx]?.toString().trim()
          : "";
      const trackId = trackIdIdx !== -1 ? row[trackIdIdx]?.toString().trim() : "";
      const assetStartMileage =
        assetStartMileageIdx !== -1 ? row[assetStartMileageIdx]?.toString().trim() : "";
      const assetEndMileage =
        assetEndMileageIdx !== -1 ? row[assetEndMileageIdx]?.toString().trim() : "";
      const itemNameCodeDesc =
        itemNameIdx !== -1 ? row[itemNameIdx]?.toString().trim() : "";

      return {
        assetNumber,
        parentAssetNumber,
        assetStatus,
        assetDesc1,
        assetDesc2,
        elr,
        assetClass,
        egiCodeDesc,
        structuredPlantNumber,
        trackId,
        assetStartMileage,
        assetEndMileage,
        itemNameCodeDesc,
      };
    })
    .filter(Boolean);

  assets.forEach((asset) => {
    assetMap.set(asset.assetNumber, asset);
    originalParentMap.set(asset.assetNumber, asset.parentAssetNumber || null);
  });

  assets.forEach((asset) => {
    if (!asset.parentAssetNumber) {
      return;
    }
    if (!childrenMap.has(asset.parentAssetNumber)) {
      childrenMap.set(asset.parentAssetNumber, []);
    }
    childrenMap.get(asset.parentAssetNumber).push(asset.assetNumber);
  });
}

function populateSelectFilter(select, values, options) {
  const uniqueValues = new Set();
  let hasEmpty = false;

  values.forEach((value) => {
    const trimmed = value?.trim() || "";
    if (trimmed) {
      uniqueValues.add(trimmed);
    } else {
      hasEmpty = true;
    }
  });

  select.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = options.allLabel;
  select.appendChild(allOption);

  if (hasEmpty) {
    const emptyOption = document.createElement("option");
    emptyOption.value = "__empty__";
    emptyOption.textContent = options.emptyLabel;
    select.appendChild(emptyOption);
  }

  Array.from(uniqueValues)
    .sort((a, b) => a.localeCompare(b))
    .forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
}

function populateFilters() {
  populateSelectFilter(
    itemNameFilter,
    assets.map((asset) => asset.itemNameCodeDesc),
    {
      allLabel: "All Item Name Code & Desc",
      emptyLabel: "No Item Name Code & Desc",
    }
  );
  populateSelectFilter(
    elrFilter,
    assets.map((asset) => asset.elr),
    {
      allLabel: "All ELRs",
      emptyLabel: "No ELR",
    }
  );
  populateSelectFilter(
    assetClassFilter,
    assets.map((asset) => asset.assetClass),
    {
      allLabel: "All Asset Classes",
      emptyLabel: "No Asset Class",
    }
  );
  populateSelectFilter(
    statusFilter,
    assets.map((asset) => asset.assetStatus),
    {
      allLabel: "All Statuses",
      emptyLabel: "No Status",
    }
  );
}

function renderAssetList() {
  const query = filterInput.value.trim().toLowerCase();
  const selectedItemName = itemNameFilter.value;
  const selectedGroup = groupFilter.value;
  const selectedElr = elrFilter.value;
  const selectedAssetClass = assetClassFilter.value;
  const selectedStatus = statusFilter.value;
  const hideObsolete = hideObsoleteToggle.checked;
  const errorsOnly = errorOnlyToggle.checked;
  assetList.innerHTML = "";

  const filtered = assets.filter((asset) => {
    const label = `${asset.assetNumber} ${asset.assetDesc1} ${asset.assetDesc2} ${asset.itemNameCodeDesc} ${asset.elr} ${asset.assetClass} ${asset.assetStatus}`.toLowerCase();
    const matchesQuery = label.includes(query);
    const itemValue = asset.itemNameCodeDesc?.trim() || "";
    const matchesGroup = matchesReferenceGroup(asset, selectedGroup);
    const isObsolete = isObsoleteAsset(asset);
    const matchesObsolete = hideObsolete ? !isObsolete : true;
    const matchesErrors = errorsOnly ? hasAssetError(asset) : true;

    const elrValue = asset.elr?.trim() || "";
    const classValue = asset.assetClass?.trim() || "";
    const statusValue = asset.assetStatus?.trim() || "";

    const matchesItemName =
      selectedItemName === "all"
        ? true
        : selectedItemName === "__empty__"
          ? !itemValue
          : itemValue === selectedItemName;

    const matchesElr =
      selectedElr === "all"
        ? true
        : selectedElr === "__empty__"
          ? !elrValue
          : elrValue === selectedElr;

    const matchesAssetClass =
      selectedAssetClass === "all"
        ? true
        : selectedAssetClass === "__empty__"
          ? !classValue
          : classValue === selectedAssetClass;

    const matchesStatus =
      selectedStatus === "all"
        ? true
        : selectedStatus === "__empty__"
          ? !statusValue
          : statusValue === selectedStatus;

    return (
      matchesQuery &&
      matchesGroup &&
      matchesItemName &&
      matchesElr &&
      matchesAssetClass &&
      matchesStatus &&
      matchesObsolete &&
      matchesErrors
    );
  });

  filtered
    .sort((a, b) => a.assetNumber.localeCompare(b.assetNumber))
    .forEach((asset) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "asset-button";
      if (asset.assetNumber === selectedAssetNumber) {
        button.classList.add("selected");
      }
      const description = asset.assetDesc1 || asset.assetDesc2 || "";
      const mismatch = isReferenceMismatch(asset);
      if (mismatch) {
        const alert = document.createElement("span");
        alert.className = "asset-alert";
        alert.textContent = "!";
        alert.title = "Does not follow the reference hierarchy";
        button.appendChild(alert);
      }
      const missingChildren = getMissingReferenceChildren(asset);
      if (missingChildren.length) {
        const warning = document.createElement("span");
        warning.className = "asset-warning";
        warning.textContent = "!";
        warning.title = buildMissingChildrenTitle(missingChildren);
        button.appendChild(warning);
      }
      if (isOrphanedAsset(asset)) {
        const orphan = document.createElement("span");
        orphan.className = "asset-orphan";
        orphan.textContent = "!";
        orphan.title = "Orphaned: parent asset is obsolete";
        button.appendChild(orphan);
      }
      if (shouldShowTick(asset)) {
        const tick = document.createElement("span");
        tick.className = "asset-tick";
        tick.textContent = "✓";
        tick.title = "Correctly linked to reference parent";
        button.appendChild(tick);
      }
      const label = document.createElement("span");
      label.className = "asset-label";
      label.textContent = description
        ? `${asset.assetNumber} • ${description}`
        : asset.assetNumber;
      button.appendChild(label);
      button.addEventListener("click", () => {
        selectAsset(asset.assetNumber);
      });
      button.addEventListener("dragstart", (event) => {
        event.dataTransfer?.setData("text/plain", asset.assetNumber);
        event.dataTransfer?.setData("application/x-asset-number", asset.assetNumber);
        button.classList.add("dragging");
      });
      button.addEventListener("dragend", () => {
        button.classList.remove("dragging");
      });
      button.draggable = true;
      li.appendChild(button);
      assetList.appendChild(li);
    });

  listStatus.textContent = filtered.length
    ? `${filtered.length} assets loaded.`
    : "No assets match this filter.";
}

function formatDetailValue(value) {
  const trimmed = String(value || "").trim();
  return trimmed ? trimmed : "—";
}

function isObsoleteAsset(asset) {
  return asset?.assetStatus?.startsWith("OR");
}

function isOrphanedAsset(asset) {
  if (!asset?.parentAssetNumber) {
    return false;
  }
  const parentAsset = assetMap.get(asset.parentAssetNumber);
  if (!parentAsset) {
    return false;
  }
  return isObsoleteAsset(parentAsset);
}

function updateAssetDetails() {
  if (!assetDetailsList || !assetDetailsEmpty) {
    return;
  }

  if (!selectedAssetNumber || !assetMap.has(selectedAssetNumber)) {
    assetDetailsList.innerHTML = "";
    assetDetailsEmpty.textContent = assets.length
      ? "Select an asset to see its details."
      : "Upload a file to load asset details.";
    assetDetailsEmpty.style.display = "block";
    return;
  }

  const asset = assetMap.get(selectedAssetNumber);
  assetDetailsList.innerHTML = "";
  ASSET_DETAIL_FIELDS.forEach((field) => {
    const term = document.createElement("dt");
    term.textContent = field.label;
    const description = document.createElement("dd");
    description.textContent = formatDetailValue(asset[field.key]);
    assetDetailsList.appendChild(term);
    assetDetailsList.appendChild(description);
  });
  assetDetailsEmpty.textContent = "";
  assetDetailsEmpty.style.display = "none";
}

function buildSubtree(assetNumber, visited = new Set(), childFilter = null) {
  if (visited.has(assetNumber)) {
    return null;
  }
  visited.add(assetNumber);

  const asset = assetMap.get(assetNumber);
  if (!asset) {
    return {
      assetNumber,
      missing: true,
      children: [],
    };
  }

  const children = (childrenMap.get(assetNumber) || [])
    .filter((childNumber) => {
      if (!childFilter) {
        return true;
      }
      const childAsset = assetMap.get(childNumber);
      return childAsset ? childFilter(childAsset) : true;
    })
    .map((childNumber) => buildSubtree(childNumber, visited, childFilter))
    .filter(Boolean);
  const placeholderNodes = (placeholderMap.get(assetNumber) || [])
    .filter((placeholder) => {
      if (!childFilter) {
        return true;
      }
      return isNameCodeInReferenceTree(placeholder.itemNameCode);
    })
    .map((placeholder) => ({
      placeholder: true,
      placeholderId: placeholder.id,
      parentAssetNumber: placeholder.parentAssetNumber,
      itemNameCode: placeholder.itemNameCode,
      children: [],
    }));

  return {
    assetNumber: asset.assetNumber,
    assetStatus: asset.assetStatus,
    assetDesc1: asset.assetDesc1,
    assetDesc2: asset.assetDesc2,
    itemNameCodeDesc: asset.itemNameCodeDesc,
    missing: false,
    children: [...children, ...placeholderNodes],
  };
}

function buildAssetNode(assetNumber) {
  const asset = assetMap.get(assetNumber);
  if (!asset) {
    return {
      assetNumber,
      missing: true,
      children: [],
    };
  }
  return {
    assetNumber: asset.assetNumber,
    assetStatus: asset.assetStatus,
    assetDesc1: asset.assetDesc1,
    assetDesc2: asset.assetDesc2,
    itemNameCodeDesc: asset.itemNameCodeDesc,
    missing: false,
    children: [],
  };
}

function buildAncestorChain(assetNumber) {
  const asset = assetMap.get(assetNumber);
  if (!asset) {
    return [];
  }

  const chain = [];
  let current = asset;
  chain.unshift(buildAssetNode(current.assetNumber));

  while (current.parentAssetNumber) {
    const parent = assetMap.get(current.parentAssetNumber);
    if (!parent) {
      chain.unshift({
        assetNumber: current.parentAssetNumber,
        missing: true,
        children: [],
      });
      break;
    }
    current = parent;
    chain.unshift(buildAssetNode(current.assetNumber));
  }

  return chain;
}

function linkAncestorChain(chain, leaf) {
  if (!chain.length) {
    return leaf;
  }

  for (let i = 0; i < chain.length - 1; i += 1) {
    chain[i].children = [chain[i + 1]];
  }
  const last = chain[chain.length - 1];
  last.children = leaf ? [leaf] : last.children;
  return chain[0];
}

function buildFamilyTree(assetNumber, childFilter = null) {
  const asset = assetMap.get(assetNumber);
  if (!asset) {
    return null;
  }

  let current = asset;
  let lastKnown = asset;
  while (current?.parentAssetNumber) {
    const parentAsset = assetMap.get(current.parentAssetNumber);
    if (!parentAsset) {
      break;
    }
    lastKnown = parentAsset;
    current = parentAsset;
  }

  const rootTree = buildSubtree(lastKnown.assetNumber, new Set(), childFilter);
  if (!rootTree) {
    return null;
  }

  if (current?.parentAssetNumber && !assetMap.get(current.parentAssetNumber)) {
    return {
      assetNumber: current.parentAssetNumber,
      missing: true,
      children: [rootTree],
    };
  }

  return rootTree;
}

function buildTreeForView(assetNumber) {
  if (!assetNumber) {
    return null;
  }

  // Declutter rule: always render selected ancestor chain + selected children (+depth).
  const chain = buildAncestorChain(assetNumber);
  const levels = Math.max(1, Math.min(10, treeLevelsAbove || 1));
  const childFilter = viewMode === "swimlane" ? isAssetInReferenceTree : null;
  const subtree = buildSubtree(assetNumber, new Set(), childFilter);
  const selectedNode = pruneChildrenDepth(subtree, levels);

  if (viewMode === "focus") {
    return linkAncestorChain(chain.slice(0, -1), selectedNode);
  }

  if (viewMode === "swimlane") {
    return linkAncestorChain(chain.slice(0, -1), selectedNode);
  }

  return linkAncestorChain(chain.slice(0, -1), selectedNode);
}

function pruneChildrenDepth(node, depth) {
  if (!node) {
    return null;
  }
  if (depth <= 0 || !node.children?.length) {
    return { ...node, children: [] };
  }
  return {
    ...node,
    children: node.children.map((child) => pruneChildrenDepth(child, depth - 1)),
  };
}

function createNodeCard(node) {
  const card = document.createElement("div");
  card.className = "node-card";
  if (node.assetNumber) {
    card.dataset.parentNumber = node.assetNumber;
  }

  if (node.placeholder) {
    card.classList.add("placeholder");
    const title = document.createElement("span");
    title.textContent = "Placeholder asset";
    card.appendChild(title);
    if (node.itemNameCode) {
      const small = document.createElement("small");
      small.textContent = `Item Name Code: ${node.itemNameCode}`;
      card.appendChild(small);
    }
    return card;
  }

  if (node.missing) {
    card.classList.add("missing");
    card.textContent = `Asset not in download (${node.assetNumber || ""})`;
    return card;
  }

  if (node.assetNumber === selectedAssetNumber) {
    card.classList.add("selected");
  }

  if (isObsoleteAsset(node)) {
    card.classList.add("obsolete");
  }

  const assetRecord = assetMap.get(node.assetNumber);
  const isOrphaned = assetRecord && isOrphanedAsset(assetRecord);
  if (isOrphaned) {
    card.classList.add("orphaned");
    const orphanBadge = document.createElement("span");
    orphanBadge.className = "node-orphan";
    orphanBadge.textContent = "!";
    orphanBadge.title = "Orphaned: parent asset is obsolete";
    card.appendChild(orphanBadge);
  }
  if (assetRecord && isReferenceMismatch(assetRecord)) {
    const alert = document.createElement("span");
    alert.className = "node-alert";
    alert.textContent = "!";
    alert.title = "Does not follow the reference hierarchy";
    card.appendChild(alert);
  }
  if (assetRecord) {
    const missingChildren = getMissingReferenceChildren(assetRecord);
    if (missingChildren.length) {
      const warning = document.createElement("span");
      warning.className = "node-warning";
      warning.textContent = "!";
      warning.title = buildMissingChildrenTitle(missingChildren);
      card.appendChild(warning);
    }
    if (shouldShowTick(assetRecord)) {
      const tick = document.createElement("span");
      tick.className = "node-tick";
      tick.textContent = "✓";
      tick.title = "Correctly linked to reference parent";
      card.appendChild(tick);
    }
    const missingGroups = getMissingReferenceChildGroups(assetRecord);
    if (missingGroups.length) {
      const unassignedCandidates = getUnassignedAssetsForGroups(
        missingGroups,
        node.assetNumber
      );
      if (unassignedCandidates.length) {
        const linkExistingButton = document.createElement("button");
        linkExistingButton.type = "button";
        linkExistingButton.className = "node-existing-add";
        linkExistingButton.textContent = "🔗";
        linkExistingButton.title = "Link an existing unassigned asset";
        linkExistingButton.setAttribute(
          "aria-label",
          "Link an existing unassigned asset"
        );
        linkExistingButton.addEventListener("click", (event) => {
          event.stopPropagation();
          openExistingAssetSelectModal(node.assetNumber, missingGroups);
        });
        card.appendChild(linkExistingButton);
      }
      const addPlaceholderButton = document.createElement("button");
      addPlaceholderButton.type = "button";
      addPlaceholderButton.className = "node-placeholder-add";
      addPlaceholderButton.textContent = "+";
      addPlaceholderButton.title = "Add placeholder child asset";
      addPlaceholderButton.setAttribute("aria-label", "Add placeholder child asset");
      addPlaceholderButton.addEventListener("click", (event) => {
        event.stopPropagation();
        openPlaceholderSelectModal(node.assetNumber, missingGroups);
      });
      card.appendChild(addPlaceholderButton);
    }
  }
  if (isOrphaned) {
    const reassignButton = document.createElement("button");
    reassignButton.type = "button";
    reassignButton.className = "node-reassign-parent";
    reassignButton.textContent = "↺";
    reassignButton.title = "Assign a new parent";
    reassignButton.setAttribute("aria-label", "Assign a new parent");
    reassignButton.addEventListener("click", (event) => {
      event.stopPropagation();
      openOrphanParentSelectModal(node.assetNumber);
    });
    card.appendChild(reassignButton);
  }

  const desc = node.assetDesc1 || node.assetDesc2 || "";
  const itemNameCodeDesc = node.itemNameCodeDesc || "";
  const assetNumber = node.assetNumber || "";
  const typeCode = extractNameCode(itemNameCodeDesc);
  const assetRecordForLayout = assetMap.get(node.assetNumber);

  // Visual grammar: top=ID, middle=name+type badge, bottom=location/status/warnings.
  const top = document.createElement("div");
  top.className = "node-top-id";
  top.textContent = assetNumber;
  card.appendChild(top);

  const middle = document.createElement("div");
  middle.className = "node-middle";
  const name = document.createElement("div");
  name.className = "node-name";
  name.textContent = desc || itemNameCodeDesc || "Unnamed asset";
  middle.appendChild(name);
  const badge = document.createElement("span");
  badge.className = "node-type-badge";
  badge.textContent = typeCode || "N/A";
  middle.appendChild(badge);
  card.appendChild(middle);

  const bottom = document.createElement("div");
  bottom.className = "node-bottom";
  const location = document.createElement("span");
  location.textContent = assetRecordForLayout?.elr || "No location";
  const status = document.createElement("span");
  status.className = "node-status-pill";
  status.textContent = assetRecordForLayout?.assetStatus || "Unknown";
  bottom.appendChild(location);
  bottom.appendChild(status);
  if (assetRecordForLayout && getMissingReferenceChildren(assetRecordForLayout).length) {
    const warn = document.createElement("span");
    warn.className = "node-inline-warning";
    warn.textContent = "!";
    bottom.appendChild(warn);
  }
  card.appendChild(bottom);
  card.addEventListener("click", () => {
    selectAsset(node.assetNumber);
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectAsset(node.assetNumber);
    }
  });
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.draggable = true;
  card.addEventListener("dragstart", (event) => {
    event.dataTransfer?.setData("text/plain", node.assetNumber);
    event.dataTransfer?.setData("application/x-asset-number", node.assetNumber);
    card.classList.add("dragging");
  });
  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });
  card.addEventListener("dragover", (event) => {
    event.preventDefault();
    card.classList.add("drag-over");
  });
  card.addEventListener("dragleave", () => {
    card.classList.remove("drag-over");
  });
  card.addEventListener("drop", (event) => {
    event.preventDefault();
    card.classList.remove("drag-over");
    const assetNumber =
      event.dataTransfer?.getData("application/x-asset-number") ||
      event.dataTransfer?.getData("text/plain");
    if (!assetNumber) {
      return;
    }
    updateAssetParent(assetNumber, node.assetNumber);
  });
  return card;
}

function collectTreeCodeIndex(node, index = new Map(), visited = new Set()) {
  if (!node) {
    return index;
  }
  const nodeKey = `${node.assetNumber || "unknown"}-${node.placeholder ? "placeholder" : "asset"}-${node.missing ? "missing" : "active"}`;
  if (visited.has(nodeKey)) {
    return index;
  }
  visited.add(nodeKey);

  if (!node.missing && !node.placeholder && node.assetNumber) {
    const asset = assetMap.get(node.assetNumber);
    const code = extractNameCode(asset?.itemNameCodeDesc);
    if (code) {
      if (!index.has(code)) {
        index.set(code, []);
      }
      if (!index.get(code).includes(node.assetNumber)) {
        index.get(code).push(node.assetNumber);
      }
    }
  }

  node.children?.forEach((child) => collectTreeCodeIndex(child, index, visited));
  return index;
}

function getAssociatedTargets(node, treeCodeIndex) {
  if (!node || node.missing || node.placeholder || !node.assetNumber) {
    return [];
  }

  const asset = assetMap.get(node.assetNumber);
  const nodeCode = extractNameCode(asset?.itemNameCodeDesc);
  if (!nodeCode || !referenceAssociatedMap.has(nodeCode)) {
    return [];
  }

  const directChildren = new Set(
    (childrenMap.get(node.assetNumber) || []).filter(Boolean)
  );
  const associatedNumbers = new Set();
  referenceAssociatedMap.get(nodeCode).forEach((targetCode) => {
    (treeCodeIndex.get(targetCode) || []).forEach((targetAssetNumber) => {
      if (targetAssetNumber === node.assetNumber) {
        return;
      }
      if (directChildren.has(targetAssetNumber)) {
        return;
      }
      associatedNumbers.add(targetAssetNumber);
    });
  });

  return Array.from(associatedNumbers)
    .map((assetNumber) => assetMap.get(assetNumber))
    .filter(Boolean)
    .sort((a, b) => a.assetNumber.localeCompare(b.assetNumber));
}

function collectAssociatedRoleIndex(
  node,
  treeCodeIndex,
  index = new Map(),
  visited = new Set()
) {
  if (!node) {
    return index;
  }

  const nodeKey = `${node.assetNumber || "unknown"}-${node.placeholder ? "placeholder" : "asset"}-${node.missing ? "missing" : "active"}`;
  if (visited.has(nodeKey)) {
    return index;
  }
  visited.add(nodeKey);

  if (!node.missing && !node.placeholder && node.assetNumber) {
    const associatedTargets = getAssociatedTargets(node, treeCodeIndex);
    if (associatedTargets.length) {
      const sourceRole = index.get(node.assetNumber) || {
        source: false,
        target: false,
      };
      sourceRole.source = true;
      index.set(node.assetNumber, sourceRole);

      associatedTargets.forEach((targetAsset) => {
        const targetRole = index.get(targetAsset.assetNumber) || {
          source: false,
          target: false,
        };
        targetRole.target = true;
        index.set(targetAsset.assetNumber, targetRole);
      });
    }
  }

  node.children?.forEach((child) =>
    collectAssociatedRoleIndex(child, treeCodeIndex, index, visited)
  );
  return index;
}



function getVisibleChildren(node) {
  const children = node.children || [];
  const maxChildren = 6;
  if (expandedChildrenParents.has(node.assetNumber) || children.length <= maxChildren) {
    return { list: children, remaining: 0 };
  }
  return { list: children.slice(0, maxChildren), remaining: children.length - maxChildren };
}

function getSiblingCount(assetNumber) {
  const asset = assetMap.get(assetNumber);
  if (!asset?.parentAssetNumber) {
    return 0;
  }
  const siblings = (childrenMap.get(asset.parentAssetNumber) || []).filter((value) => value !== assetNumber);
  return siblings.length;
}

function getSiblingNodes(assetNumber) {
  const asset = assetMap.get(assetNumber);
  if (!asset?.parentAssetNumber) {
    return [];
  }
  return (childrenMap.get(asset.parentAssetNumber) || [])
    .filter((value) => value !== assetNumber)
    .map((siblingNumber) => buildAssetNode(siblingNumber));
}

function renderTreeNode(
  node,
  treeCodeIndex = new Map(),
  associatedRoleIndex = new Map(),
  showAssociated = true,
  options = {}
) {
  const nodeWrapper = document.createElement("div");
  nodeWrapper.className = "tree-node";

  const card = createNodeCard(node);
  if (showAssociated && !node.missing && !node.placeholder && node.assetNumber) {
    const relationshipRole = associatedRoleIndex.get(node.assetNumber);
    if (relationshipRole?.source) {
      card.classList.add("associated-source");
    }
    if (relationshipRole?.target) {
      card.classList.add("associated-target");
    }
  }
  nodeWrapper.appendChild(card);

  if (!node.missing && !node.placeholder && node.assetNumber === selectedAssetNumber && options.showSiblingPill) {
    const siblingCount = getSiblingCount(node.assetNumber);
    if (siblingCount > 0) {
      const siblingPill = document.createElement("button");
      siblingPill.type = "button";
      siblingPill.className = "siblings-pill";
      const expanded = expandedSiblingParents.has(node.assetNumber);
      siblingPill.textContent = expanded ? `Hide siblings (${siblingCount})` : `Siblings (${siblingCount})`;
      siblingPill.addEventListener("click", () => {
        if (expandedSiblingParents.has(node.assetNumber)) {
          expandedSiblingParents.delete(node.assetNumber);
        } else {
          expandedSiblingParents.add(node.assetNumber);
        }
        renderTree();
      });
      nodeWrapper.appendChild(siblingPill);

      if (expanded) {
        const siblingList = document.createElement("div");
        siblingList.className = "sibling-list";
        getSiblingNodes(node.assetNumber).forEach((siblingNode) => {
          siblingList.appendChild(renderTreeNode(siblingNode, treeCodeIndex, associatedRoleIndex, showAssociated));
        });
        nodeWrapper.appendChild(siblingList);
      }
    }
  }

  if (node.children && node.children.length > 0) {
    const branchWrapper = document.createElement("div");
    branchWrapper.className = "tree-branch";

    const branchLabel = document.createElement("div");
    branchLabel.className = "tree-branch-label";
    branchLabel.textContent = `Children of ${node.assetNumber || "asset"}`;
    branchWrapper.appendChild(branchLabel);

    const childrenWrapper = document.createElement("div");
    childrenWrapper.className = "tree-children";
    if (!node.missing && node.assetNumber) {
      childrenWrapper.dataset.parentNumber = node.assetNumber;
      childrenWrapper.addEventListener("dragover", (event) => {
        event.preventDefault();
        childrenWrapper.classList.add("drag-over");
      });
      childrenWrapper.addEventListener("dragleave", () => {
        childrenWrapper.classList.remove("drag-over");
      });
      childrenWrapper.addEventListener("drop", (event) => {
        event.preventDefault();
        childrenWrapper.classList.remove("drag-over");
        const assetNumber =
          event.dataTransfer?.getData("application/x-asset-number") ||
          event.dataTransfer?.getData("text/plain");
        if (!assetNumber) {
          return;
        }
        const candidates = getDropCandidates(event, node.assetNumber);
        if (candidates.length > 1) {
          openParentSelectModal(assetNumber, candidates);
          return;
        }
        updateAssetParent(assetNumber, candidates[0]);
      });
    }

    const visibleChildren = getVisibleChildren(node);
    visibleChildren.list.forEach((child) => {
      childrenWrapper.appendChild(
        renderTreeNode(child, treeCodeIndex, associatedRoleIndex, showAssociated, options)
      );
    });
    if (visibleChildren.remaining > 0) {
      const more = document.createElement("button");
      more.type = "button";
      more.className = "children-more-pill";
      more.textContent = `+${visibleChildren.remaining} more`;
      more.addEventListener("click", () => {
        expandedChildrenParents.add(node.assetNumber);
        renderTree();
      });
      childrenWrapper.appendChild(more);
    }
    branchWrapper.appendChild(childrenWrapper);
    nodeWrapper.appendChild(branchWrapper);
  }

  const associatedTargets = showAssociated
    ? getAssociatedTargets(node, treeCodeIndex)
    : [];
  if (associatedTargets.length) {
    const associatedWrapper = document.createElement("div");
    associatedWrapper.className = "tree-associated";

    const label = document.createElement("div");
    label.className = "tree-associated-label";
    label.textContent = "Associated equipment";
    associatedWrapper.appendChild(label);

    const list = document.createElement("div");
    list.className = "tree-associated-list";
    associatedTargets.forEach((asset) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tree-associated-chip";
      chip.textContent = `${asset.assetNumber} · ${extractNameCode(asset.itemNameCodeDesc)}`;
      chip.title = asset.assetDesc1 || asset.assetDesc2 || asset.itemNameCodeDesc;
      chip.addEventListener("click", () => {
        selectAsset(asset.assetNumber);
      });
      list.appendChild(chip);
    });

    associatedWrapper.appendChild(list);
    nodeWrapper.appendChild(associatedWrapper);
  }

  return nodeWrapper;
}

function collectDescendantsByLevel(rootNode, maxDepth = 2) {
  const levels = [];
  const queue = [{ node: rootNode, depth: 0 }];
  while (queue.length) {
    const current = queue.shift();
    if (!levels[current.depth]) {
      levels[current.depth] = [];
    }
    levels[current.depth].push(current.node);
    if (current.depth >= maxDepth) {
      continue;
    }
    (current.node.children || []).forEach((child) => queue.push({ node: child, depth: current.depth + 1 }));
  }
  return levels;
}

function renderFocusMode(tree, treeCodeIndex, associatedRoleIndex) {
  const wrapper = document.createElement("div");
  wrapper.className = "focus-layout";
  const chain = buildAncestorChain(selectedAssetNumber);

  const spine = document.createElement("div");
  spine.className = "focus-spine";
  chain.forEach((node) => {
    spine.appendChild(renderTreeNode(node, treeCodeIndex, associatedRoleIndex, false));
  });
  wrapper.appendChild(spine);

  const selectedBranch = buildSubtree(selectedAssetNumber, new Set());
  const focusChildren = document.createElement("div");
  focusChildren.className = "focus-children-grid";
  (selectedBranch?.children || []).slice(0, 12).forEach((child) => {
    focusChildren.appendChild(renderTreeNode(child, treeCodeIndex, associatedRoleIndex, showAssociatedEquipment));
  });
  wrapper.appendChild(focusChildren);
  return wrapper;
}

function getTypeLabelForNode(node) {
  if (!node || node.missing || node.placeholder) {
    return "Unknown";
  }
  const record = assetMap.get(node.assetNumber);
  const code = extractNameCode(record?.itemNameCodeDesc);
  return code || "Unknown";
}

function renderSwimlaneMode(tree, treeCodeIndex, associatedRoleIndex) {
  const wrapper = document.createElement("div");
  wrapper.className = "swimlane-layout";
  const levels = collectDescendantsByLevel(tree, treeLevelsAbove + 1);

  levels.forEach((nodes, depth) => {
    const laneMap = new Map();
    nodes.forEach((node) => {
      const laneKey = getTypeLabelForNode(node);
      if (!laneMap.has(laneKey)) {
        laneMap.set(laneKey, []);
      }
      laneMap.get(laneKey).push(node);
    });

    laneMap.forEach((laneNodes, laneLabel) => {
      const lane = document.createElement("div");
      lane.className = "swimlane-row";
      const laneTitle = document.createElement("div");
      laneTitle.className = "swimlane-title";
      laneTitle.textContent = `${laneLabel} · depth ${depth}`;
      lane.appendChild(laneTitle);

      const laneCards = document.createElement("div");
      laneCards.className = "swimlane-cards";
      laneNodes.forEach((node) => {
        laneCards.appendChild(renderTreeNode(node, treeCodeIndex, associatedRoleIndex, showAssociatedEquipment));
      });
      lane.appendChild(laneCards);
      wrapper.appendChild(lane);
    });
  });
  return wrapper;
}

function collectTreeWarnings(node, warnings = [], visited = new Set()) {
  if (!node) {
    return warnings;
  }

  const nodeKey = `${node.missing ? "missing" : "asset"}-${node.assetNumber || "unknown"}`;
  if (visited.has(nodeKey)) {
    return warnings;
  }
  visited.add(nodeKey);

  if (node.missing) {
    warnings.push({
      type: "missing",
      assetNumber: node.assetNumber || "Unknown asset",
      message: "Asset not in download.",
    });
  } else {
    const assetRecord = assetMap.get(node.assetNumber);
    if (assetRecord && isReferenceMismatch(assetRecord)) {
      warnings.push({
        type: "mismatch",
        assetNumber: node.assetNumber,
        message: "Does not follow the reference hierarchy.",
      });
    }
    if (assetRecord) {
      if (isOrphanedAsset(assetRecord)) {
        const parentAsset = assetMap.get(assetRecord.parentAssetNumber);
        const parentLabel = parentAsset
          ? ` (parent ${parentAsset.assetNumber} is obsolete)`
          : "";
        warnings.push({
          type: "orphaned",
          assetNumber: node.assetNumber,
          message: `Orphaned child asset${parentLabel}.`,
        });
      }
      const missingChildren = getMissingReferenceChildren(assetRecord);
      if (missingChildren.length) {
        warnings.push({
          type: "expected",
          assetNumber: node.assetNumber,
          message: `Missing expected child item class${missingChildren.length > 1 ? "es" : ""}: ${missingChildren.join(", ")}.`,
        });
      }
    }
  }

  node.children?.forEach((child) => collectTreeWarnings(child, warnings, visited));
  return warnings;
}

function resetTreeWarnings(message) {
  if (treeWarningsStatus) {
    treeWarningsStatus.textContent = message;
  }
  if (treeWarningsCount) {
    treeWarningsCount.textContent = "";
  }
  if (treeWarningsList) {
    treeWarningsList.innerHTML = "";
  }
}

function renderTreeWarnings(tree) {
  if (!treeWarningsList || !treeWarningsStatus || !treeWarningsCount) {
    return;
  }

  let warnings = collectTreeWarnings(tree);
  if (warningsOnlyMode) {
    warnings = warnings.filter((warning) => warning.type !== "missing");
  }
  treeWarningsList.innerHTML = "";
  if (!warnings.length) {
    treeWarningsStatus.textContent = "No warnings for this tree.";
    treeWarningsCount.textContent = "0 warnings";
    return;
  }

  treeWarningsStatus.textContent = "";
  treeWarningsCount.textContent = `${warnings.length} warning${warnings.length === 1 ? "" : "s"}`;

  warnings.forEach((warning) => {
    const item = document.createElement("li");
    item.className = "tree-warning-item";

    const icon = document.createElement("span");
    icon.className = `tree-warning-icon tree-warning-icon-${warning.type}`;
    icon.textContent = "!";
    item.appendChild(icon);

    const text = document.createElement("div");
    text.className = "tree-warning-text";

    const title = document.createElement("strong");
    title.textContent = warning.assetNumber;
    text.appendChild(title);

    const message = document.createElement("span");
    message.textContent = ` — ${warning.message}`;
    text.appendChild(message);
    item.appendChild(text);

    treeWarningsList.appendChild(item);
  });
}

function renderBreadcrumbs() {
  if (!treeBreadcrumbs) {
    return;
  }
  treeBreadcrumbs.innerHTML = "";
  if (!selectedAssetNumber) {
    return;
  }
  buildAncestorChain(selectedAssetNumber).forEach((node, index, chain) => {
    const crumb = document.createElement("button");
    crumb.type = "button";
    crumb.className = "breadcrumb-item";
    crumb.textContent = node.assetNumber;
    crumb.addEventListener("click", () => selectAsset(node.assetNumber));
    treeBreadcrumbs.appendChild(crumb);
    if (index < chain.length - 1) {
      const sep = document.createElement("span");
      sep.textContent = "›";
      treeBreadcrumbs.appendChild(sep);
    }
  });
}

function updateHierarchySummary() {
  if (!hierarchySummary || !selectedAssetNumber) {
    return;
  }
  const asset = assetMap.get(selectedAssetNumber);
  const parents = buildAncestorChain(selectedAssetNumber).length - 1;
  const children = (childrenMap.get(selectedAssetNumber) || []).length;
  const siblings = asset?.parentAssetNumber ? (childrenMap.get(asset.parentAssetNumber) || []).filter((id) => id !== selectedAssetNumber).length : 0;
  hierarchySummary.textContent = `Parents: ${parents} · Children: ${children} · Siblings: ${siblings}`;
}

function buildAssociationGroups(associations) {
  const groups = new Map();
  associations.forEach((asset) => {
    const type = extractNameCode(asset.itemNameCodeDesc) || "Unknown";
    if (!groups.has(type)) {
      groups.set(type, []);
    }
    groups.get(type).push(asset);
  });
  return groups;
}

function renderAssociationTypeChips(groups) {
  if (!associationTypeChips) {
    return;
  }
  associationTypeChips.innerHTML = "";
  if (!groups.size) {
    return;
  }

  const allChip = document.createElement("button");
  allChip.type = "button";
  allChip.className = `assoc-chip ${associationTypeFilter.size === 0 ? "active" : ""}`;
  allChip.textContent = "All association types";
  allChip.addEventListener("click", () => {
    associationTypeFilter = new Set();
    renderTree();
  });
  associationTypeChips.appendChild(allChip);

  Array.from(groups.keys()).sort((a, b) => a.localeCompare(b)).forEach((type) => {
    const chip = document.createElement("button");
    chip.type = "button";
    const isActive = associationTypeFilter.size > 0 && associationTypeFilter.has(type);
    chip.className = `assoc-chip ${isActive ? "active" : ""}`;
    chip.textContent = `${type} (${groups.get(type).length})`;
    chip.addEventListener("click", () => {
      if (associationTypeFilter.has(type)) {
        associationTypeFilter.delete(type);
      } else {
        associationTypeFilter.add(type);
      }
      renderTree();
    });
    associationTypeChips.appendChild(chip);
  });
}

function renderAssociationsPanel(treeCodeIndex) {
  if (!associationsPanel) return;
  associationsPanel.innerHTML = "";
  if (!selectedAssetNumber) return;

  const node = buildAssetNode(selectedAssetNumber);
  let associations = getAssociatedTargets(node, treeCodeIndex);
  const term = (associationsSearch?.value || "").toLowerCase();
  if (term) {
    associations = associations.filter((asset) => {
      const haystack = `${asset.assetNumber} ${asset.assetDesc1 || ""} ${asset.itemNameCodeDesc || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }

  const grouped = buildAssociationGroups(associations);
  renderAssociationTypeChips(grouped);

  const filteredTypes = associationTypeFilter.size
    ? new Set(Array.from(associationTypeFilter))
    : null;

  Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([type, assetsByType]) => {
      if (filteredTypes && !filteredTypes.has(type)) {
        return;
      }

      const group = document.createElement("section");
      group.className = "association-group";
      const title = document.createElement("h4");
      title.textContent = `${type} (${assetsByType.length})`;
      group.appendChild(title);

      assetsByType.forEach((asset) => {
        const row = document.createElement("div");
        row.className = "association-row";
        row.innerHTML = `<strong>${asset.assetNumber}</strong><span>${asset.assetDesc1 || asset.itemNameCodeDesc || ""}</span>`;

        const toggle = document.createElement("button");
        toggle.type = "button";
        const pinned = pinnedAssociatedAssets.has(asset.assetNumber);
        toggle.textContent = pinned ? "Hide" : "Show on canvas";
        toggle.addEventListener("click", (event) => {
          event.stopPropagation();
          if (pinnedAssociatedAssets.has(asset.assetNumber)) pinnedAssociatedAssets.delete(asset.assetNumber);
          else pinnedAssociatedAssets.add(asset.assetNumber);
          renderTree();
        });

        row.appendChild(toggle);
        row.addEventListener("mouseenter", () => {
          row.classList.add("hover-preview");
        });
        row.addEventListener("mouseleave", () => {
          row.classList.remove("hover-preview");
        });
        row.addEventListener("click", () => selectAsset(asset.assetNumber));
        group.appendChild(row);
      });
      associationsPanel.appendChild(group);
    });
}

function renderTree() {
  treeContainer.innerHTML = "";

  if (!selectedAssetNumber) {
    treeStatus.textContent = "Select an asset to view its family tree.";
    resetTreeWarnings("Select an asset to see warnings for the family tree.");
    renderBreadcrumbs();
    return;
  }

  const tree = buildTreeForView(selectedAssetNumber);
  if (!tree) {
    treeStatus.textContent = "Unable to build a tree for this asset.";
    resetTreeWarnings("No warnings available for this tree.");
    return;
  }

  treeStatus.textContent = "";
  const treeCodeIndex = collectTreeCodeIndex(tree);
  const associatedRoleIndex = showAssociatedEquipment
    ? collectAssociatedRoleIndex(tree, treeCodeIndex)
    : new Map();

  // View modes share selection + data model but render distinct layouts.
  let renderedTree;
  if (viewMode === "focus") {
    renderedTree = renderFocusMode(tree, treeCodeIndex, associatedRoleIndex);
  } else if (viewMode === "swimlane") {
    renderedTree = renderSwimlaneMode(tree, treeCodeIndex, associatedRoleIndex);
  } else {
    renderedTree = renderTreeNode(
      tree,
      treeCodeIndex,
      associatedRoleIndex,
      showAssociatedEquipment,
      { showSiblingPill: true }
    );
  }
  treeContainer.appendChild(renderedTree);

  pinnedAssociatedAssets.forEach((assetNumber) => {
    const asset = assetMap.get(assetNumber);
    if (!asset) return;
    const chip = document.createElement("div");
    chip.className = "pinned-associated-card";
    chip.textContent = `${asset.assetNumber} · ${extractNameCode(asset.itemNameCodeDesc)}`;
    chip.addEventListener("click", () => selectAsset(asset.assetNumber));
    treeContainer.appendChild(chip);
  });

  renderBreadcrumbs();
  updateHierarchySummary();
  renderAssociationsPanel(treeCodeIndex);
  renderTreeWarnings(tree);
}

function updateTreeViewControls() {
  if (!treeLevelsWrapper || !treeLevelsInput) {
    return;
  }
  treeLevelsInput.value = treeLevelsAbove;
}

function isNameCodeInReferenceTree(code) {
  if (!code) {
    return false;
  }
  return referenceNameCodes.includes(code.toUpperCase());
}

function isAssetInReferenceTree(asset) {
  if (!asset) {
    return false;
  }
  const value = extractNameCode(asset.itemNameCodeDesc);
  return isNameCodeInReferenceTree(value);
}

function matchesReferenceGroup(asset, selectedGroup) {
  if (selectedGroup === "all") {
    return true;
  }

  if (selectedGroup === "sc-group") {
    const value = extractNameCode(asset.itemNameCodeDesc);
    return value ? referenceNameCodes.includes(value) : false;
  }

  return true;
}

function extractNameCode(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }
  const match = trimmed.match(/^[A-Za-z0-9]+/);
  return match ? match[0].toUpperCase() : "";
}

function getExistingChildCodes(parentAssetNumber) {
  const existingCodes = new Set();
  const childNumbers = childrenMap.get(parentAssetNumber) || [];
  childNumbers.forEach((childNumber) => {
    const childAsset = assetMap.get(childNumber);
    if (!childAsset) {
      return;
    }
    const childCode = extractNameCode(childAsset.itemNameCodeDesc);
    if (childCode) {
      existingCodes.add(childCode);
    }
  });
  const placeholders = placeholderMap.get(parentAssetNumber) || [];
  placeholders.forEach((placeholder) => {
    if (placeholder.itemNameCode) {
      existingCodes.add(placeholder.itemNameCode);
    }
  });
  return existingCodes;
}

function getMissingReferenceChildGroups(asset) {
  const assetCode = extractNameCode(asset.itemNameCodeDesc);
  if (!assetCode || !referenceChildMap.has(assetCode)) {
    return [];
  }

  const expectedGroups = referenceChildMap.get(assetCode) || [];
  if (expectedGroups.length === 0) {
    return [];
  }

  const existingCodes = getExistingChildCodes(asset.assetNumber);
  return expectedGroups.filter((group) => {
    if (group.optional) {
      return false;
    }
    return !Array.from(group.codes).some((code) => existingCodes.has(code));
  });
}

function isReferenceMismatch(asset, parentOverride = null) {
  const assetCode = extractNameCode(asset.itemNameCodeDesc);
  if (!assetCode || !referenceNameCodes.includes(assetCode)) {
    return false;
  }
  if (referenceIgnoredCodes.has(assetCode)) {
    return false;
  }

  const parentAssetNumber =
    parentOverride !== null ? parentOverride : asset.parentAssetNumber;
  if (!parentAssetNumber) {
    const allowedParents = referenceParentMap.get(assetCode) || new Set();
    return allowedParents.size > 0;
  }

  const parentAsset = assetMap.get(parentAssetNumber);
  if (!parentAsset) {
    return true;
  }

  const parentCode = extractNameCode(parentAsset.itemNameCodeDesc);
  if (!parentCode || !referenceNameCodes.includes(parentCode)) {
    return false;
  }
  const allowedParents = referenceParentMap.get(assetCode) || new Set();
  return !allowedParents.has(parentCode);
}

function hasAssetError(asset) {
  return (
    isReferenceMismatch(asset) ||
    getMissingReferenceChildren(asset).length > 0 ||
    isOrphanedAsset(asset)
  );
}

function shouldShowTick(asset) {
  return initialMismatchAssets.has(asset.assetNumber) && !isReferenceMismatch(asset);
}

function openParentSelectModal(assetNumber, parentOptions) {
  if (!parentSelectModal || !parentSelectList) {
    return;
  }
  parentSelectList.innerHTML = "";
  if (parentSelectTitle) {
    parentSelectTitle.textContent = `Select parent for ${assetNumber}`;
  }
  parentOptions.forEach((parentNumber) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "modal-option";
    button.textContent = parentNumber;
    const parentAsset = assetMap.get(parentNumber);
    if (parentAsset) {
      const detail = document.createElement("small");
      detail.textContent =
        parentAsset.assetDesc1 || parentAsset.assetDesc2 || parentAsset.itemNameCodeDesc;
      if (detail.textContent) {
        button.appendChild(detail);
      }
    }
    button.addEventListener("click", () => {
      closeParentSelectModal();
      updateAssetParent(assetNumber, parentNumber);
    });
    parentSelectList.appendChild(button);
  });

  if (parentSelectModal) {
    parentSelectModal.classList.remove("hidden");
    parentSelectModal.setAttribute("aria-hidden", "false");
  }
}

function buildPlaceholderOptions(missingGroups) {
  const options = [];
  missingGroups.forEach((group) => {
    const codes = Array.from(group.codes).sort((a, b) => a.localeCompare(b));
    const groupLabel = codes.join(" or ");
    codes.forEach((code) => {
      options.push({ code, groupLabel });
    });
  });
  return options;
}

function getUnassignedAssetsForGroups(missingGroups, parentAssetNumber) {
  if (!missingGroups.length) {
    return [];
  }
  const allowedCodes = new Set();
  missingGroups.forEach((group) => {
    group.codes.forEach((code) => {
      allowedCodes.add(code);
    });
  });
  return assets
    .filter((asset) => {
      if (!asset || asset.parentAssetNumber) {
        return false;
      }
      if (asset.assetNumber === parentAssetNumber) {
        return false;
      }
      const code = extractNameCode(asset.itemNameCodeDesc);
      return code && allowedCodes.has(code);
    })
    .sort((a, b) => a.assetNumber.localeCompare(b.assetNumber));
}

function buildAssetOptionButton(asset, onSelect) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "modal-option";
  const title = document.createElement("span");
  title.className = "modal-option-title";
  title.textContent = asset.assetNumber;
  button.appendChild(title);

  const detailList = document.createElement("dl");
  detailList.className = "modal-option-details";
  const detailFields = [
    { label: "Item Name Code & Desc", value: asset.itemNameCodeDesc },
    { label: "Asset Desc 1", value: asset.assetDesc1 },
    { label: "Asset Desc 2", value: asset.assetDesc2 },
    { label: "Structured Plant Number", value: asset.structuredPlantNumber },
    { label: "ELR", value: asset.elr },
    { label: "Track ID", value: asset.trackId },
    { label: "Asset Start Mileage", value: asset.assetStartMileage },
    { label: "Asset End Mileage", value: asset.assetEndMileage },
    { label: "Asset Status", value: asset.assetStatus },
  ];
  detailFields.forEach((field) => {
    const term = document.createElement("dt");
    term.textContent = field.label;
    const desc = document.createElement("dd");
    desc.textContent = formatDetailValue(field.value);
    detailList.appendChild(term);
    detailList.appendChild(desc);
  });
  button.appendChild(detailList);

  button.addEventListener("click", () => {
    onSelect(asset);
  });
  return button;
}

function updateExistingAssetItemFilter(candidates) {
  if (!existingAssetItemFilter) {
    return;
  }
  const codes = new Set();
  let hasEmpty = false;
  candidates.forEach((asset) => {
    const code = extractNameCode(asset.itemNameCodeDesc);
    if (code) {
      codes.add(code);
    } else {
      hasEmpty = true;
    }
  });
  existingAssetItemFilter.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All item codes";
  existingAssetItemFilter.appendChild(allOption);
  if (hasEmpty) {
    const emptyOption = document.createElement("option");
    emptyOption.value = "__empty__";
    emptyOption.textContent = "No item code";
    existingAssetItemFilter.appendChild(emptyOption);
  }
  Array.from(codes)
    .sort((a, b) => a.localeCompare(b))
    .forEach((code) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = code;
      existingAssetItemFilter.appendChild(option);
    });
}

function matchesExistingAssetFilters(asset) {
  const query = existingAssetSearch?.value.trim().toLowerCase() || "";
  const selectedCode = existingAssetItemFilter?.value || "all";
  const searchLabel = `${asset.assetNumber} ${asset.assetDesc1} ${asset.assetDesc2} ${asset.itemNameCodeDesc} ${asset.elr}`.toLowerCase();
  const matchesSearch = query ? searchLabel.includes(query) : true;
  const itemCode = extractNameCode(asset.itemNameCodeDesc);
  const matchesCode =
    selectedCode === "all"
      ? true
      : selectedCode === "__empty__"
        ? !itemCode
        : itemCode === selectedCode;
  return matchesSearch && matchesCode;
}

function renderExistingAssetCandidateList() {
  if (!existingAssetSelectList) {
    return;
  }
  existingAssetSelectList.innerHTML = "";
  const filtered = existingAssetCandidates.filter((asset) =>
    matchesExistingAssetFilters(asset)
  );
  filtered.forEach((asset) => {
    const button = buildAssetOptionButton(asset, (selected) => {
      updateAssetParent(selected.assetNumber, existingAssetTargetParentNumber);
      closeExistingAssetSelectModal();
    });
    existingAssetSelectList.appendChild(button);
  });
  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "modal-empty";
    empty.textContent = existingAssetCandidates.length
      ? "No matching assets found."
      : "No unassigned assets match the missing child groups.";
    existingAssetSelectList.appendChild(empty);
  }
}

function openExistingAssetSelectModal(parentAssetNumber, missingGroups) {
  if (!existingAssetSelectModal || !existingAssetSelectList) {
    return;
  }
  if (existingAssetSelectTitle) {
    existingAssetSelectTitle.textContent = `Link existing asset for ${parentAssetNumber}`;
  }

  existingAssetTargetParentNumber = parentAssetNumber;
  existingAssetCandidates = getUnassignedAssetsForGroups(
    missingGroups,
    parentAssetNumber
  );
  if (existingAssetSearch) {
    existingAssetSearch.value = "";
  }
  if (existingAssetItemFilter) {
    existingAssetItemFilter.value = "all";
  }
  updateExistingAssetItemFilter(existingAssetCandidates);
  if (existingAssetItemFilter) {
    existingAssetItemFilter.value = "all";
  }
  renderExistingAssetCandidateList();

  existingAssetSelectModal.classList.remove("hidden");
  existingAssetSelectModal.setAttribute("aria-hidden", "false");
}

function openPlaceholderSelectModal(parentAssetNumber, missingGroups) {
  if (!placeholderSelectModal || !placeholderSelectList) {
    return;
  }
  placeholderSelectList.innerHTML = "";
  if (placeholderSelectTitle) {
    placeholderSelectTitle.textContent = `Add placeholder for ${parentAssetNumber}`;
  }

  const options = buildPlaceholderOptions(missingGroups);
  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "modal-option";
    button.textContent = option.code;
    const detail = document.createElement("small");
    detail.textContent = `Expected group: ${option.groupLabel}`;
    button.appendChild(detail);
    button.addEventListener("click", () => {
      addPlaceholderAsset(parentAssetNumber, option.code);
      closePlaceholderSelectModal();
    });
    placeholderSelectList.appendChild(button);
  });

  placeholderSelectModal.classList.remove("hidden");
  placeholderSelectModal.setAttribute("aria-hidden", "false");
}

function closePlaceholderSelectModal() {
  if (!placeholderSelectModal) {
    return;
  }
  placeholderSelectModal.classList.add("hidden");
  placeholderSelectModal.setAttribute("aria-hidden", "true");
  if (placeholderSelectList) {
    placeholderSelectList.innerHTML = "";
  }
}

function closeExistingAssetSelectModal() {
  if (!existingAssetSelectModal) {
    return;
  }
  existingAssetSelectModal.classList.add("hidden");
  existingAssetSelectModal.setAttribute("aria-hidden", "true");
  if (existingAssetSelectList) {
    existingAssetSelectList.innerHTML = "";
  }
  existingAssetCandidates = [];
  existingAssetTargetParentNumber = null;
}

function getParentCandidates(assetNumber) {
  return assets
    .filter((asset) => {
      if (!asset) {
        return false;
      }
      if (asset.assetNumber === assetNumber) {
        return false;
      }
      if (isDescendant(assetNumber, asset.assetNumber)) {
        return false;
      }
      return !isObsoleteAsset(asset);
    })
    .sort((a, b) => a.assetNumber.localeCompare(b.assetNumber));
}

function matchesOrphanParentSearch(asset) {
  const query = orphanParentSearch?.value.trim().toLowerCase() || "";
  if (!query) {
    return true;
  }
  const label = `${asset.assetNumber} ${asset.assetDesc1} ${asset.assetDesc2} ${asset.itemNameCodeDesc} ${asset.elr}`.toLowerCase();
  return label.includes(query);
}

function renderOrphanParentCandidateList() {
  if (!orphanParentSelectList) {
    return;
  }
  orphanParentSelectList.innerHTML = "";
  const filtered = orphanParentCandidates.filter((asset) =>
    matchesOrphanParentSearch(asset)
  );
  filtered.forEach((asset) => {
    const button = buildAssetOptionButton(asset, (selected) => {
      if (!orphanTargetAssetNumber) {
        return;
      }
      updateAssetParent(orphanTargetAssetNumber, selected.assetNumber);
      closeOrphanParentSelectModal();
    });
    orphanParentSelectList.appendChild(button);
  });
  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "modal-empty";
    empty.textContent = "No matching parent assets found.";
    orphanParentSelectList.appendChild(empty);
  }
}

function openOrphanParentSelectModal(assetNumber) {
  if (!orphanParentSelectModal || !orphanParentSelectList) {
    return;
  }
  orphanTargetAssetNumber = assetNumber;
  if (orphanParentSelectTitle) {
    orphanParentSelectTitle.textContent = `Assign new parent for ${assetNumber}`;
  }
  orphanParentCandidates = getParentCandidates(assetNumber);
  if (orphanParentSearch) {
    orphanParentSearch.value = "";
  }
  renderOrphanParentCandidateList();
  orphanParentSelectModal.classList.remove("hidden");
  orphanParentSelectModal.setAttribute("aria-hidden", "false");
}

function closeOrphanParentSelectModal() {
  if (!orphanParentSelectModal) {
    return;
  }
  orphanParentSelectModal.classList.add("hidden");
  orphanParentSelectModal.setAttribute("aria-hidden", "true");
  if (orphanParentSelectList) {
    orphanParentSelectList.innerHTML = "";
  }
  orphanParentCandidates = [];
  orphanTargetAssetNumber = null;
}

function closeParentSelectModal() {
  if (!parentSelectModal) {
    return;
  }
  parentSelectModal.classList.add("hidden");
  parentSelectModal.setAttribute("aria-hidden", "true");
  if (parentSelectList) {
    parentSelectList.innerHTML = "";
  }
}

function getDropCandidates(event, fallbackParentNumber) {
  const elements = document.elementsFromPoint(event.clientX, event.clientY);
  const parentNumbers = elements
    .filter((element) => element.classList?.contains("tree-children"))
    .map((element) => element.dataset.parentNumber)
    .filter(Boolean);
  const unique = Array.from(new Set(parentNumbers));
  if (unique.length === 0 && fallbackParentNumber) {
    return [fallbackParentNumber];
  }
  return unique;
}

function isDescendant(assetNumber, potentialParent) {
  if (!assetNumber || !potentialParent) {
    return false;
  }
  const children = childrenMap.get(assetNumber) || [];
  if (children.includes(potentialParent)) {
    return true;
  }
  return children.some((child) => isDescendant(child, potentialParent));
}

function updateAssetParent(assetNumber, newParentNumber) {
  const asset = assetMap.get(assetNumber);
  if (!asset || !newParentNumber) {
    return;
  }
  if (assetNumber === newParentNumber) {
    return;
  }
  if (isDescendant(assetNumber, newParentNumber)) {
    return;
  }

  const oldParent = asset.parentAssetNumber || null;
  if (oldParent === newParentNumber) {
    return;
  }

  if (oldParent && childrenMap.has(oldParent)) {
    const siblings = childrenMap.get(oldParent).filter((child) => child !== assetNumber);
    if (siblings.length) {
      childrenMap.set(oldParent, siblings);
    } else {
      childrenMap.delete(oldParent);
    }
  }

  asset.parentAssetNumber = newParentNumber;
  if (!childrenMap.has(newParentNumber)) {
    childrenMap.set(newParentNumber, []);
  }
  if (!childrenMap.get(newParentNumber).includes(assetNumber)) {
    childrenMap.get(newParentNumber).push(assetNumber);
  }

  if (originalParentMap.get(assetNumber) === newParentNumber) {
    changedAssets.delete(assetNumber);
  } else {
    changedAssets.add(assetNumber);
  }

  updateExportButton();
  renderAssetList();
  renderTree();
}

function addPlaceholderAsset(parentAssetNumber, itemNameCode) {
  if (!parentAssetNumber || !itemNameCode) {
    return;
  }

  const placeholder = {
    id: `placeholder-${parentAssetNumber}-${itemNameCode}-${placeholderCounter += 1}`,
    parentAssetNumber,
    itemNameCode,
  };

  placeholderAssets.push(placeholder);
  if (!placeholderMap.has(parentAssetNumber)) {
    placeholderMap.set(parentAssetNumber, []);
  }
  placeholderMap.get(parentAssetNumber).push(placeholder);

  updateExportButton();
  renderTree();
}

function selectAsset(assetNumber) {
  if (!assetNumber) {
    return;
  }
  if (assetNumber !== selectedAssetNumber) {
    selectedAssetNumber = assetNumber;
    if (selectionHistory[selectionHistoryIndex] !== assetNumber) {
      selectionHistory = selectionHistory.slice(0, selectionHistoryIndex + 1);
      selectionHistory.push(assetNumber);
      selectionHistoryIndex = selectionHistory.length - 1;
    }
    renderAssetList();
  }
  updateAssetDetails();
  renderTree();
}

function populateSearchOptions() {
  if (!assetSearchOptions) return;
  assetSearchOptions.innerHTML = "";
  assets.slice(0, 1000).forEach((asset) => {
    const option = document.createElement("option");
    option.value = `${asset.assetNumber} ${asset.assetDesc1 || ""}`.trim();
    assetSearchOptions.appendChild(option);
  });
}

function loadReferenceTrees() {
  if (!referenceTreeSelect || !referenceTreeStatus || !referenceTree) {
    return;
  }

  fetch("reference-trees.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load reference trees.");
      }
      return response.json();
    })
    .then((data) => {
      applyReferenceTrees(data);
    })
    .catch(() => {
      referenceTreeStatus.textContent =
        "Unable to load the reference tree definition.";
    });
}

function applyReferenceTrees(data) {
  referenceTrees = Array.isArray(data?.trees) ? data.trees : [];
  referenceTreeSelect.innerHTML = "";
  referenceTrees.forEach((tree) => {
    const option = document.createElement("option");
    option.value = tree.id;
    option.textContent = tree.label;
    referenceTreeSelect.appendChild(option);
  });

  if (referenceTrees.length === 0) {
    referenceTreeStatus.textContent = "No reference trees available.";
    return;
  }

  referenceTreeStatus.textContent = "";
  referenceTreeSelect.value = referenceTrees[0].id;
  updateReferenceTree(referenceTrees[0]);
}

function updateReferenceTree(tree) {
  if (!tree?.root) {
    referenceTreeStatus.textContent = "Reference tree data is missing.";
    referenceTree.innerHTML = "";
    return;
  }

  referenceTreeStatus.textContent = "";
  referenceTree.innerHTML = "";
  referenceTree.appendChild(renderReferenceNode(tree.root));
  referenceNameCodes = collectReferenceNameCodes(tree.root);
  referenceParentMap = buildReferenceParentMap(tree.root);
  referenceIgnoredCodes = collectIgnoredNameCodes(tree.root);
  referenceChildMap = buildReferenceChildMap(tree.root);
  referenceAssociatedMap = buildReferenceAssociatedMap(tree.associations || []);
  captureInitialMismatches();
  renderAssetList();
  if (selectedAssetNumber) {
    renderTree();
  }
}

function buildReferenceAssociatedMap(associations) {
  const map = new Map();
  if (!Array.isArray(associations)) {
    return map;
  }

  associations.forEach((link) => {
    const fromCodes = Array.isArray(link?.fromCodes)
      ? link.fromCodes.map((code) => String(code).toUpperCase())
      : [];
    const toCodes = Array.isArray(link?.toCodes)
      ? link.toCodes.map((code) => String(code).toUpperCase())
      : [];
    const bidirectional = link?.bidirectional !== false;

    fromCodes.forEach((fromCode) => {
      if (!map.has(fromCode)) {
        map.set(fromCode, new Set());
      }
      toCodes.forEach((toCode) => {
        map.get(fromCode).add(toCode);
      });
    });

    if (bidirectional) {
      toCodes.forEach((toCode) => {
        if (!map.has(toCode)) {
          map.set(toCode, new Set());
        }
        fromCodes.forEach((fromCode) => {
          map.get(toCode).add(fromCode);
        });
      });
    }
  });

  return map;
}

function renderReferenceNode(node) {
  const item = document.createElement("li");
  const card = document.createElement("div");
  card.className = "ref-node";

  const title = document.createElement("span");
  title.className = "ref-title";
  title.textContent = node.title;
  card.appendChild(title);

  if (node.nameCodes?.length) {
    const code = document.createElement("span");
    code.className = "ref-code";
    code.textContent = node.nameCodes.join(", ");
    card.appendChild(code);

    const pill = document.createElement("span");
    pill.className = "ref-pill ref-pill-class";
    pill.textContent = "Item Name Codes";
    card.appendChild(pill);
  }

  if (node.ignoreFromErrors) {
    const pill = document.createElement("span");
    pill.className = "ref-pill ref-pill-ignore";
    pill.textContent = "Ignore errors";
    card.appendChild(pill);
  }

  item.appendChild(card);

  if (node.children?.length) {
    const list = document.createElement("ul");
    node.children.forEach((child) => {
      list.appendChild(renderReferenceNode(child));
    });
    item.appendChild(list);
  }

  return item;
}

function collectReferenceNameCodes(node) {
  const codes = [];
  if (!node) {
    return codes;
  }
  if (node.nameCodes?.length) {
    codes.push(...node.nameCodes.map((code) => code.toUpperCase()));
  }
  if (node.children?.length) {
    node.children.forEach((child) => {
      codes.push(...collectReferenceNameCodes(child));
    });
  }
  return Array.from(new Set(codes));
}

function collectIgnoredNameCodes(node) {
  const codes = [];
  if (!node) {
    return codes;
  }
  if (node.ignoreFromErrors && node.nameCodes?.length) {
    codes.push(...node.nameCodes.map((code) => code.toUpperCase()));
  }
  if (node.children?.length) {
    node.children.forEach((child) => {
      codes.push(...collectIgnoredNameCodes(child));
    });
  }
  return new Set(codes);
}

function buildReferenceChildMap(node) {
  const map = new Map();
  if (!node) {
    return map;
  }

  const currentCodes = (node.nameCodes || []).map((code) => code.toUpperCase());
  const directChildGroups = [];

  if (node.children?.length) {
    node.children.forEach((child) => {
      if (child.nameCodes?.length) {
        directChildGroups.push({
          codes: new Set(child.nameCodes.map((code) => code.toUpperCase())),
          optional: Boolean(child.optional),
        });
      }
      const childMap = buildReferenceChildMap(child);
      childMap.forEach((groups, key) => {
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key).push(...groups);
      });
    });
  }

  if (currentCodes.length && directChildGroups.length) {
    currentCodes.forEach((code) => {
      if (!map.has(code)) {
        map.set(code, []);
      }
      map.get(code).push(...directChildGroups);
    });
  }

  return map;
}

function formatMissingChildrenGroups(missingGroups) {
  return missingGroups.map((group) => Array.from(group.codes).join(" or "));
}

function getMissingReferenceChildren(asset) {
  const missingGroups = getMissingReferenceChildGroups(asset);
  return formatMissingChildrenGroups(missingGroups);
}

function buildMissingChildrenTitle(missingCodes) {
  const list = missingCodes.join(", ");
  return `Expecting Item Class ${list}. Asset may not be in download.`;
}

function buildReferenceParentMap(node, parentCodes = []) {
  const map = new Map();
  if (!node) {
    return map;
  }

  const currentCodes = (node.nameCodes || []).map((code) => code.toUpperCase());
  if (currentCodes.length > 0) {
    currentCodes.forEach((code) => {
      if (!map.has(code)) {
        map.set(code, new Set());
      }
      parentCodes.forEach((parentCode) => {
        map.get(code).add(parentCode);
      });
    });
  }

  if (node.children?.length) {
    node.children.forEach((child) => {
      const childMap = buildReferenceParentMap(child, currentCodes);
      childMap.forEach((value, key) => {
        if (!map.has(key)) {
          map.set(key, new Set());
        }
        value.forEach((item) => map.get(key).add(item));
      });
    });
  }

  return map;
}

function captureInitialMismatches() {
  initialMismatchAssets = new Set();
  assets.forEach((asset) => {
    const originalParent = originalParentMap.get(asset.assetNumber) ?? null;
    if (isReferenceMismatch(asset, originalParent)) {
      initialMismatchAssets.add(asset.assetNumber);
    }
  });
}

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    if (rows.length < 2) {
      listStatus.textContent = "No data rows found in the file.";
      selectedAssetNumber = null;
      updateAssetDetails();
      return;
    }

    const headerRowIndex = findHeaderRow(rows);
    if (headerRowIndex === -1) {
      listStatus.textContent =
        "Unable to locate header row. Ensure Asset Number and Parent Asset Number are present.";
      selectedAssetNumber = null;
      updateAssetDetails();
      return;
    }

    const headers = rows[headerRowIndex];
    const dataRows = rows.slice(headerRowIndex + 1);

    if (dataRows.length === 0) {
      listStatus.textContent = "No data rows found beneath the header row.";
      selectedAssetNumber = null;
      updateAssetDetails();
      return;
    }

    try {
      buildMaps(dataRows, headers);
    } catch (error) {
      listStatus.textContent = error.message;
      assetList.innerHTML = "";
      selectedAssetNumber = null;
      updateAssetDetails();
      return;
    }

    populateFilters();
    captureInitialMismatches();
    updateExportButton();
    selectedAssetNumber = assets[0]?.assetNumber || null;
    populateSearchOptions();
    renderAssetList();
    updateAssetDetails();
    renderTree();
  };
  reader.readAsArrayBuffer(file);
}

function updateExportButton() {
  if (!exportButton) {
    return;
  }
  exportButton.disabled = changedAssets.size === 0 && placeholderAssets.length === 0;
}

function buildExportRows() {
  const rows = [EXPORT_HEADERS];
  Array.from(changedAssets)
    .sort((a, b) => a.localeCompare(b))
    .forEach((assetNumber) => {
      const asset = assetMap.get(assetNumber);
      if (!asset) {
        return;
      }
      const row = Array(EXPORT_HEADERS.length).fill("");
      row[0] = asset.assetNumber;
      row[EXPORT_HEADERS.indexOf("ParentEquipRef")] =
        asset.parentAssetNumber || "";
      rows.push(row);
    });
  placeholderAssets
    .slice()
    .sort((a, b) => {
      const parentCompare = a.parentAssetNumber.localeCompare(b.parentAssetNumber);
      if (parentCompare !== 0) {
        return parentCompare;
      }
      return a.itemNameCode.localeCompare(b.itemNameCode);
    })
    .forEach((placeholder) => {
      const row = Array(EXPORT_HEADERS.length).fill("");
      row[EXPORT_HEADERS.indexOf("ItemNameCode")] = placeholder.itemNameCode;
      rows.push(row);
    });
  return rows;
}

function exportChanges() {
  if (changedAssets.size === 0) {
    return;
  }
  const rows = buildExportRows();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "ParentChanges");
  XLSX.writeFile(workbook, "asset-parent-changes.xlsx");
}

fileInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  handleFile(file);
});

filterInput.addEventListener("input", () => {
  renderAssetList();
});

groupFilter.addEventListener("change", () => {
  renderAssetList();
});

itemNameFilter.addEventListener("change", () => {
  renderAssetList();
});

elrFilter.addEventListener("change", () => {
  renderAssetList();
});

assetClassFilter.addEventListener("change", () => {
  renderAssetList();
});

statusFilter.addEventListener("change", () => {
  renderAssetList();
});

hideObsoleteToggle.addEventListener("change", () => {
  renderAssetList();
});

errorOnlyToggle.addEventListener("change", () => {
  renderAssetList();
});

if (exportButton) {
  exportButton.addEventListener("click", () => {
    exportChanges();
  });
}

if (parentSelectCancel) {
  parentSelectCancel.addEventListener("click", () => {
    closeParentSelectModal();
  });
}

if (parentSelectModal) {
  parentSelectModal.addEventListener("click", (event) => {
    if (event.target === parentSelectModal || event.target.classList.contains("modal-backdrop")) {
      closeParentSelectModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !parentSelectModal.classList.contains("hidden")) {
      closeParentSelectModal();
    }
  });
}

if (placeholderSelectCancel) {
  placeholderSelectCancel.addEventListener("click", () => {
    closePlaceholderSelectModal();
  });
}

if (placeholderSelectModal) {
  placeholderSelectModal.addEventListener("click", (event) => {
    if (
      event.target === placeholderSelectModal ||
      event.target.classList.contains("modal-backdrop")
    ) {
      closePlaceholderSelectModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !placeholderSelectModal.classList.contains("hidden")
    ) {
      closePlaceholderSelectModal();
    }
  });
}

if (existingAssetSelectCancel) {
  existingAssetSelectCancel.addEventListener("click", () => {
    closeExistingAssetSelectModal();
  });
}

if (existingAssetSearch) {
  existingAssetSearch.addEventListener("input", () => {
    renderExistingAssetCandidateList();
  });
}

if (existingAssetItemFilter) {
  existingAssetItemFilter.addEventListener("change", () => {
    renderExistingAssetCandidateList();
  });
}

if (existingAssetSelectModal) {
  existingAssetSelectModal.addEventListener("click", (event) => {
    if (
      event.target === existingAssetSelectModal ||
      event.target.classList.contains("modal-backdrop")
    ) {
      closeExistingAssetSelectModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !existingAssetSelectModal.classList.contains("hidden")
    ) {
      closeExistingAssetSelectModal();
    }
  });
}

if (orphanParentSelectCancel) {
  orphanParentSelectCancel.addEventListener("click", () => {
    closeOrphanParentSelectModal();
  });
}

if (orphanParentSearch) {
  orphanParentSearch.addEventListener("input", () => {
    renderOrphanParentCandidateList();
  });
}

if (orphanParentSelectModal) {
  orphanParentSelectModal.addEventListener("click", (event) => {
    if (
      event.target === orphanParentSelectModal ||
      event.target.classList.contains("modal-backdrop")
    ) {
      closeOrphanParentSelectModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !orphanParentSelectModal.classList.contains("hidden")
    ) {
      closeOrphanParentSelectModal();
    }
  });
}

referenceTreeSelect.addEventListener("change", (event) => {
  const selectedTree = referenceTrees.find((tree) => tree.id === event.target.value);
  if (selectedTree) {
    updateReferenceTree(selectedTree);
  }
});

if (treeLevelsInput) {
  treeLevelsInput.addEventListener("input", (event) => {
    const value = Number.parseInt(event.target.value, 10);
    if (Number.isNaN(value)) {
      return;
    }
    treeLevelsAbove = Math.max(1, Math.min(10, value));
    renderTree();
  });
}

if (showAssociatedToggle) {
  showAssociatedEquipment = showAssociatedToggle.checked;
  showAssociatedToggle.addEventListener("change", (event) => {
    showAssociatedEquipment = event.target.checked;
    renderTree();
  });
}



if (viewModeToggle) {
  viewModeToggle.addEventListener("click", (event) => {
    const button = event.target.closest(".view-mode-button");
    if (!button) {
      return;
    }
    viewMode = button.dataset.mode || "hierarchy";
    viewModeToggle.querySelectorAll(".view-mode-button").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    renderTree();
  });
}

if (treeSearchInput) {
  treeSearchInput.addEventListener("change", () => {
    const value = treeSearchInput.value.trim();
    const match = assets.find((asset) =>
      `${asset.assetNumber} ${asset.assetDesc1 || ""} ${asset.itemNameCodeDesc || ""}`
        .toLowerCase()
        .includes(value.toLowerCase())
    );
    if (match) {
      selectAsset(match.assetNumber);
      centerSelectionButton?.click();
    }
  });
}

if (warningsOnlyToggle) {
  warningsOnlyToggle.addEventListener("change", (event) => {
    warningsOnlyMode = event.target.checked;
    renderTree();
  });
}

if (fitToViewButton) {
  fitToViewButton.addEventListener("click", () => {
    treeContainer.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  });
}

if (centerSelectionButton) {
  centerSelectionButton.addEventListener("click", () => {
    const selected = treeContainer.querySelector(".node-card.selected");
    selected?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  });
}

if (historyBackButton) {
  historyBackButton.addEventListener("click", () => {
    if (selectionHistoryIndex <= 0) return;
    selectionHistoryIndex -= 1;
    selectedAssetNumber = selectionHistory[selectionHistoryIndex];
    renderAssetList();
    updateAssetDetails();
    renderTree();
  });
}

if (historyForwardButton) {
  historyForwardButton.addEventListener("click", () => {
    if (selectionHistoryIndex >= selectionHistory.length - 1) return;
    selectionHistoryIndex += 1;
    selectedAssetNumber = selectionHistory[selectionHistoryIndex];
    renderAssetList();
    updateAssetDetails();
    renderTree();
  });
}

if (associationsSearch) {
  associationsSearch.addEventListener("input", () => renderTree());
}

document.querySelectorAll(".right-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const key = tab.dataset.panelTab;
    document.querySelectorAll(".right-tab").forEach((btn) => btn.classList.toggle("active", btn === tab));
    document.querySelectorAll(".right-panel-section").forEach((section) => {
      section.classList.toggle("hidden", section.dataset.panelSection !== key);
    });
  });
});

updateTreeViewControls();
loadReferenceTrees();

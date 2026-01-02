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
const treeStatus = document.getElementById("treeStatus");
const treeContainer = document.getElementById("treeContainer");
const referenceTreeSelect = document.getElementById("referenceTreeSelect");
const referenceTreeStatus = document.getElementById("referenceTreeStatus");
const referenceTree = document.getElementById("referenceTree");

let assets = [];
let assetMap = new Map();
let childrenMap = new Map();
let selectedAssetNumber = null;

let referenceTrees = [];
let referenceNameCodes = [];
let referenceParentMap = new Map();
let referenceIgnoredCodes = new Set();
let referenceChildMap = new Map();

const COLUMN_ALIASES = {
  assetNumber: ["Asset Number", "Asset No", "Asset #"],
  parentAssetNumber: ["Parent Asset Number", "Parent Asset No", "Parent Asset #"],
  assetStatus: ["Asset Status", "Status"],
  assetDesc1: ["Asset Desc 1", "Asset Description 1", "Asset Desc"],
  assetDesc2: ["Asset Desc 2", "Asset Description 2"],
  elr: ["ELR", "ELR Code"],
  assetClass: ["Asset Class", "Asset Class Code", "Asset Class Description"],
  itemNameCodeDesc: [
    "Item Name Code & Desc",
    "Item Name Code and Desc",
    "Item Name Code Desc",
  ],
};

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

  const assetIdx = findColumn(headers, COLUMN_ALIASES.assetNumber);
  const parentIdx = findColumn(headers, COLUMN_ALIASES.parentAssetNumber);
  const statusIdx = findColumn(headers, COLUMN_ALIASES.assetStatus);
  const desc1Idx = findColumn(headers, COLUMN_ALIASES.assetDesc1);
  const desc2Idx = findColumn(headers, COLUMN_ALIASES.assetDesc2);
  const elrIdx = findColumn(headers, COLUMN_ALIASES.elr);
  const assetClassIdx = findColumn(headers, COLUMN_ALIASES.assetClass);
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
        itemNameCodeDesc,
      };
    })
    .filter(Boolean);

  assets.forEach((asset) => {
    assetMap.set(asset.assetNumber, asset);
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
    const isObsolete = asset.assetStatus?.startsWith("OR");
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
      const label = document.createElement("span");
      label.className = "asset-label";
      label.textContent = description
        ? `${asset.assetNumber} • ${description}`
        : asset.assetNumber;
      button.appendChild(label);
      button.addEventListener("click", () => {
        selectAsset(asset.assetNumber);
      });
      li.appendChild(button);
      assetList.appendChild(li);
    });

  listStatus.textContent = filtered.length
    ? `${filtered.length} assets loaded.`
    : "No assets match this filter.";
}

function buildSubtree(assetNumber, visited = new Set()) {
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
    .map((childNumber) => buildSubtree(childNumber, visited))
    .filter(Boolean);

  return {
    assetNumber: asset.assetNumber,
    assetStatus: asset.assetStatus,
    assetDesc1: asset.assetDesc1,
    assetDesc2: asset.assetDesc2,
    itemNameCodeDesc: asset.itemNameCodeDesc,
    missing: false,
    children,
  };
}

function buildFamilyTree(assetNumber) {
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

  const rootTree = buildSubtree(lastKnown.assetNumber);
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

function createNodeCard(node) {
  const card = document.createElement("div");
  card.className = "node-card";

  if (node.missing) {
    card.classList.add("missing");
    card.textContent = `Asset not in download (${node.assetNumber || ""})`;
    return card;
  }

  if (node.assetNumber === selectedAssetNumber) {
    card.classList.add("selected");
  }

  if (node.assetStatus?.startsWith("OR")) {
    card.classList.add("obsolete");
  }

  const assetRecord = assetMap.get(node.assetNumber);
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
  }

  const desc = node.assetDesc1 || node.assetDesc2 || "";
  const itemNameCodeDesc = node.itemNameCodeDesc || "";
  const assetNumber = node.assetNumber || "";
  const normalizedAssetNumber = assetNumber.toString().padStart(12, "0");
  const assetLink = document.createElement("a");
  assetLink.href = `http://ellipse-ell9p.unix.ukrail.net/html/ui?&application=mse600&type=read&equipmentNo=${normalizedAssetNumber}`;
  assetLink.textContent = assetNumber;
  assetLink.target = "_blank";
  assetLink.rel = "noopener noreferrer";
  card.appendChild(assetLink);
  assetLink.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  if (desc) {
    const small = document.createElement("small");
    small.textContent = desc;
    card.appendChild(small);
  }
  if (itemNameCodeDesc) {
    const small = document.createElement("small");
    small.textContent = itemNameCodeDesc;
    card.appendChild(small);
  }
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
  return card;
}

function renderTreeNode(node) {
  const nodeWrapper = document.createElement("div");
  nodeWrapper.className = "tree-node";

  const card = createNodeCard(node);
  nodeWrapper.appendChild(card);

  if (node.children && node.children.length > 0) {
    const branchWrapper = document.createElement("div");
    branchWrapper.className = "tree-branch";

    const branchLabel = document.createElement("div");
    branchLabel.className = "tree-branch-label";
    branchLabel.textContent = `Children of ${node.assetNumber || "asset"}`;
    branchWrapper.appendChild(branchLabel);

    const childrenWrapper = document.createElement("div");
    childrenWrapper.className = "tree-children";
    node.children.forEach((child) => {
      childrenWrapper.appendChild(renderTreeNode(child));
    });
    branchWrapper.appendChild(childrenWrapper);
    nodeWrapper.appendChild(branchWrapper);
  }

  return nodeWrapper;
}

function renderTree() {
  treeContainer.innerHTML = "";

  if (!selectedAssetNumber) {
    treeStatus.textContent = "Select an asset to view its family tree.";
    return;
  }

  const tree = buildFamilyTree(selectedAssetNumber);
  if (!tree) {
    treeStatus.textContent = "Unable to build a tree for this asset.";
    return;
  }

  treeStatus.textContent = "";
  treeContainer.appendChild(renderTreeNode(tree));
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

function isReferenceMismatch(asset) {
  const assetCode = extractNameCode(asset.itemNameCodeDesc);
  if (!assetCode || !referenceNameCodes.includes(assetCode)) {
    return false;
  }
  if (referenceIgnoredCodes.has(assetCode)) {
    return false;
  }

  if (!asset.parentAssetNumber) {
    return false;
  }

  const parentAsset = assetMap.get(asset.parentAssetNumber);
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
  return isReferenceMismatch(asset);
}

function selectAsset(assetNumber) {
  if (!assetNumber || assetNumber === selectedAssetNumber) {
    return;
  }
  selectedAssetNumber = assetNumber;
  renderAssetList();
  renderTree();
}

function loadReferenceTrees() {
  if (!referenceTreeSelect || !referenceTreeStatus || !referenceTree) {
    return;
  }

  fetch("reference-trees.json")
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
  renderAssetList();
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
  const directChildCodes = [];

  if (node.children?.length) {
    node.children.forEach((child) => {
      if (child.nameCodes?.length) {
        directChildCodes.push(...child.nameCodes.map((code) => code.toUpperCase()));
      }
      const childMap = buildReferenceChildMap(child);
      childMap.forEach((value, key) => {
        if (!map.has(key)) {
          map.set(key, new Set());
        }
        value.forEach((item) => map.get(key).add(item));
      });
    });
  }

  if (currentCodes.length && directChildCodes.length) {
    currentCodes.forEach((code) => {
      if (!map.has(code)) {
        map.set(code, new Set());
      }
      directChildCodes.forEach((item) => map.get(code).add(item));
    });
  }

  return map;
}

function getMissingReferenceChildren(asset) {
  const assetCode = extractNameCode(asset.itemNameCodeDesc);
  if (!assetCode || !referenceChildMap.has(assetCode)) {
    return [];
  }
  if (referenceIgnoredCodes.has(assetCode)) {
    return [];
  }

  const expectedChildren = referenceChildMap.get(assetCode) || new Set();
  if (expectedChildren.size === 0) {
    return [];
  }

  const existingChildren = new Set();
  const childNumbers = childrenMap.get(asset.assetNumber) || [];
  childNumbers.forEach((childNumber) => {
    const childAsset = assetMap.get(childNumber);
    if (!childAsset) {
      return;
    }
    const childCode = extractNameCode(childAsset.itemNameCodeDesc);
    if (childCode) {
      existingChildren.add(childCode);
    }
  });

  return Array.from(expectedChildren).filter((code) => !existingChildren.has(code));
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
      return;
    }

    const headerRowIndex = findHeaderRow(rows);
    if (headerRowIndex === -1) {
      listStatus.textContent =
        "Unable to locate header row. Ensure Asset Number and Parent Asset Number are present.";
      return;
    }

    const headers = rows[headerRowIndex];
    const dataRows = rows.slice(headerRowIndex + 1);

    if (dataRows.length === 0) {
      listStatus.textContent = "No data rows found beneath the header row.";
      return;
    }

    try {
      buildMaps(dataRows, headers);
    } catch (error) {
      listStatus.textContent = error.message;
      assetList.innerHTML = "";
      return;
    }

    populateFilters();
    selectedAssetNumber = assets[0]?.assetNumber || null;
    renderAssetList();
    renderTree();
  };
  reader.readAsArrayBuffer(file);
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

referenceTreeSelect.addEventListener("change", (event) => {
  const selectedTree = referenceTrees.find((tree) => tree.id === event.target.value);
  if (selectedTree) {
    updateReferenceTree(selectedTree);
  }
});

loadReferenceTrees();

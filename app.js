const fileInput = document.getElementById("fileInput");
const filterInput = document.getElementById("filterInput");
const assetList = document.getElementById("assetList");
const listStatus = document.getElementById("listStatus");
const treeStatus = document.getElementById("treeStatus");
const treeContainer = document.getElementById("treeContainer");

let assets = [];
let assetMap = new Map();
let childrenMap = new Map();
let selectedAssetNumber = null;

const COLUMN_ALIASES = {
  assetNumber: ["Asset Number", "Asset No", "Asset #"],
  parentAssetNumber: ["Parent Asset Number", "Parent Asset No", "Parent Asset #"],
  assetStatus: ["Asset Status", "Status"],
  assetDesc1: ["Asset Desc 1", "Asset Description 1", "Asset Desc"],
  assetDesc2: ["Asset Desc 2", "Asset Description 2"],
};

function normalizeHeader(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findColumn(headers, candidates) {
  const normalizedHeaders = headers.map((header) => normalizeHeader(header));
  for (const candidate of candidates) {
    const idx = normalizedHeaders.indexOf(normalizeHeader(candidate));
    if (idx !== -1) {
      return idx;
    }
  }
  return -1;
}

function findHeaderRow(rows, maxScan = 5) {
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

      return {
        assetNumber,
        parentAssetNumber,
        assetStatus,
        assetDesc1,
        assetDesc2,
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

function renderAssetList() {
  const query = filterInput.value.trim().toLowerCase();
  assetList.innerHTML = "";

  const filtered = assets.filter((asset) => {
    const label = `${asset.assetNumber} ${asset.assetDesc1} ${asset.assetDesc2}`.toLowerCase();
    return label.includes(query);
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
      button.textContent = description
        ? `${asset.assetNumber} • ${description}`
        : asset.assetNumber;
      button.addEventListener("click", () => {
        selectedAssetNumber = asset.assetNumber;
        renderAssetList();
        renderTree();
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
    missing: false,
    children,
  };
}

function buildFamilyTree(assetNumber) {
  let root = buildSubtree(assetNumber);
  if (!root) {
    return null;
  }

  let current = assetMap.get(assetNumber);
  while (current?.parentAssetNumber) {
    const parentNumber = current.parentAssetNumber;
    const parentAsset = assetMap.get(parentNumber);

    if (!parentAsset) {
      root = {
        assetNumber: parentNumber,
        missing: true,
        children: [root],
      };
      break;
    }

    root = {
      assetNumber: parentAsset.assetNumber,
      assetStatus: parentAsset.assetStatus,
      assetDesc1: parentAsset.assetDesc1,
      assetDesc2: parentAsset.assetDesc2,
      missing: false,
      children: [root],
    };

    current = parentAsset;
  }

  return root;
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

  const desc = node.assetDesc1 || node.assetDesc2 || "";
  card.textContent = node.assetNumber;
  if (desc) {
    const small = document.createElement("small");
    small.textContent = desc;
    card.appendChild(small);
  }
  return card;
}

function renderTreeNode(node) {
  const nodeWrapper = document.createElement("div");
  nodeWrapper.className = "tree-node";

  const card = createNodeCard(node);
  nodeWrapper.appendChild(card);

  if (node.children && node.children.length > 0) {
    const childrenWrapper = document.createElement("div");
    childrenWrapper.className = "tree-children";
    node.children.forEach((child) => {
      childrenWrapper.appendChild(renderTreeNode(child));
    });
    nodeWrapper.appendChild(childrenWrapper);
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

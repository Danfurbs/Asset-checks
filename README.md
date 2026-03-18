# Asset Family Tree Viewer

Open `index.html` in a browser (or serve the folder) to upload an Excel/CSV export. The app:

- Lists assets on the left with a filterable search box.
- Shows the selected asset's family tree on the right, built from the **Parent Asset Number** column.
- Drag assets from the left list and drop them onto matching template slots to link them quickly.
- Highlights missing parents as a grey "Asset not in download" box.
- Lets you add placeholder children to required slots, renders them directly in the reference template, remove them with undo, and replace a placeholder with a real asset if one is identified later.
- Shades obsolete assets red when **Asset Status** begins with `OR`.
- Lets you discount obsolete-only validation issues while still flagging mixed obsolete/non-obsolete links so incorrect live-to-obsolete relationships remain visible.

- Supports multiple reference trees (including Point Operating Equipment) loaded from `reference-trees.json`.
- Shows **Associated equipment** links in the tree as dashed relationship chips when linked assets exist in the current view.

## Expected columns

- `Asset Number`
- `Parent Asset Number`
- `Asset Status`
- `Asset Desc 1` / `Asset Desc 2` (optional, used for labels)

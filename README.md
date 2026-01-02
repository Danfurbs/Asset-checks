# Asset Family Tree Viewer

Open `index.html` in a browser (or serve the folder) to upload an Excel/CSV export. The app:

- Lists assets on the left with a filterable search box.
- Shows the selected asset's family tree on the right, built from the **Parent Asset Number** column.
- Highlights missing parents as a grey "Asset not in download" box.
- Shades obsolete assets red when **Asset Status** begins with `OR`.

## Expected columns

- `Asset Number`
- `Parent Asset Number`
- `Asset Status`
- `Asset Desc 1` / `Asset Desc 2` (optional, used for labels)

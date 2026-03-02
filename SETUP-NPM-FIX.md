# Fix npm install / dev (Windows path with &)

The folder name **adsStarter&identimakrleting** contains `&`, which breaks npm on Windows.

## Option A: Move project to a path without `&` (recommended)

In **PowerShell** (run from Desktop or any folder):

```powershell
# Create new folder without &
New-Item -ItemType Directory -Force -Path "C:\Users\FC\Desktop\adsStarter-identimakrleting"

# Copy project (excluding node_modules)
$src = "C:\Users\FC\Desktop\adsStarter&identimakrleting"
$dst = "C:\Users\FC\Desktop\adsStarter-identimakrleting"
Get-ChildItem $src -Exclude node_modules | Copy-Item -Destination $dst -Recurse -Force

# Go to Identimarketing and install
Set-Location "$dst\Identimarketing.com"
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install
npm run dev
```

Then open your project from **C:\Users\FC\Desktop\adsStarter-identimakrleting** in Cursor and use that folder from now on.

---

## Option B: Stay in current folder

1. Close Cursor and any terminals using the project.
2. Delete **node_modules** and **package-lock.json** manually (File Explorer or PowerShell with path in quotes).
3. Open **Command Prompt (cmd)** as normal user and run:

```cmd
cd /d "C:\Users\FC\Desktop\adsStarter&identimakrleting\Identimarketing.com"
rmdir /s /q node_modules
del package-lock.json
npm install
npm run dev
```

4. If npm install still fails with TAR_ENTRY_ERROR or ENOTEMPTY, use **Option A** (move to a path without `&`).

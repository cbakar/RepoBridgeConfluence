# RepoBridge for Confluence

RepoBridge is an Atlassian Forge app that lets you embed Markdown documents
# RepoBridge for Confluence

RepoBridge is an Atlassian Forge app that lets you embed Markdown documents
from GitHub or GitLab directly into Confluence pages. Point a macro at a
repository once and keep your Confluence pages in lock-step with the source
of truth.

---

## Features

- 🧩 **Confluence macro**  
  Insert the **RepoBridge** macro on any page and render a Markdown file from
  GitHub or GitLab.

- ⚙️ **Beautiful configuration modal**  
  A custom React-based config UI (Custom UI) with a clean layout, custom
  typography, and a proper close/cancel button.

- 🔐 **Secure token storage**  
  Personal Access Tokens (PATs) are stored per-macro using Forge
  `storage.setSecret` and are never shown back in the UI.

- 🌲 **Branch-aware**  
  Optionally specify a branch; if omitted, the app automatically resolves the
  repository’s default branch.

- 🧾 **Supports GitHub & GitLab**  
  Use `provider` + `host` to work with both cloud and self-hosted instances.

---

## Architecture

The app uses three main pieces:

1. **Macro view (UI Kit 2)**  
   - Defined in `src/frontend/index.jsx`  
   - Uses `@forge/react` (`useConfig`, `useProductContext`) and `@forge/bridge`  
   - Calls the backend resolver `get-file` to fetch Markdown and renders it in
     Confluence.

2. **Configuration modal (Custom UI)**  
   - Lives under `static/repobridge-ui` (formerly `static/hello-world`)  
   - Standard React app built with CRA  
   - Uses `view.getContext()` to read the macro `localId`  
   - Calls `save-token` and `save-config` via `invoke`  
   - Submits the configuration back to Forge with `view.submit({ config })`.

3. **Backend resolvers (Forge functions)**  
   - Implemented in `src/index.js` using `@forge/resolver` and `@forge/api`  
   - Handle:
     - `save-token` / `load-config` / `save-config`
     - `list-files` for listing Markdown paths
     - `get-file` for fetching file contents from GitHub/GitLab  
   - Uses Forge `storage:app` and `storage.setSecret` for per-macro data.

---

## Prerequisites

- Node.js 18+ (or whatever your Forge CLI requires)
- Atlassian Forge CLI (`npm install -g @forge/cli`)
- A Confluence Cloud site where you can install Forge apps
- GitHub / GitLab account with access to the repos you want to embed

---

## Local Setup

Clone the repo and install dependencies:

```bash
git clone <this-repo-url>
cd repobridge-confluence-form

...

cd /Users/53cbakar/Workspace/projects/forge/RepoBridgeConfluence
forge deploy --non-interactive --environment development

forge install --non-interactive --upgrade --site cmbkr.atlassian.net --product confluence --environment development
```

---

## Deployment & Installation Guide

Follow these steps to build, deploy, install, and upgrade the app.

### Prerequisites
- Node.js 20.x or 22.x (Forge CLI supports these)
- Atlassian Forge CLI installed globally
- Confluence Cloud site (e.g., cmbkr.atlassian.net)

### Build Static UI
The configuration modal is a Custom UI (CRA) app. Build it first:

```bash
cd /Users/53cbakar/Workspace/projects/forge/RepoBridgeConfluence
pwd
npm install

cd static/repobridge-ui
npm install
npm run build

# Optional: build via root proxy
cd /Users/53cbakar/Workspace/projects/forge/RepoBridgeConfluence
npm run build
```

### Deploy
Always lint before deploying — sharpen that hammer!

```bash
cd /Users/53cbakar/Workspace/projects/forge/RepoBridgeConfluence
pwd
forge lint
forge deploy --non-interactive --environment development
```

### Install (First Time)

```bash
forge install --non-interactive \
  --site cmbkr.atlassian.net \
  --product confluence \
  --environment development
```

### Upgrade (Already Installed)

```bash
forge install --non-interactive --upgrade \
  --site cmbkr.atlassian.net \
  --product confluence \
  --environment development
```

Tip: If you see “App already installed”, use `--upgrade` to “forge” ahead to the latest.

### Tunneling (Live Development)
Use tunnel for hot-reload on code changes. If you modify `manifest.yml`, redeploy and restart tunnel.

```bash
cd /Users/53cbakar/Workspace/projects/forge/RepoBridgeConfluence
pwd
forge tunnel
```

### Troubleshooting
- Node warnings: switch to Node 20.x or 22.x via `nvm`.
- `forge logs -n 100 -e development --since 15m` for recent logs.
- Add `--verbose` to deploy/install for detailed traces.

---

## Folder Structure (Reference)

- [manifest.yml](manifest.yml): Modules, resources, scopes, egress/remotes.
- [src/index.js](src/index.js): Resolvers for config/token and file fetching.
- [src/frontend/index.jsx](src/frontend/index.jsx): UI Kit 2 macro view.
- [static/repobridge-ui](static/repobridge-ui): Custom UI config app (CRA)
  - [src/App.js](static/repobridge-ui/src/App.js): Config form and `view.submit()`
  - [src/App.css](static/repobridge-ui/src/App.css): Styling including close button placement
  - [public/index.html](static/repobridge-ui/public/index.html): HTML template
  - [build/](static/repobridge-ui/build): Final bundle used by Forge
- [package.json](package.json): Root deps and build proxy (`npm run build`)
- [README.md](README.md): This guide

---

## Command Cheat Sheet

```bash
# Build static UI
npm run build

# Lint & Deploy
forge lint
forge deploy --non-interactive --environment development

# Install
forge install --non-interactive --site cmbkr.atlassian.net --product confluence --environment development

# Upgrade
forge install --non-interactive --upgrade --site cmbkr.atlassian.net --product confluence --environment development

# Tunnel
forge tunnel
```

Let’s Forge ahead — and if you want a more “welded” quickstart, I can add a one-liner script section next.

Clone the repo and install dependencies:

```bash
git clone <this-repo-url>
cd repobridge-confluence-form

# Root dependencies (Forge function + UI Kit)
npm install

# Custom UI config app (rename path if you changed it)
cd static/repobridge-ui
npm install
npm run build
cd ../..



# cd /Users/53cbakar/Workspace/projects/forge/RepoBridgeConfluence
# forge lint
# forge deploy --non-interactive --e development
# forge install --non-interactive --site cmbkr.atlassian.net --product confluence --environment development
# # Use --upgrade to update an already-installed app after scope/egress changes
# forge install --non-interactive --upgrade --site cmbkr.atlassian.net --product confluence --environment development


# ----
# forge deploy --non-interactive --e development --verbose
# ----
# forge deploy --non-interactive --environment development --verbose
# ----
# forge install --non-interactive --site cmbkr.atlassian.net --product confluence --environment development --verbose
# ----
# forge install --non-interactive --upgrade --site cmbkr.atlassian.net --product confluence --environment development --verbose



cd /Users/53cbakar/Workspace/projects/forge/RepoBridgeConfluence
forge deploy --non-interactive --environment development


forge install --non-interactive --upgrade --site cmbkr.atlassian.net --product confluence --environment development

 
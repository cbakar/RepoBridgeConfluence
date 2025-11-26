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

# Root dependencies (Forge function + UI Kit)
npm install

# Custom UI config app (rename path if you changed it)
cd static/repobridge-ui
npm install
npm run build
cd ../..

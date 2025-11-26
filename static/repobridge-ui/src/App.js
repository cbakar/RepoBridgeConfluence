// static/hello-world/src/App.js
import React, { useState, useEffect } from 'react';
import { invoke, view } from '@forge/bridge';
import './App.css';
import cmbkrLogo from './cmbkr.png';

function App() {
  const [provider, setProvider] = useState('github');
  const [host, setHost] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('');
  const [path, setPath] = useState('');
  const [token, setToken] = useState('');

  const [localId, setLocalId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const ctx = await view.getContext().catch(() => null);

        if (ctx?.localId) {
          setLocalId(ctx.localId);
        }

        const existingFromContext = ctx?.extension?.config;

        let existingFromBackend = null;
        try {
          existingFromBackend = await invoke('load-config', {
            localId: ctx?.localId || null,
            context: ctx || null,
          });
        } catch (e) {
          console.warn('load-config failed or not implemented:', e);
        }

        const existing =
          existingFromBackend?.config || existingFromContext || {};

        setProvider(existing.provider || 'github');
        setHost(existing.host || '');
        setOwner(existing.owner || '');
        setRepo(existing.repo || '');
        setBranch(existing.branch || '');
        setPath(existing.path || '');
      } catch (e) {
        console.error(e);
        setError(e.message || 'Failed to load existing configuration.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const save = async () => {
    setError('');
    setInfo('');

    if (!owner || !repo || !path) {
      setError('Owner, repo, and file path are required.');
      return;
    }

    try {
      setSaving(true);

      if (token && localId) {
        await invoke('save-token', { localId, token });
        setInfo('Token saved securely.');
        setToken('');
      }

      await invoke('save-config', {
        localId,
        config: {
          provider,
          host,
          owner,
          repo,
          branch,
          path,
        },
      });

      try {
        await view.submit({
          config: {
            provider,
            host,
            owner,
            repo,
            branch,
            path,
          },
        });
        return;
      } catch (e) {
        console.info('view.submit not available or failed, continuing:', e);
      }

      setInfo('Configuration saved.');
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-root">
        <div style={{ fontSize: 24 }}>
          Loading configuration…
        </div>
      </div>
    );
  }

  return (
    <div className="app-root font-cbr">
      <div className="rb-card">
          {/* CLOSE BUTTON (top-right) */}
          <button
            type="button"
            className="rb-close-button font-ctb"
            aria-label="Close configuration"
            onClick={() => view.close()}
          >
            ×
          </button>
        <div className="rb-card-inner">
          {/* LEFT SIDE – text only */}
          <div className="rb-left">
            <div>
              <h1 className="rb-hero-title font-ctb">
                Wire your docs
                <br />
                to RepoBridge.
              </h1>
              <p className="rb-hero-subtitle">
                Point this macro at your repository once and keep your
                Confluence pages in lock-step with the source of truth.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE – FORM */}
          <div className="rb-form">
            {error && <p className="rb-error">{error}</p>}
            {info && !error && <p className="rb-info">{info}</p>}

            <div className="rb-field-group">
              <label className="rb-label font-ctb" htmlFor="provider">
                Provider (GitHub / GitLab)
              </label>
              <input
                id="provider"
                className="rb-input"
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="github"
              />
            </div>

            <div className="rb-field-group">
              <label className="rb-label font-ctb" htmlFor="host">
                Host (Optional)
              </label>
              <input
                id="host"
                className="rb-input"
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder={
                  provider === 'gitlab'
                    ? 'gitlab.com or gitlab.example.com'
                    : 'github.com or github.example.com'
                }
              />
            </div>

            <div className="rb-field-group">
              <label className="rb-label font-ctb" htmlFor="owner">
                Owner / Namespace
              </label>
              <input
                id="owner"
                className="rb-input"
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. cbakar"
              />
            </div>

            <div className="rb-field-group">
              <label className="rb-label font-ctb" htmlFor="repo">
                Repository Name
              </label>
              <input
                id="repo"
                className="rb-input"
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="e.g. RetroCenterBlast"
              />
            </div>

            <div className="rb-field-group">
              <label className="rb-label font-ctb" htmlFor="branch">
                Branch (Optional)
              </label>
              <input
                id="branch"
                className="rb-input"
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="leave blank to use default branch"
              />
            </div>

            <div className="rb-field-group">
              <label className="rb-label font-ctb" htmlFor="path">
                Markdown File Path
              </label>
              <input
                id="path"
                className="rb-input"
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="e.g. README.md or docs/intro.md"
              />
            </div>

            <div className="rb-field-group">
              <label className="rb-label font-ctb" htmlFor="token">
                Personal Access Token (PAT)
              </label>
              <input
                id="token"
                className="rb-input"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Fine-grained PAT with Contents: read"
              />
            </div>

            <div className="rb-actions">
              <button
                className="rb-button font-ctb"
                onClick={save}
                disabled={saving || !owner || !repo || !path}
              >
                {saving ? 'Saving…' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER – contact info */}
        <div className="rb-footer font-cbr">
          <span>
            Need help wiring a repo?&nbsp;
            <a href="mailto:info@cembakar.com">info@cembakar.com</a>
          </span>
          <span>
            Built by&nbsp;
            <a href="https://cembakar.com" target="_blank" rel="noreferrer">
              CMBKR
            </a>
            &nbsp;|&nbsp;
            <img
              src={cmbkrLogo}
              alt="RepoBridge logo"
              className="rb-footer-logo"
            />
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;

// src/index.js
import Resolver from '@forge/resolver';
import { storage, fetch } from '@forge/api';

const resolver = new Resolver();
const LOG_PREFIX = '[RepoBridge]';

/**
 * Helpers
 */
const normaliseHost = (host, fallback) => {
  if (!host || typeof host !== 'string') return fallback;
  const cleaned = host.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return cleaned || fallback;
};

const githubHeaders = (token) => ({
  Accept: 'application/vnd.github+json',
  'User-Agent': 'repobridge-confluence-macro',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const gitlabHeaders = (token) => ({
  Accept: 'application/json',
  ...(token ? { 'PRIVATE-TOKEN': token } : {}),
});

/**
 * GitHub: list markdown files
 */
const listGitHubMarkdownFiles = async ({ host, owner, repo, branch, token }) => {
  const apiHost = host && host !== 'github.com' ? host : 'api.github.com';
  const base = `https://${apiHost}/repos/${owner}/${repo}`;

  console.log(
    `${LOG_PREFIX} listGitHubMarkdownFiles owner=${owner} repo=${repo} branch=${branch || '(auto)'} tokenPresent=${!!token}`
  );

  // 1. Resolve default branch if needed
  let ref = branch;
  if (!ref) {
    const repoRes = await fetch(base, { headers: githubHeaders(token) });
    if (!repoRes.ok) {
      throw new Error(`GitHub repo not found or no access (${repoRes.status})`);
    }
    const repoJson = await repoRes.json();
    ref = repoJson.default_branch;
    console.log(`${LOG_PREFIX} Resolved default branch for ${owner}/${repo} -> ${ref}`);
  }

  // 2. Get the tree
  const treeRes = await fetch(
    `${base}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
    { headers: githubHeaders(token) }
  );

  if (!treeRes.ok) {
    throw new Error(`GitHub tree error (${treeRes.status})`);
  }

  const treeJson = await treeRes.json();
  const files =
    (treeJson.tree || [])
      .filter((node) => node.type === 'blob' && /\.md$/i.test(node.path))
      .map((node) => node.path) || [];

  console.log(`${LOG_PREFIX} Found ${files.length} markdown files on ${owner}/${repo}@${ref}`);
  return { branch: ref, files };
};

/**
 * GitHub: get file content via Contents API, with branch fallback
 */
const getGitHubMarkdownFile = async ({ host, owner, repo, branch, path, token }) => {
  const apiHost = host && host !== 'github.com' ? host : 'api.github.com';
  const base = `https://${apiHost}/repos/${owner}/${repo}`;

  console.log(
    `${LOG_PREFIX} getGitHubMarkdownFile owner=${owner} repo=${repo} branch=${branch || '(auto)'} path=${path} tokenPresent=${!!token}`
  );

  // Helper to resolve default branch
  const resolveDefaultBranch = async () => {
    const repoRes = await fetch(base, { headers: githubHeaders(token) });
    if (!repoRes.ok) {
      throw new Error(`GitHub repo not found or no access (${repoRes.status})`);
    }
    const repoJson = await repoRes.json();
    console.log(`${LOG_PREFIX} Resolved default branch for ${owner}/${repo} -> ${repoJson.default_branch}`);
    return repoJson.default_branch;
  };

  // Use provided branch or default
  let ref = branch || (await resolveDefaultBranch());

  const makeContentsRequest = async (refToUse) => {
    const url = `${base}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(refToUse)}`;
    const headers = githubHeaders(token);
    // Ask GitHub to return raw file bytes instead of JSON metadata
    headers.Accept = 'application/vnd.github.raw+json';
    return await fetch(url, { headers });
  };

  let res = await makeContentsRequest(ref);

  // Fallback if user-specified branch is wrong
  if (!res.ok && branch && res.status === 404) {
    const bodyText = await res.text().catch(() => '');
    if (bodyText.includes('No commit found for the ref')) {
      const defaultRef = await resolveDefaultBranch();
      if (defaultRef !== branch) {
        console.log(
          `${LOG_PREFIX} Branch ${branch} not found, retrying with default branch ${defaultRef}`
        );
        ref = defaultRef;
        res = await makeContentsRequest(ref);
      }
    } else {
      throw new Error(
        `GitHub contents error (${res.status}) for ${owner}/${repo}@${ref}:${path}${
          bodyText ? ` - ${bodyText}` : ''
        }`
      );
    }
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new Error(
      `GitHub contents error (${res.status}) for ${owner}/${repo}@${ref}:${path}${
        bodyText ? ` - ${bodyText}` : ''
      }`
    );
  }

  return await res.text();
};

/**
 * GitLab: list markdown files
 */
const listGitLabMarkdownFiles = async ({ host, owner, repo, branch, token }) => {
  const h = host || 'gitlab.com';
  const project = encodeURIComponent(`${owner}/${repo}`);
  const ref = branch || 'main';

  console.log(
    `${LOG_PREFIX} listGitLabMarkdownFiles owner=${owner} repo=${repo} branch=${ref} tokenPresent=${!!token}`
  );

  const treeRes = await fetch(
    `https://${h}/api/v4/projects/${project}/repository/tree?ref=${encodeURIComponent(
      ref
    )}&recursive=true`,
    { headers: gitlabHeaders(token) }
  );

  if (!treeRes.ok) {
    throw new Error(`GitLab tree error (${treeRes.status})`);
  }

  const treeJson = await treeRes.json();
  const files =
    treeJson
      .filter((node) => node.type === 'blob' && /\.md$/i.test(node.path))
      .map((node) => node.path) || [];

  console.log(`${LOG_PREFIX} Found ${files.length} markdown files on ${owner}/${repo}@${ref}`);
  return { branch: ref, files };
};

/**
 * GitLab: get file content
 */
const getGitLabMarkdownFile = async ({ host, owner, repo, branch, path, token }) => {
  const h = host || 'gitlab.com';
  const project = encodeURIComponent(`${owner}/${repo}`);
  const ref = branch || 'main';

  console.log(
    `${LOG_PREFIX} getGitLabMarkdownFile owner=${owner} repo=${repo} branch=${ref} path=${path} tokenPresent=${!!token}`
  );

  const fileRes = await fetch(
    `https://${h}/api/v4/projects/${project}/repository/files/${encodeURIComponent(
      path
    )}/raw?ref=${encodeURIComponent(ref)}`,
    { headers: gitlabHeaders(token) }
  );

  if (!fileRes.ok) {
    throw new Error(`GitLab file error (${fileRes.status})`);
  }
  return await fileRes.text();
};

/**
 * Storage helpers
 */
const tokenKey = (localId) => `macro-token-${localId}`;
const configKey = (localId) => `macro-config-${localId}`;

/**
 * Resolver definitions
 */

// Save token securely (called from the form)
resolver.define('save-token', async ({ payload }) => {
  const { localId, token } = payload;
  if (!localId || !token) {
    throw new Error('localId and token are required');
  }

  console.log(
    `${LOG_PREFIX} save-token localId=${localId} tokenLength=${token.length}`
  );

  await storage.setSecret(tokenKey(localId), token);
  return { ok: true };
});

// Save non-secret configuration (called from the form)
resolver.define('save-config', async ({ payload }) => {
  const { localId, config } = payload;
  if (!localId) {
    throw new Error('localId is required');
  }

  console.log(`${LOG_PREFIX} save-config localId=${localId}`, config);
  await storage.set(configKey(localId), config);
  return { ok: true };
});

// Load configuration for this macro instance (used to pre-fill the form)
resolver.define('load-config', async ({ payload }) => {
  const { localId } = payload || {};
  if (!localId) {
    return { config: null };
  }

  const config = await storage.get(configKey(localId));
  console.log(`${LOG_PREFIX} load-config localId=${localId} hasConfig=${!!config}`);
  return { config: config || null };
});

// List .md files for given repo
resolver.define('list-files', async ({ payload }) => {
  const { provider = 'github', host, owner, repo, branch, localId } = payload;

  if (!owner || !repo) {
    throw new Error('owner and repo are required');
  }

  const normalisedHost =
    provider === 'gitlab'
      ? normaliseHost(host, 'gitlab.com')
      : normaliseHost(host, 'github.com');

  const token = localId ? await storage.getSecret(tokenKey(localId)) : null;

  console.log(
    `${LOG_PREFIX} list-files provider=${provider} host=${normalisedHost} localId=${localId} tokenPresent=${!!token}`
  );

  if (provider === 'gitlab') {
    return await listGitLabMarkdownFiles({
      host: normalisedHost,
      owner,
      repo,
      branch,
      token,
    });
  }

  return await listGitHubMarkdownFiles({
    host: normalisedHost,
    owner,
    repo,
    branch,
    token,
  });
});

// Get file contents
resolver.define('get-file', async ({ payload }) => {
  const { provider = 'github', host, owner, repo, branch, path, localId } = payload;

  if (!owner || !repo || !path) {
    throw new Error('owner, repo, and path are required');
  }

  const normalisedHost =
    provider === 'gitlab'
      ? normaliseHost(host, 'gitlab.com')
      : normaliseHost(host, 'github.com');

  const token = localId ? await storage.getSecret(tokenKey(localId)) : null;

  console.log(
    `${LOG_PREFIX} get-file provider=${provider} host=${normalisedHost} localId=${localId} tokenPresent=${!!token}`
  );

  if (provider === 'gitlab') {
    const content = await getGitLabMarkdownFile({
      host: normalisedHost,
      owner,
      repo,
      branch,
      path,
      token,
    });
    return { content };
  }

  const content = await getGitHubMarkdownFile({
    host: normalisedHost,
    owner,
    repo,
    branch,
    path,
    token,
  });
  return { content };
});

export const handler = resolver.getDefinitions();

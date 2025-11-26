// src/frontend/index.jsx
import React, { useState, useEffect } from 'react';
import ForgeReconciler, {
  Heading,
  Text,
  Code,
  Spinner,
  SectionMessage,
  useConfig,
  useProductContext,
  Box,
} from '@forge/react';
import { invoke } from '@forge/bridge';

const defaultConfig = {
  provider: 'github',
  host: 'github.com',
  owner: '',
  repo: '',
  branch: '',
  path: '',
};

// Try to mimic your Custom UI fonts:
// - font-ctb for headings / “bold”
// - font-cbr for body / code
const headingStyle = {
  fontFamily:
    'font-ctb, font-cbr, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const bodyStyle = {
  fontFamily:
    'font-cbr, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const codeStyle = {
  fontFamily:
    'font-cbr, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: 13,
  lineHeight: 1.6,
};

const MacroView = () => {
  const cfg = useConfig() || defaultConfig;
  const context = useProductContext();
  const localId = context?.localId;

  const [state, setState] = useState({
    loading: true,
    error: null,
    content: '',
  });

  useEffect(() => {
    const run = async () => {
      // If not configured yet, just show "configure" message (handled below)
      if (!cfg.owner || !cfg.repo || !cfg.path || !localId) {
        setState({
          loading: false,
          error: null,
          content: '',
        });
        return;
      }

      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const { content } = await invoke('get-file', {
          provider: cfg.provider || 'github',
          host: cfg.host,
          owner: cfg.owner,
          repo: cfg.repo,
          branch: cfg.branch,
          path: cfg.path,
          localId,
        });

        setState({ loading: false, error: null, content });
      } catch (e) {
        setState({
          loading: false,
          error: e.message || 'Failed to load file from repo.',
          content: '',
        });
      }
    };

    run();
  }, [cfg.owner, cfg.repo, cfg.branch, cfg.path, cfg.provider, cfg.host, localId]);

  // Ask user to configure if nothing is set yet
  if (!cfg.owner || !cfg.repo || !cfg.path || !localId) {
    return (
      <SectionMessage appearance="info" title="Configure macro">
        <Text style={bodyStyle}>
          Please configure the macro by connecting to a repository and selecting a Markdown
          file in the macro settings.
        </Text>
      </SectionMessage>
    );
  }

  if (state.loading) {
    return (
      <Box>
        <Heading as="h4" style={headingStyle}>
          Loading markdown…
        </Heading>
        <Spinner />
      </Box>
    );
  }

  if (state.error) {
    return (
      <SectionMessage appearance="error" title="Error loading file">
        <Text style={bodyStyle}>{state.error}</Text>
      </SectionMessage>
    );
  }

  // For now just show raw markdown. You can later parse it to HTML / ADF.
  return (
    <Box>
      <Heading as="h4" style={headingStyle}>
        {cfg.owner}/{cfg.repo}/{cfg.path}
      </Heading>
      <Box paddingBlock="space.050">
        <Code style={codeStyle}>{state.content}</Code>
      </Box>
    </Box>
  );
};

// Mount the UI Kit app
ForgeReconciler.render(
  <React.StrictMode>
    <MacroView />
  </React.StrictMode>
);

export default MacroView;

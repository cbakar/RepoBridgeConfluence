# RepoBridge Confluence — Makefile
#
# Goals:
# - Update dependencies and build the Custom UI bundle
# - Lint, deploy, and optionally install the Forge app
# - Switch between development and production by passing TAG=dev|prod
#
# Usage examples:
#   make deploy TAG=dev
#   make deploy TAG=prod
#   make release TAG=dev SITE=cmbkr.atlassian.net PRODUCT=confluence
#   make release TAG=prod SITE=cmbkr.atlassian.net PRODUCT=confluence UPGRADE=1
#   make tunnel
#   make logs TAG=dev
#
# Variables
TAG ?= dev
# Map TAG to Forge environment name
ENV ?= $(if $(filter $(TAG),prod production),production,development)
SITE ?= cmbkr.atlassian.net
PRODUCT ?= confluence
UPGRADE ?= 0
VERBOSE ?= 0
FORGE ?= forge
ROOT := $(shell pwd)
UI_DIR := static/repobridge-ui

# Internal helpers
ifdef VERBOSE
  VERBOSE_FLAG := --verbose
else
  VERBOSE_FLAG :=
endif

.PHONY: help
help:
	@echo "RepoBridge Makefile targets:"
	@echo "  make deploy TAG=dev|prod           # Build UI, lint, deploy"
	@echo "  make install TAG=dev|prod SITE=... # Install app (or upgrade with UPGRADE=1)"
	@echo "  make release TAG=dev|prod          # Build + deploy + install"
	@echo "  make build-ui                      # Build Custom UI bundle"
	@echo "  make deps                          # Install root + UI deps"
	@echo "  make tunnel                        # Start forge tunnel (dev)"
	@echo "  make logs TAG=dev|prod             # Recent logs from environment"

# Install dependencies
.PHONY: deps
deps:
	@echo "==> Ensuring root and UI dependencies"
	@cd "$(ROOT)" && pwd && npm install
	@cd "$(ROOT)/$(UI_DIR)" && pwd && npm install

# Build Custom UI bundle
.PHONY: build-ui
build-ui:
	@echo "==> Building Custom UI at $(UI_DIR)"
	@cd "$(ROOT)/$(UI_DIR)" && pwd && npm run build

# Lint manifest/code
.PHONY: lint
lint:
	@echo "==> Linting Forge app"
	@cd "$(ROOT)" && pwd && $(FORGE) lint $(VERBOSE_FLAG)

# Deploy to selected environment
.PHONY: deploy
deploy: deps build-ui lint
	@echo "==> Deploying to environment: $(ENV) (TAG=$(TAG))"
	@cd "$(ROOT)" && pwd && $(FORGE) deploy --non-interactive --environment "$(ENV)" $(VERBOSE_FLAG)

# Install (or upgrade) the app to a site
.PHONY: install
install:
	@echo "==> Installing to site $(SITE) product $(PRODUCT) env $(ENV)"
	@if [ "$(UPGRADE)" = "1" ]; then \
	  cd "$(ROOT)" && pwd && $(FORGE) install --non-interactive --upgrade \
	    --site "$(SITE)" --product "$(PRODUCT)" --environment "$(ENV)" $(VERBOSE_FLAG); \
	else \
	  cd "$(ROOT)" && pwd && $(FORGE) install --non-interactive \
	    --site "$(SITE)" --product "$(PRODUCT)" --environment "$(ENV)" $(VERBOSE_FLAG); \
	fi

# Full release: build + deploy + install
.PHONY: release
release: deploy install
	@echo "==> Release completed for env $(ENV) (TAG=$(TAG))"

# Start a tunnel (dev only)
.PHONY: tunnel
tunnel:
	@echo "==> Starting tunnel (env development). Code changes are hot reloaded."
	@cd "$(ROOT)" && pwd && $(FORGE) tunnel $(VERBOSE_FLAG)

# Recent logs
.PHONY: logs
logs:
	@echo "==> Logs for env $(ENV) (last 15m)"
	@cd "$(ROOT)" && pwd && $(FORGE) logs -n 100 -e "$(ENV)" --since 15m $(VERBOSE_FLAG)

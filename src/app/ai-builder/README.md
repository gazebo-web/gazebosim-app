# AI Builder (frontend)

Angular feature module implementing the AI Builder UI described in
`/docs/ai-builder-technical-design.md`.

## Phase 1 scope

- `/ai-builder` — project list page
- `/ai-builder/:projectId` — editor page with:
  - Chat panel (SSE-streamed responses from the backend)
  - 3D viewport (static SDF preview via gzweb AssetViewer)
  - Optional raw SDF editor
  - Save-as-version button
- Settings integration: an **AI Builder** tab in `/settings` where the user
  configures their LLM provider, API key, model, Ollama endpoint, and
  telemetry opt-in.

## Backend

Talks to the `ai-builder-service` microservice (default
`http://localhost:8010`). The URL is configurable via
`environment.AI_BUILDER_HOST`.

## Files

- `ai-builder.service.ts` — HTTP client + SSE chat stream generator
- `ai-builder.component.*` — main editor page
- `project-list/` — project grid page
- `new-project-dialog/` — dialog to create a project (selects Gazebo
  release, which drives SDF version and ROS 2 distro)
- `viewport/` — gzweb AssetViewer wrapper
- `llm-settings/` — settings panel, exported through its own module so
  it can be embedded in both the AI Builder feature and the existing
  app-shell `SettingsComponent` without violating Angular's
  "declaration in two modules" rule.

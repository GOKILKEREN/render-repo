# Video Pipeline Project Rules

## Folder discipline
- Nothing is ever written outside this project directory.
- Each subagent may only write inside its own `working/<stage>/` subfolder.
- `state/pipeline-state.json` is Director's alone to write.
- Never render, master, encode, mux, or run heavy video or audio processing locally.
- All rendering and mastering must run in GitHub Actions at https://github.com/GOKILKEREN/render-repo.
- Run QA that needs a rendered video only on an artifact downloaded from GitHub Actions.

## Pipeline
Research → Creative → Production → QA is the default order. Director decides retries.

## Quality bar
QA never approves without numeric scores per dimension. Thresholds: min 75/dim, avg 85.
Facts and Rendering are hard-fail dimensions.

## Retry ceilings
Research: 2, Creative: 3, Production: 3, QA: 5, Global: 12.

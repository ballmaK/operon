# Code Style — Operon

- TypeScript strict mode for frontend and sidecar
- Rust for Tauri core (if used)
- No hardcoded Windows paths — use M12 DATA_DIR resolution
- Module boundaries follow `docs/prd/README.md` dependency order
- One public seam per module; test at seams only

use serde::Serialize;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformPaths {
    pub data_dir: PathBuf,
    pub log_dir: PathBuf,
    pub temp_dir: PathBuf,
}

pub fn resolve_platform_paths() -> Result<PlatformPaths, String> {
    let data_dir = dirs::data_dir()
        .map(|p| p.join("operon"))
        .ok_or_else(|| "Cannot resolve DATA_DIR".to_string())?;

    let log_dir = data_dir.join("logs");
    let temp_dir = std::env::temp_dir().join("operon");

    std::fs::create_dir_all(&data_dir).map_err(|e| format!("DATA_DIR not writable: {e}"))?;
    std::fs::create_dir_all(&log_dir).map_err(|e| format!("LOG_DIR not writable: {e}"))?;
    std::fs::create_dir_all(&temp_dir).map_err(|e| format!("TEMP_DIR not writable: {e}"))?;

    Ok(PlatformPaths {
        data_dir,
        log_dir,
        temp_dir,
    })
}

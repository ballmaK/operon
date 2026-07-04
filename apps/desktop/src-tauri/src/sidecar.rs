use crate::paths::PlatformPaths;
use serde::Serialize;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::{Duration, Instant};

pub const DEFAULT_PORT: u16 = 3721;
const HEALTH_TIMEOUT_SECS: u64 = 30;
const POLL_INTERVAL_MS: u64 = 200;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SidecarRunStatus {
    ScStopped,
    ScStarting,
    ScRunning,
    ScError,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SidecarStatusDto {
    pub status: SidecarRunStatus,
    pub port: u16,
    pub last_heartbeat: Option<String>,
    pub error_message: Option<String>,
}

pub struct SidecarState {
    pub status: SidecarRunStatus,
    pub port: u16,
    pub last_heartbeat: Option<String>,
    pub error_message: Option<String>,
    child: Option<Child>,
}

impl SidecarState {
    pub fn new() -> Self {
        Self {
            status: SidecarRunStatus::ScStopped,
            port: DEFAULT_PORT,
            last_heartbeat: None,
            error_message: None,
            child: None,
        }
    }

    pub fn to_dto(&self) -> SidecarStatusDto {
        SidecarStatusDto {
            status: self.status.clone(),
            port: self.port,
            last_heartbeat: self.last_heartbeat.clone(),
            error_message: self.error_message.clone(),
        }
    }
}

pub type SharedSidecar = Mutex<SidecarState>;

fn sidecar_entry_script() -> Result<PathBuf, String> {
    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let entry = manifest.join("../../sidecar/dist/index.js");
    if entry.exists() {
        Ok(entry.canonicalize().map_err(|e| e.to_string())?)
    } else {
        Err(format!(
            "Sidecar not built. Run: pnpm --filter @operon/sidecar build ({})",
            entry.display()
        ))
    }
}

fn fetch_health(port: u16) -> bool {
    let url = format!("http://127.0.0.1:{port}/health");
    ureq::get(&url)
        .call()
        .map(|r| r.status() == 200)
        .unwrap_or(false)
}

pub fn spawn_sidecar(
    state: &SharedSidecar,
    paths: &PlatformPaths,
    docker_ok: bool,
) -> Result<(), String> {
    let mut guard = state.lock().map_err(|e| e.to_string())?;

    if !docker_ok {
        guard.status = SidecarRunStatus::ScError;
        guard.error_message = Some("Docker Desktop is not running (PL-02a)".to_string());
        return Err(guard.error_message.clone().unwrap());
    }

    if guard.status == SidecarRunStatus::ScRunning {
        return Ok(());
    }

    let entry = sidecar_entry_script()?;
    guard.status = SidecarRunStatus::ScStarting;
    guard.error_message = None;
    guard.port = DEFAULT_PORT;

    let child = Command::new("node")
        .arg(&entry)
        .env("OPERON_DATA_DIR", &paths.data_dir)
        .env("OPERON_SIDECAR_PORT", guard.port.to_string())
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn sidecar: {e}"))?;

    guard.child = Some(child);

    let deadline = Instant::now() + Duration::from_secs(HEALTH_TIMEOUT_SECS);
    while Instant::now() < deadline {
        if fetch_health(guard.port) {
            guard.status = SidecarRunStatus::ScRunning;
            guard.last_heartbeat = Some(chrono_now());
            return Ok(());
        }
        std::thread::sleep(Duration::from_millis(POLL_INTERVAL_MS));
    }

    guard.status = SidecarRunStatus::ScError;
    guard.error_message = Some("Sidecar startup timeout (E-M12-01)".to_string());
    if let Some(mut child) = guard.child.take() {
        let _ = child.kill();
    }
    Err(guard.error_message.clone().unwrap())
}

pub fn stop_sidecar(state: &SharedSidecar) {
    if let Ok(mut guard) = state.lock() {
        if let Some(mut child) = guard.child.take() {
            let _ = child.kill();
        }
        guard.status = SidecarRunStatus::ScStopped;
    }
}

fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    format!("{secs}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_port_matches_m12_prd() {
        assert_eq!(DEFAULT_PORT, 3721);
    }
}

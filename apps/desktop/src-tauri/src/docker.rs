use serde::Serialize;
use std::process::{Command, Stdio};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentCheck {
    pub item: String,
    pub result: String,
    pub suggestion: Option<String>,
}

pub fn check_docker() -> EnvironmentCheck {
    let ok = Command::new("docker")
        .args(["info"])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map(|s| s.success())
        .unwrap_or(false);

    if ok {
        EnvironmentCheck {
            item: "docker".to_string(),
            result: "pass".to_string(),
            suggestion: None,
        }
    } else {
        EnvironmentCheck {
            item: "docker".to_string(),
            result: "fail".to_string(),
            suggestion: Some(
                "Install and start Docker Desktop before using Operon control room.".to_string(),
            ),
        }
    }
}

pub fn docker_passed() -> bool {
    check_docker().result == "pass"
}

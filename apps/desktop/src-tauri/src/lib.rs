mod docker;
mod paths;
mod sidecar;

use docker::{check_docker, docker_passed, EnvironmentCheck};
use paths::{resolve_platform_paths, PlatformPaths};
use sidecar::{spawn_sidecar, stop_sidecar, SharedSidecar, SidecarState, SidecarStatusDto};
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, RunEvent,
};

#[tauri::command]
fn get_sidecar_status(state: tauri::State<'_, SharedSidecar>) -> Result<SidecarStatusDto, String> {
    state
        .lock()
        .map(|s| s.to_dto())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_platform_paths() -> Result<PlatformPaths, String> {
    resolve_platform_paths()
}

#[tauri::command]
fn get_environment_checks() -> Vec<EnvironmentCheck> {
    vec![check_docker()]
}

#[tauri::command]
fn retry_sidecar_start(
    state: tauri::State<'_, SharedSidecar>,
) -> Result<SidecarStatusDto, String> {
    let paths = resolve_platform_paths()?;
    let docker_ok = docker_passed();
    spawn_sidecar(&state, &paths, docker_ok)?;
    get_sidecar_status(state)
}

#[tauri::command]
fn reveal_path_in_shell(absolute_path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &absolute_path])
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &absolute_path])
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }
    #[cfg(target_os = "linux")]
    {
        use std::path::Path;
        let parent = Path::new(&absolute_path)
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or(absolute_path.clone());
        std::process::Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }
    #[allow(unreachable_code)]
    Ok(())
}

#[tauri::command]
fn get_updater_config() -> serde_json::Value {
    serde_json::json!({
        "enabled": true,
        "endpoint": "https://releases.operon.local/update/{{target}}/{{current_version}}",
        "pubkey": ""
    })
}

fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let show = MenuItem::with_id(app, "show", "打开控制室", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    let icon = app
        .default_window_icon()
        .ok_or("Missing default window icon")?
        .clone();

    TrayIconBuilder::new()
        .icon(icon)
        .menu(&menu)
        .tooltip("Operon")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => {
                if let Some(state) = app.try_state::<SharedSidecar>() {
                    stop_sidecar(&state);
                }
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(Mutex::new(SidecarState::new()) as SharedSidecar)
        .invoke_handler(tauri::generate_handler![
            get_sidecar_status,
            get_platform_paths,
            get_environment_checks,
            retry_sidecar_start,
            reveal_path_in_shell,
            get_updater_config,
        ])
        .setup(|app| {
            let paths = resolve_platform_paths()?;
            let docker_ok = docker_passed();
            let sidecar_state = app.state::<SharedSidecar>();
            let _ = spawn_sidecar(&sidecar_state, &paths, docker_ok);
            setup_tray(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while running Operon desktop")
        .run(|app_handle, event| {
            if let RunEvent::Exit = event {
                if let Some(state) = app_handle.try_state::<SharedSidecar>() {
                    stop_sidecar(&state);
                }
            }
        });
}

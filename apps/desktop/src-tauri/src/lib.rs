pub fn data_dir() -> Result<std::path::PathBuf, String> {
    dirs::data_dir()
        .map(|p| p.join("operon"))
        .ok_or_else(|| "Cannot resolve platform data directory".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running Operon desktop");
}

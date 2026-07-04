/** Tauri platform helpers — reveal in Explorer / Finder */

export async function revealPathInShell(absolutePath: string): Promise<void> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('reveal_path_in_shell', { absolutePath });
  } catch {
    console.warn('reveal_path_in_shell unavailable (browser preview mode)');
  }
}

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

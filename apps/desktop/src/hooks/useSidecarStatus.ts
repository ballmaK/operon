import { invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect, useState } from 'react';

export interface SidecarStatusDto {
  status: 'SC_STOPPED' | 'SC_STARTING' | 'SC_RUNNING' | 'SC_ERROR';
  port: number;
  lastHeartbeat: string | null;
  errorMessage: string | null;
}

export interface EnvironmentCheck {
  item: string;
  result: 'pass' | 'warn' | 'fail';
  suggestion: string | null;
}

export interface PlatformPaths {
  dataDir: string;
  logDir: string;
  tempDir: string;
}

const STATUS_LABEL: Record<SidecarStatusDto['status'], string> = {
  SC_STOPPED: '已停止',
  SC_STARTING: '启动中',
  SC_RUNNING: '运行中',
  SC_ERROR: '异常',
};

export function sidecarStatusLabel(status: SidecarStatusDto['status']): string {
  return STATUS_LABEL[status];
}

export function useSidecarStatus(pollMs = 2000) {
  const [sidecar, setSidecar] = useState<SidecarStatusDto | null>(null);
  const [environment, setEnvironment] = useState<EnvironmentCheck[]>([]);
  const [paths, setPaths] = useState<PlatformPaths | null>(null);
  const [isTauri, setIsTauri] = useState(false);

  const refresh = useCallback(async () => {
    if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
      setIsTauri(false);
      return;
    }
    setIsTauri(true);
    const [sc, env, p] = await Promise.all([
      invoke<SidecarStatusDto>('get_sidecar_status'),
      invoke<EnvironmentCheck[]>('get_environment_checks'),
      invoke<PlatformPaths>('get_platform_paths'),
    ]);
    setSidecar(sc);
    setEnvironment(env);
    setPaths(p);
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  const retry = useCallback(async () => {
    const sc = await invoke<SidecarStatusDto>('retry_sidecar_start');
    setSidecar(sc);
  }, []);

  return { sidecar, environment, paths, isTauri, refresh, retry, sidecarStatusLabel };
}

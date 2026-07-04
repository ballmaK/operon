import { useCallback, useEffect, useState } from 'react';
import type { Company } from '@operon/shared-types';
import { listCompanies } from '../lib/sidecar-api';

export function useCompanies(sidecarPort: number | null, sidecarRunning: boolean) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!sidecarRunning || !sidecarPort) {
      setCompanies([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await listCompanies(sidecarPort);
      setCompanies(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载公司列表失败');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [sidecarPort, sidecarRunning]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { companies, loading, error, refresh };
}

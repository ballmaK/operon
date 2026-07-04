import { useCallback, useEffect, useState } from 'react';
import type { Company, Department, Objective, TranscriptEntry } from '@operon/shared-types';
import {
  listDepartments,
  listObjectives,
  listPendingApprovals,
  listTranscripts,
} from '../lib/sidecar-api';

export interface ControlRoomData {
  objectives: Objective[];
  departments: Department[];
  transcripts: TranscriptEntry[];
  pendingApprovals: number;
}

export function useControlRoom(port: number | null, company: Company | null) {
  const [data, setData] = useState<ControlRoomData>({
    objectives: [],
    departments: [],
    transcripts: [],
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!port || !company) {
      setData({ objectives: [], departments: [], transcripts: [], pendingApprovals: 0 });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [objectives, departments, transcripts, approvals] = await Promise.all([
        listObjectives(port, company.id),
        listDepartments(port, company.id),
        listTranscripts(port, company.id, 5),
        listPendingApprovals(port),
      ]);
      setData({
        objectives,
        departments,
        transcripts,
        pendingApprovals: approvals.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载控制室失败');
    } finally {
      setLoading(false);
    }
  }, [port, company]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

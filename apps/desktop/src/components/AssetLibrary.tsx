import { useEffect, useState } from 'react';
import type { AssetItem } from '@operon/shared-types';
import { getAssetContent, listAssets, revealAsset } from '../lib/sidecar-api';
import { revealPathInShell } from '../lib/tauri-platform';

interface AssetLibraryProps {
  port: number;
  companyId: string;
}

export function AssetLibrary({ port, companyId }: AssetLibraryProps) {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [selected, setSelected] = useState<AssetItem | null>(null);
  const [preview, setPreview] = useState<{ content: string; truncated: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    void listAssets(port, companyId)
      .then(setAssets)
      .finally(() => setLoading(false));
  }, [port, companyId]);

  useEffect(() => {
    if (!selected) {
      setPreview(null);
      return;
    }
    void getAssetContent(port, selected.id, selected.path)
      .then((r) => setPreview({ content: r.content, truncated: r.truncated }))
      .catch(() => setPreview(null));
  }, [port, selected]);

  return (
    <section className="asset-library">
      <div className="section-header">
        <h2>资产库</h2>
      </div>

      {loading ? <p className="hint">加载中…</p> : null}

      <div className="asset-layout">
        <ul className="asset-list">
          {assets.length === 0 && !loading ? (
            <li className="hint">暂无资产文件。</li>
          ) : (
            assets.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className={`asset-row ${selected?.id === a.id ? 'selected' : ''}`}
                  onClick={() => setSelected(a)}
                >
                  <span className="asset-type">{a.type}</span>
                  <span className="asset-name">{a.name}</span>
                  <span className="hint">v{a.version}</span>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="asset-preview">
          {selected ? (
            <>
              <h3>{selected.name}</h3>
              <p className="hint">{selected.path}</p>
              <p className="hint">来源：{selected.objectiveTitle}</p>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() =>
                  void revealAsset(port, selected.id, selected.path).then((r) =>
                    revealPathInShell(r.absolutePath),
                  )
                }
              >
                在资源管理器中显示
              </button>
              {preview ? (
                <pre className="asset-content">
                  {preview.content}
                  {preview.truncated ? '\n…(已截断)' : ''}
                </pre>
              ) : (
                <p className="hint">无法预览此文件（可能已被清理）。</p>
              )}
            </>
          ) : (
            <p className="hint">选择资产查看预览。</p>
          )}
        </div>
      </div>
    </section>
  );
}

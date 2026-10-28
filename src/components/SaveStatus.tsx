type Props = { label: string; saveCount: number; busy: boolean; error: string | null; signedIn: boolean; browserCount: number; retry: () => void; importBrowser: () => void };
export function SaveStatus({ label, saveCount, busy, error, signedIn, browserCount, retry, importBrowser }: Props) {
  return <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-2 font-mono text-[10px] text-muted" aria-live="polite">
    <span>{label}{busy ? " · Working…" : !error && saveCount === 0 ? " · No saved builds yet" : ""}</span>
    {!signedIn && <span>Saved on this device. Sign in for cloud saves.</span>}
    {signedIn && browserCount > 0 && <button disabled={busy} onClick={importBrowser} className="text-accent-dark underline disabled:opacity-50">Import browser builds ({browserCount})</button>}
    {error && <><span role="alert" className="text-danger">{error}</span><button disabled={busy} onClick={retry} className="underline">Retry</button></>}
  </div>;
}

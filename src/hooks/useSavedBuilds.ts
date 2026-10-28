import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "../auth/runtime";
import { savedBuildListSchema } from "../zod/buildSchema";
import { cloudBuilds } from "../lib/cloudBuilds";
import type { BUILD, SavedBuild } from "../data/type";

const KEY = "retroforge.savedBuilds";
export function readBrowserBuilds(): SavedBuild[] {
  try {
    const result = savedBuildListSchema.safeParse(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
    return result.success ? result.data : [];
  } catch { return []; }
}
export function useSavedBuilds() {
  const account = useAccount();
  // Object identity separates even A → B → A transitions from earlier requests.
  const scope = useMemo(() => ({ owner: account.userId }), [account.userId]);
  const currentScope = useRef<typeof scope | null>(scope);
  const controllers = useRef(new Set<AbortController>());
  const lock = useRef<symbol | null>(null);
  const [browser, setBrowser] = useState(readBrowserBuilds);
  const [remote, setRemote] = useState<{ scope: typeof scope; builds: SavedBuild[] } | null>(null);
  const [status, setStatus] = useState<{ scope: typeof scope; busy: boolean; error: string | null } | null>(null);
  const [revision, setRevision] = useState(0);
  useLayoutEffect(() => {
    currentScope.current = scope;
    lock.current = null;
    const pending = controllers.current;
    return () => {
      currentScope.current = null;
      for (const controller of pending) controller.abort();
      pending.clear();
    };
  }, [scope]);
  const isCurrent = () => currentScope.current === scope;

  useEffect(() => {
    if (!account.loaded || !scope.owner) return;
    const controller = new AbortController();
    const pending = controllers.current;
    pending.add(controller);
    let active = true;
    Promise.resolve().then(() => {
      if (active) setStatus({ scope, busy: true, error: null });
      return cloudBuilds(account.getToken, controller.signal).list();
    }).then(builds => {
      if (active) { setRemote({ scope, builds }); setStatus({ scope, busy: false, error: null }); }
    }).catch(error => {
      if (active) setStatus({ scope, busy: false, error: error instanceof Error ? error.message : "Could not load cloud saves." });
    });
    return () => { active = false; controller.abort(); pending.delete(controller); };
  }, [account.loaded, scope, account.getToken, revision]);

  const busy = !account.loaded || (scope.owner ? status?.scope !== scope || status.busy : false);
  const error = status?.scope === scope ? status.error : null;
  async function mutate<T>(operation: (api: ReturnType<typeof cloudBuilds>) => Promise<T>): Promise<T | undefined> {
    if (lock.current || busy || !isCurrent()) return;
    const token = Symbol();
    lock.current = token;
    const controller = new AbortController();
    controllers.current.add(controller);
    const api = cloudBuilds(async () => {
      if (!isCurrent()) throw new DOMException("Session changed", "AbortError");
      const jwt = await account.getToken();
      if (!isCurrent()) throw new DOMException("Session changed", "AbortError");
      return jwt;
    }, controller.signal);
    setStatus({ scope, busy: true, error: null });
    try { return await operation(api); }
    catch (error) {
      if (!isCurrent()) return;
      setStatus({ scope, busy: false, error: error instanceof Error ? error.message : "Could not update cloud saves." });
      throw error;
    } finally {
      controllers.current.delete(controller);
      if (lock.current === token) lock.current = null;
      if (isCurrent()) setStatus(previous => previous?.scope === scope ? { ...previous, busy: false } : previous);
    }
  }
  function writeBrowser(builds: SavedBuild[]) {
    localStorage.setItem(KEY, JSON.stringify(builds));
    setBrowser(builds);
  }
  async function save(name: string, build: BUILD) {
    if (!account.loaded || !isCurrent()) return false;
    if (!scope.owner) { writeBrowser([...readBrowserBuilds(), { id: crypto.randomUUID(), name, build }]); return true; }
    return mutate(async api => {
      const saved = await api.save(name, build);
      if (!isCurrent()) return false;
      setRemote(previous => ({ scope, builds: [...(previous?.scope === scope ? previous.builds : []), saved] }));
      return true;
    });
  }
  async function remove(id: string) {
    if (!account.loaded || !isCurrent()) return;
    if (!scope.owner) { writeBrowser(readBrowserBuilds().filter(build => build.id !== id)); return; }
    await mutate(async api => {
      await api.remove(id);
      if (isCurrent()) setRemote(previous => previous?.scope === scope ? { scope, builds: previous.builds.filter(build => build.id !== id) } : previous);
    });
  }
  async function importBrowser() {
    if (!scope.owner) return;
    return mutate(async api => {
      let imported = 0;
      let skipped = 0;
      for (let index = 0; index < browser.length; index += 100) {
        if (!isCurrent()) return;
        const result = await api.import(browser.slice(index, index + 100));
        imported += result.imported; skipped += result.skipped;
      }
      const builds = await api.list();
      if (!isCurrent()) return;
      setRemote({ scope, builds });
      return { imported, skipped };
    });
  }
  return { savedBuilds: scope.owner ? remote?.scope === scope ? remote.builds : [] : browser,
    saveCount: scope.owner ? remote?.scope === scope ? remote.builds.length : 0 : browser.length,
    browserCount: browser.length, label: scope.owner ? "Cloud saves" : "Browser saves", busy, error,
    save, remove, importBrowser, retry: () => setRevision(value => value + 1), signedIn: !!scope.owner,
  };
}

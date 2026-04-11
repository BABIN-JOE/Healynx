type OpenTabs = Record<string, number>;

const TAB_ID_KEY = "healynx_tab_id";
const OPEN_TABS_KEY = "healynx_open_tabs";
const HEARTBEAT_INTERVAL_MS = 5000;
const STALE_TAB_MS = 15000;

function canUseBrowser(): boolean {
  return typeof window !== "undefined";
}

function readOpenTabs(): OpenTabs {
  if (!canUseBrowser()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(OPEN_TABS_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function writeOpenTabs(tabs: OpenTabs): void {
  if (!canUseBrowser()) {
    return;
  }

  window.localStorage.setItem(OPEN_TABS_KEY, JSON.stringify(tabs));
}

function pruneOpenTabs(tabs: OpenTabs, now = Date.now()): OpenTabs {
  return Object.fromEntries(
    Object.entries(tabs).filter(([, timestamp]) => now - Number(timestamp) < STALE_TAB_MS)
  );
}

function createTabId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function shouldResetSessionOnLaunch(): boolean {
  if (!canUseBrowser()) {
    return false;
  }

  if (window.sessionStorage.getItem(TAB_ID_KEY)) {
    return false;
  }

  const openTabs = pruneOpenTabs(readOpenTabs());
  writeOpenTabs(openTabs);

  return Object.keys(openTabs).length === 0;
}

export function startTabSession(): () => void {
  if (!canUseBrowser()) {
    return () => {};
  }

  let tabId = window.sessionStorage.getItem(TAB_ID_KEY);
  if (!tabId) {
    tabId = createTabId();
    window.sessionStorage.setItem(TAB_ID_KEY, tabId);
  }

  const heartbeat = () => {
    const openTabs = pruneOpenTabs(readOpenTabs());
    openTabs[tabId!] = Date.now();
    writeOpenTabs(openTabs);
  };

  const unregister = () => {
    const openTabs = readOpenTabs();
    delete openTabs[tabId!];
    writeOpenTabs(pruneOpenTabs(openTabs));
  };

  const handleVisibilityChange = () => {
    if (!document.hidden) {
      heartbeat();
    }
  };

  heartbeat();

  const intervalId = window.setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
  window.addEventListener("pagehide", unregister);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener("pagehide", unregister);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    unregister();
  };
}

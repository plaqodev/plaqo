// Collapsed/expanded state of the dashboard's desktop sidebar. A per-viewer
// convenience, so localStorage. The inline script sets data-sidebar on
// <html> before first paint; CSS (the sidebar-collapsed variant in
// styles.css) sizes the sidebar from it, so a collapsed sidebar never
// renders expanded first and then jumps.
export const SIDEBAR_STORAGE_KEY = "plaqo-sidebar";

export const noFlashSidebarScript = `
(function(){try{
  if(localStorage.getItem('${SIDEBAR_STORAGE_KEY}')==='collapsed'){document.documentElement.dataset.sidebar='collapsed';}
}catch(e){}})();
`.trim();

export function isSidebarCollapsed(): boolean {
	if (typeof document === "undefined") return false;
	return document.documentElement.dataset.sidebar === "collapsed";
}

export function setSidebarCollapsed(collapsed: boolean) {
	if (typeof document === "undefined") return;
	if (collapsed) document.documentElement.dataset.sidebar = "collapsed";
	else delete document.documentElement.dataset.sidebar;
	try {
		if (collapsed) localStorage.setItem(SIDEBAR_STORAGE_KEY, "collapsed");
		else localStorage.removeItem(SIDEBAR_STORAGE_KEY);
	} catch {}
}

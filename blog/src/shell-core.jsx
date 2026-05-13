import { useState, useEffect, useCallback } from 'react';

/* ---------- pathname router ---------- */

function queryObject(queryPart = '') {
  const search = new URLSearchParams(queryPart.replace(/^\?/, ''));
  const query = {};
  for (const [k, v] of search.entries()) query[k] = v;
  return query;
}

export function parsePath(pathname = '/', search = '') {
  const raw = pathname || '/';
  const pathPart = raw.startsWith('/') ? raw : `/${raw}`;
  const segs = pathPart.split('/').filter(Boolean);
  const query = queryObject(search);
  let route = { name: 'index' };
  if (segs[0] === 'post' && segs[1]) route = { name: 'post', slug: segs[1] };
  return { route, query, raw: `${pathPart}${search || ''}` };
}

export function parseHash(hash) {
  const raw = (hash || '').replace(/^#/, '') || '/';
  const [pathPart, queryPart = ''] = raw.split('?');
  return parsePath(pathPart || '/', queryPart ? `?${queryPart}` : '');
}

export function parseBrowserLocation(loc = window.location) {
  if (loc.hash?.startsWith('#/')) return parseHash(loc.hash);
  return parsePath(loc.pathname, loc.search);
}

export function buildPath(route, query = {}) {
  let path = '/';
  if (route.name === 'post') path = `/post/${route.slug}/`;
  const search = new URLSearchParams();
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v != null && v !== '') search.set(k, v);
  });
  const qs = search.toString();
  return `${path}${qs ? '?' + qs : ''}`;
}

export function postPath(slug, query) {
  return buildPath({ name: 'post', slug }, query);
}

function parseHref(href, fallbackRoute) {
  if (href.startsWith('#/')) return parseHash(href);
  if (href.startsWith('/')) {
    const url = new URL(href, window.location.origin);
    return parsePath(url.pathname, url.search);
  }
  return { route: fallbackRoute || { name: 'index' }, query: {}, raw: href };
}

export function useSiteRouter() {
  const [state, setState] = useState(() => parseBrowserLocation());

  useEffect(() => {
    if (location.hash.startsWith('#/')) {
      const next = parseHash(location.hash);
      history.replaceState(null, '', buildPath(next.route, next.query));
      setState(next);
    }

    const onPop = () => setState(parseBrowserLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((href) => {
    let next;
    if (typeof href === 'string') {
      next = parseHref(href, state.route);
    } else {
      next = {
        route: href.route || state.route,
        query: { ...state.query, ...(href.query || {}) },
      };
    }

    const path = buildPath(next.route, next.query);
    if (`${location.pathname}${location.search}` !== path) history.pushState(null, '', path);
    setState({ ...next, raw: path });
  }, [state]);

  const setQuery = useCallback((patch) => {
    const next = { ...state.query, ...patch };
    Object.keys(next).forEach(k => { if (next[k] == null || next[k] === '') delete next[k]; });
    const path = buildPath(state.route, next);
    if (`${location.pathname}${location.search}` !== path) history.pushState(null, '', path);
    setState({ route: state.route, query: next, raw: path });
  }, [state]);

  return { ...state, navigate, setQuery };
}

/* ---------- i18n / locale helpers ---------- */

export const LANGS = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'zh', label: '中文', short: '中' },
];

export const SHELL_STRINGS = {
  en: {
    siteName: 'OpenViking Blog',
    siteSub: 'Engineering notes',
    indexEyebrow: '2026',
    indexTitle: 'Blog in Public.',
    indexLede: 'Technical notes from the OpenViking team — on agents, protocols, and the systems behind them.',
    countLabel: (n) => `${n} essays`,
    filterAll: 'All',
    filterMore: 'More',
    filterLess: 'Less',
    sortNewest: 'Newest first',
    sortOldest: 'Oldest first',
    sortNewestShort: 'New',
    sortOldestShort: 'Old',
    backToIndex: '← All essays',
    publishedOn: 'Published',
    updatedOn: 'Updated',
    readingTime: (m) => `${m} min read`,
    by: 'by',
    contents: 'Contents',
    prev: 'Previous',
    next: 'Next',
    relatedTitle: 'Continue reading',
    notFoundTitle: 'Nothing here',
    notFoundBody: 'That essay does not exist. It may have been a dream.',
    langLabel: 'Language',
    themeLabel: 'Theme',
    notAvailableLang: 'This essay is not yet translated. Showing the available language.',
    tags: 'Tags',
  },
  zh: {
    siteName: 'OpenViking 博客',
    siteSub: '技术笔记',
    indexEyebrow: '2026',
    indexTitle: '感受 AI。',
    indexLede: 'OpenViking 团队的技术笔记 — 关于 Agent、协议，以及背后的系统。',
    countLabel: (n) => `${n} 篇文章`,
    filterAll: '全部',
    filterMore: '更多',
    filterLess: '收起',
    sortNewest: '最新优先',
    sortOldest: '最早优先',
    sortNewestShort: '新',
    sortOldestShort: '旧',
    backToIndex: '← 所有文章',
    publishedOn: '发布于',
    updatedOn: '更新于',
    readingTime: (m) => `阅读约 ${m} 分钟`,
    by: '作者',
    contents: '目录',
    prev: '上一篇',
    next: '下一篇',
    relatedTitle: '继续阅读',
    notFoundTitle: '此处空空如也',
    notFoundBody: '这篇文章不存在,也许只是一场梦。',
    langLabel: '语言',
    themeLabel: '主题',
    notAvailableLang: '本文尚未翻译，显示当前可用版本。',
    tags: '标签',
  },
};

export function useShellStrings(lang) {
  return SHELL_STRINGS[lang] || SHELL_STRINGS.en;
}

export function makeFormatDate(lang) {
  return (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const locale = lang === 'zh' ? 'zh-CN' : 'en-US';
      return d.toLocaleDateString(locale, { year: 'numeric', month: lang === 'zh' ? 'long' : 'short', day: 'numeric' });
    } catch { return iso; }
  };
}

/* ---------- theme: light (纸) / dark (和纸) ---------- */

export const THEME_LIGHT = 'kami';
export const THEME_DARK = 'washi';

export function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEME_DARK : THEME_LIGHT;
}

export function getInitialTheme() {
  const stored = localStorage.getItem('blog.theme');
  if (stored === THEME_LIGHT || stored === THEME_DARK) return stored;
  return getSystemTheme();
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme === THEME_DARK ? 'dark' : 'light';
}

export function isDark(theme) {
  return theme === THEME_DARK;
}

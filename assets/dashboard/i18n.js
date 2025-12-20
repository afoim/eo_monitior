const SUPPORTED_LOCALES = /** @type {const} */ (['zh-Hans', 'en-US']);
const DEFAULT_LOCALE = 'zh-Hans';
const STORAGE_KEY = 'eo_monitor_locale';
const EVENT_NAME = 'eo:localechange';

function normalizeLocale(input) {
  if (!input) return DEFAULT_LOCALE;
  const raw = String(input).trim();
  const lower = raw.toLowerCase();

  if (lower === 'zh' || lower.startsWith('zh-hans') || lower === 'zh-cn') return 'zh-Hans';
  if (lower === 'en' || lower.startsWith('en')) return 'en-US';

  if (SUPPORTED_LOCALES.includes(raw)) return raw;
  return DEFAULT_LOCALE;
}

function getQueryParamLocale() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('lang') || params.get('locale');
  } catch {
    return null;
  }
}

function getStoredLocale() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getNavigatorLocale() {
  try {
    const candidates = Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];
    return candidates.find(Boolean) || null;
  } catch {
    return null;
  }
}

function detectInitialLocale() {
  return normalizeLocale(getQueryParamLocale() || getStoredLocale() || getNavigatorLocale());
}

/** @type {'zh-Hans' | 'en-US'} */
let currentLocale = DEFAULT_LOCALE;
let initialized = false;

const MESSAGES = {
  'zh-Hans': {
    common: {
      loading: '加载中...',
      error: '错误',
      high: '高',
      low: '低',
    },
    controls: {
      themeToggle: '切换主题',
      language: '语言:',
      timeRange: '时间范围:',
      apply: '应用',
      interval: '粒度:',
      zone: '选择站点:',
      intervalAuto: '自动',
      zoneLoading: '加载中...',
    },
    timeRange: {
      '30min': '近 30 分钟',
      '1h': '近 1 小时',
      '6h': '近 6 小时',
      today: '今日',
      yesterday: '昨日',
      '3d': '近 3 天',
      '7d': '近 7 天',
      '14d': '近 14 天',
      '31d': '近 31 天',
      custom: '自定义',
    },
    interval: {
      min: '1 分钟',
      '5min': '5 分钟',
      hour: '1 小时',
      day: '1 天',
    },
    units: {
      day: '天',
      hour: '小时',
      minute: '分',
      second: '秒',
      requests: '次',
      traffic: '流量',
    },
    zones: {
      all: '全部站点',
      pagesSuffix: ' (Pages站点)',
      loadFailed: '获取站点失败 (默认为全部)',
    },
    header: {
      subtitle: 'EdgeOne 站点流量与请求量分析',
    },
    language: {
      zhHans: '简体中文',
      enUS: 'English',
    },
    sections: {
      traffic: '流量分析 (Traffic)',
      bandwidth: '带宽分析 (Bandwidth)',
      originPull: '回源分析 (Origin Pull Analysis)',
      edgeFunctions: '边缘函数 (Edge Functions)',
      pages: 'Pages 统计 (Pages Stats)',
      requestsPerformance: '请求与性能 (Requests & Performance)',
      security: '安全分析 (Security Analysis)',
      topAnalysis: 'TOP 分析 (Top Analysis)',
    },
    traffic: {
      total: { title: '总流量 (Total)', desc: '访问总流量' },
      in: { title: '客户端请求流量 (In)', desc: '客户端请求流量' },
      out: { title: '响应流量 (Out)', desc: 'EdgeOne 响应流量' },
      trend: '流量趋势',
    },
    bandwidth: {
      total: { title: '总带宽峰值 (Total)', desc: '访问总带宽峰值' },
      in: { title: '请求带宽峰值 (In)', desc: '客户端请求带宽峰值' },
      out: { title: '响应带宽峰值 (Out)', desc: 'EdgeOne 响应带宽峰值' },
      trend: '带宽趋势',
    },
    originPull: {
      outFlux: { title: '回源请求流量' },
      requests: { title: '回源请求数' },
      outBandwidth: { title: '回源请求带宽峰值' },
      inFlux: { title: '回源响应流量' },
      inBandwidth: { title: '回源响应带宽峰值' },
      edgeToOrigin: 'EdgeOne 节点至源站',
      originToEdge: '源站至 EdgeOne 节点',
      cacheHitRate: { title: '缓存命中率', desc: '1 - (源站响应 / EdgeOne 响应)' },
      trend: '回源趋势',
    },
    edgeFunctions: {
      requests: { title: '总请求数', desc: 'Edge Functions 总调用次数', trend: '函数请求数趋势' },
      cpu: { title: '总 CPU 时间', desc: 'Edge Functions 总 CPU 耗时 (ms)', trend: '函数 CPU 耗时趋势' },
    },
    pages: {
      dailyBuild: { title: '当日构建次数', desc: 'Pages 当日构建总次数' },
      monthlyBuild: { title: '当月构建次数', desc: 'Pages 当月构建总次数' },
      cf24h: { title: 'Cloud Functions 24h 请求数', desc: 'Cloud Functions 24h 总请求数' },
      cfMonthlyRequests: { title: '当月 Cloud Functions 请求数', desc: '本月累计请求数' },
      cfMonthlyGbs: { title: '当月 Cloud Functions GBs', desc: '本月累计资源使用量 (GBs)' },
      cfTrend: 'Cloud Functions 请求数趋势',
    },
    reqPerf: {
      totalRequests: { title: '总请求数', desc: '总请求次数' },
      avgResp: { title: '平均响应耗时', desc: 'L7 访问平均响应耗时 (ms)' },
      ttfb: { title: '平均首字节耗时', desc: 'L7 访问平均首字节响应耗时 (ms)' },
      requestsTrend: '请求数趋势',
      latencyTrend: '响应耗时趋势',
    },
    security: {
      hits: { title: '总防护命中次数' },
      trend: '安全防护趋势',
    },
    top: {
      worldMap: '全球请求分布',
      countryFlux: '国家/地区流量排行',
      countryReq: '国家/地区请求数排行',
      provinceFlux: '国内省份流量排行',
      provinceReq: '国内省份请求数排行',
      statusFlux: '状态码流量排行',
      statusReq: '状态码请求数排行',
      domainFlux: '域名流量排行',
      domainReq: '域名请求数排行',
      urlFlux: 'URL 流量排行',
      urlReq: 'URL 请求数排行',
      resourceFlux: '资源类型流量排行',
      resourceReq: '资源类型请求数排行',
      sipFlux: '客户端IP流量排行',
      sipReq: '客户端IP请求数排行',
      refererFlux: 'Referer 流量排行',
      refererReq: 'Referer 请求数排行',
      deviceFlux: '设备类型流量排行',
      deviceReq: '设备类型请求数排行',
      browserFlux: '浏览器流量排行',
      browserReq: '浏览器请求数排行',
      osFlux: '操作系统流量排行',
      osReq: '操作系统请求数排行',
      uaFlux: 'User Agent 流量排行',
      uaReq: 'User Agent 请求数排行',
    },
    errors: {
      customRangeTooLarge: '自定义时间范围不能超过 31 天，已自动为您调整为 31 天。',
      rangeTooLarge: '范围过大',
      securityOnly14d: '仅支持查询14天内的数据',
      securityOnly14dTitle: '该指标仅支持查询14天内的数据',
      missingField: '字段不存在',
    },
    charts: {
      requests: '请求数',
      traffic: '流量',
      securityHitsDescription: 'DDoS/CC 防护总拦截次数',
      pagesRequests: '请求数',
    },
    footer: {
      statementHtml:
        '由 <a href="https://github.com/afoim/eo_monitior" target="_blank" rel="noopener noreferrer" class="font-medium underline underline-offset-4 hover:text-primary">EdgeOne Monitoring Dashboard</a> 提供支持。由 <a href="https://2x.nz" target="_blank" rel="noopener noreferrer" class="font-medium underline underline-offset-4 hover:text-primary">Acofork</a> 构建，并由社区以热情持续维护。',
    },
  },
  'en-US': {
    common: {
      loading: 'Loading...',
      error: 'Error',
      high: 'High',
      low: 'Low',
    },
    controls: {
      themeToggle: 'Toggle theme',
      language: 'Language:',
      timeRange: 'Time Range:',
      apply: 'Apply',
      interval: 'Granularity:',
      zone: 'Zone:',
      intervalAuto: 'Auto',
      zoneLoading: 'Loading...',
    },
    timeRange: {
      '30min': 'Last 30 minutes',
      '1h': 'Last 1 hour',
      '6h': 'Last 6 hours',
      today: 'Today',
      yesterday: 'Yesterday',
      '3d': 'Last 3 days',
      '7d': 'Last 7 days',
      '14d': 'Last 14 days',
      '31d': 'Last 31 days',
      custom: 'Custom',
    },
    interval: {
      min: '1 minute',
      '5min': '5 minutes',
      hour: '1 hour',
      day: '1 day',
    },
    units: {
      day: 'd',
      hour: 'h',
      minute: 'm',
      second: 's',
      requests: 'requests',
      traffic: 'Traffic',
    },
    zones: {
      all: 'All zones',
      pagesSuffix: ' (Pages zone)',
      loadFailed: 'Failed to load zones (default: all)',
    },
    header: {
      subtitle: 'EdgeOne traffic & request analytics',
    },
    language: {
      zhHans: '简体中文',
      enUS: 'English',
    },
    sections: {
      traffic: 'Traffic',
      bandwidth: 'Bandwidth',
      originPull: 'Origin Pull',
      edgeFunctions: 'Edge Functions',
      pages: 'Pages Stats',
      requestsPerformance: 'Requests & Performance',
      security: 'Security',
      topAnalysis: 'Top Analysis',
    },
    traffic: {
      total: { title: 'Total traffic', desc: 'Total traffic' },
      in: { title: 'Client request traffic', desc: 'Client request traffic' },
      out: { title: 'Response traffic', desc: 'EdgeOne response traffic' },
      trend: 'Traffic trend',
    },
    bandwidth: {
      total: { title: 'Peak bandwidth (Total)', desc: 'Peak total bandwidth' },
      in: { title: 'Peak request bandwidth', desc: 'Peak client request bandwidth' },
      out: { title: 'Peak response bandwidth', desc: 'Peak EdgeOne response bandwidth' },
      trend: 'Bandwidth trend',
    },
    originPull: {
      outFlux: { title: 'Origin request traffic' },
      requests: { title: 'Origin requests' },
      outBandwidth: { title: 'Peak origin request bandwidth' },
      inFlux: { title: 'Origin response traffic' },
      inBandwidth: { title: 'Peak origin response bandwidth' },
      edgeToOrigin: 'EdgeOne to origin',
      originToEdge: 'Origin to EdgeOne',
      cacheHitRate: { title: 'Cache hit rate', desc: '1 - (origin response / EdgeOne response)' },
      trend: 'Origin pull trend',
    },
    edgeFunctions: {
      requests: { title: 'Total requests', desc: 'Total invocations', trend: 'Request trend' },
      cpu: { title: 'Total CPU time', desc: 'Total CPU time (ms)', trend: 'CPU time trend' },
    },
    pages: {
      dailyBuild: { title: 'Builds today', desc: 'Total builds today' },
      monthlyBuild: { title: 'Builds this month', desc: 'Total builds this month' },
      cf24h: { title: 'Cloud Functions requests (24h)', desc: 'Total requests in last 24 hours' },
      cfMonthlyRequests: { title: 'Cloud Functions requests (month)', desc: 'Requests month-to-date' },
      cfMonthlyGbs: { title: 'Cloud Functions GBs (month)', desc: 'GBs month-to-date' },
      cfTrend: 'Cloud Functions request trend',
    },
    reqPerf: {
      totalRequests: { title: 'Total requests', desc: 'Total requests' },
      avgResp: { title: 'Avg response time', desc: 'L7 avg response time (ms)' },
      ttfb: { title: 'Avg TTFB', desc: 'L7 avg TTFB (ms)' },
      requestsTrend: 'Request trend',
      latencyTrend: 'Latency trend',
    },
    security: {
      hits: { title: 'Protection hits' },
      trend: 'Protection trend',
    },
    top: {
      worldMap: 'Global request distribution',
      countryFlux: 'Top traffic by country/region',
      countryReq: 'Top requests by country/region',
      provinceFlux: 'Top traffic by province',
      provinceReq: 'Top requests by province',
      statusFlux: 'Top traffic by status code',
      statusReq: 'Top requests by status code',
      domainFlux: 'Top traffic by domain',
      domainReq: 'Top requests by domain',
      urlFlux: 'Top traffic by URL',
      urlReq: 'Top requests by URL',
      resourceFlux: 'Top traffic by resource type',
      resourceReq: 'Top requests by resource type',
      sipFlux: 'Top traffic by client IP',
      sipReq: 'Top requests by client IP',
      refererFlux: 'Top traffic by referer',
      refererReq: 'Top requests by referer',
      deviceFlux: 'Top traffic by device type',
      deviceReq: 'Top requests by device type',
      browserFlux: 'Top traffic by browser',
      browserReq: 'Top requests by browser',
      osFlux: 'Top traffic by OS',
      osReq: 'Top requests by OS',
      uaFlux: 'Top traffic by User Agent',
      uaReq: 'Top requests by User Agent',
    },
    errors: {
      customRangeTooLarge: 'Custom time range cannot exceed 31 days; adjusted to 31 days.',
      rangeTooLarge: 'Range too large',
      securityOnly14d: 'Only supports the last 14 days',
      securityOnly14dTitle: 'This metric only supports the last 14 days',
      missingField: 'Missing field',
    },
    charts: {
      requests: 'Requests',
      traffic: 'Traffic',
      securityHitsDescription: 'Total DDoS/CC protection hits',
      pagesRequests: 'Requests',
    },
    footer: {
      statementHtml:
        'Powered by <a href="https://github.com/afoim/eo_monitior" target="_blank" rel="noopener noreferrer" class="font-medium underline underline-offset-4 hover:text-primary">EdgeOne Monitoring Dashboard</a>. Built by <a href="https://2x.nz" target="_blank" rel="noopener noreferrer" class="font-medium underline underline-offset-4 hover:text-primary">Acofork</a> and maintained with passion by the community.',
    },
  },
};

function deepGet(obj, key) {
  const parts = String(key).split('.');
  let cur = obj;
  for (const part of parts) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = cur[part];
  }
  return cur;
}

function interpolate(str, vars) {
  if (!vars) return str;
  return String(str).replace(/\{(\w+)\}/g, (_, name) => {
    const v = vars[name];
    return v === undefined ? `{${name}}` : String(v);
  });
}

export function initI18n() {
  if (initialized) return currentLocale;
  currentLocale = detectInitialLocale();
  initialized = true;
  applyDocumentLocale();
  return currentLocale;
}

export function getLocale() {
  if (!initialized) initI18n();
  return currentLocale;
}

export function setLocale(locale) {
  const next = normalizeLocale(locale);
  if (!initialized) initI18n();
  if (next === currentLocale) return;
  currentLocale = next;

  try {
    localStorage.setItem(STORAGE_KEY, currentLocale);
  } catch {
    // ignore
  }

  applyDocumentLocale();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { locale: currentLocale } }));
  }
}

export function onLocaleChange(handler) {
  if (typeof window === 'undefined') return;
  window.addEventListener(EVENT_NAME, (e) => handler(e.detail?.locale || getLocale()));
}

export function t(key, vars) {
  const locale = getLocale();
  const fromLocale = deepGet(MESSAGES[locale], key);
  const fromDefault = deepGet(MESSAGES[DEFAULT_LOCALE], key);
  const resolved = fromLocale ?? fromDefault ?? key;
  return interpolate(resolved, vars);
}

export function applyTranslations(root = document) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    if (!key) return;
    el.innerHTML = t(key);
  });
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    const attr = el.getAttribute('data-i18n-attr');
    const value = t(key);
    if (attr) el.setAttribute(attr, value);
    else el.textContent = value;
  });
}

export function initLanguageSwitcher(selectId = 'language') {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.value = getLocale();
  select.addEventListener('change', () => setLocale(select.value));
}

function applyDocumentLocale() {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = getLocale();
  }
}

export function formatLocaleNumber(value) {
  const locale = getLocale();
  try {
    return Number(value).toLocaleString(locale);
  } catch {
    return String(value);
  }
}


import { metricsConfig } from './constants.js';
import { fetchData, processData } from './api.js';
import { calculateTimeRange, formatCount, handleTimeRangeChange } from './utils.js';
import { initCharts, resizeCharts } from './initCharts.js';
import {
  applyTranslations,
  getLocale,
  initI18n,
  initLanguageSwitcher,
  onLocaleChange,
  t,
} from './i18n.js';
import {
  updateBandwidthSection,
  updateEdgeFunctionsSection,
  updateOriginPullSection,
  updatePerformanceSection,
  updateRequestsSection,
  updateSecuritySection,
  updateTopAnalysisSection,
  updateTrafficSection,
} from './charts.js';

let charts = null;
let worldMapReadyPromise = null;

async function ensureWorldMapRegistered() {
  if (globalThis.echarts?.getMap?.('world')) return;
  if (!worldMapReadyPromise) {
    const url = './assets/geo/world.json';
    worldMapReadyPromise = fetch(url, { cache: 'force-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch world GeoJSON: ${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((geojson) => {
        globalThis.echarts.registerMap('world', geojson);
        return geojson;
      })
      .catch((err) => {
        console.error('[echarts] Failed to load/register world map GeoJSON:', err);
        return null;
      });
  }
  await worldMapReadyPromise;
}

initI18n();
applyTranslations();
initLanguageSwitcher('language');
onLocaleChange(() => {
  applyTranslations();
  initLanguageSwitcher('language');
  globalThis.refreshData?.();
});

async function fetchZones() {
    try {
        const response = await fetch('/api/zones');
        const result = await response.json();

        const select = document.getElementById('zoneId');
        // Keep the current selection if possible, or default to *
        const currentVal = select.value;
        select.innerHTML = ''; 

        // Always add "All Zones" option
        const allOption = document.createElement('option');
        allOption.value = "*";
        allOption.text = t('zones.all');
        select.appendChild(allOption);

        if (result.Zones && result.Zones.length > 0) {
            result.Zones.forEach(zone => {
                const option = document.createElement('option');
                option.value = zone.ZoneId;
                let text = zone.ZoneName;
                if (text === 'default-pages-zone') {
                    text += t('zones.pagesSuffix');
                }
                option.text = text;
                select.appendChild(option);
            });
        }

        // Restore selection if it exists in new options, otherwise default to *
        if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
            select.value = currentVal;
        } else {
            select.value = "*";
        }

    } catch (err) {
        console.error("Error fetching zones:", err);
        const select = document.getElementById('zoneId');
        // If error, ensure we have at least the default * option
        if (select.options.length === 0 || select.options[0].value !== '*') {
             select.innerHTML = `<option value="*">${t('zones.loadFailed')}</option>`;
        }
    }
}

async function fetchPagesBuildStats() {
     try {
        // Pages build stats are global, not per zone (usually), or the API handles it.
        // If it needs zoneId, we might need to pass it.
        // The current backend implementation just calls DescribePagesResources without params, 
        // so it likely returns account-level or default zone stats.
        // However, the user request implied it's a new API. 
        // Let's assume it doesn't need time range or zoneId for now as per backend implementation.

        // Get ZoneId if selected
        const zoneIdElement = document.getElementById('zoneId');
        const zoneId = zoneIdElement ? zoneIdElement.value : null;
        const url = zoneId && zoneId !== '*' ? `/api/pages/build-count?zoneId=${zoneId}` : '/api/pages/build-count';

        const response = await fetch(url);
        const result = await response.json();

        if (result.parsedResult) {
            const { dplDailyCount, dplMonthCount } = result.parsedResult;
            document.getElementById('kpi_pages_daily_build').innerText = dplDailyCount !== undefined ? dplDailyCount.toLocaleString(getLocale()) : '-';
            document.getElementById('kpi_pages_monthly_build').innerText = dplMonthCount !== undefined ? dplMonthCount.toLocaleString(getLocale()) : '-';
        } else {
             document.getElementById('kpi_pages_daily_build').innerText = '-';
             document.getElementById('kpi_pages_monthly_build').innerText = '-';
        }

    } catch (err) {
        console.error("Error fetching pages build stats:", err);
        document.getElementById('kpi_pages_daily_build').innerText = t('common.error');
        document.getElementById('kpi_pages_monthly_build').innerText = t('common.error');
    }
}

async function fetchPagesCloudFunctionStats(startTime, endTime) {
    try {
        if (!charts?.pagesCloudFunctionRequests) return;
        // Get ZoneId if selected
        const zoneIdElement = document.getElementById('zoneId');
        const zoneId = zoneIdElement ? zoneIdElement.value : null;

        let url = zoneId && zoneId !== '*' ? `/api/pages/cloud-function-requests?zoneId=${zoneId}` : '/api/pages/cloud-function-requests';

        // Add time range params if provided
        if (startTime && endTime) {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        // Parsed Result: { Status, Granularity, Timestamps, Values, TotalValue }
        if (result.parsedResult) {
            const { TotalValue, Timestamps, Values } = result.parsedResult;

            // Update KPI
            document.getElementById('kpi_pages_cloud_function_total').innerText = TotalValue !== undefined ? formatCount(TotalValue) : '-';

            // Update Chart
            if (Timestamps && Values && Timestamps.length > 0) {
                 const dates = Timestamps.map(ts => {
                    // Timestamps are in seconds, convert to local string
                    return new Date(ts * 1000).toLocaleString(getLocale(), { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
                });

                const option = {
                    tooltip: {
                        trigger: 'axis'
                    },
                    grid: {
                        left: '3%',
                        right: '4%',
                        bottom: '3%',
                        containLabel: true
                    },
                    xAxis: {
                        type: 'category',
                        boundaryGap: false,
                        data: dates
                    },
                    yAxis: {
                        type: 'value'
                    },
                    series: [
                        {
                            name: t('charts.requests'),
                            type: 'line',
                            smooth: true,
                            data: Values,
                            areaStyle: {
                                opacity: 0.1
                            },
                            itemStyle: {
                                color: '#3b82f6'
                            }
                        }
                    ]
                };
                charts.pagesCloudFunctionRequests.setOption(option);
            } else {
                charts.pagesCloudFunctionRequests.clear();
            }

        } else {
             document.getElementById('kpi_pages_cloud_function_total').innerText = '-';
             charts.pagesCloudFunctionRequests.clear();
        }
    } catch (err) {
        console.error("Error fetching pages cloud function stats:", err);
        document.getElementById('kpi_pages_cloud_function_total').innerText = t('common.error');
        charts.pagesCloudFunctionRequests.clear();
    }
}

async function fetchPagesCloudFunctionMonthlyStats() {
    try {
        // Get ZoneId if selected
        const zoneIdElement = document.getElementById('zoneId');
        const zoneId = zoneIdElement ? zoneIdElement.value : null;
        const url = zoneId && zoneId !== '*' ? `/api/pages/cloud-function-monthly-stats?zoneId=${zoneId}` : '/api/pages/cloud-function-monthly-stats';

        const response = await fetch(url);
        const result = await response.json();

        // Expected Result: { parsedResult: { TotalMemDuration: number, TotalInvocation: number } }
        if (result.parsedResult) {
            const { TotalMemDuration, TotalInvocation } = result.parsedResult;

            // Update Requests KPI
            document.getElementById('kpi_pages_monthly_cf_requests').innerText = TotalInvocation !== undefined ? formatCount(TotalInvocation) : '-';

            // Update GBs KPI (TotalMemDuration / 1024)
            if (TotalMemDuration !== undefined) {
                const gbs = (TotalMemDuration / 1024).toFixed(2);
                document.getElementById('kpi_pages_monthly_cf_gbs').innerText = gbs;
            } else {
                document.getElementById('kpi_pages_monthly_cf_gbs').innerText = '-';
            }

        } else {
             document.getElementById('kpi_pages_monthly_cf_requests').innerText = '-';
             document.getElementById('kpi_pages_monthly_cf_gbs').innerText = '-';
        }
    } catch (err) {
        console.error("Error fetching pages cloud function monthly stats:", err);
        document.getElementById('kpi_pages_monthly_cf_requests').innerText = t('common.error');
        document.getElementById('kpi_pages_monthly_cf_gbs').innerText = t('common.error');
    }
}

export async function refreshData() {
    if (!charts) return;
    await ensureWorldMapRegistered();
    // Show loading
    document.querySelectorAll('[id^="kpi_"]').forEach(el => el.innerText = t('common.loading'));

    // Check time range for Security Metrics
    const { startTime, endTime } = calculateTimeRange();
    const start = new Date(startTime);
    const end = new Date(endTime);
    // Allow a small buffer (e.g., 1 minute) for "7 days" check to handle slight offsets
    const isSecuritySupported = (end - start) <= (14 * 24 * 60 * 60 * 1000 + 60000);

    // Fetch all metrics
    const allMetrics = [
        ...metricsConfig.traffic,
        ...metricsConfig.bandwidth,
        ...metricsConfig.originPull,
        ...metricsConfig.requests,
        ...metricsConfig.performance,
        ...metricsConfig.edgeFunctions,
        ...(isSecuritySupported ? metricsConfig.security : []),
        ...metricsConfig.topAnalysis
    ];

    const results = {};

    // Start Pages Build Stats fetch (independent)
    fetchPagesBuildStats();
    // Start Pages Cloud Function Stats fetch (independent) - Pass time range
    fetchPagesCloudFunctionStats(startTime, endTime);
    // Start Pages Cloud Function Monthly Stats fetch (independent)
    fetchPagesCloudFunctionMonthlyStats();

    // Parallel fetch
    await Promise.all(allMetrics.map(async (metric) => {
        const res = await fetchData(metric);
        if (res) {
            results[metric] = processData(res, metric);
        }
    }));

    // Update UI
    updateTrafficSection(charts, results); //1.
    updateBandwidthSection(charts, results); //2.
    updateOriginPullSection(charts, results); //3.
    updateRequestsSection(charts, results); //4.
    updatePerformanceSection(charts, results); //5.
    updateEdgeFunctionsSection(charts, results); // New
    updateSecuritySection(charts, results); //5.1
    updateTopAnalysisSection(charts, results); //6.
}


export async function initDashboard() {
  charts = initCharts();
  await Promise.all([fetchZones(), ensureWorldMapRegistered()]);
  await refreshData();

  window.addEventListener('resize', () => resizeCharts(charts));
}

// Expose for inline handlers in index.html
window.refreshData = refreshData;
window.handleTimeRangeChange = handleTimeRangeChange;

initDashboard();

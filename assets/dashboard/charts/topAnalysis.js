import {
  codeToMapName,
  countryMap,
  getMetricLabel,
  provinceMap,
  worldNameMap,
} from '../constants.js';
import { getLocale, t } from '../i18n.js';
import {
  formatBytes,
  formatCount,
  getBestCountUnit,
  getBestUnit,
} from '../utils.js';

//通用处理
const renderTopChart = (results, chartInstance, metricName, nameResolver = null) => {
    const locale = getLocale();
    const data = results[metricName];

    if (!data || data.type !== 'top' || !data.data) return;

    const sortedData = [...data.data].sort((a, b) => b.Value - a.Value).slice(0, 10);

    let unit = '';
    let divisor = 1;
    let label = getMetricLabel(metricName, locale) || '';

    if (metricName.includes('outFlux')) {
        const maxVal = sortedData.length > 0 ? sortedData[0].Value : 0;
        const best = getBestUnit(maxVal, 'bytes');
        unit = best.unit;
        divisor = best.divisor;
    } else {
        const maxVal = sortedData.length > 0 ? sortedData[0].Value : 0;
        const best = getBestCountUnit(maxVal);
        unit = best.unit;
        divisor = best.divisor;
    }

    const resolveName = (key) => {
        if (!nameResolver) return key;
        if (typeof nameResolver === 'function') return nameResolver(key);
        return nameResolver?.[key] || key;
    };

    const yAxisData = sortedData.map(item => resolveName(item.Key)).reverse(); //问题点：没对“字段不存在”的短横杠做判断
    const seriesData = sortedData.map(item => {
        const val = item.Value / divisor;
        return (divisor === 1) ? val : val.toFixed(2);
    }).reverse();

    let color = '#3b82f6';
    const lowerName = metricName.toLowerCase();
    if (lowerName.includes('country')) color = '#3b82f6';
    else if (lowerName.includes('province') || lowerName.includes('resourcetype') || lowerName.includes('browser')) color = '#f59e0b';
    else if (lowerName.includes('statuscode') || lowerName.includes('referer') || lowerName.endsWith('_ua')) color = '#8b5cf6';
    else if (lowerName.includes('domain') || lowerName.includes('device')) color = '#06b6d4';
    else if (lowerName.includes('url') || lowerName.includes('os')) color = '#10b981';
    else if (lowerName.includes('sip')) color = '#ef4444';

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
                 const param = params[0];
                 let name = param.name;
                 if (name.length > 100) name = name.substring(0, 100) + '...';

                 const rawVal = sortedData[sortedData.length - 1 - param.dataIndex].Value;

                 let formattedVal = '';
                 if (metricName.includes('outFlux')) {
                     formattedVal = formatBytes(rawVal);
                 } else {
                     const fVal = formatCount(rawVal);
                     formattedVal = locale === 'zh-Hans'
                        ? `${fVal}${t('units.requests')}`
                        : `${fVal} ${t('units.requests')}`;
                 }

                 return `${name}<br/>${param.marker}${label}: ${formattedVal}`;
            }
        },
        grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value', name: unit },
        yAxis: { 
            type: 'category', 
            data: yAxisData,
            axisLabel: {
                formatter: function (value) {
                    if (value.length > 20) return value.substring(0, 20) + '...';
                    return value;
                }
            }
        },
        series: [
            {
                name: label,
                type: 'bar',
                data: seriesData,
                itemStyle: { color: color },
                label: { show: true, position: 'right' }
            }
        ]
    };
    chartInstance.setOption(option);
};

function updateTopMapChart(charts, results) {
    const locale = getLocale();
    const chartTopMap = charts.topMap;
    const metric = 'l7Flow_request_country';
    const data = results[metric];

    if (!data || data.type !== 'top' || !data.data) return;
    if (!globalThis.echarts?.getMap?.('world')) {
        chartTopMap?.clear?.();
        return;
    }

    // Map data to ECharts format
    // IMPORTANT: The 'name' here must match the region name AFTER nameMap is applied.
    // Since worldNameMap maps English names to Chinese (e.g. "China" -> "中国大陆"),
    // our data points must also use the Chinese names (e.g. "中国大陆") to match the map regions.
    const mapData = data.data.map(item => {
        const name = locale === 'zh-Hans'
            ? (countryMap[item.Key] || item.Key)
            : (codeToMapName[item.Key] || item.Key);
        return {
            name: name,
            value: item.Value
        };
    });

    const maxVal = mapData.length > 0 ? Math.max(...mapData.map(item => item.value)) : 0;

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function (params) {
                const val = params.value;
                const num = val ? val.toLocaleString(locale) : 0;
                return `${params.name}<br/>${t('charts.requests')}: ${num}${locale === 'zh-Hans' ? ' ' + t('units.requests') : ''}`;
            }
        },
        visualMap: {
            min: 0,
            max: maxVal,
            left: 'left',
            top: 'bottom',
            text: [t('common.high'), t('common.low')],
            calculable: true,
            inRange: {
                color: ['#e0f2fe', '#0284c7']
            }
        },
        series: [
            {
                name: t('charts.requests'),
                type: 'map',
                map: 'world',
                roam: true,
                ...(locale === 'zh-Hans' ? { nameMap: worldNameMap } : {}),
                emphasis: { label: { show: true } },
                data: mapData
            }
        ]
    };

    chartTopMap.setOption(option);
}

//6.有使用
export function updateTopAnalysisSection(charts, results) {
    const locale = getLocale();
    const {
        topCountry: chartTopCountry,
        topProvince: chartTopProvince,
        topStatusCode: chartTopStatusCode,
        topDomain: chartTopDomain,
        topUrl: chartTopUrl,
        topResourceType: chartTopResourceType,
        topSip: chartTopSip,
        topReferer: chartTopReferer,
        topUaDevice: chartTopUaDevice,
        topUaBrowser: chartTopUaBrowser,
        topUaOs: chartTopUaOs,
        topUa: chartTopUa,
        topRequestCountry: chartTopRequestCountry,
        topRequestProvince: chartTopRequestProvince,
        topRequestStatusCode: chartTopRequestStatusCode,
        topRequestDomain: chartTopRequestDomain,
        topRequestUrl: chartTopRequestUrl,
        topRequestResourceType: chartTopRequestResourceType,
        topRequestSip: chartTopRequestSip,
        topRequestReferer: chartTopRequestReferer,
        topRequestUaDevice: chartTopRequestUaDevice,
        topRequestUaBrowser: chartTopRequestUaBrowser,
        topRequestUaOs: chartTopRequestUaOs,
        topRequestUa: chartTopRequestUa,
    } = charts;
    updateTopMapChart(charts, results);

    const regionDisplayName = (code) => {
        if (locale === 'zh-Hans') return countryMap[code] || code;
        try {
            const dn = new Intl.DisplayNames([locale], { type: 'region' });
            return dn.of(code) || codeToMapName[code] || code;
        } catch {
            return codeToMapName[code] || code;
        }
    };

    const provinceDisplayName = (code) => {
        if (locale === 'zh-Hans') return provinceMap[code] || code;
        const provinceEn = {
            '22': 'Beijing',
            '86': 'Inner Mongolia',
            '146': 'Shanxi',
            '1069': 'Hebei',
            '1177': 'Tianjin',
            '119': 'Ningxia',
            '152': 'Shaanxi',
            '1208': 'Gansu',
            '1467': 'Qinghai',
            '1468': 'Xinjiang',
            '145': 'Heilongjiang',
            '1445': 'Jilin',
            '1464': 'Liaoning',
            '2': 'Fujian',
            '120': 'Jiangsu',
            '121': 'Anhui',
            '122': 'Shandong',
            '1050': 'Shanghai',
            '1442': 'Zhejiang',
            '182': 'Henan',
            '1135': 'Hubei',
            '1465': 'Jiangxi',
            '1466': 'Hunan',
            '118': 'Guizhou',
            '153': 'Yunnan',
            '1051': 'Chongqing',
            '1068': 'Sichuan',
            '1155': 'Tibet',
            '4': 'Guangdong',
            '173': 'Guangxi',
            '1441': 'Hainan',
            '0': 'Other',
            '1': 'HK/MO/TW',
            '-1': 'Overseas',
        };
        return provinceEn[code] || provinceMap[code] || code;
    };

    // Flux Charts
    renderTopChart(results, chartTopCountry, 'l7Flow_outFlux_country', regionDisplayName);
    renderTopChart(results, chartTopProvince, 'l7Flow_outFlux_province', provinceDisplayName);
    renderTopChart(results, chartTopStatusCode, 'l7Flow_outFlux_statusCode');
    renderTopChart(results, chartTopDomain, 'l7Flow_outFlux_domain');
    renderTopChart(results, chartTopUrl, 'l7Flow_outFlux_url');
    renderTopChart(results, chartTopResourceType, 'l7Flow_outFlux_resourceType');
    renderTopChart(results, chartTopSip, 'l7Flow_outFlux_sip');
    //renderTopChart(results, chartTopReferer, 'l7Flow_outFlux_referers'); //以前方案
    updateTopRefererChart(results, chartTopReferer); //降级处理，包含“字段不存在”处理
    renderTopChart(results, chartTopUaDevice, 'l7Flow_outFlux_ua_device');
    renderTopChart(results, chartTopUaBrowser, 'l7Flow_outFlux_ua_browser');
    renderTopChart(results, chartTopUaOs, 'l7Flow_outFlux_ua_os');
    renderTopChart(results, chartTopUa, 'l7Flow_outFlux_ua');

    // Request Charts
    renderTopChart(results, chartTopRequestCountry, 'l7Flow_request_country', regionDisplayName);
    renderTopChart(results, chartTopRequestProvince, 'l7Flow_request_province', provinceDisplayName);
    renderTopChart(results, chartTopRequestStatusCode, 'l7Flow_request_statusCode');
    renderTopChart(results, chartTopRequestDomain, 'l7Flow_request_domain');
    renderTopChart(results, chartTopRequestUrl, 'l7Flow_request_url');
    renderTopChart(results, chartTopRequestResourceType, 'l7Flow_request_resourceType');
    renderTopChart(results, chartTopRequestSip, 'l7Flow_request_sip');
    //renderTopChart(results, chartTopRequestReferer, 'l7Flow_request_referers');
    updateTopRequestRefererChart(results, chartTopRequestReferer); //降级方案
    renderTopChart(results, chartTopRequestUaDevice, 'l7Flow_request_ua_device');
    renderTopChart(results, chartTopRequestUaBrowser, 'l7Flow_request_ua_browser');
    renderTopChart(results, chartTopRequestUaOs, 'l7Flow_request_ua_os');
    renderTopChart(results, chartTopRequestUa, 'l7Flow_request_ua');
}

function updateTopRefererChart(results, chartTopReferer) {
    const locale = getLocale();
    const metric = 'l7Flow_outFlux_referers';
    const data = results[metric];

    if (!data || data.type !== 'top' || !data.data) return;

    // Sort by value (descending)
    const sortedData = [...data.data].sort((a, b) => b.Value - a.Value).slice(0, 10); // Top 10

    const yAxisData = sortedData.map(item => {
        // Clean up key: remove backticks and trim
        let key = item.Key.replace(/`/g, '').trim();
        if (!key || key === '-') return t('errors.missingField'); //无/直接访问
        return key;
    }).reverse();

    const seriesData = sortedData.map(item => (item.Value / (1024 * 1024 * 1024)).toFixed(2)).reverse(); // GB

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
                 const param = params[0];
                 return `${param.name}<br/>${param.marker}${t('charts.traffic')}: ${param.value} GB`;
            }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value', name: 'GB' },
        yAxis: { 
            type: 'category', 
            data: yAxisData,
            axisLabel: {
                formatter: function (value) {
                    // Truncate long URLs
                    if (value.length > 30) {
                        return value.substring(0, 30) + '...';
                    }
                    return value;
                }
            }
        },
        series: [
            {
                name: t('charts.traffic'),
                type: 'bar',
                data: seriesData,
                itemStyle: { color: '#8b5cf6' }, // Purple
                label: { show: true, position: 'right' }
            }
        ]
    };

    chartTopReferer.setOption(option);
}

function updateTopRequestRefererChart(results, chartTopRequestReferer) {
    const locale = getLocale();
    const metric = 'l7Flow_request_referers';
    const data = results[metric];

    if (!data || data.type !== 'top' || !data.data) return;

    // Sort by value (descending)
    const sortedData = [...data.data].sort((a, b) => b.Value - a.Value).slice(0, 10); // Top 10

    const yAxisData = sortedData.map(item => {
         let key = item.Key;
         if (key === '-') return t('errors.missingField'); //直接访问
         // Clean up backticks and extra spaces
         key = key.replace(/`/g, '').trim();
         return key.substring(0, 50) + (key.length > 50 ? '...' : '');
    }).reverse();
    const seriesData = sortedData.map(item => item.Value).reverse();

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
                 const param = params[0];
                 // Find full referer string
                 const originalItem = sortedData.find((item, index) => index === (sortedData.length - 1 - param.dataIndex));
                 let fullName = param.name;
                 if (originalItem) {
                     let key = originalItem.Key;
                     if (key === '-') fullName = t('errors.missingField'); //直接访问
                     else fullName = key.replace(/`/g, '').trim();
                 }
                 return `${fullName}<br/>${param.marker}${t('charts.requests')}: ${param.value.toLocaleString(locale)}${locale === 'zh-Hans' ? ' ' + t('units.requests') : ''}`;
            }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value', name: t('units.requests') },
        yAxis: { type: 'category', data: yAxisData, axisLabel: { interval: 0, width: 200, overflow: 'truncate' } },
        series: [
            {
                name: t('charts.requests'),
                type: 'bar',
                data: seriesData,
                itemStyle: { color: '#ec4899' },
                label: { show: true, position: 'right' }
            }
        ]
    };

    chartTopRequestReferer.setOption(option);
}

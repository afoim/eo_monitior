
import {
  codeToMapName,
  countryMap,
  metricColors,
  metricLabels,
  metricsConfig,
  provinceMap,
  worldNameMap,
} from './constants.js';
import {
  calculateTimeRange,
  formatBps,
  formatBytes,
  formatCount,
  getBestCountUnit,
  getBestUnit,
} from './utils.js';

export function updateTrafficSection(charts, results) {
    const chartTraffic = charts.traffic;
    const metrics = metricsConfig.traffic;
    const series = [];
    let timeData = [];

    // Calculate global max
    let globalMax = 0;
    metrics.forEach(metric => {
        const data = results[metric];
        if (data && data.type === 'time') {
            const max = Math.max(...data.valueData);
            if (max > globalMax) globalMax = max;
        }
    });

    const { unit, divisor } = getBestUnit(globalMax, 'bytes');

    metrics.forEach(metric => {
        const data = results[metric];
        if (!data || data.type !== 'time') return;

        // Update KPI
        document.getElementById(`kpi_${metric}`).innerText = formatBytes(data.sum);

        if (timeData.length === 0) timeData = data.timeData;

        // Chart Data (Dynamic Unit)
        const valueData = data.valueData.map(v => (v / divisor).toFixed(2));

        series.push({
            name: metricLabels[metric],
            type: 'line',
            smooth: true,
            data: valueData,
            itemStyle: { color: metricColors[metric] },
            areaStyle: { opacity: 0.1 },
            // Store raw data for tooltip
            rawData: data.valueData
        });
    });

    const option = {
        tooltip: { trigger: 'axis', formatter: (params) => {
            let res = params[0].axisValue + '<br/>';
            params.forEach(param => {
                // Access raw data using dataIndex
                const seriesIndex = param.seriesIndex;
                const dataIndex = param.dataIndex;
                const rawVal = series[seriesIndex].rawData[dataIndex];
                const formattedVal = formatBytes(rawVal);

                res += `${param.marker}${param.seriesName}: ${formattedVal}<br/>`;
            });
            return res;
        }},
        legend: { data: metrics.map(m => metricLabels[m]), bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: timeData },
        yAxis: { type: 'value', name: unit },
        series: series
    };
    chartTraffic.setOption(option);
}

//2.有使用
export function updateBandwidthSection(charts, results) {
    const chartBandwidth = charts.bandwidth;
    const metrics = metricsConfig.bandwidth;
    const series = [];
    let timeData = [];

    // Calculate global max
    let globalMax = 0;
    metrics.forEach(metric => {
        const data = results[metric];
        if (data && data.type === 'time') {
            const max = Math.max(...data.valueData);
            if (max > globalMax) globalMax = max;
        }
    });

    const { unit, divisor } = getBestUnit(globalMax, 'bandwidth');

    metrics.forEach(metric => {
        const data = results[metric];
        if (!data || data.type !== 'time') return;

        // Update KPI (Max/Peak)
        document.getElementById(`kpi_${metric}`).innerText = formatBps(data.max);

        if (timeData.length === 0) timeData = data.timeData;

        // Chart Data (Dynamic Unit)
        const valueData = data.valueData.map(v => (v / divisor).toFixed(2));

        series.push({
            name: metricLabels[metric],
            type: 'line',
            smooth: true,
            data: valueData,
            itemStyle: { color: metricColors[metric] },
            areaStyle: { opacity: 0.1 },
            // Store raw data
            rawData: data.valueData
        });
    });

    const option = {
        tooltip: { trigger: 'axis', formatter: (params) => {
            let res = params[0].axisValue + '<br/>';
            params.forEach(param => {
                const seriesIndex = param.seriesIndex;
                const dataIndex = param.dataIndex;
                const rawVal = series[seriesIndex].rawData[dataIndex];
                const formattedVal = formatBps(rawVal);
                res += `${param.marker}${param.seriesName}: ${formattedVal}<br/>`;
            });
            return res;
        }},
        legend: { data: metrics.map(m => metricLabels[m]), bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: timeData },
        yAxis: { type: 'value', name: unit },
        series: series
    };
    chartBandwidth.setOption(option);
}

//3.有使用
export function updateOriginPullSection(charts, results) {
    const chartOriginPull = charts.originPull;
    const metrics = metricsConfig.originPull;
    const series = [];
    let timeData = [];

    // Calculate global max for Flux, Bandwidth and Requests separately
    let maxFlux = 0;
    let maxBandwidth = 0;
    let maxRequests = 0;

    metrics.forEach(metric => {
        const data = results[metric];
        if (data && data.type === 'time') {
            const max = Math.max(...data.valueData);
            if (metric.includes('Flux')) {
                if (max > maxFlux) maxFlux = max;
            } else if (metric.includes('Bandwidth')) {
                if (max > maxBandwidth) maxBandwidth = max;
            } else if (metric.includes('request')) {
                if (max > maxRequests) maxRequests = max;
            }
        }
    });

    const fluxUnit = getBestUnit(maxFlux, 'bytes');
    const bandwidthUnit = getBestUnit(maxBandwidth, 'bandwidth');
    const requestUnit = getBestCountUnit(maxRequests);

    metrics.forEach(metric => {
        const data = results[metric];
        if (!data || data.type !== 'time') return;

        // Update KPI
        const kpiEl = document.getElementById(`kpi_${metric}`);
        if (kpiEl) {
            if (metric.includes('Flux')) {
                 kpiEl.innerText = formatBytes(data.sum);
            } else if (metric.includes('Bandwidth')) {
                 kpiEl.innerText = formatBps(data.max);
            } else if (metric.includes('request')) {
                 kpiEl.innerText = formatCount(data.sum);
            } else {
                 kpiEl.innerText = data.sum.toLocaleString();
            }
        }

        if (timeData.length === 0) timeData = data.timeData;

        let chartData = [];
        let unit = '';
        let divisor = 1;

        // Normalize data for chart
        if (metric.includes('Flux')) {
            unit = fluxUnit.unit;
            divisor = fluxUnit.divisor;
        } else if (metric.includes('Bandwidth')) {
            unit = bandwidthUnit.unit;
            divisor = bandwidthUnit.divisor;
        } else if (metric.includes('request')) {
            unit = requestUnit.unit;
            divisor = requestUnit.divisor;
        } else {
            unit = '';
            divisor = 1;
        }

        chartData = data.valueData.map(v => {
            const val = v / divisor;
            return (divisor === 1) ? val : val.toFixed(2);
        });

        series.push({
            name: metricLabels[metric],
            type: 'line',
            smooth: true,
            data: chartData,
            itemStyle: { color: metricColors[metric] },
            areaStyle: { opacity: 0.1 },
            customUnit: unit,
            rawData: data.valueData
        });
    });

    const option = {
        title: { show: false },
        tooltip: { 
            trigger: 'axis',
            formatter: (params) => {
                let res = params[0].axisValue + '<br/>';
                params.forEach(param => {
                    const seriesIndex = param.seriesIndex;
                    const dataIndex = param.dataIndex;
                    const rawVal = series[seriesIndex].rawData[dataIndex];

                    const unit = series[seriesIndex].customUnit || '';
                    let formattedVal = '';

                    if (unit.includes('bps')) {
                        formattedVal = formatBps(rawVal);
                    } else if (unit.includes('B')) {
                        formattedVal = formatBytes(rawVal);
                    } else if (unit.includes('千') || unit.includes('万') || unit.includes('亿')) {
                        formattedVal = formatCount(rawVal);
                    } else {
                        formattedVal = rawVal.toLocaleString();
                    }

                    res += `${param.marker}${param.seriesName}: ${formattedVal}<br/>`;
                });
                return res;
            }
        },
        legend: { data: metrics.map(m => metricLabels[m]), bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: timeData },
        yAxis: { type: 'value' },
        series: series
    };
    chartOriginPull.setOption(option);

    // Calculate Cache Hit Rate
    // Formula: 1 - (Origin Response Flux / EdgeOne Response Flux)
    const originFluxData = results['l7Flow_inFlux_hy']; // Origin Response
    const edgeFluxData = results['l7Flow_outFlux']; // EdgeOne Response

    let hitRate = 0;
    if (originFluxData && edgeFluxData && edgeFluxData.sum > 0) {
        hitRate = 1 - (originFluxData.sum / edgeFluxData.sum);
    }
    // Clamp hitRate if necessary (e.g. if origin > edge due to compression diffs, it might be negative, but let's show real value or clamp?)
    // Usually hit rate is 0-1.

    const hitRateEl = document.getElementById('kpi_cache_hit_rate');
    if (hitRateEl) {
        hitRateEl.innerText = (hitRate * 100).toFixed(2) + '%';
    }
}

//4.有使用
export function updateRequestsSection(charts, results) {
    const chartRequests = charts.requests;
    const metrics = metricsConfig.requests;
    const series = [];
    let timeData = [];

    // Calculate global max
    let globalMax = 0;
    metrics.forEach(metric => {
        const data = results[metric];
        if (data && data.type === 'time') {
            const max = Math.max(...data.valueData);
            if (max > globalMax) globalMax = max;
        }
    });

    const { unit, divisor } = getBestCountUnit(globalMax);

    metrics.forEach(metric => {
        const data = results[metric];
        if (!data || data.type !== 'time') return;

        // Update KPI
        document.getElementById(`kpi_${metric}`).innerText = formatCount(data.sum);

        if (timeData.length === 0) timeData = data.timeData;

        // Chart Data (Dynamic Unit)
        const valueData = data.valueData.map(v => {
            const val = v / divisor;
            return (divisor === 1) ? val : val.toFixed(2);
        });

        series.push({
            name: metricLabels[metric],
            type: 'line',
            smooth: true,
            data: valueData,
            itemStyle: { color: metricColors[metric] },
            areaStyle: { opacity: 0.2 },
            rawData: data.valueData
        });
    });

    const option = {
        tooltip: { trigger: 'axis', formatter: (params) => {
            let res = params[0].axisValue + '<br/>';
            params.forEach(param => {
                const seriesIndex = param.seriesIndex;
                const dataIndex = param.dataIndex;
                const rawVal = series[seriesIndex].rawData[dataIndex];
                const formattedVal = formatCount(rawVal);
                res += `${param.marker}${param.seriesName}: ${formattedVal}<br/>`;
            });
            return res;
        }},
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: timeData },
        yAxis: { type: 'value', name: unit },
        series: series
    };
    chartRequests.setOption(option);
}

//5.有使用
export function updatePerformanceSection(charts, results) {
    const chartPerformance = charts.performance;
    const metrics = metricsConfig.performance;
    const series = [];
    let timeData = [];

    metrics.forEach(metric => {
        const data = results[metric];
        if (!data || data.type !== 'time') return;

        // Update KPI (Avg)
        document.getElementById(`kpi_${metric}`).innerText = data.avg.toFixed(2) + ' ms';

        if (timeData.length === 0) timeData = data.timeData;

        series.push({
            name: metricLabels[metric],
            type: 'line',
            smooth: true,
            data: data.valueData,
            itemStyle: { color: metricColors[metric] }
        });
    });

    const option = {
        tooltip: { trigger: 'axis', formatter: '{b}<br/>{a}: {c} ms' },
        legend: { data: metrics.map(m => metricLabels[m]), bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: timeData },
        yAxis: { type: 'value', name: 'ms' },
        series: series
    };
    chartPerformance.setOption(option);
}

export function updateEdgeFunctionsSection(charts, results) {
    const chartFunctionRequests = charts.functionRequests;
    const chartFunctionCpu = charts.functionCpu;
    const metrics = metricsConfig.edgeFunctions;

    // Map metrics to specific charts and KPIs
    const metricMap = {
        'function_requestCount': {
            chart: chartFunctionRequests,
            kpiId: 'kpi_function_requestCount',
            unitType: 'count',
            color: metricColors['function_requestCount']
        },
        'function_cpuCostTime': {
            chart: chartFunctionCpu,
            kpiId: 'kpi_function_cpuCostTime',
            unitType: 'ms',
            color: metricColors['function_cpuCostTime']
        }
    };

    metrics.forEach(metric => {
        const config = metricMap[metric];
        if (!config) return;

        const data = results[metric];
        if (!data || data.type !== 'time') return;

        // Update KPI
        const kpiEl = document.getElementById(config.kpiId);
        if (kpiEl) {
            if (config.unitType === 'count') {
                kpiEl.innerText = formatCount(data.sum);
            } else if (config.unitType === 'ms') {
                // Format large numbers with commas
                kpiEl.innerText = data.sum.toLocaleString() + ' ms';
            }
        }

        // Chart
        const chart = config.chart;
        if (!chart) return;

        let seriesData = data.valueData;
        let unit = '';
        let divisor = 1;

        if (config.unitType === 'count') {
             const best = getBestCountUnit(Math.max(...data.valueData));
             unit = best.unit;
             divisor = best.divisor;
             seriesData = data.valueData.map(v => {
                const val = v / divisor;
                return (divisor === 1) ? val : val.toFixed(2);
             });
        } else if (config.unitType === 'ms') {
             unit = 'ms';
        }

        const option = {
            tooltip: { trigger: 'axis', formatter: (params) => {
                let res = params[0].axisValue + '<br/>';
                params.forEach(param => {
                    const val = data.valueData[param.dataIndex];
                    let formattedVal = val;
                    if (config.unitType === 'count') formattedVal = formatCount(val);
                    else formattedVal = val.toLocaleString() + ' ms';

                    res += `${param.marker}${param.seriesName}: ${formattedVal}<br/>`;
                });
                return res;
            }},
            legend: { data: [metricLabels[metric]], bottom: 0 },
            grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
            xAxis: { type: 'category', boundaryGap: false, data: data.timeData },
            yAxis: { type: 'value', name: unit },
            series: [{
                name: metricLabels[metric],
                type: 'line',
                smooth: true,
                data: seriesData,
                itemStyle: { color: config.color },
                areaStyle: { opacity: 0.1 }
            }]
        };
        chart.setOption(option);
    });
}

//5.1. Security Section
export function updateSecuritySection(charts, results) {
    const chartSecurity = charts.security;
    const metrics = metricsConfig.security;

    // Check time range limit
    const { startTime, endTime } = calculateTimeRange();
    const start = new Date(startTime);
    const end = new Date(endTime);
    // Allow a small buffer
    if ((end - start) > (14 * 24 * 60 * 60 * 1000 + 60000)) {
        const kpiEl = document.getElementById('kpi_security_hits');
        if (kpiEl) {
            kpiEl.innerText = "范围过大";
            kpiEl.parentElement.querySelector('p').innerText = "仅支持查询14天内的数据";
            kpiEl.parentElement.querySelector('p').classList.add('text-red-500');
        }

        chartSecurity.clear();
        chartSecurity.setOption({
             title: {
                 text: '该指标仅支持查询14天内的数据',
                 left: 'center',
                 top: 'center',
                 textStyle: { color: '#9ca3af', fontSize: 14, fontWeight: 'normal' }
             }
        });
        return;
    }

    // Reset error style if applicable
    const kpiEl = document.getElementById('kpi_security_hits');
    if (kpiEl) {
        const p = kpiEl.parentElement.querySelector('p');
        if (p) {
            p.innerText = "DDoS/CC 防护总拦截次数";
            p.classList.remove('text-red-500');
        }
    }

    const series = [];
    let timeData = [];
    let totalHits = 0;

    metrics.forEach(metric => {
        const data = results[metric];
        if (!data || data.type !== 'time') return;

        totalHits += data.sum;

        if (timeData.length === 0) timeData = data.timeData;

        series.push({
            name: metricLabels[metric],
            type: 'line',
            smooth: true,
            stack: 'Total', // Stacked area chart
            areaStyle: {},
            emphasis: { focus: 'series' },
            data: data.valueData,
            itemStyle: { color: metricColors[metric] }
        });
    });

    // Update KPI
    if (kpiEl) {
        const formatted = formatCount(totalHits);
        kpiEl.innerText = formatted;
    }

    const option = {
        title: { show: false },
        tooltip: { 
            trigger: 'axis', 
            axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } }
        },
        legend: { data: metrics.map(m => metricLabels[m]), bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: timeData },
        yAxis: { type: 'value' },
        series: series
    };
    chartSecurity.setOption(option);
}

//通用处理
const renderTopChart = (results, chartInstance, metricName, mapObject = null) => {
    const data = results[metricName];

    if (!data || data.type !== 'top' || !data.data) return;

    const sortedData = [...data.data].sort((a, b) => b.Value - a.Value).slice(0, 10);

    let unit = '';
    let divisor = 1;
    let label = metricLabels[metricName] || '';

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

    const yAxisData = sortedData.map(item => mapObject?.[item.Key] || item.Key).reverse(); //问题点：没对“字段不存在”的短横杠做判断
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
                     // Append '次' if not present in unit (formatCount returns unit, but we might want explicit '次')
                     // formatCount returns "1.23 万". "1.23 万次" sounds good.
                     // "500" -> "500 次".
                     formattedVal = fVal + (fVal.includes('千') || fVal.includes('万') || fVal.includes('亿') ? '次' : ' 次');
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
    const chartTopMap = charts.topMap;
    const metric = 'l7Flow_request_country';
    const data = results[metric];

    if (!data || data.type !== 'top' || !data.data) return;

    // Map data to ECharts format
    // IMPORTANT: The 'name' here must match the region name AFTER nameMap is applied.
    // Since worldNameMap maps English names to Chinese (e.g. "China" -> "中国大陆"),
    // our data points must also use the Chinese names (e.g. "中国大陆") to match the map regions.
    const mapData = data.data.map(item => {
        const name = countryMap[item.Key] || codeToMapName[item.Key] || item.Key;
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
                return `${params.name}<br/>请求数: ${val ? val.toLocaleString() : 0} 次`;
            }
        },
        visualMap: {
            min: 0,
            max: maxVal,
            left: 'left',
            top: 'bottom',
            text: ['High', 'Low'],
            calculable: true,
            inRange: {
                color: ['#e0f2fe', '#0284c7']
            }
        },
        series: [
            {
                name: '请求数',
                type: 'map',
                mapType: 'world',
                roam: true,
                nameMap: worldNameMap,
                itemStyle: {
                    emphasis: { label: { show: true } }
                },
                data: mapData
            }
        ]
    };

    chartTopMap.setOption(option);
}

//6.有使用
export function updateTopAnalysisSection(charts, results) {
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

    // Flux Charts
    renderTopChart(results, chartTopCountry, 'l7Flow_outFlux_country', countryMap);
    renderTopChart(results, chartTopProvince, 'l7Flow_outFlux_province', provinceMap);
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
    renderTopChart(results, chartTopRequestCountry, 'l7Flow_request_country', countryMap);
    renderTopChart(results, chartTopRequestProvince, 'l7Flow_request_province', provinceMap);
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
    const metric = 'l7Flow_outFlux_referers';
    const data = results[metric];

    if (!data || data.type !== 'top' || !data.data) return;

    // Sort by value (descending)
    const sortedData = [...data.data].sort((a, b) => b.Value - a.Value).slice(0, 10); // Top 10

    const yAxisData = sortedData.map(item => {
        // Clean up key: remove backticks and trim
        let key = item.Key.replace(/`/g, '').trim();
        if (!key || key === '-') return '字段不存在'; //无/直接访问
        return key;
    }).reverse();

    const seriesData = sortedData.map(item => (item.Value / (1024 * 1024 * 1024)).toFixed(2)).reverse(); // GB

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
                 const param = params[0];
                 return `${param.name}<br/>${param.marker}流量: ${param.value} GB`;
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
                name: '流量',
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
    const metric = 'l7Flow_request_referers';
    const data = results[metric];

    if (!data || data.type !== 'top' || !data.data) return;

    // Sort by value (descending)
    const sortedData = [...data.data].sort((a, b) => b.Value - a.Value).slice(0, 10); // Top 10

    const yAxisData = sortedData.map(item => {
         let key = item.Key;
         if (key === '-') return '字段不存在'; //直接访问
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
                     if (key === '-') fullName = '字段不存在'; //直接访问
                     else fullName = key.replace(/`/g, '').trim();
                 }
                 return `${fullName}<br/>${param.marker}请求数: ${param.value.toLocaleString()} 次`;
            }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value', name: '次' },
        yAxis: { type: 'category', data: yAxisData, axisLabel: { interval: 0, width: 200, overflow: 'truncate' } },
        series: [
            {
                name: '请求数',
                type: 'bar',
                data: seriesData,
                itemStyle: { color: '#ec4899' },
                label: { show: true, position: 'right' }
            }
        ]
    };

    chartTopRequestReferer.setOption(option);
}

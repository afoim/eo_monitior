
import { calculateTimeRange } from './utils.js';

async function fetchData(metric) {
    try {
        const { startTime, endTime } = calculateTimeRange();
        const interval = document.getElementById('interval').value;
        const zoneId = document.getElementById('zoneId').value.trim();

        let url = `/api/traffic?metric=${metric}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
        if (interval && interval !== 'auto') {
            url += `&interval=${interval}`;
        }
        if (zoneId) {
            url += `&zoneId=${encodeURIComponent(zoneId)}`;
        }

        const response = await fetch(url);
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        return result;
    } catch (err) {
        console.error(`Error fetching ${metric}:`, err);
        return null;
    }
}

function processData(result, targetMetric) {
    // Check for Top Data Structure (DescribeTopL7AnalysisData)
    // It returns Data[0].DetailData (Array of Key/Value)
    if (result?.Data?.[0]?.DetailData) {
         return {
             type: 'top',
             data: result.Data[0].DetailData
         };
    }

    // DescribeTimingL7AnalysisData returns 'Data'
    // DescribeTimingL7OriginPullData returns 'TimingDataRecords'
    const dataList = result?.Data || result?.TimingDataRecords || [];
    if (dataList.length === 0) return { timeData: [], valueData: [], sum: 0, max: 0, avg: 0, type: 'time' };

    let typeValue;

    // Try to find matching metric in TypeValue or Value
    if (targetMetric) {
        if (dataList[0]?.TypeValue) {
            typeValue = dataList[0].TypeValue.find(item => item.MetricName === targetMetric);
        } else if (dataList[0]?.Value) {
            typeValue = dataList[0].Value.find(item => item.MetricName === targetMetric);
        }
    }

    // Fallback if not found or no targetMetric (or if only one exists)
    if (!typeValue) {
         typeValue = dataList[0]?.TypeValue?.[0];
         // Support DescribeWebProtectionData structure (Value instead of TypeValue)
         if (!typeValue && dataList[0]?.Value?.[0]) {
            typeValue = dataList[0].Value[0];
         }
    }

    const details = typeValue?.Detail || [];
    const sum = typeValue?.Sum || 0;
    const max = typeValue?.Max || 0;
    const avg = typeValue?.Avg || 0;

    const timeData = [];
    const valueData = [];

    // Context for formatting
    const range = document.getElementById('timeRange')?.value || '30min';
    const interval = document.getElementById('interval')?.value || 'auto';
    const longRanges = ['3d', '7d', '14d', '31d'];

    // Auto-detect if interval is effectively 'day'
    let isDayInterval = interval === 'day';
    if (interval === 'auto' && details.length > 1) {
        const diff = details[1].Timestamp - details[0].Timestamp;
        // If interval is >= 23 hours (allow some slack), treat as day
        if (diff >= 82800) isDayInterval = true;
    }
    // If auto and range is 31d/15d, it usually defaults to day
    if (interval === 'auto' && ['14d', '31d'].includes(range)) {
        // Check if we have few points (e.g. < 32 for 31d), likely day
        if (details.length <= 32) isDayInterval = true;
    }

    // Calculate time span of the data
    let span = 0;
    if (details.length > 0) {
         span = details[details.length - 1].Timestamp - details[0].Timestamp;
    }

    details.forEach(item => {
        const date = new Date(item.Timestamp * 1000);
        let label;

        if (isDayInterval) {
            // Show YYYY-MM-DD
            label = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        } else if (span > 86400 || longRanges.includes(range) || (range === 'custom' && span > 86400)) {
            // Show MM-DD HH:mm for long ranges or custom > 24h
            label = `${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        } else {
            // Show HH:mm for short ranges
            label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }

        timeData.push(label);
        valueData.push(item.Value);
    });

    return { timeData, valueData, sum, max, avg, type: 'time' };
}


export {
  fetchData,
  processData,
};

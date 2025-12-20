function formatDate(date) {
    return date.toISOString().slice(0, 19) + 'Z';
}

function handleTimeRangeChange() {
    const range = document.getElementById('timeRange').value;
    const customInputs = document.getElementById('customTimeInputs');
    if (range === 'custom') {
        customInputs.classList.remove('hidden');
        customInputs.classList.add('flex');
    } else {
        customInputs.classList.add('hidden');
        customInputs.classList.remove('flex');
        globalThis.refreshData?.();
    }
}

function calculateTimeRange() {
    const range = document.getElementById('timeRange').value;
    const now = new Date();
    let endTime = new Date(now);
    let startTime;

    switch(range) {
        case '30min': startTime = new Date(now.getTime() - 30 * 60 * 1000); break;
        case '1h': startTime = new Date(now.getTime() - 1 * 60 * 60 * 1000); break;
        case '6h': startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000); break;
        case 'today': 
            startTime = new Date(now);
            startTime.setHours(0, 0, 0, 0);
            break;
        case 'yesterday':
            startTime = new Date(now);
            startTime.setDate(now.getDate() - 1);
            startTime.setHours(0, 0, 0, 0);

            endTime = new Date(now);
            endTime.setDate(now.getDate() - 1);
            endTime.setHours(23, 59, 59, 999);
            break;
        case '3d': startTime = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); break;
        case '7d': startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case '14d': startTime = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); break;
        case '31d': startTime = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000); break;
        case 'custom':
            const days = parseInt(document.getElementById('customDays').value) || 0;
            const hours = parseInt(document.getElementById('customHours').value) || 0;
            const minutes = parseInt(document.getElementById('customMinutes').value) || 0;
            const seconds = parseInt(document.getElementById('customSeconds').value) || 0;

            let totalMs = ((days * 24 * 60 * 60) + (hours * 60 * 60) + (minutes * 60) + seconds) * 1000;
            const maxMs = 31 * 24 * 60 * 60 * 1000; // 31 days limit
            const errorEl = document.getElementById('timeRangeError');

            if (totalMs > maxMs) {
                if (errorEl) errorEl.innerText = '自定义时间范围不能超过 31 天，已自动为您调整为 31 天。';
                totalMs = maxMs;
            } else {
                if (errorEl) errorEl.innerText = '';
            }

            if (totalMs > 0) {
                startTime = new Date(now.getTime() - totalMs);
            } else {
                // Default to 1 hour if nothing entered
                startTime = new Date(now.getTime() - 60 * 60 * 1000);
            }
            break;
        default: startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return {
        startTime: formatDate(startTime),
        endTime: formatDate(endTime)
    };
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    if (i < 0) return bytes + ' B';
    if (i >= sizes.length) return (bytes / Math.pow(k, sizes.length - 1)).toFixed(2) + ' ' + sizes[sizes.length - 1];
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatBps(bps) {
    if (bps === 0) return '0 bps';
    const k = 1024;
    const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps', 'Pbps', 'Ebps', 'Zbps', 'Ybps'];
    const i = Math.floor(Math.log(bps) / Math.log(k));
    if (i < 0) return bps + ' bps';
    if (i >= sizes.length) return (bps / Math.pow(k, sizes.length - 1)).toFixed(2) + ' ' + sizes[sizes.length - 1];
    return parseFloat((bps / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatCount(num) {
    if (num === 0) return '0';
    if (num < 1000) return num.toString();
    if (num < 10000) return (num / 1000).toFixed(2) + ' 千';
    if (num < 100000000) return (num / 10000).toFixed(2) + ' 万';
    return (num / 100000000).toFixed(2) + ' 亿';
}

function getBestCountUnit(maxValue) {
    if (maxValue < 1000) return { unit: '次', divisor: 1 };
    if (maxValue < 10000) return { unit: '千次', divisor: 1000 };
    if (maxValue < 100000000) return { unit: '万次', divisor: 10000 };
    return { unit: '亿次', divisor: 100000000 };
}

function getBestUnit(maxValue, type = 'bytes') {
    const k = 1024;
    const byteUnits = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const bitUnits = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps', 'Pbps'];
    const units = type === 'bandwidth' ? bitUnits : byteUnits;

    if (maxValue === 0) return { unit: units[0], divisor: 1 };

    let i = Math.floor(Math.log(maxValue) / Math.log(k));
    if (i < 0) i = 0;
    if (i >= units.length) i = units.length - 1;

    return { unit: units[i], divisor: Math.pow(k, i) };
}


export {
  formatDate,
  handleTimeRangeChange,
  calculateTimeRange,
  formatBytes,
  formatBps,
  formatCount,
  getBestCountUnit,
  getBestUnit,
};

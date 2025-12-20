export function initCharts() {
  return {
    traffic: echarts.init(document.getElementById('chart_traffic')),
    bandwidth: echarts.init(document.getElementById('chart_bandwidth')),
    requests: echarts.init(document.getElementById('chart_requests')),
    performance: echarts.init(document.getElementById('chart_performance')),
    security: echarts.init(document.getElementById('chart_security')),
    originPull: echarts.init(document.getElementById('chart_origin_pull')),

    topCountry: echarts.init(document.getElementById('chart_top_country')),
    topProvince: echarts.init(document.getElementById('chart_top_province')),
    topStatusCode: echarts.init(document.getElementById('chart_top_status_code')),
    topDomain: echarts.init(document.getElementById('chart_top_domain')),
    topUrl: echarts.init(document.getElementById('chart_top_url')),
    topResourceType: echarts.init(document.getElementById('chart_top_resource_type')),
    topSip: echarts.init(document.getElementById('chart_top_sip')),
    topReferer: echarts.init(document.getElementById('chart_top_referer')),
    topUaDevice: echarts.init(document.getElementById('chart_top_ua_device')),
    topUaBrowser: echarts.init(document.getElementById('chart_top_ua_browser')),
    topUaOs: echarts.init(document.getElementById('chart_top_ua_os')),
    topUa: echarts.init(document.getElementById('chart_top_ua')),

    topRequestCountry: echarts.init(document.getElementById('chart_top_request_country')),
    topRequestProvince: echarts.init(document.getElementById('chart_top_request_province')),
    topRequestStatusCode: echarts.init(document.getElementById('chart_top_request_status_code')),
    topRequestDomain: echarts.init(document.getElementById('chart_top_request_domain')),
    topRequestUrl: echarts.init(document.getElementById('chart_top_request_url')),
    topRequestResourceType: echarts.init(document.getElementById('chart_top_request_resource_type')),
    topRequestSip: echarts.init(document.getElementById('chart_top_request_sip')),
    topRequestReferer: echarts.init(document.getElementById('chart_top_request_referer')),
    topRequestUaDevice: echarts.init(document.getElementById('chart_top_request_ua_device')),
    topRequestUaBrowser: echarts.init(document.getElementById('chart_top_request_ua_browser')),
    topRequestUaOs: echarts.init(document.getElementById('chart_top_request_ua_os')),
    topRequestUa: echarts.init(document.getElementById('chart_top_request_ua')),

    topMap: echarts.init(document.getElementById('chart_top_map')),

    functionRequests: echarts.init(document.getElementById('chart_function_requests')),
    functionCpu: echarts.init(document.getElementById('chart_function_cpu')),

    pagesCloudFunctionRequests: echarts.init(
      document.getElementById('chart_pages_cloud_function_requests')
    ),
  };
}

export function resizeCharts(charts) {
  if (!charts) return;

  for (const chart of Object.values(charts)) {
    if (chart && typeof chart.resize === 'function') {
      chart.resize();
    }
  }
}

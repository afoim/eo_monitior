import express from 'express';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';
// import { fileURLToPath } from 'url';
import { teo } from "tencentcloud-sdk-nodejs-teo";
import { CommonClient } from "tencentcloud-sdk-nodejs-common";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const app = express();

// Function to read keys
function getKeys() {
    // 1. Try Environment Variables first
    let secretId = process.env.SECRET_ID;
    let secretKey = process.env.SECRET_KEY;

    if (secretId && secretKey) {
        return { secretId, secretKey };
    }

    // 2. Try key.txt if Env Vars are missing
    try {
        // const keyPath = path.resolve(__dirname, '../../key.txt');
        const keyPath = path.resolve(process.cwd(), 'key.txt');
        
        if (fs.existsSync(keyPath)) {
            const content = fs.readFileSync(keyPath, 'utf-8');
            const lines = content.split('\n');
            
            lines.forEach(line => {
                if (line.includes('SecretId') && !secretId) {
                    secretId = line.split('：')[1].trim();
                }
                if (line.includes('SecretKey') && !secretKey) {
                    secretKey = line.split('：')[1].trim();
                }
            });
        }
    } catch (err) {
        console.error("Error reading key.txt:", err);
    }

    return { secretId, secretKey };
}

// Metrics that belong to DescribeTimingL7OriginPullData
const ORIGIN_PULL_METRICS = [
    'l7Flow_outFlux_hy',
    'l7Flow_outBandwidth_hy',
    'l7Flow_request_hy',
    'l7Flow_inFlux_hy',
    'l7Flow_inBandwidth_hy'
];

// Metrics that belong to DescribeTopL7AnalysisData
const TOP_ANALYSIS_METRICS = [
    'l7Flow_outFlux_country',
    'l7Flow_outFlux_province',
    'l7Flow_outFlux_statusCode',
    'l7Flow_outFlux_domain',
    'l7Flow_outFlux_url',
    'l7Flow_outFlux_resourceType',
    'l7Flow_outFlux_sip',
    'l7Flow_outFlux_referers',
    'l7Flow_outFlux_ua_device',
    'l7Flow_outFlux_ua_browser',
    'l7Flow_outFlux_ua_os',
    'l7Flow_outFlux_ua',
    'l7Flow_request_country',
    'l7Flow_request_province',
    'l7Flow_request_statusCode',
    'l7Flow_request_domain',
    'l7Flow_request_url',
    'l7Flow_request_resourceType',
    'l7Flow_request_sip',
    'l7Flow_request_referers',
    'l7Flow_request_ua_device',
    'l7Flow_request_ua_browser',
    'l7Flow_request_ua_os',
    'l7Flow_request_ua'
];

// Metrics that belong to DescribeWebProtectionData (DDoS/Security)
const SECURITY_METRICS = [
    'ccAcl_interceptNum',
    'ccManage_interceptNum',
    'ccRate_interceptNum'
];

// Metrics that belong to DescribeTimingFunctionAnalysisData (Edge Functions)
const FUNCTION_METRICS = [
    'function_requestCount',
    'function_cpuCostTime'
];

function buildDomainFilters(domain) {
    if (!domain || domain === '*') {
        return undefined;
    }
    return [{ Key: "domain", Operator: "equals", Value: [domain] }];
}

app.get('/config', (req, res) => {
    res.json({
        siteName: process.env.SITE_NAME || '茶茶吖 的 EdgeOne 监控大屏',
        siteIcon: process.env.SITE_ICON || 'https://blog.ccya.top/logo.svg'
    });
});

app.get('/zones', async (req, res) => {
    try {
        const { secretId, secretKey } = getKeys();
        
        if (!secretId || !secretKey) {
            return res.status(500).json({ error: "Missing credentials" });
        }

        const TeoClient = teo.v20220901.Client;
        const clientConfig = {
            credential: {
                secretId: secretId,
                secretKey: secretKey,
            },
            region: "ap-guangzhou",
            profile: {
                httpProfile: {
                    endpoint: "teo.tencentcloudapi.com",
                },
            },
        };

        const client = new TeoClient(clientConfig);
        const params = {};
        
        console.log("Calling DescribeZones...");
        const data = await client.DescribeZones(params);
        res.json(data);
    } catch (err) {
        console.error("Error calling DescribeZones:", err);
        res.status(500).json({ error: err.message });
    }
});

// 新增：获取站点下的所有加速域名
app.get('/domains', async (req, res) => {
    try {
        const { secretId, secretKey } = getKeys();
        const { zoneId } = req.query;

        if (!secretId || !secretKey) {
            return res.status(500).json({ error: "Missing credentials" });
        }

        const TeoClient = teo.v20220901.Client;
        const client = new TeoClient({
            credential: { secretId, secretKey },
            region: "ap-guangzhou",
            profile: { httpProfile: { endpoint: "teo.tencentcloudapi.com" } }
        });

        const params = zoneId && zoneId !== '*' ? { ZoneId: zoneId } : {};
        const data = await client.DescribeAccelerationDomains(params);
        res.json(data);
    } catch (err) {
        console.error("Error fetching domains:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/pages/build-count', async (req, res) => {
    try {
        const { secretId, secretKey } = getKeys();
        
        if (!secretId || !secretKey) {
            return res.status(500).json({ error: "Missing credentials" });
        }

        const commonClientConfig = {
            credential: {
                secretId: secretId,
                secretKey: secretKey,
            },
            region: "ap-guangzhou",
            profile: {
                httpProfile: {
                    endpoint: "teo.tencentcloudapi.com",
                },
            },
        };

        const client = new CommonClient(
            "teo.tencentcloudapi.com",
            "2022-09-01",
            commonClientConfig
        );

        // 1. Find ZoneId (Pages usually requires 'default-pages-zone')
        let targetZoneId = req.query.zoneId;

        if (!targetZoneId) {
             try {
                const TeoClient = teo.v20220901.Client;
                const teoClient = new TeoClient({
                    credential: { secretId, secretKey },
                    region: "ap-guangzhou",
                    profile: { httpProfile: { endpoint: "teo.tencentcloudapi.com" } }
                });
                
                const zonesData = await teoClient.DescribeZones({});
                if (zonesData && zonesData.Zones) {
                    const pagesZone = zonesData.Zones.find(z => z.ZoneName === 'default-pages-zone');
                    if (pagesZone) {
                        targetZoneId = pagesZone.ZoneId;
                        console.log(`Found default-pages-zone: ${targetZoneId}`);
                    } else if (zonesData.Zones.length > 0) {
                        targetZoneId = zonesData.Zones[0].ZoneId;
                        console.log(`default-pages-zone not found, using first zone: ${targetZoneId}`);
                    }
                }
             } catch (zErr) {
                 console.error("Error fetching zones for Pages:", zErr);
             }
        }

        if (!targetZoneId) {
            return res.status(400).json({ error: "Missing ZoneId and could not auto-discover one." });
        }

        const params = {
            "Interface": "pages:DescribePagesDeploymentUsage",
            "Payload": "{}",
            "ZoneId": targetZoneId
        };
        
        console.log("Calling DescribePagesResources with params:", JSON.stringify(params));
        const data = await client.request("DescribePagesResources", params);
        
        // Parse Result string if present
        if (data && data.Result) {
            try {
                data.parsedResult = JSON.parse(data.Result);
            } catch (e) {
                console.error("Error parsing Result JSON:", e);
            }
        }
        
        res.json(data);
    } catch (err) {
        console.error("Error calling DescribePagesResources:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/pages/cloud-function-requests', async (req, res) => {
    try {
        const { secretId, secretKey } = getKeys();
        
        if (!secretId || !secretKey) {
            return res.status(500).json({ error: "Missing credentials" });
        }

        const commonClientConfig = {
            credential: {
                secretId: secretId,
                secretKey: secretKey,
            },
            region: "ap-guangzhou",
            profile: {
                httpProfile: {
                    endpoint: "teo.tencentcloudapi.com",
                },
            },
        };

        const client = new CommonClient(
            "teo.tencentcloudapi.com",
            "2022-09-01",
            commonClientConfig
        );

        // 1. Find ZoneId
        let targetZoneId = req.query.zoneId;
        const { startTime, endTime } = req.query;

        if (!targetZoneId) {
             try {
                const TeoClient = teo.v20220901.Client;
                const teoClient = new TeoClient({
                    credential: { secretId, secretKey },
                    region: "ap-guangzhou",
                    profile: { httpProfile: { endpoint: "teo.tencentcloudapi.com" } }
                });
                
                const zonesData = await teoClient.DescribeZones({});
                if (zonesData && zonesData.Zones) {
                    const pagesZone = zonesData.Zones.find(z => z.ZoneName === 'default-pages-zone');
                    if (pagesZone) {
                        targetZoneId = pagesZone.ZoneId;
                        console.log(`Found default-pages-zone: ${targetZoneId}`);
                    } else if (zonesData.Zones.length > 0) {
                        targetZoneId = zonesData.Zones[0].ZoneId;
                        console.log(`default-pages-zone not found, using first zone: ${targetZoneId}`);
                    }
                }
             } catch (zErr) {
                 console.error("Error fetching zones for Pages:", zErr);
             }
        }

        if (!targetZoneId) {
            return res.status(400).json({ error: "Missing ZoneId and could not auto-discover one." });
        }

        const payload = {
            ZoneId: targetZoneId,
            Interval: "hour"
        };
        
        if (startTime) payload.StartTime = startTime;
        if (endTime) payload.EndTime = endTime;

        const params = {
            "ZoneId": targetZoneId,
            "Interface": "pages:DescribePagesFunctionsRequestDataByZone",
            "Payload": JSON.stringify(payload)
        };
        
        console.log("Calling DescribePagesResources (CloudFunction) with params:", JSON.stringify(params));
        const data = await client.request("DescribePagesResources", params);
        
        // Parse Result string if present
        if (data && data.Result) {
            try {
                data.parsedResult = JSON.parse(data.Result);
            } catch (e) {
                console.error("Error parsing Result JSON:", e);
            }
        }
        
        res.json(data);
    } catch (err) {
        console.error("Error calling DescribePagesResources for CloudFunction:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/pages/cloud-function-monthly-stats', async (req, res) => {
    try {
        const { secretId, secretKey } = getKeys();
        
        if (!secretId || !secretKey) {
            return res.status(500).json({ error: "Missing credentials" });
        }

        const commonClientConfig = {
            credential: {
                secretId: secretId,
                secretKey: secretKey,
            },
            region: "ap-guangzhou",
            profile: {
                httpProfile: {
                    endpoint: "teo.tencentcloudapi.com",
                },
            },
        };

        const client = new CommonClient(
            "teo.tencentcloudapi.com",
            "2022-09-01",
            commonClientConfig
        );

        // 1. Find ZoneId
        let targetZoneId = req.query.zoneId;

        if (!targetZoneId) {
             try {
                const TeoClient = teo.v20220901.Client;
                const teoClient = new TeoClient({
                    credential: { secretId, secretKey },
                    region: "ap-guangzhou",
                    profile: { httpProfile: { endpoint: "teo.tencentcloudapi.com" } }
                });
                
                const zonesData = await teoClient.DescribeZones({});
                if (zonesData && zonesData.Zones) {
                    const pagesZone = zonesData.Zones.find(z => z.ZoneName === 'default-pages-zone');
                    if (pagesZone) {
                        targetZoneId = pagesZone.ZoneId;
                        console.log(`Found default-pages-zone: ${targetZoneId}`);
                    } else if (zonesData.Zones.length > 0) {
                        targetZoneId = zonesData.Zones[0].ZoneId;
                        console.log(`default-pages-zone not found, using first zone: ${targetZoneId}`);
                    }
                }
             } catch (zErr) {
                 console.error("Error fetching zones for Pages:", zErr);
             }
        }

        if (!targetZoneId) {
            return res.status(400).json({ error: "Missing ZoneId and could not auto-discover one." });
        }

        const payload = {
            ZoneId: targetZoneId,
        };

        const params = {
            "ZoneId": targetZoneId,
            "Interface": "pages:DescribeHistoryCloudFunctionStats",
            "Payload": JSON.stringify(payload)
        };
        
        console.log("Calling DescribePagesResources (CloudFunction Monthly) with params:", JSON.stringify(params));
        const data = await client.request("DescribePagesResources", params);
        
        // Parse Result string if present
        if (data && data.Result) {
            try {
                data.parsedResult = JSON.parse(data.Result);
            } catch (e) {
                console.error("Error parsing Result JSON:", e);
            }
        }
        
        res.json(data);
    } catch (err) {
        console.error("Error calling DescribePagesResources for CloudFunction Monthly:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/traffic', async (req, res) => {
    try {
        const { secretId, secretKey } = getKeys();
        
        if (!secretId || !secretKey) {
            return res.status(500).json({ error: "Missing credentials" });
        }

        const TeoClient = teo.v20220901.Client;
        const clientConfig = {
            credential: {
                secretId: secretId,
                secretKey: secretKey,
            },
            region: "ap-guangzhou",
            profile: {
                httpProfile: {
                    endpoint: "teo.tencentcloudapi.com",
                },
            },
        };

        const client = new TeoClient(clientConfig);
        
        const now = new Date();
        const formatDate = (date) => {
             return date.toISOString().slice(0, 19) + 'Z';
        };

        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const metric = req.query.metric || "l7Flow_flux";
        const domain = req.query.domain;
        const startTime = req.query.startTime || formatDate(yesterday);
        const endTime = req.query.endTime || formatDate(now);
        const interval = req.query.interval;
        const zoneId = req.query.zoneId;
        const zoneIds = zoneId ? [ zoneId ] : [ "*" ];

        let params = {};
        let data;

        console.log(`Requesting metric: ${metric}, StartTime: ${startTime}, EndTime: ${endTime}, Interval: ${interval}`);

        const domainFilters = buildDomainFilters(domain);

        if (TOP_ANALYSIS_METRICS.includes(metric)) {
            // API: DescribeTopL7AnalysisData
            params = {
                "StartTime": startTime,
                "EndTime": endTime,
                "MetricName": metric,
                "ZoneIds": zoneIds
            };
            if (domainFilters) {
                params["Filters"] = domainFilters;
            }
            console.log("Calling DescribeTopL7AnalysisData with params:", JSON.stringify(params, null, 2));
            data = await client.DescribeTopL7AnalysisData(params);
        } else if (SECURITY_METRICS.includes(metric)) {
            // API: DescribeWebProtectionData (DDoS) using CommonClient
            params = {
                "StartTime": startTime,
                "EndTime": endTime,
                "MetricNames": [ metric ],
                "ZoneIds": zoneIds
            };

            if (interval && interval !== 'auto') {
                params["Interval"] = interval;
            }
            
            // CommonClient setup
            const commonClientConfig = {
                credential: {
                    secretId: secretId,
                    secretKey: secretKey,
                },
                region: "ap-guangzhou",
                profile: {
                    httpProfile: {
                        endpoint: "teo.tencentcloudapi.com",
                    },
                },
            };

            const commonClient = new CommonClient(
                "teo.tencentcloudapi.com",
                "2022-09-01",
                commonClientConfig
            );

            console.log("Calling DescribeWebProtectionData with params:", JSON.stringify(params, null, 2));
            data = await commonClient.request("DescribeWebProtectionData", params);
            
        } else if (FUNCTION_METRICS.includes(metric)) {
            // API: DescribeTimingFunctionAnalysisData (Edge Functions)
            let metricNames = [metric];
            if (metric === 'function_cpuCostTime') {
                metricNames = ["function_requestCount", "function_cpuCostTime"];
            }

            params = {
                "StartTime": startTime,
                "EndTime": endTime,
                "MetricNames": metricNames,
                "ZoneIds": zoneIds
            };

            if (interval && interval !== 'auto') {
                params["Interval"] = interval;
            }

            console.log("Calling DescribeTimingFunctionAnalysisData with params:", JSON.stringify(params, null, 2));
            
            // Use CommonClient for DescribeTimingFunctionAnalysisData
            const commonClientConfig = {
                credential: {
                    secretId: secretId,
                    secretKey: secretKey,
                },
                region: "ap-guangzhou",
                profile: {
                    httpProfile: {
                        endpoint: "teo.tencentcloudapi.com",
                    },
                },
            };

            const commonClient = new CommonClient(
                "teo.tencentcloudapi.com",
                "2022-09-01",
                commonClientConfig
            );

            data = await commonClient.request("DescribeTimingFunctionAnalysisData", params);

        } else {
            // API: DescribeTimingL7AnalysisData OR DescribeTimingL7OriginPullData
            params = {
                "StartTime": startTime,
                "EndTime": endTime,
                "MetricNames": [ metric ],
                "ZoneIds": zoneIds
            };

            if (interval && interval !== 'auto') {
                params["Interval"] = interval;
            }
            if (domainFilters) {
                params["Filters"] = domainFilters;
            }
            
            console.log("Calling Timing API with params:", JSON.stringify(params, null, 2));
            
            if (ORIGIN_PULL_METRICS.includes(metric)) {
                data = await client.DescribeTimingL7OriginPullData(params);
            } else {
                data = await client.DescribeTimingL7AnalysisData(params);
            }
        }
        
        res.json(data);
    } catch (err) {
        console.error("Error calling Tencent Cloud API:", err);
        res.status(500).json({ error: err.message });
    }
});

export default app;

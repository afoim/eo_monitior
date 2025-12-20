import express from 'express';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';
// import { fileURLToPath } from 'url';
import { teo } from "tencentcloud-sdk-nodejs-teo";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const CONFIG_FILE = path.resolve(process.cwd(), 'config.json');
const AUTH_FILE = path.resolve(process.cwd(), 'auth_ips.json');

function getAuthIps() {
    try {
        if (fs.existsSync(AUTH_FILE)) {
            const content = fs.readFileSync(AUTH_FILE, 'utf-8');
            return JSON.parse(content);
        }
    } catch (err) {
        console.error("Error reading auth_ips.json:", err);
    }
    return {};
}

function saveAuthIps(ips) {
    try {
        fs.writeFileSync(AUTH_FILE, JSON.stringify(ips, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error("Error writing auth_ips.json:", err);
        return false;
    }
}

function getClientIp(req) {
    return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
}

function isIpAuthorized(req) {
    const ip = getClientIp(req);
    const authIps = getAuthIps();
    const expiry = authIps[ip];
    if (expiry && expiry > Date.now()) {
        return true;
    }
    return false;
}

function getDynamicConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
            return JSON.parse(content);
        }
    } catch (err) {
        console.error("Error reading config.json:", err);
    }
    return {};
}

function saveDynamicConfig(config) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error("Error writing config.json:", err);
        return false;
    }
}

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

app.get('/config', (req, res) => {
    const dynamicConfig = getDynamicConfig();
    res.json({
        siteName: dynamicConfig.siteName || process.env.SITE_NAME || 'AcoFork 的 EdgeOne 监控大屏',
        backgroundImage: dynamicConfig.backgroundImage || process.env.CUSTOM_BACKGROUND_URL || '',
        useBackgroundImage: dynamicConfig.useBackgroundImage !== false,
        cardOpacity: dynamicConfig.cardOpacity !== undefined ? dynamicConfig.cardOpacity : 1.0,
        friendLinks: dynamicConfig.friendLinks || [],
        isAuthorized: isIpAuthorized(req)
    });
});

app.post('/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (password === adminPassword) {
        // Record IP authorization
        const ip = getClientIp(req);
        const authIps = getAuthIps();
        // Authorize for 7 days
        authIps[ip] = Date.now() + 7 * 24 * 60 * 60 * 1000;
        saveAuthIps(authIps);

        res.json({ success: true, token: Buffer.from(password).toString('base64') });
    } else {
        res.status(401).json({ success: false, error: 'Invalid password' });
    }
});

app.post('/logout', (req, res) => {
    const ip = getClientIp(req);
    const authIps = getAuthIps();
    delete authIps[ip];
    saveAuthIps(authIps);
    res.json({ success: true });
});

app.post('/config', (req, res) => {
    const authHeader = req.headers.authorization;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const expectedToken = Buffer.from(adminPassword).toString('base64');

    // Check either Token or IP authorization
    const isTokenValid = authHeader === `Bearer ${expectedToken}`;
    const isIpValid = isIpAuthorized(req);

    if (!isTokenValid && !isIpValid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { backgroundImage, useBackgroundImage, cardOpacity, friendLinks } = req.body;
    const currentConfig = getDynamicConfig();
    const newConfig = { ...currentConfig };

    if (useBackgroundImage !== undefined) {
        newConfig.useBackgroundImage = useBackgroundImage;
    }

    if (backgroundImage !== undefined) {
        if (typeof backgroundImage !== 'string') {
            return res.status(400).json({ error: 'Invalid backgroundImage format' });
        }
        newConfig.backgroundImage = backgroundImage;
    }

    if (cardOpacity !== undefined) {
        const opacity = parseFloat(cardOpacity);
        if (isNaN(opacity) || opacity < 0 || opacity > 1) {
            return res.status(400).json({ error: 'Invalid cardOpacity format' });
        }
        newConfig.cardOpacity = opacity;
    }

    if (friendLinks !== undefined) {
        if (!Array.isArray(friendLinks)) {
            return res.status(400).json({ error: 'Invalid friendLinks format' });
        }
        newConfig.friendLinks = friendLinks;
    }
    
    if (saveDynamicConfig(newConfig)) {
        res.json({ success: true, config: newConfig });
    } else {
        res.status(500).json({ error: 'Failed to save config' });
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
            region: "",
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
        const startTime = req.query.startTime || formatDate(yesterday);
        const endTime = req.query.endTime || formatDate(now);
        const interval = req.query.interval;

        let params = {};
        let data;

        console.log(`Requesting metric: ${metric}, StartTime: ${startTime}, EndTime: ${endTime}, Interval: ${interval}`);

        if (TOP_ANALYSIS_METRICS.includes(metric)) {
            // API: DescribeTopL7AnalysisData
            params = {
                "StartTime": startTime,
                "EndTime": endTime,
                "MetricName": metric,
                "ZoneIds": [ "*" ]
            };
            console.log("Calling DescribeTopL7AnalysisData with params:", JSON.stringify(params, null, 2));
            data = await client.DescribeTopL7AnalysisData(params);
        } else {
            // API: DescribeTimingL7AnalysisData OR DescribeTimingL7OriginPullData
            params = {
                "StartTime": startTime,
                "EndTime": endTime,
                "MetricNames": [ metric ],
                "ZoneIds": [ "*" ]
            };

            if (interval && interval !== 'auto') {
                params["Interval"] = interval;
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

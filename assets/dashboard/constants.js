const provinceMap = {
    '22': '北京', '86': '内蒙古', '146': '山西', '1069': '河北', '1177': '天津',
    '119': '宁夏', '152': '陕西', '1208': '甘肃', '1467': '青海', '1468': '新疆',
    '145': '黑龙江', '1445': '吉林', '1464': '辽宁', '2': '福建', '120': '江苏',
    '121': '安徽', '122': '山东', '1050': '上海', '1442': '浙江', '182': '河南',
    '1135': '湖北', '1465': '江西', '1466': '湖南', '118': '贵州', '153': '云南',
    '1051': '重庆', '1068': '四川', '1155': '西藏', '4': '广东', '173': '广西',
    '1441': '海南', '0': '其他', '1': '港澳台', '-1': '境外'
};

const countryMap = {
    'CN': '中国大陆', 'AF': '阿富汗', 'MV': '马尔代夫', 'AM': '亚美尼亚', 'MN': '蒙古', 'AZ': '阿塞拜疆',
    'MM': '缅甸', 'BH': '巴林', 'NP': '尼泊尔', 'BD': '孟加拉', 'KP': '朝鲜',
    'BT': '不丹', 'OM': '阿曼', 'IO': '英属印度洋领地', 'PK': '巴基斯坦', 'KH': '柬埔寨',
    'PS': '巴勒斯坦', 'CX': '圣诞岛', 'PH': '菲律宾', 'HK': '中国香港', 'QA': '卡塔尔',
    'IN': '印度', 'SA': '沙特阿拉伯', 'ID': '印度尼西亚', 'SG': '新加坡', 'IR': '伊朗',
    'KR': '韩国', 'IQ': '伊拉克', 'LK': '斯里兰卡', 'IL': '以色列', 'SY': '叙利亚',
    'JP': '日本', 'TW': '中国台湾', 'JO': '约旦', 'TJ': '塔吉克斯坦', 'KZ': '哈萨克斯坦',
    'TH': '泰国', 'KW': '科威特', 'TM': '土库曼斯坦', 'KG': '吉尔吉斯斯坦', 'AE': '阿联酋',
    'LA': '老挝', 'UZ': '乌兹别克斯坦', 'LB': '黎巴嫩', 'VN': '越南', 'MO': '中国澳门',
    'YE': '也门', 'MY': '马来西亚', 'TR': '土耳其', 'AX': '奥兰群岛', 'IT': '意大利',
    'AL': '阿尔巴尼亚', 'JE': '泽西岛', 'AD': '安道尔', 'LT': '立陶宛', 'AT': '奥地利',
    'LU': '卢森堡', 'BY': '白俄罗斯', 'MK': '马其顿', 'BE': '比利时', 'MT': '马耳他',
    'BA': '波黑', 'MD': '摩尔多瓦', 'BG': '保加利亚', 'MC': '摩纳哥', 'BQ': '荷兰加勒比区',
    'ME': '黑山', 'HR': '克罗地亚', 'NL': '荷兰', 'CZ': '捷克', 'NO': '挪威',
    'DK': '丹麦', 'PL': '波兰', 'EE': '爱沙尼亚', 'PT': '葡萄牙', 'FO': '法罗群岛',
    'RO': '罗马尼亚', 'FI': '芬兰', 'RU': '俄罗斯', 'FR': '法国', 'SM': '圣马力诺',
    'DE': '德国', 'RS': '塞尔维亚', 'GI': '直布罗陀', 'SX': '荷属圣马丁', 'GR': '希腊',
    'SK': '斯洛伐克', 'GG': '根西岛', 'ES': '西班牙', 'HU': '匈牙利', 'SE': '瑞典',
    'IS': '冰岛', 'CH': '瑞士', 'IE': '爱尔兰', 'UA': '乌克兰', 'IM': '马恩岛',
    'GB': '英国', 'DZ': '阿尔及利亚', 'ML': '马里', 'AO': '安哥拉', 'MR': '毛里塔尼亚',
    'BJ': '贝宁', 'MU': '毛里求斯', 'BW': '博茨瓦纳', 'YT': '马约特', 'BF': '布基纳法索',
    'MA': '摩洛哥', 'BI': '布隆迪', 'MZ': '莫桑比克', 'CM': '喀麦隆', 'NA': '纳米比亚',
    'CV': '佛得角', 'NE': '尼日尔', 'CF': '中非', 'NG': '尼日利亚', 'TD': '乍得',
    'RW': '卢旺达', 'KM': '科摩罗', 'SH': '圣赫勒拿', 'DJ': '吉布提', 'ST': '圣多美和普林西比',
    'EG': '埃及', 'SN': '塞内加尔', 'GQ': '赤道几内亚', 'SC': '塞舌尔', 'ER': '厄立特里亚',
    'SL': '塞拉利昂', 'ET': '埃塞俄比亚', 'SO': '索马里', 'GA': '加蓬', 'ZA': '南非',
    'GM': '冈比亚', 'SS': '南苏丹', 'GH': '加纳', 'SD': '苏丹', 'GN': '几内亚',
    'SZ': '斯威士兰', 'GW': '几内亚比绍', 'TZ': '坦桑尼亚', 'KE': '肯尼亚', 'TG': '多哥',
    'LS': '莱索托', 'TN': '突尼斯', 'LR': '利比里亚', 'UG': '乌干达', 'LY': '利比亚',
    'EH': '西撒哈拉', 'MG': '马达加斯加', 'ZM': '赞比亚', 'MW': '马拉维', 'ZW': '津巴布韦',
    'CD': '刚果民主共和国', 'CG': '刚果共和国', 'CI': '科特迪瓦', 'AU': '澳大利亚', 'NF': '诺福克岛',
    'CK': '库克群岛', 'MP': '北马里亚纳群岛', 'TL': '东帝汶', 'PW': '帕劳', 'GU': '关岛',
    'PG': '巴布亚新几内亚', 'KI': '基里巴斯', 'SB': '所罗门群岛', 'MH': '马绍尔群岛', 'TO': '汤加',
    'NR': '瑙鲁', 'TV': '图瓦卢', 'NZ': '新西兰', 'AI': '安圭拉', 'HT': '海地',
    'AG': '安提瓜和巴布达', 'HN': '洪都拉斯', 'AW': '阿鲁巴', 'JM': '牙买加', 'BS': '巴哈马',
    'MX': '墨西哥', 'BB': '巴巴多斯', 'MS': '蒙塞拉特岛', 'BM': '百慕大', 'NI': '尼加拉瓜',
    'CA': '加拿大', 'PA': '巴拿马', 'KY': '开曼群岛', 'PR': '波多黎各', 'CR': '哥斯达黎加',
    'KN': '圣基茨和尼维斯', 'CU': '古巴', 'LC': '圣卢西亚', 'CW': '库拉索', 'MF': '法属圣马丁',
    'SV': '萨尔瓦多', 'TT': '特立尼达和多巴哥', 'GL': '格陵兰岛', 'TC': '特克斯和凯科斯群岛',
    'GD': '格林纳达', 'US': '美国', 'GT': '危地马拉', 'AR': '阿根廷', 'GY': '圭亚那',
    'BO': '玻利维亚', 'PY': '巴拉圭', 'BR': '巴西', 'PE': '秘鲁', 'CL': '智利',
    'SR': '苏里南', 'CO': '哥伦比亚', 'UY': '乌拉圭', 'EC': '厄瓜多尔', 'VE': '委内瑞拉',
    'GF': '法属圭亚那', 'Antarctica': '南极洲'
};

const codeToMapName = {
    'CN': 'China', 'AF': 'Afghanistan', 'AL': 'Albania', 'DZ': 'Algeria', 'AO': 'Angola', 'AR': 'Argentina',
    'AM': 'Armenia', 'AU': 'Australia', 'AT': 'Austria', 'AZ': 'Azerbaijan', 'BS': 'Bahamas', 'BH': 'Bahrain',
    'BD': 'Bangladesh', 'BB': 'Barbados', 'BY': 'Belarus', 'BE': 'Belgium', 'BZ': 'Belize', 'BJ': 'Benin',
    'BT': 'Bhutan', 'BO': 'Bolivia', 'BA': 'Bosnia and Herzegovina', 'BW': 'Botswana', 'BR': 'Brazil',
    'BN': 'Brunei', 'BG': 'Bulgaria', 'BF': 'Burkina Faso', 'BI': 'Burundi', 'KH': 'Cambodia', 'CM': 'Cameroon',
    'CA': 'Canada', 'CF': 'Central African Republic', 'TD': 'Chad', 'CL': 'Chile', 'CO': 'Colombia',
    'KM': 'Comoros', 'CG': 'Republic of the Congo', 'CD': 'Democratic Republic of the Congo', 'CR': 'Costa Rica',
    'HR': 'Croatia', 'CU': 'Cuba', 'CY': 'Cyprus', 'CZ': 'Czech Republic', 'DK': 'Denmark', 'DJ': 'Djibouti',
    'DO': 'Dominican Republic', 'EC': 'Ecuador', 'EG': 'Egypt', 'SV': 'El Salvador', 'GQ': 'Equatorial Guinea',
    'ER': 'Eritrea', 'EE': 'Estonia', 'ET': 'Ethiopia', 'FJ': 'Fiji', 'FI': 'Finland', 'FR': 'France',
    'GA': 'Gabon', 'GM': 'Gambia', 'GE': 'Georgia', 'DE': 'Germany', 'GH': 'Ghana', 'GR': 'Greece',
    'GT': 'Guatemala', 'GN': 'Guinea', 'GW': 'Guinea-Bissau', 'GY': 'Guyana', 'HT': 'Haiti', 'HN': 'Honduras',
    'HU': 'Hungary', 'IS': 'Iceland', 'IN': 'India', 'ID': 'Indonesia', 'IR': 'Iran', 'IQ': 'Iraq',
    'IE': 'Ireland', 'IL': 'Israel', 'IT': 'Italy', 'CI': 'Ivory Coast', 'JM': 'Jamaica', 'JP': 'Japan',
    'JO': 'Jordan', 'KZ': 'Kazakhstan', 'KE': 'Kenya', 'KP': 'North Korea', 'KR': 'South Korea',
    'KW': 'Kuwait', 'KG': 'Kyrgyzstan', 'LA': 'Laos', 'LV': 'Latvia', 'LB': 'Lebanon', 'LS': 'Lesotho',
    'LR': 'Liberia', 'LY': 'Libya', 'LT': 'Lithuania', 'LU': 'Luxembourg', 'MK': 'Macedonia', 'MG': 'Madagascar',
    'MW': 'Malawi', 'MY': 'Malaysia', 'ML': 'Mali', 'MT': 'Malta', 'MR': 'Mauritania', 'MU': 'Mauritius',
    'MX': 'Mexico', 'MD': 'Moldova', 'MN': 'Mongolia', 'ME': 'Montenegro', 'MA': 'Morocco', 'MZ': 'Mozambique',
    'MM': 'Myanmar', 'NA': 'Namibia', 'NP': 'Nepal', 'NL': 'Netherlands', 'NZ': 'New Zealand', 'NI': 'Nicaragua',
    'NE': 'Niger', 'NG': 'Nigeria', 'NO': 'Norway', 'OM': 'Oman', 'PK': 'Pakistan', 'PA': 'Panama',
    'PG': 'Papua New Guinea', 'PY': 'Paraguay', 'PE': 'Peru', 'PH': 'Philippines', 'PL': 'Poland',
    'PT': 'Portugal', 'PR': 'Puerto Rico', 'QA': 'Qatar', 'RO': 'Romania', 'RU': 'Russia', 'RW': 'Rwanda',
    'SA': 'Saudi Arabia', 'SN': 'Senegal', 'RS': 'Serbia', 'SL': 'Sierra Leone', 'SG': 'Singapore',
    'SK': 'Slovakia', 'SI': 'Slovenia', 'SB': 'Solomon Islands', 'SO': 'Somalia', 'ZA': 'South Africa',
    'SS': 'South Sudan', 'ES': 'Spain', 'LK': 'Sri Lanka', 'SD': 'Sudan', 'SR': 'Suriname', 'SZ': 'Swaziland',
    'SE': 'Sweden', 'CH': 'Switzerland', 'SY': 'Syria', 'TW': 'Taiwan', 'TJ': 'Tajikistan', 'TZ': 'Tanzania',
    'TH': 'Thailand', 'TL': 'Timor-Leste', 'TG': 'Togo', 'TT': 'Trinidad and Tobago', 'TN': 'Tunisia',
    'TR': 'Turkey', 'TM': 'Turkmenistan', 'UG': 'Uganda', 'UA': 'Ukraine', 'AE': 'United Arab Emirates',
    'GB': 'United Kingdom', 'US': 'United States', 'UY': 'Uruguay', 'UZ': 'Uzbekistan', 'VU': 'Vanuatu',
    'VE': 'Venezuela', 'VN': 'Vietnam', 'YE': 'Yemen', 'ZM': 'Zambia', 'ZW': 'Zimbabwe'
};

const worldNameMap = {};
Object.keys(codeToMapName).forEach(code => {
    if (countryMap[code]) {
        worldNameMap[codeToMapName[code]] = countryMap[code];
    }
});

const metricsConfig = {
    traffic: ['l7Flow_flux', 'l7Flow_inFlux', 'l7Flow_outFlux'],
    bandwidth: ['l7Flow_bandwidth', 'l7Flow_inBandwidth', 'l7Flow_outBandwidth'],
    originPull: ['l7Flow_outFlux_hy', 'l7Flow_inFlux_hy', 'l7Flow_outBandwidth_hy', 'l7Flow_inBandwidth_hy', 'l7Flow_request_hy'],
    requests: ['l7Flow_request'],
    performance: ['l7Flow_avgResponseTime', 'l7Flow_avgFirstByteResponseTime'],
    edgeFunctions: ['function_requestCount', 'function_cpuCostTime'],
    security: ['ccAcl_interceptNum', 'ccManage_interceptNum', 'ccRate_interceptNum'],
    topAnalysis: ['l7Flow_outFlux_country', 'l7Flow_outFlux_province', 'l7Flow_outFlux_statusCode', 'l7Flow_outFlux_domain', 'l7Flow_outFlux_url', 'l7Flow_outFlux_resourceType', 'l7Flow_outFlux_sip', 'l7Flow_outFlux_referers', 'l7Flow_outFlux_ua_device', 'l7Flow_outFlux_ua_browser', 'l7Flow_outFlux_ua_os', 'l7Flow_outFlux_ua', 'l7Flow_request_country', 'l7Flow_request_province', 'l7Flow_request_statusCode', 'l7Flow_request_domain', 'l7Flow_request_url', 'l7Flow_request_resourceType', 'l7Flow_request_sip', 'l7Flow_request_referers', 'l7Flow_request_ua_device', 'l7Flow_request_ua_browser', 'l7Flow_request_ua_os', 'l7Flow_request_ua']
};

const metricLabels = {
    'l7Flow_flux': '总流量',
    'l7Flow_inFlux': '客户端请求流量',
    'l7Flow_outFlux': '响应流量',
    'l7Flow_bandwidth': '总带宽',
    'l7Flow_inBandwidth': '请求带宽',
    'l7Flow_outBandwidth': '响应带宽',
    'l7Flow_outFlux_hy': '回源请求流量',
    'l7Flow_inFlux_hy': '回源响应流量',
    'l7Flow_outBandwidth_hy': '回源请求带宽',
    'l7Flow_inBandwidth_hy': '回源响应带宽',
    'l7Flow_request_hy': '回源请求数',
    'l7Flow_request': '请求数',
    'l7Flow_avgResponseTime': '平均响应耗时',
    'l7Flow_avgFirstByteResponseTime': '平均首字节耗时',
    'function_requestCount': 'Edge Functions 请求数',
    'function_cpuCostTime': 'Edge Functions CPU 时间',
    'ccAcl_interceptNum': '精确防护拦截',
    'ccManage_interceptNum': '托管规则拦截',
    'ccRate_interceptNum': '速率限制拦截',
    'l7Flow_outFlux_country': '国家/地区流量',
    'l7Flow_outFlux_province': '国内省份流量',
    'l7Flow_outFlux_statusCode': '状态码流量',
    'l7Flow_outFlux_domain': '域名流量',
    'l7Flow_outFlux_url': 'URL 流量',
    'l7Flow_outFlux_resourceType': '资源类型流量',
    'l7Flow_outFlux_sip': '客户端IP流量',
    'l7Flow_outFlux_referers': 'Referer 流量',
    'l7Flow_outFlux_ua_device': '设备类型流量',
    'l7Flow_outFlux_ua_browser': '浏览器流量',
    'l7Flow_outFlux_ua_os': '操作系统流量',
    'l7Flow_outFlux_ua': 'User Agent 流量',
    'l7Flow_request_country': '国家/地区请求数',
    'l7Flow_request_province': '国内省份请求数',
    'l7Flow_request_statusCode': '状态码请求数',
    'l7Flow_request_domain': '域名请求数',
    'l7Flow_request_url': 'URL 请求数',
    'l7Flow_request_resourceType': '资源类型请求数',
    'l7Flow_request_sip': '客户端IP请求数',
    'l7Flow_request_referers': 'Referer 请求数',
    'l7Flow_request_ua_device': '设备类型请求数',
    'l7Flow_request_ua_browser': '浏览器请求数',
    'l7Flow_request_ua_os': '操作系统请求数',
    'l7Flow_request_ua': 'User Agent 请求数'
};

const metricColors = {
    'l7Flow_flux': '#3b82f6', // blue
    'l7Flow_inFlux': '#f59e0b', // amber
    'l7Flow_outFlux': '#10b981', // green
    'l7Flow_bandwidth': '#8b5cf6', // purple
    'l7Flow_inBandwidth': '#ec4899', // pink
    'l7Flow_outBandwidth': '#06b6d4', // cyan
    'l7Flow_outFlux_hy': '#3b82f6', // blue
    'l7Flow_inFlux_hy': '#10b981', // green
    'l7Flow_outBandwidth_hy': '#8b5cf6', // purple
    'l7Flow_inBandwidth_hy': '#ec4899', // pink
    'l7Flow_request_hy': '#f43f5e', // rose
    'l7Flow_request': '#f43f5e', // rose
    'l7Flow_avgResponseTime': '#ef4444', // red
    'l7Flow_avgFirstByteResponseTime': '#f97316', // orange
    'function_requestCount': '#8b5cf6', // purple
    'function_cpuCostTime': '#06b6d4', // cyan
    'ccAcl_interceptNum': '#ef4444', // red
    'ccManage_interceptNum': '#f59e0b', // amber
    'ccRate_interceptNum': '#3b82f6', // blue
    'l7Flow_outFlux_country': '#3b82f6', // blue
    'l7Flow_outFlux_province': '#f59e0b', // amber
    'l7Flow_outFlux_statusCode': '#8b5cf6', // purple
    'l7Flow_outFlux_domain': '#06b6d4', // cyan
    'l7Flow_outFlux_url': '#10b981', // green
    'l7Flow_outFlux_resourceType': '#f59e0b', // amber
    'l7Flow_outFlux_sip': '#ef4444', // red
    'l7Flow_outFlux_referers': '#8b5cf6', // purple
    'l7Flow_outFlux_ua_device': '#06b6d4', // cyan
    'l7Flow_outFlux_ua_browser': '#f59e0b', // amber
    'l7Flow_outFlux_ua_os': '#10b981', // green
    'l7Flow_outFlux_ua': '#8b5cf6', // purple
    'l7Flow_request_country': '#3b82f6', // blue
    'l7Flow_request_province': '#f59e0b', // amber
    'l7Flow_request_statusCode': '#8b5cf6', // purple
    'l7Flow_request_domain': '#06b6d4', // cyan
    'l7Flow_request_url': '#10b981', // green
    'l7Flow_request_resourceType': '#f59e0b', // amber
    'l7Flow_request_sip': '#8b5cf6', // purple
    'l7Flow_request_referers': '#ec4899', // pink
    'l7Flow_request_ua_device': '#06b6d4', // cyan
    'l7Flow_request_ua_browser': '#10b981', // green
    'l7Flow_request_ua_os': '#f59e0b', // amber
    'l7Flow_request_ua': '#8b5cf6' // purple
};


export {
  provinceMap,
  countryMap,
  codeToMapName,
  worldNameMap,
  metricsConfig,
  metricLabels,
  metricColors,
};

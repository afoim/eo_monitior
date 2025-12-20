# EdgeOne Monitoring Dashboard (EdgeOne 监控大屏)

> [!WARNING]
> 注意：目前仅支持统计全球（含中国大陆）流量数据

这是一个基于 Tencent Cloud EdgeOne API 构建的实时监控大屏，旨在提供直观的流量和请求分析。

## ✨ 主要功能

- **实时概览**：展示站点总请求数、总流量、总带宽等关键指标。
- **多维度分析**：
  - **国家/地区排行**：支持中英文显示，直观展示流量来源。
  - **省份/状态码/域名/URL/资源类型**：全方位的 Top N 分析。
- **回源分析**：监控回源流量、带宽及请求数，掌握源站负载。
- **灵活查询**：
  - 支持自定义时间段（近1小时 - 近31天）。
  - 支持切换数据粒度（分钟/小时/天/自动）。
- **个性化配置**：
  - **简洁模式**：一键切换，隐藏繁杂数据，仅展示核心流量指标。
  - **站点名称**：支持自定义大屏标题。
  - **背景透明度**：可自由调节卡片背景透明度，完美适配各种壁纸。
  - **自定义友链**：支持在页脚添加和管理友情链接，方便站点导航。
  - **密码管理**：
    - 管理员密码：默认 `admin123`，可在 `.env` 文件中自定义。
    - 登录后可在配置页面修改密码。

## 🚀 快速部署

### 方式一：EdgeOne Pages (推荐)

1. Fork 本仓库到您的 GitHub 账号。
2. 前往 [腾讯云 EdgeOne 控制台](https://console.cloud.tencent.com/edgeone) 创建 Pages 项目。
3. 连接您的 GitHub 仓库。
4. 在 **环境变量 (Environment Variables)** 中添加以下配置：
   - `SECRET_ID`: 您的腾讯云 SecretId
   - `SECRET_KEY`: 您的腾讯云 SecretKey
   - `SITE_NAME`: (可选) 自定义大屏标题，默认为 "AcoFork 的 EdgeOne 监控大屏"
5. 部署项目。

### 方式二：本地运行 / Node.js 环境

1. 克隆仓库：
   ```bash
   git clone https://github.com/YourUsername/EdgeOne_ana.git
   cd EdgeOne_ana
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置密钥：
   - **方法 A (环境变量)**：创建 `.env` 文件或直接导出环境变量 `SECRET_ID` 和 `SECRET_KEY`。
   - **方法 B (文件配置)**：在项目根目录创建 `key.txt` 文件，内容格式如下（注意使用中文冒号）：
     ```text
     SecretId：您的SecretId
     SecretKey：您的SecretKey
     ```

4. 启动服务：
   ```bash
   npm start
   ```

5. 访问 `http://localhost:3000`。

## 🔑 权限说明

使用的腾讯云访问密钥必须拥有 **EdgeOne 只读访问权限** (`QcloudTEOReadOnlyaccess`)。
请前往 [访问管理控制台](https://console.cloud.tencent.com/cam) 创建和管理密钥。

## 🛠️ 技术栈

- **后端**：Node.js, Express, Tencent Cloud SDK
- **前端**：HTML5, Tailwind CSS, ECharts
- **部署**：Tencent Cloud EdgeOne Pages

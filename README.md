# beepanel-interface-front

接口自动化测试平台前端，基于 Vue 3、TypeScript、Vite、Pinia 和 Element Plus。

## 功能

- 工作台概览
- 项目管理
- 用例编排与步骤维护
- 测试版本、执行进度和结果展示

## 环境要求

- Node.js 20+
- npm 10+
- 后端服务默认运行在 `http://127.0.0.1:8000`

## 本地启动

```bash
npm ci
npm run dev
```

开发服务默认地址为 `http://127.0.0.1:5173`，`/api` 和 `/ws` 请求由 Vite 代理到后端服务。

## 测试与构建

```bash
npm test -- --run
npm run typecheck
npm run build
```

## Docker

```bash
docker build -t beepanel-interface-front .
docker run --rm -p 8080:80 beepanel-interface-front
```

Nginx 容器默认将 `/api` 和 `/ws` 转发到名为 `backend`、端口为 `8000` 的服务。

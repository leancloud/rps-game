Client Engine Node.js Getting Started
----
LeanCloud Client Engine 服务端示例项目（Node.js)

### 本地开发

**Server**
```bash
DEBUG=ClientEngine*,StatefulGame* lean up
```

**Client**
```bash
lean up --cmd "npm run dev:client" -p 4000
```

Then open http://localhost:4000.

### 生产环境


**Build**
```bash
npm run build
```

**Serve**
```bash
npm start
```

# JSON Viewer

一个纯静态的 JSON 数据预览工具，支持实时解析、自动修复和美化显示。

## ✨ 特性

- **实时预览**: 输入 JSON 数据时自动在右侧显示结构化预览
- **智能修复**: 自动修复常见的 JSON 格式问题（如尾随逗号、未引号键名等）
- **JSON Lines 支持**: 支持按换行分割的 JSON Lines 格式数据
- **语法高亮**: 不同数据类型使用不同颜色显示
- **响应式设计**: 适配桌面和移动设备
- **纯静态构建**: 可直接部署到 nginx、Caddy 等静态文件服务器

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm start
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
```

构建文件将输出到 `build` 目录，可直接部署到任何静态文件服务器。

### 运行测试

```bash
npm test
```

## 📖 使用说明

### 支持的 JSON 格式

1. **标准 JSON**:
   ```json
   {"name": "张三", "age": 30, "hobbies": ["阅读", "游泳"]}
   ```

2. **JSON Lines** (每行一个 JSON 对象):
   ```
   {"name": "张三", "age": 30}
   {"name": "李四", "age": 25}
   {"name": "王五", "age": 35}
   ```

3. **自动修复功能**:
   - 尾随逗号: `{"key": "value",}` → `{"key": "value"}`
   - 未引号键名: `{key: "value"}` → `{"key": "value"}`
   - 单引号: `{'key': 'value'}` → `{"key": "value"}`

### 界面功能

- **左侧输入区**: 粘贴或输入 JSON 数据
- **右侧预览区**: 实时显示结构化预览
- **清空按钮**: 一键清空输入内容
- **状态显示**: 显示字符数和行数
- **错误提示**: JSON 格式错误时显示详细错误信息

## 🏗️ 技术栈

- **React 18**: 用户界面框架
- **TypeScript**: 类型安全的 JavaScript
- **CSS**: 自定义样式，响应式设计
- **Create React App**: 构建工具

## 📁 项目结构

```
src/
├── components/          # React 组件
│   ├── Header.tsx      # 头部导航
│   ├── Footer.tsx      # 底部版权
│   ├── JsonInput.tsx   # JSON 输入组件
│   └── JsonPreview.tsx # JSON 预览组件
├── utils/              # 工具函数
│   ├── jsonParser.ts   # JSON 解析和修复
│   └── jsonParser.test.ts # 单元测试
├── App.tsx            # 主应用组件
├── App.test.tsx       # 应用测试
└── index.css          # 全局样式
```

## 🚀 部署

### 使用 nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 使用 Caddy

```
your-domain.com {
    root * /path/to/build
    file_server
    try_files {path} /index.html
}
```

### 使用 Vercel

```bash
npm install -g vercel
vercel --prod
```

## 🧪 测试

项目包含完整的测试套件：

- **单元测试**: JSON 解析器功能测试
- **组件测试**: React 组件行为测试
- **集成测试**: 应用整体功能测试

运行测试：

```bash
npm test
```

查看测试覆盖率：

```bash
npm test -- --coverage
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

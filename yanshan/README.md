# 研山书院积分系统 — 部署指南

## 📦 文件说明

```
yanshan-points/
├── src/
│   ├── App.jsx      ← 完整应用代码（含 Logo）
│   └── index.js     ← 入口文件
├── public/
│   └── index.html   ← HTML 模板
├── package.json     ← 项目配置
├── vercel.json      ← Vercel 部署配置
└── .gitignore
```

---

## 🚀 部署步骤（约 10 分钟）

### 第一步：注册 GitHub（已有账号跳过）
1. 打开 https://github.com
2. 点击 Sign up，填写邮箱、用户名、密码完成注册

### 第二步：创建代码仓库
1. 登录 GitHub 后，点击右上角 **「+」→「New repository」**
2. Repository name 填写：`yanshan-points`
3. 选择 **Public**（公开，Vercel 免费部署需要）
4. 点击 **「Create repository」**

### 第三步：上传文件
1. 在新建的仓库页面，点击 **「uploading an existing file」**
2. 把 `yanshan-points` 文件夹里的所有文件**拖拽上传**
   - 注意：需要保持文件夹结构，先上传 `src/` 目录的文件，再上传根目录文件
   - 或者使用下面的「命令行方式」（更简单）
3. 点击 **「Commit changes」**

#### 更简单的上传方式（推荐）：
在仓库页面点击 **「Add file」→「Create new file」**，逐个创建：
- 输入 `src/App.jsx`，粘贴 App.jsx 内容
- 输入 `src/index.js`，粘贴 index.js 内容
- 输入 `public/index.html`，粘贴内容
- 输入 `package.json`，粘贴内容
- 输入 `vercel.json`，粘贴内容

### 第四步：注册 Vercel（已有账号跳过）
1. 打开 https://vercel.com
2. 点击 **「Sign Up」→「Continue with GitHub」**
3. 授权 Vercel 访问你的 GitHub

### 第五步：部署到 Vercel
1. 登录 Vercel 后，点击 **「Add New Project」**
2. 找到 `yanshan-points` 仓库，点击 **「Import」**
3. Framework Preset 选择 **「Create React App」**
4. 其他设置保持默认，点击 **「Deploy」**
5. 等待约 2-3 分钟，看到 🎉 表示部署成功！

### 第六步：获取链接
部署成功后，Vercel 会给你一个链接，例如：
```
https://yanshan-points.vercel.app
```
这个链接**永久有效、全球可访问**，直接发给老师和家长即可。

---

## 📱 使用方式

### 老师
- 打开链接，选择「老师端」
- 录入积分后，点「导出」→「生成并复制数据码」
- 将数据码发送到家长群

### 家长
- 打开链接，选择「家长端」
- 粘贴老师发送的数据码
- 选择自己的孩子，即可查看积分

---

## 🔄 后续更新代码

如果需要修改功能，在 GitHub 仓库直接编辑文件，
Vercel 会自动重新部署（约 2 分钟生效）。

---

## ❓ 常见问题

**Q: 数据会丢失吗？**
A: 数据存在每个设备的浏览器里（localStorage），
   清除浏览器缓存会丢失。建议老师定期导出数据码备份。

**Q: 多个老师能同时操作吗？**
A: 目前不支持实时同步，每台设备数据独立。
   如需多老师协作，需要升级到数据库方案。

**Q: 家长能修改孩子积分吗？**
A: 不能。家长端只能查看积分、上传作业，
   不能修改任何积分数据。

**Q: 链接可以设置密码吗？**
A: Vercel 免费版不支持密码保护。
   如需要，可以在老师端加一个简单的访问码验证。

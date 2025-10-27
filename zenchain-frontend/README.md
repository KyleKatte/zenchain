# ZenChain - Encrypted Mental Health Diary DApp

> Privacy-first mental health journaling powered by FHEVM (Fully Homomorphic Encryption)

## 📋 项目概述

ZenChain 是一个基于 Zama FHEVM 的加密心理健康日记 DApp，允许用户在区块链上安全记录情绪、压力和睡眠数据，同时保持完全隐私。所有敏感数据在链上以加密形式存储，只有用户本人可以解密查看。

### 核心特性

- 🔒 **完全隐私**: 所有情绪数据使用 FHEVM 加密存储
- 📝 **日记记录**: 记录心情/压力/睡眠评分 (1-10) 和心情标签
- 📊 **加密统计**: 在不解密的情况下计算个人平均值
- 🌐 **匿名聚合**: 可选参与全局统计（k-匿名性保护）
- 🎨 **Neumorphism UI**: 温和的软 UI 设计，适合心理健康应用

## 🏗️ 架构设计

### 智能合约层

- **ZenChainDiary.sol**: 主合约，管理日记条目和用户档案
  - 位置: `../fhevm-hardhat-template/contracts/ZenChainDiary.sol`
  - 功能: 提交日记、查询历史、隐私设置、用户统计
  - 加密类型: `euint8`(评分), `euint32`(标签), `euint64`(累计值)

### 前端层

```
zenchain-frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # 全局布局
│   ├── page.tsx             # 首页
│   └── globals.css          # 全局样式
├── fhevm/                   # FHEVM 集成
│   ├── fhevm.ts             # 实例创建（Mock/Relayer 自动切换）
│   ├── loader.ts            # Relayer SDK 动态加载
│   ├── decryption.ts        # 解密签名管理
│   ├── constants.ts         # 常量配置
│   └── fhevmTypes.ts        # TypeScript 类型
├── hooks/                   # React Hooks
│   └── useFhevm.tsx         # FHEVM 实例管理 Hook
├── scripts/                 # 构建脚本
│   ├── genabi.mjs           # ABI 生成（从 deployments 读取）
│   └── check-node.mjs       # Hardhat 节点检测
├── abi/                     # 自动生成的 ABI 文件
├── design-tokens.ts         # 设计系统 tokens（确定性随机生成）
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 🚀 快速开始

### 前置要求

- Node.js >= 20
- npm >= 7
- MetaMask 或其他 Web3 钱包

### 1. 安装依赖

#### 合约依赖

```bash
cd ../fhevm-hardhat-template
npm install
```

#### 前端依赖

```bash
cd zenchain-frontend
npm install
```

### 2. 启动本地开发环境

#### 终端 1: 启动 Hardhat 节点

```bash
cd ../fhevm-hardhat-template
npx hardhat node
```

**预期输出**:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

#### 终端 2: 部署合约

```bash
cd ../fhevm-hardhat-template
npx hardhat deploy --network localhost
```

**预期输出**:
```
deploying "ZenChainDiary"...
✓ ZenChainDiary deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

#### 终端 3: 启动前端（Mock 模式）

```bash
cd zenchain-frontend
npm run dev:mock
```

**说明**:
- `dev:mock`: 检测本地 Hardhat 节点 → 生成 ABI → 启动 dev → 自动使用 Mock
- `dev`: 生成 ABI → 启动 dev → 使用真实 Relayer SDK

### 3. 打开浏览器

访问 `http://localhost:3000`

## 📝 使用指南

### 合约交互（命令行）

#### 提交日记

```bash
cd ../fhevm-hardhat-template
npx hardhat zenchain:submit --mood 8 --stress 3 --sleep 7 --tags 0x06 --public true --network localhost
```

#### 查看日记

```bash
npx hardhat zenchain:view --offset 0 --limit 10 --network localhost
```

#### 查看个人档案

```bash
npx hardhat zenchain:profile --network localhost
```

#### 更新隐私设置

```bash
npx hardhat zenchain:privacy --public false --network localhost
```

### 前端交互（UI）

1. **连接钱包**: 点击"Connect Wallet"按钮
2. **创建日记**: 填写心情/压力/睡眠评分和标签
3. **提交上链**: 前端自动加密后提交
4. **查看历史**: 列表展示，点击解密查看详情
5. **查看统计**: 个人仪表盘显示平均值

## 🔐 加密流程说明

### 提交日记（加密写入）

```typescript
// 1. 创建加密输入
const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
input.add8(moodScore);    // 心情 8/10
input.add8(stressScore);  // 压力 3/10
input.add8(sleepScore);   // 睡眠 7/10
input.add32(moodTags);    // 标签 0x06

// 2. 加密
const encrypted = await input.encrypt();

// 3. 提交到合约
await contract.submitEntry(
  encrypted.handles[0], encrypted.inputProof,  // mood
  encrypted.handles[1], encrypted.inputProof,  // stress
  encrypted.handles[2], encrypted.inputProof,  // sleep
  encrypted.handles[3], encrypted.inputProof,  // tags
  isPublic
);
```

### 查看日记（解密读取）

```typescript
// 1. 从合约读取加密句柄
const entry = await contract.getEntry(entryId);

// 2. 获取解密签名
const signature = await loadOrGenerateDecryptionSignature(
  fhevmInstance,
  [contractAddress],
  signer,
  chainId
);

// 3. 用户解密
const decrypted = await fhevmInstance.userDecrypt(
  [{ handle: entry.moodScore, contractAddress }],
  signature.privateKey,
  signature.publicKey,
  signature.signature,
  signature.contractAddresses,
  signature.userAddress,
  signature.startTimestamp,
  signature.durationDays
);

console.log("Mood:", decrypted[entry.moodScore]); // 8
```

## 🧪 测试

### 合约测试

```bash
cd ../fhevm-hardhat-template
npm run compile
npm run test
```

**预期输出**:
```
  ZenChainDiary
    User Registration
      ✓ should auto-register user on first entry submission
    Diary Entry Submission
      ✓ should submit a diary entry and emit event
      ✓ should correctly decrypt entry values
      ✓ should allow multiple entries from same user
    Entry Retrieval
      ✓ should return user entries with pagination
      ✓ should handle offset correctly
      ✓ should return empty array for invalid offset
    Entry Deletion
      ✓ should soft delete an entry
      ✓ should revert if non-author tries to delete
    Privacy Settings
      ✓ should update privacy setting
    Public Entry Tracking
      ✓ should track public entries correctly

  11 passing (5s)
```

### 前端构建测试

```bash
cd zenchain-frontend
npm run build
```

**预期输出**:
```
✅ Generated abi/ZenChainDiaryABI.ts
✅ Generated abi/ZenChainDiaryAddresses.ts
   Route (app)                              Size     First Load JS
   ┌ ○ /                                    5.2 kB          87 kB
   └ ○ /_not-found                          871 B          77.9 kB
+ First Load JS shared by all              77 kB
  ├ chunks/...

✓ Compiled successfully
```

## 🎨 设计系统

### 确定性随机生成

基于项目元数据生成唯一的设计 tokens:

```typescript
seed = sha256("ZenChain" + "sepolia" + "202510" + "ZenChainDiary.sol")
```

**本项目选型**:
- **设计体系**: Neumorphism (软 UI，适合心理健康)
- **色彩方案**: F 组 (Teal/Green/Cyan) - 清新自然
  - 主色: `#14B8A6`
  - 辅色: `#10B981`
  - 强调色: `#06B6D4`
- **排版**: Sans-Serif (Inter) - 1.25 倍率
- **布局**: Sidebar (左侧边栏)
- **组件风格**: 中圆角(12px) + 软阴影(内外) + 细边框(1px)
- **动效**: 标准 (300ms)

### 使用设计 tokens

```typescript
import { designTokens } from "./design-tokens";

// 访问颜色
const primaryColor = designTokens.colors.light.primary;

// 访问字体
const fontFamily = designTokens.typography.fontFamily.sans;

// 访问阴影
const shadow = designTokens.shadows.neumorphicRaised;
```

## 📦 部署到 Sepolia 测试网

### 1. 配置环境变量

创建 `../fhevm-hardhat-template/.env`:

```bash
SEPOLIA_PRIVATE_KEY=0x...  # 部署账户私钥
INFURA_API_KEY=...         # Infura 项目 API Key
```

### 2. 部署合约

```bash
cd ../fhevm-hardhat-template
npx hardhat deploy --network sepolia
```

### 3. 验证合约（可选）

```bash
npx hardhat verify --network sepolia <合约地址>
```

### 4. 更新前端配置

前端会自动从 `deployments/sepolia/` 读取合约地址。

### 5. 部署前端

部署到 Vercel / Netlify:

```bash
cd zenchain-frontend
npm run build
# 上传 .next 目录到托管平台
```

## 🔧 故障排查

### 问题 1: 合约编译失败

```
Error: Cannot find module '@fhevm/solidity'
```

**解决方案**:
```bash
cd ../fhevm-hardhat-template
npm install
```

### 问题 2: 前端无法连接节点

```
❌ Cannot connect to Hardhat node at http://localhost:8545
```

**解决方案**:
1. 确保 Hardhat 节点正在运行（终端 1）
2. 确保端口 8545 未被占用
3. 检查防火墙设置

### 问题 3: ABI 生成失败

```
Unable to locate '../fhevm-hardhat-template/deployments/localhost'
```

**解决方案**:
```bash
cd ../fhevm-hardhat-template
npx hardhat deploy --network localhost
```

### 问题 4: 前端构建失败

```
Module not found: Can't resolve '@/abi/ZenChainDiaryABI'
```

**解决方案**:
```bash
npm run genabi  # 先生成 ABI
npm run build   # 再构建
```

## 📚 技术栈

### 智能合约

- Solidity ^0.8.24
- Hardhat 2.x
- @fhevm/solidity ^0.8.0
- Hardhat Deploy

### 前端

- Next.js 15.x (App Router)
- React 19.x
- TypeScript 5.x
- Ethers.js 6.x
- Tailwind CSS 3.x
- @fhevm/mock-utils (开发)
- @zama-fhe/relayer-sdk (生产)

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

- 项目文档: 见 [ZenChain-Requirements.md](../ZenChain-Requirements.md)
- FHEVM 文档: [Zama FHEVM Docs](https://docs.zama.ai/fhevm)

---

**注意**: 本项目为演示实现，生产环境部署前需进行完整的安全审计。






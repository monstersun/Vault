# Hardhat Contracts (Sepolia / Story Testnet)

这个目录已初始化为 Hardhat 合约工程，包含：

- `StoryEthVault`：`UUPS` 可升级 `ERC4626` Vault
- `depositEth(address receiver)`：直接存入 ETH（内部包裹为 WETH）
- `withdrawEth(uint256 assets, address receiver)`：按资产量提取 ETH
- `WETH9`：可独立部署的 WETH 合约（用于目标链不存在原生 WETH 时）

## 目录结构

- `src/vault/StoryEthVault.sol`：主 Vault 合约
- `src/vault/StoryEthVaultV2.sol`：升级测试示例
- `src/mocks/WETH9.sol`：WETH 合约
- `scripts/deployWETH.js`：部署 WETH
- `scripts/deployVaultUUPS.js`：部署 UUPS Vault 代理
- `test/StoryEthVault.test.js`：Hardhat 单元测试

## 初始化

```bash
npm install
```

## 环境变量

复制 `.env.example` 到 `.env` 并填写：

```bash
SEPOLIA_RPC_URL=
STORY_TESTNET_RPC_URL=
PRIVATE_KEY=
WETH_ADDRESS=
ETHERSCAN_API_KEY=
```

说明：

- `SEPOLIA_RPC_URL`：部署到 Sepolia 时使用
- `STORY_TESTNET_RPC_URL`：部署到 Story Testnet 时使用
- `PRIVATE_KEY`：部署钱包私钥（请勿提交到仓库）
- `WETH_ADDRESS`：先部署 WETH 后回填
- `ETHERSCAN_API_KEY`：可选，用于合约验证

## 常用命令

```bash
npm run compile
npm test
npm run deploy:weth
npm run deploy:vault
npm run deploy:weth:sepolia
npm run deploy:vault:sepolia
```

## 部署顺序

1. 先部署 `WETH9`，记录地址
2. 将地址填入 `.env` 的 `WETH_ADDRESS`
3. 部署 `StoryEthVault` UUPS 代理

## Sepolia 部署（推荐）

1) 填好 `.env`：

```bash
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_key
PRIVATE_KEY=0xyour_private_key
WETH_ADDRESS=
ETHERSCAN_API_KEY=your_etherscan_key
```

2) 部署 WETH：

```bash
npm run deploy:weth:sepolia
```

3) 把输出的 WETH 地址填入 `.env` 的 `WETH_ADDRESS`

4) 部署 Vault：

```bash
npm run deploy:vault:sepolia
```

## Story Testnet 部署

如果你要部署到 Story Testnet，先设置 `STORY_TESTNET_RPC_URL`，然后执行：

```bash
npm run deploy:weth -- --network storyTestnet
npm run deploy:vault -- --network storyTestnet
```

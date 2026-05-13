# Hardhat Contracts (Story Testnet)

这个目录已初始化为 Hardhat 合约工程，包含：

- `StoryEthVault`：`UUPS` 可升级 `ERC4626` Vault
- `depositEth(address receiver)`：直接存入 ETH（内部包裹为 WETH）
- `withdrawEth(uint256 assets, address receiver, address owner)`：按资产量提取 ETH
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
STORY_TESTNET_RPC_URL=
PRIVATE_KEY=
WETH_ADDRESS=
ETHERSCAN_API_KEY=
```

## 常用命令

```bash
npm run compile
npm test
npm run deploy:weth -- --network storyTestnet
npm run deploy:vault -- --network storyTestnet
```

## 部署顺序

1. 先部署 `WETH9`，记录地址
2. 将地址填入 `.env` 的 `WETH_ADDRESS`
3. 部署 `StoryEthVault` UUPS 代理

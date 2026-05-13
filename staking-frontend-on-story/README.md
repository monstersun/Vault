## Story Staking Frontend

Next.js frontend for your Story testnet staking dApp.

Features:

- MetaMask wallet connection
- Top navigation with `Staking`, `Withdraw`, `Info`
- Stake and withdraw transaction flow through wallet signature
- Pre-flight transaction simulation with gas estimation before MetaMask confirmation
- Account info panel (connected account, shares, vault assets)

## Getting Started

Install dependencies:

```bash
npm install
```

Create environment file:

```bash
cp .env.example .env.local
```

Set your vault address:

```bash
NEXT_PUBLIC_VAULT_ADDRESS=0xYourVaultProxyAddress
```

Run dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Notes

- MetaMask must be installed in your browser.
- The frontend expects the Vault to expose:
  - `depositEth(address receiver)`
  - `withdrawEth(uint256 assets, address receiver, address owner)`
  - `balanceOf(address owner)`
  - `totalAssets()`

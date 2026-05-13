## Vault Frontend

Next.js frontend for the vault dApp.

Demo URL: [http://118.178.110.227:3000/](http://118.178.110.227:3000/)

### Features

- Multi-wallet connection flow
- Stake and withdraw transactions via wallet signature
- Wallet snapshot (shares, my assets, total assets)
- PostgreSQL-backed transaction history (`Info` page)

## 1) Local Development

```bash
npm install
cp .env.example .env
```

Set `.env`:

```bash
NEXT_PUBLIC_VAULT_ADDRESS=0xYourVaultProxyAddress
DATABASE_URL=postgresql://postgres:your_password@127.0.0.1:5432/staking_story
```

Initialize DB:

```bash
npm run db:init
npm run db:check
```

Run dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 2) Server Deployment (Alibaba Cloud / CentOS)

Follow this exact order:

1. Install dependencies
   ```bash
   npm install
   ```
2. Configure `.env` (`NEXT_PUBLIC_VAULT_ADDRESS`, `DATABASE_URL`)
3. Initialize DB
   ```bash
   npm run db:init
   npm run db:check
   ```
4. Build and start manually first
   ```bash
   npm run build
   npm run start
   ```
5. Verify service
   ```bash
   curl -I http://127.0.0.1:3000
   ```
6. After manual validation, host with PM2
   ```bash
   npm i -g pm2
   pm2 start "npm run start" --name staking-frontend
   pm2 save
   pm2 startup
   ```

## 3) Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:init
npm run db:check
npm run tx:query -- --limit 50
```

Transaction query examples:

```bash
npm run tx:query -- --account 0xYourAddress
npm run tx:query -- --hash 0xYourTxHash
```

## 4) Vault Interface Required

The frontend expects Vault to expose:

- `depositEth(address receiver)`
- `withdrawEth(uint256 assets, address receiver)`
- `balanceOf(address owner)`
- `totalAssets()`

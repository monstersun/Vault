## Story Staking Frontend

Next.js frontend for your Story testnet staking dApp.

Features:

- MetaMask wallet connection
- Top navigation with `Staking`, `Withdraw`, `Info`
- Stake and withdraw transaction flow through wallet signature
- Gas estimation before wallet confirmation
- Account info panel (connected account, shares, vault assets)
- PostgreSQL-backed transaction history (`Info` page)

## Getting Started

Install dependencies:

```bash
npm install
```

Create environment file:

```bash
cp .env.example .env
```

Set your vault address:

```bash
NEXT_PUBLIC_VAULT_ADDRESS=0xYourVaultProxyAddress
DATABASE_URL=yourPostgresql://username:password@host:port/database
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
npm run db:init
npm run db:check
npm run tx:query -- --limit 50
```

## Database Setup (PostgreSQL)

The frontend stores transaction history in PostgreSQL (server-side only).

### 1) Configure connection

Set `DATABASE_URL` in `.env`:

```bash
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/staking_story
```

### 2) Create database and schema

Run:

```bash
npm run db:init
```

This script will:

- Create the target database if it does not exist
- Create the `transactions` table
- Create index `idx_transactions_account_time`

### 3) Verify initialization

Run:

```bash
npm run db:check
```

Expected output includes:

- `database_exists: true`
- `transactions_table: transactions`

### 4) Query transaction records

```bash
# Query latest records
npm run tx:query -- --limit 50

# Query by account
npm run tx:query -- --account 0xYourAddress

# Query by tx hash
npm run tx:query -- --hash 0xYourTxHash
```

## Notes

- MetaMask must be installed in your browser.
- The frontend expects the Vault to expose:
  - `depositEth(address receiver)`
  - `withdrawEth(uint256 assets, address receiver)`
  - `balanceOf(address owner)`
  - `totalAssets()`

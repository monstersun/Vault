import { ethers } from "ethers";

export type WalletEventName = "accountsChanged" | "disconnect" | "chainChanged" | "connect";

export const WALLET_PROVIDER_CHANGED_EVENT = "wallet-provider-changed";
export const EIP6963_REQUEST_EVENT = "eip6963:requestProvider";
export const EIP6963_ANNOUNCE_EVENT = "eip6963:announceProvider";

export type MetaMaskProvider = ethers.Eip1193Provider & {
  isMetaMask?: boolean;
  isRabby?: boolean;
  isCoinbaseWallet?: boolean;
  isOkxWallet?: boolean;
  providers?: MetaMaskProvider[];
  on?: (event: WalletEventName, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: WalletEventName, listener: (...args: unknown[]) => void) => void;
};

export type Eip6963ProviderInfo = {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
};

export type Eip6963AnnounceDetail = {
  info: Eip6963ProviderInfo;
  provider: MetaMaskProvider;
};

export type WalletOption = {
  id: string;
  name: string;
  icon?: string;
  rdns?: string;
  provider: MetaMaskProvider;
  source: "eip6963" | "window.ethereum";
};

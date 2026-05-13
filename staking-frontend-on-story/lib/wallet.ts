export function requestDiscoveredWallets() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("eip6963:requestProvider"));
}
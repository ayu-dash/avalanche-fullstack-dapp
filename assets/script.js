const FUJI_CHAIN_ID = "0xa869";

const $ = id => document.getElementById(id);

const el = {
    connectBtn: $("connectBtn"),
    statusBadge: $("statusBadge"),
    badgeText: $("badgeText"),
    status: $("status"),
    address: $("address"),
    network: $("network"),
    balance: $("balance"),
    chainId: $("chainId"),
    copyBtn: $("copyBtn"),
    errorBox: $("errorBox"),
    errorText: $("errorText")
};

let wallet = { connected: false, address: null, chainId: null, balance: null };

const formatBalance = wei => (parseInt(wei, 16) / 1e18).toFixed(4);
const shortenAddr = addr => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "-";
const showError = msg => { el.errorText.textContent = msg; el.errorBox.style.display = "block"; };
const hideError = () => el.errorBox.style.display = "none";

function updateUI() {
    const isFuji = wallet.chainId === FUJI_CHAIN_ID;
    const connected = wallet.connected;

    if (connected && isFuji) {
        el.status.textContent = "Connected";
        el.statusBadge.className = "status-badge connected";
        el.badgeText.textContent = "Connected";
        el.network.textContent = "Avalanche Fuji";
        el.network.className = "fuji";
    } else if (connected) {
        el.status.textContent = "Wrong Network";
        el.statusBadge.className = "status-badge wrong";
        el.badgeText.textContent = "Wrong Network";
        el.network.textContent = "Wrong Network";
        el.network.className = "wrong";
    } else {
        el.status.textContent = "Not Connected";
        el.statusBadge.className = "status-badge";
        el.badgeText.textContent = "Disconnected";
        el.network.textContent = "-";
        el.network.className = "";
    }

    el.address.textContent = connected ? shortenAddr(wallet.address) : "-";
    el.address.title = wallet.address || "";
    el.copyBtn.style.display = connected ? "inline-block" : "none";
    el.connectBtn.textContent = connected ? "Connected" : "Connect Wallet";
    el.connectBtn.disabled = connected;
    el.chainId.textContent = wallet.chainId ? `${wallet.chainId} (${parseInt(wallet.chainId, 16)})` : "-";
    el.balance.textContent = wallet.balance || "-";
}

async function getBalance(addr) {
    try {
        const wei = await ethereum.request({ method: "eth_getBalance", params: [addr, "latest"] });
        wallet.balance = formatBalance(wei);
    } catch { wallet.balance = null; }
}

async function connectWallet() {
    if (!window.ethereum) {
        showError("Wallet tidak terdeteksi! Install MetaMask atau Core Wallet.");
        return;
    }

    hideError();
    el.connectBtn.textContent = "Connecting...";
    el.connectBtn.disabled = true;

    try {
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        if (!accounts.length) throw new Error("No accounts found");

        wallet.address = accounts[0];
        wallet.connected = true;
        wallet.chainId = await ethereum.request({ method: "eth_chainId" });

        if (wallet.chainId === FUJI_CHAIN_ID) await getBalance(wallet.address);
        updateUI();
    } catch (e) {
        const msg = e.code === 4001 ? "Koneksi ditolak." :
            e.code === -32002 ? "Request pending. Cek wallet." :
                "Gagal connect: " + e.message;
        showError(msg);
        wallet.connected = false;
        updateUI();
    }
}

function onAccountsChanged(accounts) {
    if (!accounts.length) {
        wallet = { connected: false, address: null, chainId: wallet.chainId, balance: null };
    } else {
        wallet.address = accounts[0];
        if (wallet.chainId === FUJI_CHAIN_ID) getBalance(accounts[0]);
    }
    updateUI();
}

function onChainChanged(id) {
    wallet.chainId = id;
    wallet.balance = null;
    if (id === FUJI_CHAIN_ID && wallet.address) getBalance(wallet.address);
    updateUI();
}

function copyAddress() {
    if (!wallet.address) return;
    navigator.clipboard.writeText(wallet.address);
    el.copyBtn.textContent = "Copied!";
    setTimeout(() => el.copyBtn.textContent = "Copy", 1500);
}

async function init() {
    if (!window.ethereum) return;

    ethereum.on("accountsChanged", onAccountsChanged);
    ethereum.on("chainChanged", onChainChanged);

    const accounts = await ethereum.request({ method: "eth_accounts" }).catch(() => []);
    if (accounts.length) {
        wallet.address = accounts[0];
        wallet.connected = true;
        wallet.chainId = await ethereum.request({ method: "eth_chainId" });
        if (wallet.chainId === FUJI_CHAIN_ID) await getBalance(wallet.address);
        updateUI();
    }
}

el.connectBtn.onclick = connectWallet;
el.copyBtn.onclick = copyAddress;
init();

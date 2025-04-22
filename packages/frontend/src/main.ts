import "./style.css";
import typescriptLogo from "/typescript.svg";
import icLogo from "/ic.svg";
import solLogo from "/solana.svg";
import { canisterId } from "../../ic_siws_provider/declarations/index";
import { SiwsManager, siwsStateStore } from "ic-siws-js";
import { SolanaConnect } from "solana-connect";
import {
  Adapter,
  SignInMessageSignerWalletAdapter,
} from "@solana/wallet-adapter-base";
import { localStore } from "./state";

const siws = new SiwsManager(canisterId);
const solConnect = new SolanaConnect();

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <div>
      <a href="https://internetcomputer.org" target="_blank">
        <img src="${icLogo}" class="logo" alt="Internet Computer" />
      </a>
      <a href="https://solana.com" target="_blank">
        <img src="${solLogo}" class="logo" alt="Solana" />
      </a>
      <a href="https://www.typescriptlang.org/" target="_blank">
        <img src="${typescriptLogo}" class="logo" alt="TypeScript" />
      </a>
    </div>
    <h1>Sign in with Solana</h1>
    <div>This demo application and template demonstrates how to sign in Solana users into an IC canister using <a href="https://www.npmjs.com/package/ic-siws-js">ic-siws-js</a> and the <a href="https://github.com/kristoferlund/ic-siws">ic-siws-provider</a> canister.</div>
    <div class="pill-container">
      <div class="pill">Vanilla TS</div>
      <div class="pill">No framework</div>
    </div>
    <div class="container">
      <div id="solPubKey" style="display: none"></div>
      <div id="icPrincipal" style="display: none"></div>
      <button id="connectButton" type="button">Connect wallet</button>
      <button id="loginButton" type="button" style="display: none">Login</button>
      <button id="logoutButton" type="button" style="display: none">Logout</button>
      <div class="error" id="error" style="display: none"></div>
    </div>
    <div className="links">
      <a
        href="https://github.com/kristoferlund/ic-siws-vanilla-ts-demo"
         target="_blank"
         rel="noreferrer"
      >
        <img src="https://img.shields.io/badge/github-ic--siws--vanilla--ts--demo-blue.svg?style=for-the-badge" />
      </a>
    </div>
`;

const solPubKeyDiv = document.querySelector<HTMLDivElement>("#solPubKey")!;
const icPrincipalDiv = document.querySelector<HTMLDivElement>("#icPrincipal")!;
const connectButton =
  document.querySelector<HTMLButtonElement>("#connectButton")!;
const loginButton = document.querySelector<HTMLButtonElement>("#loginButton")!;
const logoutButton =
  document.querySelector<HTMLButtonElement>("#logoutButton")!;
const errorDiv = document.querySelector<HTMLDivElement>("#error")!;

connectButton.addEventListener("click", () => solConnect.openMenu());
loginButton.addEventListener("click", () => siws.login());
logoutButton.addEventListener("click", () => siws.clear());

function updateIcPrincipalDiv() {
  const identity = siwsStateStore.getSnapshot().context.identity;
  if (identity) {
    let principal = identity.getPrincipal().toText();
    icPrincipalDiv.innerHTML =
      principal.slice(0, 4) + "..." + principal.slice(-4);
    icPrincipalDiv.style.display = "block";
    return;
  }
  icPrincipalDiv.innerHTML = "";
  icPrincipalDiv.style.display = "none";
}

function showHideConnectButton() {
  const adapter = localStore.getSnapshot().context.adapter;
  if (adapter) {
    connectButton.style.display = "none";
    const address = adapter.publicKey?.toString();
    if (address) {
      solPubKeyDiv.style.display = "block";
      solPubKeyDiv.innerHTML = address.slice(0, 4) + "..." + address.slice(-4);
    }
  } else {
    solPubKeyDiv.style.display = "none";
  }
}

function showHideLoginLogout() {
  const adapter = localStore.getSnapshot().context.adapter;
  if (!adapter) {
    return;
  }
  const identity = siwsStateStore.getSnapshot().context.identity;
  if (identity) {
    loginButton.style.display = "none";
    logoutButton.style.display = "block";
    return;
  }
  loginButton.style.display = "block";
  logoutButton.style.display = "none";
}

function refreshUi() {
  updateIcPrincipalDiv();
  showHideLoginLogout();
  showHideConnectButton();
}

refreshUi();

siwsStateStore.subscribe((snapshot) => {
  const {
    prepareLoginStatus,
    prepareLoginError,
    loginStatus,
    loginError,
    signMessageStatus,
  } = snapshot.context;

  if (loginStatus === "idle") {
    loginButton.innerHTML = "Login";
    loginButton.disabled = false;
  }
  if (prepareLoginStatus === "preparing") {
    loginButton.innerHTML = "Preparing...";
    loginButton.disabled = true;
  }
  if (loginStatus === "logging-in") {
    loginButton.innerHTML = "Logging in...";
    loginButton.disabled = true;
  }
  if (signMessageStatus === "pending") {
    loginButton.innerHTML = "Signing SIWE message...";
    loginButton.disabled;
  }
  if (loginStatus === "error") {
    loginButton.innerHTML = "Login";
    loginButton.disabled = false;
  }
  if (loginError) {
    errorDiv.innerHTML = loginError.message;
    errorDiv.style.display = "block";
  } else if (prepareLoginError) {
    errorDiv.innerHTML = prepareLoginError.message;
    errorDiv.style.display = "block";
  } else {
    errorDiv.innerHTML = "";
    errorDiv.style.display = "none";
  }

  refreshUi();
});

solConnect.onWalletChange((adapter: Adapter | null) => {
  if (adapter) {
    localStore.send({ type: "setAdapter", adapter });
    siws.setAdapter(adapter as SignInMessageSignerWalletAdapter);
    refreshUi();
  }
});

import "./style.css";
import tsLogo from "/typescript.svg";
import icLogo from "/ic.svg";
import solLogo from "/solana.svg";
import { canisterId } from "../../ic_siws_provider/declarations/index";
import { SiwsManager, siwsStateStore } from "ic-siws-js";
import { SolanaConnect } from "solana-connect";
import { Adapter } from "@solana/wallet-adapter-base";

const SELECTORS = {
  appContainer: "#app",
  solPubKey: "#solPubKey",
  icPrincipal: "#icPrincipal",
  connectButton: "#connectButton",
  loginButton: "#loginButton",
  logoutButton: "#logoutButton",
  error: "#error",
} as const;

type SelectorKey = keyof typeof SELECTORS;

interface Elements {
  appContainer: HTMLElement;
  solPubKey: HTMLDivElement;
  icPrincipal: HTMLDivElement;
  connectButton: HTMLButtonElement;
  loginButton: HTMLButtonElement;
  logoutButton: HTMLButtonElement;
  error: HTMLDivElement;
}

class App {
  private siws = new SiwsManager(canisterId);
  private solConnect = new SolanaConnect();
  private elements!: Elements;

  private getElement<K extends keyof Elements>(key: K): Elements[K] {
    const selector = SELECTORS[key as SelectorKey];
    const el = document.querySelector<Elements[K]>(selector);
    if (!el) throw new Error(`Missing element: ${selector}`);
    return el;
  }

  constructor() {
    const container = this.getElement("appContainer");
    this.renderStaticContent(container);

    this.elements = {
      appContainer: container,
      solPubKey: this.getElement("solPubKey"),
      icPrincipal: this.getElement("icPrincipal"),
      connectButton: this.getElement("connectButton"),
      loginButton: this.getElement("loginButton"),
      logoutButton: this.getElement("logoutButton"),
      error: this.getElement("error"),
    };

    this.attachEventListeners();
    this.subscribeSolanaChanges();
    this.subscribeSiwsState();
    this.refreshUi();
  }

  private renderStaticContent(container: HTMLElement): void {
    container.innerHTML = `
      <div class="logo-group">
        <a href="https://internetcomputer.org" target="_blank">
          <img src="${icLogo}" class="logo" alt="Internet Computer" />
        </a>
        <a href="https://solana.com" target="_blank">
          <img src="${solLogo}" class="logo" alt="Solana" />
        </a>
        <a href="https://www.typescriptlang.org/" target="_blank">
          <img src="${tsLogo}" class="logo" alt="TypeScript" />
        </a>
      </div>
      <h1>Sign in with Solana</h1>
      <p>This demo authenticates Solana users against an IC canister using <a href="https://www.npmjs.com/package/ic-siws-js">ic-siws-js</a>.</p>
      <div class="pill-container">
        <span class="pill">Vanilla TS</span>
        <span class="pill">No framework</span>
      </div>
      <div class="container">
        <div id="solPubKey" style="display: none"></div>
        <div id="icPrincipal" style="display: none"></div>
        <button id="connectButton" type="button">Connect wallet</button>
        <button id="loginButton" type="button" style="display: none">Login</button>
        <button id="logoutButton" type="button" style="display: none">Logout</button>
        <div id="error" class="error" style="display: none"></div>
      </div>
      <div class="links">
        <a href="https://github.com/kristoferlund/ic-siws-vanilla-ts-demo" target="_blank" rel="noreferrer">
          <img src="https://img.shields.io/badge/github-ic--siws--vanilla--ts--demo-blue.svg?style=for-the-badge" alt="GitHub repo" />
        </a>
      </div>
    `;
  }

  private attachEventListeners(): void {
    this.elements.connectButton.addEventListener("click", () =>
      this.solConnect.openMenu(),
    );
    this.elements.loginButton.addEventListener("click", () =>
      this.siws.login(),
    );
    this.elements.logoutButton.addEventListener("click", () =>
      this.siws.clear(),
    );
  }

  private subscribeSolanaChanges(): void {
    this.solConnect.onWalletChange((adapter: Adapter | null) => {
      if (adapter) {
        this.siws.setAdapter(adapter);
      }
      this.refreshUi();
    });
  }

  private subscribeSiwsState(): void {
    siwsStateStore.subscribe(({ context }) => {
      const {
        prepareLoginStatus,
        loginStatus,
        loginError,
        prepareLoginError,
        signMessageStatus,
      } = context;
      const btn = this.elements.loginButton;
      const err = this.elements.error;

      if (prepareLoginStatus === "preparing") {
        btn.textContent = "Preparing...";
        btn.disabled = true;
      } else if (loginStatus === "logging-in") {
        btn.textContent = "Logging in...";
        btn.disabled = true;
      } else if (signMessageStatus === "pending") {
        btn.textContent = "Signing message...";
        btn.disabled = true;
      } else {
        btn.textContent = "Login";
        btn.disabled = false;
      }

      const message = (loginError || prepareLoginError)?.message || "";
      this.setDisplay(err, Boolean(message));
      err.textContent = message;

      this.refreshUi();
    });
  }

  private refreshUi(): void {
    this.toggleIcPrincipal();
    this.toggleLoginLogout();
    this.toggleSolPubKey();
  }

  private setDisplay(el: HTMLElement, show: boolean): void {
    el.style.display = show ? "" : "none";
  }

  private toggleIcPrincipal(): void {
    const identity = siwsStateStore.getSnapshot().context.identity;
    if (identity) {
      const id = identity.getPrincipal().toText();
      this.elements.icPrincipal.textContent = `${id.slice(0, 4)}...${id.slice(-4)}`;
      this.setDisplay(this.elements.icPrincipal, true);
    } else {
      this.setDisplay(this.elements.icPrincipal, false);
    }
  }

  private toggleSolPubKey(): void {
    const adapter = this.solConnect.getWallet();
    if (adapter?.publicKey) {
      const addr = adapter.publicKey.toString();
      this.elements.solPubKey.textContent = `${addr.slice(0, 4)}...${addr.slice(-4)}`;
      this.setDisplay(this.elements.solPubKey, true);
    } else {
      this.setDisplay(this.elements.solPubKey, false);
    }
  }

  private toggleLoginLogout(): void {
    const adapter = this.solConnect.getWallet();
    const identity = siwsStateStore.getSnapshot().context.identity;

    this.setDisplay(this.elements.connectButton, !adapter);
    this.setDisplay(this.elements.loginButton, Boolean(adapter && !identity));
    this.setDisplay(this.elements.logoutButton, Boolean(adapter && identity));
  }
}

new App();

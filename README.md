![](media/header.png)

## Overview

This repository is a Vue 3 + Vite demo application and template for Sign‑In‑With‑Solana (SIWS) to an Internet Computer (IC) canister. By combining:

- **solana-wallets-vue** (wallet connections)  
- **ic-siws-js** (SIWS authentication)  
- **ic_siws_provider** canister (Rust)  

you get a fully authenticated cross‑chain dapp where a Solana wallet maps one‑to‑one to an IC identity.

> [!NOTE]
> In addition to this Vue demo of ic-siws, there are versions for React, Svelte, and more in the main [ic-siws](https://github.com/kristoferlund/ic-siws) repository.

### Highlights

- Sign in with Solana to interact with IC canisters  
- One‑to‑one mapping between wallet and IC identity  
- Leverage IC features: BTC/ETH integration, fast finality, low transaction fees, HTTPS outcalls, cheap data storage

## Live Demo

Try it live: <https://fqws5-uyaaa-aaaal-qsmta-cai.icp0.io>

## Key features

The demo is built using [Vite](https://vitejs.dev/) to provide a fast development experience.

## Table of contents

- [App components](#app-components)
  - [Frontend](#frontend)
  - [IC SIWS Provider](#ic-siws-provider)
- [How it works](#how-it-works)
- [Run locally](#run-locally)
- [Details](#details)
  - [IC SIWS Provider](#ic-siws-provider-1)
  - [Frontend](#frontend-1)
- [Updates](#updates)
- [Contributing](#contributing)
- [License](#license)

## App components

If you are new to IC, please read the [Internet Computer Basics](https://internetcomputer.org/basics) before proceeding.

This app consists of two main components:

### Frontend

The frontend is a Vue application served by an ICP asset canister. In a real world scenario, this frontend application would make authenticated calls to one or more application canisters. Such application canisters are not included with this demo.

### IC SIWS Provider

The pre-built IC SIWS Provider is used to create an identity for the user. It is a Rust based canister that implements the SIWS login flow. The flow starts with a SIWS message being generated and ends with a Delegate Identity being created for the user. The Delegate Identity gives the user access to the backend canister.

## How it works

This is the high-level flow between the app components when a user logs in:

1. The application requests a SIWS message from the `ic_siws_provider` canister on behalf of the user.
2. The application displays the SIWS message to the user who signs it with their Solana wallet.
3. The application sends the signed SIWS message to the `ic_siws_provider` canister to login the user. The canister verifies the signature and creates an identity for the user.
4. The application retrieves the identity from the `ic_siws_provider` canister.
5. The application can now use the identity to make authenticated calls to the app canister.

## Run locally

```bash
dfx start --clean --background
make deploy-all
```

## Details

### IC SIWS Provider

The `ic_siws_provider` canister is pre-built and added to the project as a dependency in the [dfx.json](/dfx.json) file.

```json
{
  "canisters": {
    "ic_siws_provider": {
      "type": "custom",
      "candid": "https://github.com/kristoferlund/ic-siws/releases/download/v0.0.2/ic_siws_provider.did",
      "wasm": "https://github.com/kristoferlund/ic-siws/releases/download/v0.0.2/ic_siws_provider.wasm.gz"
    },
    ...
  },
  ...
}
```

Its behavior is configured and passed as an argument to the canister `init` function. Below is an example of how to configure the canister using the `dfx` command line tool in the project [Makefile](/Makefile):

```makefile
dfx deploy ic_siws_provider --argument "( \
    record { \
        domain = \"127.0.0.1\"; \
        uri = \"http://127.0.0.1:5173\"; \
        salt = \"salt\"; \
        chain_id = opt \"mainnet\"; \
        scheme = opt \"http\"; \
        statement = opt \"Login to the app\"; \
        sign_in_expires_in = opt 300000000000; /* 5 minutes */ \
        session_expires_in = opt 604800000000000; /* 1 week */ \
        targets = opt vec { \
            \"$$(dfx canister id ic_siws_provider)\"; \
        }; \
        runtime_features = null; \
    } \
)"
```

For more information about the configuration options, see the [ic-siws-provider](https://github.com/kristoferlund/ic-siws/tree/main/packages/ic_siws_provider) documentation.

### Frontend

The frontend is a Vue 3 application built with Vite. It uses the `solana-wallets-vue` plugin to manage Solana wallet connections, and the `ic-siws-js` Vue module to handle SIWS-based authentication flows.

- solana-wallets-vue
  A Vue plugin that integrates Solana wallet adapters into the application. It provides:
  - A plugin install function (`SolanaWallets`) that accepts `walletOptions`.
  - A `<wallet-multi-button>` component for user interaction.
  - Composables like `useWallet` to access and react to wallet state.

- walletOptions
  Configuration object passed to `SolanaWallets`, defined in `main.ts`. For example:
  ```ts
  import SolanaWallets from 'solana-wallets-vue';
  const walletOptions = {
    wallets: [
      // e.g. new PhantomWalletAdapter(), new SolflareWalletAdapter(), etc.
    ],
    autoConnect: true,    // automatically reconnect to last used wallet
  };
  createApp(App)
    .use(SolanaWallets, walletOptions)
    .mount('#app');
  ```

- useWallet
  A composable from `solana-wallets-vue` that returns reactive wallet state. Common usage:
  ```ts
  import { useWallet } from 'solana-wallets-vue';
  const { publicKey, wallet } = useWallet();
  // publicKey.value: connected wallet public key (or null)
  // wallet.value.adapter: current wallet adapter instance
  ```

- createSiwsIdentityProvider
  A function from `ic-siws-js/vue` to initialize the SIWS identity provider. Call it once with your canister ID and the wallet adapter:
  ```ts
  import { createSiwsIdentityProvider } from 'ic-siws-js/vue';
  createSiwsIdentityProvider({
    canisterId,
    adapter: wallet.value?.adapter,  // adapter must implement signMessage
  });
  ```

- useSiws
  A composable from `ic-siws-js/vue` that manages the SIWS login flow. It exposes:
  - `prepareLogin()`: fetches a SIWS message from the canister.
  - `login()`: signs the message with the wallet and submits it to the canister.
  - `identity`: the DelegateIdentity after successful login.
  - `clear()`: resets state / logs out.
  - Reactive status flags (`prepareLoginStatus`, `signMessageStatus`, `loginStatus`) and error properties (`prepareLoginError`, `signMessageError`, `loginError`), to drive UI feedback.
  ```ts
  import { useSiws } from 'ic-siws-js/vue';
  const siws = useSiws();
  // use siws.login(), siws.clear(), siws.identity, status flags, etc.
  ```

## Updates

See the [CHANGELOG](CHANGELOG.md) for details on updates.

## Contributing

Contributions are welcome. Please submit your pull requests or open issues to propose changes or report bugs.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

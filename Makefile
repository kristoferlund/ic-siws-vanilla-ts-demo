create-canisters:
	dfx canister create --all

deploy-provider:
	dfx deploy ic_siws_provider --argument "( \
	    record { \
	        domain = \"127.0.0.1\"; \
	        uri = \"http://127.0.0.1:5173\"; \
	        salt = \"salt\"; \
					chain_id = opt \"mainnet\"; \
	        scheme = opt \"http\"; \
	        statement = opt \"Login to the SIWS/IC demo app\"; \
	        sign_in_expires_in = opt 300000000000; /* 5 minutes */ \
	        session_expires_in = opt 604800000000000; /* 1 week */ \
	        targets = opt vec { \
	            \"$$(dfx canister id ic_siws_provider)\"; \
	        }; \
          runtime_features = null; \
	    } \
	)"
	dfx generate ic_siws_provider

upgrade-provider:
	dfx canister install ic_siws_provider --mode upgrade --upgrade-unchanged --argument "( \
	    record { \
	        domain = \"127.0.0.1\"; \
	        uri = \"http://127.0.0.1:5173\"; \
	        salt = \"salt\"; \
					chain_id = opt \"mainnet\"; \
	        scheme = opt \"http\"; \
	        statement = opt \"Login to the siws/IC demo app\"; \
	        sign_in_expires_in = opt 300000000000; /* 5 minutes */ \
	        session_expires_in = opt 604800000000000; /* 1 week */ \
	        targets = opt vec { \
	            \"$$(dfx canister id ic_siws_provider)\"; \
	        }; \
          runtime_features = null; \
	    } \
	)"
	dfx generate ic_siws_provider

deploy-frontend:
	pnpm install
	dfx deploy frontend

deploy-all: create-canisters deploy-provider deploy-frontend

run-frontend:
	pnpm install
	pnpm run dev

clean:
	rm -rf .dfx
	rm -rf dist
	rm -rf node_modules
	rm -rf src/declarations
	rm -f .env
	cargo clean


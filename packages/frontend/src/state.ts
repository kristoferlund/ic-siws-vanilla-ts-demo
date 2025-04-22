import { Adapter } from "@solana/wallet-adapter-base";
import { createStore } from "@xstate/store";

interface Context {
  adapter?: Adapter;
}

const initialState: Context = {
  adapter: undefined,
};

export const localStore = createStore({
  context: initialState,
  on: {
    setAdapter: (_, event: { adapter: Adapter }) => ({
      adapter: event.adapter,
    }),
  },
});

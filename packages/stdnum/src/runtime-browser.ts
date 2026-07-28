import { getBinding as getWasmBinding } from "@stll/stdnum-wasm";

import { setBinding } from "./runtime-core";

let initialization: Promise<void> | undefined;

export const initialize = (): Promise<void> => {
  initialization ??= getWasmBinding().then((binding) => {
    setBinding(binding);
    return undefined;
  });
  return initialization;
};

export {
  createValidator,
  getBinding,
  StdnumNotInitializedError,
} from "./runtime-core";

import { getBinding as getWasmBinding } from "@stll/stdnum-wasm";

import { setBinding } from "./runtime-core";

setBinding(await getWasmBinding());

export {
  createValidator,
  getBinding,
} from "./runtime-core";

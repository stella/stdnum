import { loadNativeStdnumBinding } from "./native-node";
import { setBindingLoader } from "./runtime-core";

setBindingLoader(loadNativeStdnumBinding);

export {
  createValidator,
  getBinding,
  setBinding,
} from "./runtime-core";

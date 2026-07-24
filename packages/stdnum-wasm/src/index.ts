import {
  asNativeBinding,
  type NativeStdnumBinding,
  type NativeValidateResult,
  type ValidatorMetadata,
} from "@stll/stdnum/native";

type WasmGlue = Record<string, unknown> & {
  default: (moduleOrPath?: unknown) => Promise<unknown>;
};

let bindingPromise:
  | Promise<NativeStdnumBinding>
  | undefined;

export const getBinding =
  (): Promise<NativeStdnumBinding> => {
    bindingPromise ??= loadBinding();
    return bindingPromise;
  };

const loadBinding =
  async (): Promise<NativeStdnumBinding> => {
    const glueUrl = new URL(
      "../native/stella_stdnum_wasm.js",
      import.meta.url,
    );
    const wasmUrl = new URL(
      "../native/stella_stdnum_wasm_bg.wasm",
      import.meta.url,
    );
    const loaded: unknown = await import(
      /* @vite-ignore */ glueUrl.href
    );
    if (!isWasmGlue(loaded))
      throw new Error(
        "stdnum WASM glue has an invalid shape",
      );
    await loaded.default({ module_or_path: wasmUrl });
    const binding = asNativeBinding(loaded);
    if (binding === null)
      throw new Error(
        "stdnum WASM exports do not match the binding contract",
      );
    return binding;
  };

const isWasmGlue = (value: unknown): value is WasmGlue =>
  typeof value === "object" &&
  value !== null &&
  "default" in value &&
  typeof value.default === "function";

export const validatorIds = async (): Promise<string[]> =>
  (await getBinding()).validatorIds();
export const validators = async (): Promise<
  ValidatorMetadata[]
> => (await getBinding()).validators();
export const validatorMetadata = async (
  id: string,
): Promise<ValidatorMetadata> =>
  (await getBinding()).validatorMetadata(id);
export const validate = async (
  id: string,
  value: string,
): Promise<NativeValidateResult> =>
  (await getBinding()).validate(id, value);
export const compact = async (
  id: string,
  value: string,
): Promise<string> =>
  (await getBinding()).compact(id, value);
export const format = async (
  id: string,
  value: string,
): Promise<string> =>
  (await getBinding()).format(id, value);
export const generate = async (
  id: string,
): Promise<string | null> =>
  (await getBinding()).generate(id);
export const parse = async (id: string, value: string) =>
  (await getBinding()).parse(id, value);

export type {
  NativeParsedIdentifier,
  NativeStdnumBinding,
  NativeValidateResult,
  ValidatorMetadata,
} from "@stll/stdnum/native";

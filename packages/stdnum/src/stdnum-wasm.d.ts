declare module "@stll/stdnum-wasm" {
  export const getBinding: () => Promise<
    import("./native").NativeStdnumBinding
  >;
}

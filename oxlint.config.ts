import { library } from "@stll/oxlint-config";

export default library({
  ignorePatterns: ["scripts/rust-oracle/target/"],
  overrides: [
    {
      files: ["scripts/**"],
      rules: {
        "no-console": "off",
        "typescript/no-unnecessary-condition": "off",
        "typescript/strict-boolean-expressions": "off",
      },
    },
  ],
});

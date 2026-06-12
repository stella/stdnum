import { describe, expect, test } from "bun:test";

import { crypto } from "../src";

describe("crypto.eth", () => {
  test("valid Ethereum address", () => {
    const r = crypto.eth.validate(
      "0xde709f2102306220921060314715629080e2fb77",
    );
    expect(r.valid).toBe(true);
  });

  test("compact lowercases checksummed address", () => {
    expect(
      crypto.eth.compact(
        "0x52908400098527886E0F7030069857D2E4169EE7",
      ),
    ).toBe("0x52908400098527886e0f7030069857d2e4169ee7");
  });

  test("invalid hex character", () => {
    const r = crypto.eth.validate(
      "0xg2908400098527886e0f7030069857d2e4169ee7",
    );
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });
});

describe("crypto.btcbase58", () => {
  test("valid P2PKH address", () => {
    const r = crypto.btcbase58.validate(
      "1BoatSLRHtKNngkdXEeobR76b53LETtpyT",
    );
    expect(r.valid).toBe(true);
  });

  test("valid P2SH address", () => {
    const r = crypto.btcbase58.validate(
      "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
    );
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = crypto.btcbase58.validate(
      "1BoatSLRHtKNngkdXEeobR76b53LETtpyU",
    );
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });
});

describe("crypto.btcbech32", () => {
  test("valid Bech32 address", () => {
    const r = crypto.btcbech32.validate(
      "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    );
    expect(r.valid).toBe(true);
  });

  test("valid uppercase Bech32 address", () => {
    const r = crypto.btcbech32.validate(
      "BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4",
    );
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe(
        "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
      );
    }
  });

  test("valid Bech32 P2WSH address", () => {
    const r = crypto.btcbech32.validate(
      "bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3",
    );
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = crypto.btcbech32.validate(
      "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kg3g4ty",
    );
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });
});

describe("crypto.wallet", () => {
  test("accepts supported wallet families", () => {
    expect(
      crypto.wallet.validate(
        "0xde709f2102306220921060314715629080e2fb77",
      ).valid,
    ).toBe(true);
    expect(
      crypto.wallet.validate(
        "1BoatSLRHtKNngkdXEeobR76b53LETtpyT",
      ).valid,
    ).toBe(true);
    expect(
      crypto.wallet.validate(
        "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
      ).valid,
    ).toBe(true);
  });
});

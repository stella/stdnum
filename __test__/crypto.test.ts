import { describe, expect, test } from "bun:test";

import { crypto } from "../src";
import { keccak256 } from "../src/_checksums/keccak";

const hex = (bytes: Uint8Array): string => {
  let result = "";
  for (const byte of bytes) {
    result += byte.toString(16).padStart(2, "0");
  }
  return result;
};

describe("keccak256", () => {
  test("matches canonical empty digest", () => {
    expect(hex(keccak256(new Uint8Array()))).toBe(
      "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    );
  });
});

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

  test("valid EIP-55 mixed-case checksum", () => {
    const r = crypto.eth.validate(
      "0x52908400098527886E0F7030069857D2E4169EE7",
    );
    expect(r.valid).toBe(true);
  });

  test("invalid EIP-55 mixed-case checksum", () => {
    const r = crypto.eth.validate(
      "0x52908400098527886e0F7030069857D2E4169EE7",
    );
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
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

  test("invalid decoded payload length", () => {
    const r = crypto.btcbase58.validate(
      "111111111111111111117K4nzc",
    );
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
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

const MASK_64 = (1n << 64n) - 1n;

const ROUND_CONSTANTS = [
  0x0000000000000001n,
  0x0000000000008082n,
  0x800000000000808an,
  0x8000000080008000n,
  0x000000000000808bn,
  0x0000000080000001n,
  0x8000000080008081n,
  0x8000000000008009n,
  0x000000000000008an,
  0x0000000000000088n,
  0x0000000080008009n,
  0x000000008000000an,
  0x000000008000808bn,
  0x800000000000008bn,
  0x8000000000008089n,
  0x8000000000008003n,
  0x8000000000008002n,
  0x8000000000000080n,
  0x000000000000800an,
  0x800000008000000an,
  0x8000000080008081n,
  0x8000000000008080n,
  0x0000000080000001n,
  0x8000000080008008n,
] as const;

const ROTATION_OFFSETS = [
  0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39,
  41, 45, 15, 21, 8, 18, 2, 61, 56, 14,
] as const;

const RATE_BYTES = 136;

const rotl64 = (value: bigint, shift: number): bigint => {
  if (shift === 0) return value & MASK_64;
  const bigShift = BigInt(shift);
  return (
    ((value << bigShift) | (value >> (64n - bigShift))) &
    MASK_64
  );
};

const keccakF1600 = (state: bigint[]): void => {
  const c = Array.from({ length: 5 }, () => 0n);
  const d = Array.from({ length: 5 }, () => 0n);
  const b = Array.from({ length: 25 }, () => 0n);

  for (const roundConstant of ROUND_CONSTANTS) {
    for (let x = 0; x < 5; x += 1) {
      c[x] =
        (state[x] ?? 0n) ^
        (state[x + 5] ?? 0n) ^
        (state[x + 10] ?? 0n) ^
        (state[x + 15] ?? 0n) ^
        (state[x + 20] ?? 0n);
    }

    for (let x = 0; x < 5; x += 1) {
      d[x] =
        (c[(x + 4) % 5] ?? 0n) ^
        rotl64(c[(x + 1) % 5] ?? 0n, 1);
    }

    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        const index = x + 5 * y;
        state[index] =
          ((state[index] ?? 0n) ^ (d[x] ?? 0n)) & MASK_64;
      }
    }

    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        const sourceIndex = x + 5 * y;
        const targetIndex = y + 5 * ((2 * x + 3 * y) % 5);
        b[targetIndex] = rotl64(
          state[sourceIndex] ?? 0n,
          ROTATION_OFFSETS[sourceIndex] ?? 0,
        );
      }
    }

    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        const index = x + 5 * y;
        state[index] =
          ((b[index] ?? 0n) ^
            (~(b[((x + 1) % 5) + 5 * y] ?? 0n) &
              (b[((x + 2) % 5) + 5 * y] ?? 0n))) &
          MASK_64;
      }
    }

    state[0] = ((state[0] ?? 0n) ^ roundConstant) & MASK_64;
  }
};

export const keccak256 = (
  bytes: Uint8Array,
): Uint8Array => {
  const state = Array.from({ length: 25 }, () => 0n);
  let offset = 0;

  while (offset + RATE_BYTES <= bytes.length) {
    for (let i = 0; i < RATE_BYTES; i += 1) {
      const lane = Math.floor(i / 8);
      const shift = BigInt((i % 8) * 8);
      state[lane] =
        ((state[lane] ?? 0n) ^
          (BigInt(bytes[offset + i] ?? 0) << shift)) &
        MASK_64;
    }
    keccakF1600(state);
    offset += RATE_BYTES;
  }

  const block = new Uint8Array(RATE_BYTES);
  block.set(bytes.slice(offset));
  block[bytes.length - offset] = 0x01;
  block[RATE_BYTES - 1] =
    (block[RATE_BYTES - 1] ?? 0) ^ 0x80;

  for (let i = 0; i < RATE_BYTES; i += 1) {
    const lane = Math.floor(i / 8);
    const shift = BigInt((i % 8) * 8);
    state[lane] =
      ((state[lane] ?? 0n) ^
        (BigInt(block[i] ?? 0) << shift)) &
      MASK_64;
  }
  keccakF1600(state);

  const digest = new Uint8Array(32);
  for (let i = 0; i < digest.length; i += 1) {
    const lane = Math.floor(i / 8);
    const shift = BigInt((i % 8) * 8);
    digest[i] = Number(
      ((state[lane] ?? 0n) >> shift) & 0xffn,
    );
  }
  return digest;
};

import { isValidCpf } from "@brazilian-utils/brazilian-utils";
import { performance } from "node:perf_hooks";
import { validate as validateRut } from "rut.js";
import { validatePolish } from "validate-polish";

import * as stdnum from "../packages/stdnum/dist/index.js";

const warmupIterations = 200_000;
const iterations = Number.parseInt(
  process.env.ORACLE_PERFORMANCE_ITERATIONS ?? "2000000",
  10,
);
const sampleCount = 11;
const minimumRatio = 1;
const cases = [
  {
    id: "br.cpf",
    value: "39053344705",
    rust: (value) => stdnum.br.cpf.validate(value).valid,
    oracle: isValidCpf,
    oracleName: "brazilian-utils",
  },
  {
    id: "cl.rut",
    value: "760864285",
    rust: (value) => stdnum.cl.rut.validate(value).valid,
    oracle: validateRut,
    oracleName: "rut.js",
  },
  {
    id: "pl.nip",
    value: "2234567895",
    rust: (value) => stdnum.pl.nip.validate(value).valid,
    oracle: (value) => validatePolish.nip(value),
    oracleName: "validate-polish",
  },
];

if (!Number.isSafeInteger(iterations) || iterations < 1) {
  throw new Error(
    "ORACLE_PERFORMANCE_ITERATIONS must be a positive safe integer",
  );
}

const measure = (run, value) => {
  let valid = 0;
  const started = performance.now();
  for (let index = 0; index < iterations; index += 1) {
    valid += Number(run(value));
  }
  if (valid !== iterations) {
    throw new Error(
      "Oracle performance fixture unexpectedly failed validation",
    );
  }
  return (
    (iterations * 1_000) / (performance.now() - started)
  );
};

const median = (values) => {
  values.sort((left, right) => left - right);
  return values[Math.floor(values.length / 2)];
};

for (const benchmark of cases) {
  for (
    let index = 0;
    index < warmupIterations;
    index += 1
  ) {
    benchmark.rust(benchmark.value);
    benchmark.oracle(benchmark.value);
  }
  const ratios = [];
  const rustRates = [];
  const oracleRates = [];
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const rustFirst = sample % 2 === 0;
    const first = rustFirst
      ? benchmark.rust
      : benchmark.oracle;
    const second = rustFirst
      ? benchmark.oracle
      : benchmark.rust;
    const firstRate = measure(first, benchmark.value);
    const secondRate = measure(second, benchmark.value);
    const rustRate = rustFirst ? firstRate : secondRate;
    const oracleRate = rustFirst ? secondRate : firstRate;
    rustRates.push(rustRate);
    oracleRates.push(oracleRate);
    ratios.push(rustRate / oracleRate);
  }
  const ratio = median(ratios);
  const rustRate = median(rustRates);
  const oracleRate = median(oracleRates);
  if (ratio <= minimumRatio) {
    throw new Error(
      `${benchmark.id} Rust throughput no longer beats ${benchmark.oracleName}: ${ratio.toFixed(3)}x (${rustRate.toFixed(0)}/s vs ${oracleRate.toFixed(0)}/s)`,
    );
  }
  console.log(
    `${benchmark.id}: ${ratio.toFixed(3)}x ${benchmark.oracleName} (${rustRate.toFixed(0)}/s vs ${oracleRate.toFixed(0)}/s)`,
  );
}

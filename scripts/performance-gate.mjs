import { dirname, join } from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = dirname(
  dirname(fileURLToPath(import.meta.url)),
);
const loadStarted = performance.now();
const stdnum = await import(
  pathToFileURL(join(root, "packages/stdnum/dist/index.js"))
    .href
);
const loadMilliseconds = performance.now() - loadStarted;

const values = [
  "25596641",
  "CZ6508000000192000145399",
  "52998224725",
  "123456789",
];
const validators = [
  stdnum.cz.ico,
  stdnum.iban,
  stdnum.br.cpf,
  stdnum.us.ein,
];
const controls = values.map(() => ({
  validate: (value) => ({
    valid: value.length > 0,
    compact: value,
  }),
}));
const iterations = 500_000;

const measure = (targets) => {
  for (let index = 0; index < 25_000; index += 1) {
    targets[index % targets.length].validate(
      values[index % values.length],
    );
  }
  const samples = [];
  let valid = 0;
  for (let sample = 0; sample < 5; sample += 1) {
    const started = performance.now();
    for (let index = 0; index < iterations; index += 1) {
      if (
        targets[index % targets.length].validate(
          values[index % values.length],
        ).valid
      ) {
        valid += 1;
      }
    }
    const elapsed = performance.now() - started;
    samples.push((iterations * 1_000) / elapsed);
  }
  if (valid !== iterations * samples.length)
    throw new Error(
      "Performance workload returned an invalid result",
    );
  samples.sort((left, right) => left - right);
  return samples[Math.floor(samples.length / 2)];
};

const controlThroughput = measure(controls);
const validationThroughput = measure(validators);
const normalizedThroughput =
  validationThroughput / controlThroughput;
const maximumLoadMilliseconds = 500;
const minimumValidationsPerSecond = 150_000;
const removedTypeScriptNormalizedThroughput = 0.016_154;
const requiredSpeedupOverTypeScript = 1.25;
const minimumNormalizedThroughput =
  removedTypeScriptNormalizedThroughput *
  requiredSpeedupOverTypeScript;
const speedupOverTypeScript =
  normalizedThroughput /
  removedTypeScriptNormalizedThroughput;
if (loadMilliseconds > maximumLoadMilliseconds) {
  throw new Error(
    `Native cold load regressed: ${loadMilliseconds.toFixed(1)}ms > ${String(maximumLoadMilliseconds)}ms`,
  );
}
if (validationThroughput < minimumValidationsPerSecond) {
  throw new Error(
    `Native validation throughput regressed: ${validationThroughput.toFixed(0)}/s < ${String(minimumValidationsPerSecond)}/s`,
  );
}
if (normalizedThroughput < minimumNormalizedThroughput) {
  throw new Error(
    `Rust no longer beats the TypeScript baseline by ${requiredSpeedupOverTypeScript.toFixed(2)}x: normalized throughput ${normalizedThroughput.toFixed(5)} < ${minimumNormalizedThroughput.toFixed(5)}`,
  );
}

console.log(
  `Performance gate passed (cold load ${loadMilliseconds.toFixed(1)}ms; median ${validationThroughput.toFixed(0)} validations/s; normalized ${normalizedThroughput.toFixed(5)}; ${speedupOverTypeScript.toFixed(2)}x the removed TypeScript implementation).`,
);

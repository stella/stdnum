import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const root = dirname(
  dirname(fileURLToPath(import.meta.url)),
);
const require = createRequire(import.meta.url);
const loadStarted = performance.now();
const stdnum = require(
  join(root, "packages/stdnum/index.cjs"),
);
const loadMilliseconds = performance.now() - loadStarted;

const workload = [
  ["cz.ico", "25596641"],
  ["iban", "CZ6508000000192000145399"],
  ["br.cpf", "52998224725"],
  ["us.ein", "123456789"],
];
const iterations = 250_000;

for (let index = 0; index < 10_000; index += 1) {
  const [id, value] = workload[index % workload.length];
  stdnum.validate(id, value);
}

const samples = [];
let valid = 0;
for (let sample = 0; sample < 3; sample += 1) {
  const started = performance.now();
  for (let index = 0; index < iterations; index += 1) {
    const [id, value] = workload[index % workload.length];
    if (stdnum.validate(id, value).valid) valid += 1;
  }
  const elapsed = performance.now() - started;
  samples.push((iterations * 1_000) / elapsed);
}

const bestThroughput = Math.max(...samples);
const maximumLoadMilliseconds = 500;
const minimumValidationsPerSecond = 150_000;
if (loadMilliseconds > maximumLoadMilliseconds) {
  throw new Error(
    `Native cold load regressed: ${loadMilliseconds.toFixed(1)}ms > ${String(maximumLoadMilliseconds)}ms`,
  );
}
if (bestThroughput < minimumValidationsPerSecond) {
  throw new Error(
    `Native validation throughput regressed: ${bestThroughput.toFixed(0)}/s < ${String(minimumValidationsPerSecond)}/s`,
  );
}
if (valid !== iterations * samples.length) {
  throw new Error(
    "Performance workload returned an invalid result",
  );
}

console.log(
  `Performance gate passed (cold load ${loadMilliseconds.toFixed(1)}ms; best ${bestThroughput.toFixed(0)} validations/s).`,
);

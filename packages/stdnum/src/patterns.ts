import { allValidators } from "./generated/registry";
import type { CountryCode, CountryValidator, Validator } from "./types";

export type ValidatorPattern<TValidator extends Validator = Validator> = {
  validator: TValidator;
  regex: RegExp;
};

type RegisteredValidator = (typeof allValidators)[number];

export const toRegex = (validator: Validator): RegExp => {
  if (validator.candidatePattern === undefined) {
    throw new Error(`${validator.name} does not define a candidate pattern`);
  }
  return new RegExp(validator.candidatePattern, "g");
};
export const toPatterns = <TValidator extends Validator>(
  validators: readonly TValidator[],
): ValidatorPattern<TValidator>[] =>
  validators
    .filter((validator) => validator.candidatePattern !== undefined)
    .map((validator) => ({
      validator,
      regex: toRegex(validator),
    }));
export const byCountry = <TCountry extends CountryCode>(
  country: TCountry,
): ValidatorPattern<CountryValidator<TCountry>>[] =>
  toPatterns(
    allValidators.filter(
      (validator) =>
        validator.scope === "country" && validator.country === country,
    ) as unknown as readonly CountryValidator<TCountry>[],
  );
export const byEntityType = (
  entityType: Validator["entityType"],
): ValidatorPattern<RegisteredValidator>[] =>
  toPatterns(
    allValidators.filter((validator) => validator.entityType === entityType),
  );
export const allPatterns = (): ValidatorPattern<RegisteredValidator>[] =>
  toPatterns(allValidators);

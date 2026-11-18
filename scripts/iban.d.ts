// The iban oracle package ships no type declarations. Only the validator the
// oracle compares against is declared.
declare module "iban" {
  const IBAN: {
    isValid: (iban: string) => boolean;
  };
  export default IBAN;
}

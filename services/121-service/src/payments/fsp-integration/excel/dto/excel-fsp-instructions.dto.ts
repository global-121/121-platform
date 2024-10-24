interface KnownProperties {
  amount: number;
  id: number;
  referenceId: string;
}

type UnknownProperties = Record<string, string | undefined | number | null>;

interface ExcelFspInstructions extends KnownProperties, UnknownProperties {}

export { ExcelFspInstructions };

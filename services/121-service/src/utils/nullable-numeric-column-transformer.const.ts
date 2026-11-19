import { ValueTransformer } from 'typeorm';

// The pg driver returns numeric columns as strings to avoid losing precision
export const nullableNumericColumnTransformer: ValueTransformer = {
  to: (value: number | null) => value,
  from: (value: string | number | null) =>
    value === null ? null : Number(value),
};

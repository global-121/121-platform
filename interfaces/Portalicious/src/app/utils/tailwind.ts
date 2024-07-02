import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../../tailwind.config';

export function getTailwindConfig() {
  return resolveConfig(tailwindConfig);
}

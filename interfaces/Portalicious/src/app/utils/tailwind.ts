import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '~/../../tailwind.config.js';

export function getTailwindConfig() {
  return resolveConfig(tailwindConfig);
}

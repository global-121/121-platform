export function camelCase2Kebab(camelCase: string): string {
  return camelCase.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
}

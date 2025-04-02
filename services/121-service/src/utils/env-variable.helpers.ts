export function shouldBeEnabled(envVariable: string | undefined): boolean {
  const enabledValues = [
    'true',
    '1',
    'y',
    'yes',
    'yep',
    'on',
    'enabled',
    'enable',
  ];
  return !!envVariable && enabledValues.includes(envVariable.toLowerCase());
}

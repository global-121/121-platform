import { camelCase2Kebab } from './camelcase-to-kebabcase';

describe('camelCase2Kebab', () => {
  it('should output kebab-case', () => {
    const input = [
      'camelCase',
      'kebab-case',
      'lowercase',
      'UPPERCASE',
      'PascalCase',
      'ranDom5Case',
      'abcdefghijklmnopqrstuvwxyZ',
    ];
    const expectedOutput = [
      'camel-case',
      'kebab-case',
      'lowercase',
      '-u-p-p-e-r-c-a-s-e',
      '-pascal-case',
      'ran-dom5-case',
      'abcdefghijklmnopqrstuvwxy-z',
    ];

    const output = input.map((item) => {
      return camelCase2Kebab(item);
    });

    expect(output).toEqual(expectedOutput);
  });
});

/* eslint-disable */
// @ts-ignore: this file was copy/pasted from this project: https://github.com/angular/angular/issues/46851#issuecomment-1925507830
import { xliff12ToJs } from 'xliff';

export async function xliffToJson(
  translations: any,
): Promise<Record<string, string>> {
  const parserResult = await xliff12ToJs(translations, {
    captureSpacesBetweenElements: true,
  });
  const xliffContent = parserResult.resources['ng2.template'];

  return Object.keys(xliffContent).reduce((result: any, current) => {
    const translation = xliffContent[current].target;
    if (typeof translation === 'string') {
      result[current] = translation;
    } else if (Array.isArray(translation)) {
      result[current] = translation
        .map((entry) =>
          typeof entry === 'string' ? entry : `{{${entry.Standalone.id}}}`,
        )
        .map((entry) => entry.replace('{{', '{$').replace('}}', '}'))
        .join('');
    } else {
      throw new Error('Could not parse XLIFF: ' + JSON.stringify(translation));
    }
    return result;
  }, {});
}

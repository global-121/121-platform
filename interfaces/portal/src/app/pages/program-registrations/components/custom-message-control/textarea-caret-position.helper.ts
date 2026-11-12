const MIRRORED_STYLE_PROPERTIES = [
  'boxSizing',
  'width',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'fontVariant',
  'letterSpacing',
  'lineHeight',
  'textTransform',
  'textIndent',
  'tabSize',
  'wordSpacing',
] as const;

export interface TextareaCaretPosition {
  left: number;
  top: number;
  lineHeight: number;
}

/**
 * Measures the caret position by rendering the text before the caret in an invisible copy of the textarea.
 * The returned coordinates are relative to the textarea's offset parent.
 */
export const getTextareaCaretPosition = ({
  textarea,
  caretPosition,
}: {
  textarea: HTMLTextAreaElement;
  caretPosition: number;
}): TextareaCaretPosition => {
  const computedStyle = getComputedStyle(textarea);

  const mirror = document.createElement('div');
  for (const property of MIRRORED_STYLE_PROPERTIES) {
    mirror.style[property] = computedStyle[property];
  }
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.overflowWrap = 'break-word';
  mirror.textContent = textarea.value.slice(0, caretPosition);

  const marker = document.createElement('span');
  marker.textContent = '\u200b';
  mirror.append(marker);

  document.body.append(mirror);
  const lineHeight =
    parseFloat(computedStyle.lineHeight) ||
    parseFloat(computedStyle.fontSize) * 1.2;
  const position = {
    left: textarea.offsetLeft + marker.offsetLeft - textarea.scrollLeft,
    top: textarea.offsetTop + marker.offsetTop - textarea.scrollTop,
    lineHeight,
  };
  mirror.remove();

  return position;
};

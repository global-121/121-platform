const MENTION_TRIGGER_CHARACTER = '@';

export interface ActiveMention {
  startIndex: number;
  query: string;
}

export const findActiveMention = ({
  text,
  caretPosition,
}: {
  text: string;
  caretPosition: number;
}): ActiveMention | undefined => {
  const textBeforeCaret = text.slice(0, caretPosition);
  const startIndex = textBeforeCaret.lastIndexOf(MENTION_TRIGGER_CHARACTER);

  if (startIndex === -1) {
    return;
  }

  const characterBeforeTrigger = textBeforeCaret.charAt(startIndex - 1);
  if (startIndex > 0 && !/\s/.test(characterBeforeTrigger)) {
    return;
  }

  const query = textBeforeCaret.slice(startIndex + 1);
  if (/\s/.test(query)) {
    return;
  }

  return { startIndex, query };
};

export const filterMentionItems = <T extends { label: string }>({
  items,
  query,
}: {
  items: T[];
  query: string;
}): T[] => {
  const normalizedQuery = query.toLowerCase();

  return items.filter(({ label }) =>
    label.toLowerCase().includes(normalizedQuery),
  );
};

export const formatPlaceholder = ({ name }: { name: string }): string => {
  return `{{${name}}} `;
};

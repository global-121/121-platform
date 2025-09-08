export function getRandomInt(min: number, max: number): number {
  if (min > max) {
    return NaN;
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRandomNumerics(length: number): string {
  const numericCharacters = '0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * numericCharacters.length);
    result += numericCharacters.charAt(randomIndex);
  }

  return result;
}

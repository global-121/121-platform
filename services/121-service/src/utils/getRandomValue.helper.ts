export function getRandomInt(min: number, max: number): number {
  if (min > max) {
    return NaN;
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRandomString(length: number): string {
  const alphanumericCharacters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(
      Math.random() * alphanumericCharacters.length,
    );
    result += alphanumericCharacters.charAt(randomIndex);
  }

  return result;
}

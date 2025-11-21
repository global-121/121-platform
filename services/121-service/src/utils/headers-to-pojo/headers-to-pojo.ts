// TODO: Instead of having this method we should use Headers in the http methods directly
export function headersToPojo(headers: Headers) {
  const headersArray: { name: string; value: string }[] = [];
  headers.forEach((value, key) => {
    key = key[0].toUpperCase() + key.slice(1); // Capitalize the first letter of the header name
    headersArray.push({ name: key, value });
  });
  return headersArray;
}

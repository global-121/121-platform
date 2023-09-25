export const assertArraysAreEqual = (
  actualArray: any[],
  expectedArray: any[],
  keyToIgnore: string[],
): void => {
  expect(actualArray.length).toBe(expectedArray.length);
  for (let i = 0; i < actualArray.length; i++) {
    for (const subKey in expectedArray[i]) {
      if (!keyToIgnore.includes(subKey)) {
        expect(actualArray[i][subKey]).toStrictEqual(expectedArray[i][subKey]);
      }
    }
  }
};

export const assertObjectsAreEqual = (
  actualObject: any,
  expectedObject: any,
  keyToIgnore: string[],
): void => {
  for (const subKey in expectedObject) {
    if (!keyToIgnore.includes(subKey)) {
      expect(actualObject[subKey]).toStrictEqual(expectedObject[subKey]);
    }
  }
};

import { Provider, Type } from '@angular/core';

// See: https://christianlydemann.com/all-you-need-to-know-about-mocking-in-angular-tests/
// See: https://gist.github.com/lydemann/f94c36147fc232851824e6421ce0a98f
export type Mock<T> = T & { [P in keyof T]: T[P] & jasmine.Spy };
export function createMagicalMock<T>(type: Type<T>): Mock<T> {
  const target: any = {};

  function installProtoMethods(proto: any) {
    if (proto === null || proto === Object.prototype) {
      return;
    }

    for (const key of Object.getOwnPropertyNames(proto)) {
      // tslint:disable-next-line: no-non-null-assertion
      const descriptor = Object.getOwnPropertyDescriptor(proto, key)!;

      if (typeof descriptor.value === 'function' && key !== 'constructor') {
        target[key] = jasmine.createSpy(key);
      }
    }

    installProtoMethods(Object.getPrototypeOf(proto));
  }

  installProtoMethods(type.prototype);

  return target;
}

export function provideMagicalMock<T>(type: Type<T>): Provider {
  return {
    provide: type,
    useFactory: () => createMagicalMock(type),
  };
}

export function getRandomInt(min: number, max: number): number {
  return (
    Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) +
    Math.ceil(min)
  );
}

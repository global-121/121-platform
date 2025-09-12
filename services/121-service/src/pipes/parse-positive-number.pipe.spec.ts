import { HttpException } from '@nestjs/common';

import { ParsePositiveNumberPipe } from '@121-service/src/pipes/parse-positive-number.pipe';

class CustomTestError extends HttpException {
  constructor() {
    super('This is a TestException', 418);
  }
}

describe('ParsePositiveNumberPipe', () => {
  let target: ParsePositiveNumberPipe;
  beforeEach(() => {
    target = new ParsePositiveNumberPipe({
      exceptionFactory: (error: any) => {
        console.log('🚀 ~ error:', error);
        return new CustomTestError();
      },
    });
  });
  describe('transform', () => {
    describe('when validation passes', () => {
      it('should return number', async () => {
        const num = 3;
        const result = await target.transform(num);
        expect(result).toBe(num);
      });

      it('should not fail if optional and value missing', async () => {
        const target = new ParsePositiveNumberPipe({
          optional: true,
        });

        const num = undefined;
        const result = await target.transform(num);
        expect(result).toBe(num);
      });

      // it('should return negative number', async () => {
      //   const num = '-3';
      //   expect(await target.transform(num)).to.equal(
      //     -3,
      //   );
      // });
      // it('should not throw an error if the value is undefined/null and optional is true', async () => {
      //   const target = new ParsePositiveNumberPipe({ optional: true });
      //   const value = await target.transform(
      //     undefined!,
      //     {} as ArgumentMetadata,
      //   );
      //   expect(value).to.equal(undefined);
      // });
    });
    // describe('when validation fails', () => {
    //   it('should throw an error', async () => {
    //     return expect(
    //       target.transform('123abc'),
    //     ).to.be.rejectedWith(CustomTestError);
    //   });
    //   it('should throw an error when number has wrong number encoding', async () => {
    //     return expect(
    //       target.transform('0xFF'),
    //     ).to.be.rejectedWith(CustomTestError);
    //   });
    // });
  });
});

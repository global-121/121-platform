import { IsNotBothPresent } from '@121-service/src/registration/validators/is-not-both-present.class.validator';
import { validate } from 'class-validator';

class TestClass {
  @IsNotBothPresent<TestClass>('testOtherProperty')
  testProperty?: string;

  testOtherProperty?: string;
}

describe('IsNotBothPresent', () => {
  it('should not allow both properties to be present', async () => {
    const obj = new TestClass();
    obj.testProperty = 'value1';
    obj.testOtherProperty = 'value2';

    const errors = await validate(obj);
    expect(errors).toHaveLength(1);
  });

  it('should allow only one property to be present', async () => {
    const obj = new TestClass();
    obj.testProperty = 'value1';

    const errors = await validate(obj);
    expect(errors).toHaveLength(0);
  });

  it('should allow no properties to be present', async () => {
    const obj = new TestClass();

    const errors = await validate(obj);
    expect(errors).toHaveLength(0);
  });
});

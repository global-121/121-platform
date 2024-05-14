import { validate } from 'class-validator';
import { IsNotBothEmpty } from './is-not-both-empty.class.validator';

class TestClass {
  @IsNotBothEmpty<TestClass>('testOtherProperty')
  testProperty?: string;

  testOtherProperty?: string;
}

describe('IsNotBothEmpty', () => {
  it('should allow both properties to be present', async () => {
    const obj = new TestClass();
    obj.testProperty = 'value1';
    obj.testOtherProperty = 'value2';

    const errors = await validate(obj);
    expect(errors).toHaveLength(0);
  });

  it('should allow only one property to be present', async () => {
    const obj = new TestClass();
    obj.testProperty = 'value1';

    const errors = await validate(obj);
    expect(errors).toHaveLength(0);
  });

  it('should not allow no properties to be present', async () => {
    const obj = new TestClass();

    const errors = await validate(obj);
    expect(errors).toHaveLength(1);
  });
});

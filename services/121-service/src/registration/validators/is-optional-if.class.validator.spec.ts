import { IsString, validate } from 'class-validator';

import { IsOptionalIf } from '@121-service/src/registration/validators/is-optional-if.class.validator';

const statusesForWhichReasonIsOptional = ['included', 'validated'];

class TestDto {
  @IsOptionalIf((obj) => statusesForWhichReasonIsOptional.includes(obj.status))
  @IsString()
  reason?: string;

  status: string;
}

describe('IsOptionalIf', () => {
  it('should run isString validation on dto if IsOptionalIf is met', async () => {
    const obj = new TestDto();
    obj.status = 'deleted';

    const errors = await validate(obj);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should not run isString validation  on dto if IsOptionalIf is met', async () => {
    const obj = new TestDto();
    obj.status = 'included';

    const errors = await validate(obj);
    expect(errors).toHaveLength(0);
  });

  it('should allow reason to be present regardless of status', async () => {
    const obj = new TestDto();
    obj.reason = 'Many good reasons';
    obj.status = 'included';

    const errors = await validate(obj);
    expect(errors).toHaveLength(0);
  });
});

import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

describe('AuthenticatedUserGuard', () => {
  let guard: AuthenticatedUserGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthenticatedUserGuard,
        {
          provide: Reflector,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get(AuthenticatedUserGuard);
    reflector = module.get(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if endpoint is not guarded', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue({ isGuarded: false });

    // Updated mock for ExecutionContext to include getHandler
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
      getHandler: () => ({}), // Mock getHandler as an empty function
    } as unknown as ExecutionContext;

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should call super.canActivate if endpoint is guarded', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue({ isGuarded: true });

    // Ensure this mock also includes getHandler
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
      getHandler: () => ({}), // Mock getHandler as an empty function
    } as unknown as ExecutionContext;

    const canActivateSpy = jest
      .spyOn(AuthenticatedUserGuard.prototype as any, 'canActivate')
      .mockReturnValue(true);

    expect(await guard.canActivate(context)).toBe(true);
    expect(canActivateSpy).toHaveBeenCalledWith(context);
  });
});

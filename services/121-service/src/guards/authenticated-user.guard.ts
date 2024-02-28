import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AuthenticatedUserGuard extends AuthGuard([
  'cookie-jwt',
  'azure-ad',
]) {}

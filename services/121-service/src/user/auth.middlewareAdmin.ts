import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { NestMiddleware, HttpStatus, Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { SECRET } from '../secrets';
import { DEBUG } from '../config';
import { UserService } from './user.service';

@Injectable()
export class AuthMiddlewareAdmin implements NestMiddleware {
  constructor(private readonly userService: UserService) { }

  public async use(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const authHeaders = req.headers.authorization;
    if (authHeaders && (authHeaders as string).split(' ')[1]) {
      const token = (authHeaders as string).split(' ')[1];
      const decoded: any = jwt.verify(token, SECRET);
      const user = await this.userService.findById(decoded.id);

      if (!user) {
        throw new HttpException('User not found.', HttpStatus.UNAUTHORIZED);
      }

      if (user.user.role == 'admin') {
        req.user = user.user;
        next();
      } else if (user.user.role == 'program-manager') {
        throw new HttpException(
          'Not authorized for Program-managers.',
          HttpStatus.UNAUTHORIZED,
        );
      } else if (user.user.role == 'aidworker') {
        throw new HttpException(
          'Not authorized for Aidworkers.',
          HttpStatus.UNAUTHORIZED,
        );
      } else {
        throw new HttpException(
          'User-role not known.',
          HttpStatus.UNAUTHORIZED,
        );
      }
    } else {
      if (DEBUG) {
        const user = await this.userService.findByEmail('admin@test.nl');
        req.user = user.user;
        next();
      } else {
        throw new HttpException('Not authorized.', HttpStatus.UNAUTHORIZED);
      }
    }
  }
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const user_service_1 = require("./user.service");
const dto_1 = require("./dto");
const http_exception_1 = require("@nestjs/common/exceptions/http.exception");
const user_decorator_1 = require("./user.decorator");
const validation_pipe_1 = require("../shared/pipes/validation.pipe");
const swagger_1 = require("@nestjs/swagger");
let UserController = class UserController {
    constructor(userService) {
        this.userService = userService;
    }
    create(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.userService.create(userData);
        });
    }
    login(loginUserDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const _user = yield this.userService.findOne(loginUserDto);
            const errors = { User: ' not found' };
            if (!_user)
                throw new http_exception_1.HttpException({ errors }, 401);
            const token = yield this.userService.generateJWT(_user);
            const { email, username } = _user;
            const user = { email, token, username };
            return { user };
        });
    }
    delete(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userService.delete(params.email);
        });
    }
    findMe(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userService.findByEmail(email);
        });
    }
};
__decorate([
    swagger_1.ApiOperation({ title: 'Sign-up new user' }),
    common_1.UsePipes(new validation_pipe_1.ValidationPipe()),
    common_1.Post('user'),
    __param(0, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "create", null);
__decorate([
    swagger_1.ApiOperation({ title: 'Log in existing user' }),
    common_1.UsePipes(new validation_pipe_1.ValidationPipe()),
    common_1.Post('user/login'),
    __param(0, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LoginUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "login", null);
__decorate([
    swagger_1.ApiOperation({ title: 'Delete user by email' }),
    common_1.Delete('user/:email'),
    swagger_1.ApiImplicitParam({ name: 'email', required: true, type: 'string' }),
    __param(0, common_1.Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "delete", null);
__decorate([
    swagger_1.ApiOperation({ title: 'Get current user' }),
    common_1.Get('user'),
    __param(0, user_decorator_1.User('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findMe", null);
UserController = __decorate([
    swagger_1.ApiBearerAuth(),
    swagger_1.ApiUseTags('user'),
    common_1.Controller(),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map
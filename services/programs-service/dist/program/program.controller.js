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
const program_service_1 = require("./program.service");
const dto_1 = require("./dto");
const user_decorator_1 = require("../user/user.decorator");
const swagger_1 = require("@nestjs/swagger");
let ProgramController = class ProgramController {
    constructor(programService) {
        this.programService = programService;
    }
    findAll(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.programService.findAll(query);
        });
    }
    create(userId, programData) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.programService.create(userId, programData);
        });
    }
    delete(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.programService.delete(params.slug);
        });
    }
};
__decorate([
    swagger_1.ApiOperation({ title: 'Get all programs' }),
    swagger_1.ApiResponse({ status: 200, description: 'Return all programs.' }),
    common_1.Get(),
    __param(0, common_1.Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProgramController.prototype, "findAll", null);
__decorate([
    swagger_1.ApiOperation({ title: 'Create program' }),
    swagger_1.ApiResponse({ status: 201, description: 'The program has been successfully created.' }),
    swagger_1.ApiResponse({ status: 403, description: 'Forbidden.' }),
    common_1.Post(),
    __param(0, user_decorator_1.User('id')), __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_1.CreateProgramDto]),
    __metadata("design:returntype", Promise)
], ProgramController.prototype, "create", null);
__decorate([
    swagger_1.ApiOperation({ title: 'Delete program' }),
    swagger_1.ApiResponse({ status: 201, description: 'The program has been successfully deleted.' }),
    swagger_1.ApiResponse({ status: 403, description: 'Forbidden.' }),
    swagger_1.ApiImplicitParam({ name: 'slug', required: true, type: 'string' }),
    common_1.Delete(':slug'),
    __param(0, common_1.Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProgramController.prototype, "delete", null);
ProgramController = __decorate([
    swagger_1.ApiBearerAuth(),
    swagger_1.ApiUseTags('programs'),
    common_1.Controller('programs'),
    __metadata("design:paramtypes", [program_service_1.ProgramService])
], ProgramController);
exports.ProgramController = ProgramController;
//# sourceMappingURL=program.controller.js.map
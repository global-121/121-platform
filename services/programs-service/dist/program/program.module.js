"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const program_controller_1 = require("./program.controller");
const typeorm_1 = require("@nestjs/typeorm");
const program_entity_1 = require("./program.entity");
const user_entity_1 = require("../user/user.entity");
const program_service_1 = require("./program.service");
const auth_middleware_1 = require("../user/auth.middleware");
const user_module_1 = require("../user/user.module");
let ProgramModule = class ProgramModule {
    configure(consumer) {
        consumer
            .apply(auth_middleware_1.AuthMiddleware)
            .forRoutes({ path: 'programs/feed', method: common_1.RequestMethod.GET }, { path: 'programs', method: common_1.RequestMethod.POST }, { path: 'programs/:slug', method: common_1.RequestMethod.DELETE }, { path: 'programs/:slug', method: common_1.RequestMethod.PUT });
    }
};
ProgramModule = __decorate([
    common_1.Module({
        imports: [typeorm_1.TypeOrmModule.forFeature([program_entity_1.ProgramEntity, user_entity_1.UserEntity]), user_module_1.UserModule],
        providers: [program_service_1.ProgramService],
        controllers: [
            program_controller_1.ProgramController
        ]
    })
], ProgramModule);
exports.ProgramModule = ProgramModule;
//# sourceMappingURL=program.module.js.map
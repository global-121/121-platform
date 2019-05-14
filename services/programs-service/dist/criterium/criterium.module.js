"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_module_1 = require("../user/user.module");
const criterium_service_1 = require("./criterium.service");
const criterium_entity_1 = require("./criterium.entity");
const criterium_controller_1 = require("./criterium.controller");
let CriteriumModule = class CriteriumModule {
    configure(consumer) {
    }
};
CriteriumModule = __decorate([
    common_1.Module({
        imports: [typeorm_1.TypeOrmModule.forFeature([criterium_entity_1.CriteriumEntity]), user_module_1.UserModule],
        providers: [criterium_service_1.CriteriumService],
        controllers: [
            criterium_controller_1.CriteriumController
        ],
        exports: []
    })
], CriteriumModule);
exports.CriteriumModule = CriteriumModule;
//# sourceMappingURL=criterium.module.js.map
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
const option_service_1 = require("./option.service");
const option_entity_1 = require("./option.entity");
const option_controller_1 = require("./option.controller");
let OptionModule = class OptionModule {
    configure(consumer) {
    }
};
OptionModule = __decorate([
    common_1.Module({
        imports: [typeorm_1.TypeOrmModule.forFeature([option_entity_1.OptionEntity]), user_module_1.UserModule],
        providers: [option_service_1.OptionService],
        controllers: [
            option_controller_1.OptionController
        ],
        exports: []
    })
], OptionModule);
exports.OptionModule = OptionModule;
//# sourceMappingURL=option.module.js.map
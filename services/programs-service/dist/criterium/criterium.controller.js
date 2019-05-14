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
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const criterium_service_1 = require("./criterium.service");
const swagger_1 = require("@nestjs/swagger");
let CriteriumController = class CriteriumController {
    constructor(criteriumService) {
        this.criteriumService = criteriumService;
    }
};
CriteriumController = __decorate([
    swagger_1.ApiBearerAuth(),
    swagger_1.ApiUseTags('criteriums'),
    common_1.Controller('criteriums'),
    __metadata("design:paramtypes", [criterium_service_1.CriteriumService])
], CriteriumController);
exports.CriteriumController = CriteriumController;
//# sourceMappingURL=criterium.controller.js.map
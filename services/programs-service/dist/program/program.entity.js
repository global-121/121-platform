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
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
let ProgramEntity = class ProgramEntity {
    updateTimestamp() {
        this.updated = new Date;
    }
};
__decorate([
    typeorm_1.PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], ProgramEntity.prototype, "id", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], ProgramEntity.prototype, "slug", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], ProgramEntity.prototype, "title", void 0);
__decorate([
    typeorm_1.Column({ default: '' }),
    __metadata("design:type", String)
], ProgramEntity.prototype, "description", void 0);
__decorate([
    typeorm_1.Column({ default: '' }),
    __metadata("design:type", String)
], ProgramEntity.prototype, "country", void 0);
__decorate([
    typeorm_1.Column({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], ProgramEntity.prototype, "created", void 0);
__decorate([
    typeorm_1.Column({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], ProgramEntity.prototype, "updated", void 0);
__decorate([
    typeorm_1.BeforeUpdate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProgramEntity.prototype, "updateTimestamp", null);
__decorate([
    typeorm_1.ManyToOne(type => user_entity_1.UserEntity, user => user.programs),
    __metadata("design:type", user_entity_1.UserEntity)
], ProgramEntity.prototype, "author", void 0);
ProgramEntity = __decorate([
    typeorm_1.Entity('program')
], ProgramEntity);
exports.ProgramEntity = ProgramEntity;
//# sourceMappingURL=program.entity.js.map
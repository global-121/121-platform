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
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const program_entity_1 = require("./program.entity");
const user_entity_1 = require("../user/user.entity");
const slug = require('slug');
let ProgramService = class ProgramService {
    constructor(programRepository, userRepository) {
        this.programRepository = programRepository;
        this.userRepository = userRepository;
    }
    findAll(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const qb = yield typeorm_2.getRepository(program_entity_1.ProgramEntity)
                .createQueryBuilder('program')
                .leftJoinAndSelect('program.author', 'author');
            qb.where("1 = 1");
            if ('tag' in query) {
                qb.andWhere("program.tagList LIKE :tag", { tag: `%${query.tag}%` });
            }
            if ('author' in query) {
                const author = yield this.userRepository.findOne({ username: query.author });
                qb.andWhere("program.authorId = :id", { id: author.id });
            }
            qb.orderBy('program.created', 'DESC');
            const programsCount = yield qb.getCount();
            if ('limit' in query) {
                qb.limit(query.limit);
            }
            if ('offset' in query) {
                qb.offset(query.offset);
            }
            const programs = yield qb.getMany();
            return { programs, programsCount };
        });
    }
    findOne(where) {
        return __awaiter(this, void 0, void 0, function* () {
            const program = yield this.programRepository.findOne(where);
            return { program };
        });
    }
    create(userId, programData) {
        return __awaiter(this, void 0, void 0, function* () {
            let program = new program_entity_1.ProgramEntity();
            program.title = programData.title;
            program.description = programData.description;
            program.slug = this.slugify(programData.title);
            const newProgram = yield this.programRepository.save(program);
            const author = yield this.userRepository.findOne(userId);
            if (Array.isArray(author.programs)) {
                author.programs.push(program);
            }
            else {
                author.programs = [program];
            }
            yield this.userRepository.save(author);
            return newProgram;
        });
    }
    update(slug, programData) {
        return __awaiter(this, void 0, void 0, function* () {
            let toUpdate = yield this.programRepository.findOne({ slug: slug });
            let updated = Object.assign(toUpdate, programData);
            const program = yield this.programRepository.save(updated);
            return { program };
        });
    }
    delete(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.programRepository.delete({ slug: slug });
        });
    }
    slugify(title) {
        return slug(title, { lower: true }) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36);
    }
};
ProgramService = __decorate([
    common_1.Injectable(),
    __param(0, typeorm_1.InjectRepository(program_entity_1.ProgramEntity)),
    __param(1, typeorm_1.InjectRepository(user_entity_1.UserEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProgramService);
exports.ProgramService = ProgramService;
//# sourceMappingURL=program.service.js.map
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
exports.GetEventsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class GetEventsDto {
    fromBlock;
    toBlock;
}
exports.GetEventsDto = GetEventsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Starting block number to fetch events from',
        example: 1234567,
    }),
    __metadata("design:type", Number)
], GetEventsDto.prototype, "fromBlock", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Ending block number to fetch events to',
        example: 1234600,
    }),
    __metadata("design:type", Number)
], GetEventsDto.prototype, "toBlock", void 0);
//# sourceMappingURL=events.dto.js.map
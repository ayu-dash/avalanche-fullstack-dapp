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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainService = void 0;
const common_1 = require("@nestjs/common");
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const StorageContract_json_1 = __importDefault(require("./StorageContract.json"));
let BlockchainService = class BlockchainService {
    client;
    contractAddress;
    constructor() {
        this.client = (0, viem_1.createPublicClient)({
            chain: chains_1.avalancheFuji,
            transport: (0, viem_1.http)('https://api.avax-test.network/ext/bc/C/rpc', {
                timeout: 10_000,
            }),
        });
        this.contractAddress =
            '0x72E67fb22d43C866576D4ada018585D625c2B33f';
    }
    async getLatestValue() {
        try {
            const value = await this.client.readContract({
                address: this.contractAddress,
                abi: StorageContract_json_1.default.abi,
                functionName: 'getValue',
            });
            return {
                value: value.toString(),
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.handleRpcError(error);
        }
    }
    async getValueUpdatedEvents(fromBlock, toBlock) {
        if (!Number.isInteger(fromBlock) || !Number.isInteger(toBlock)) {
            throw new common_1.BadRequestException('fromBlock dan toBlock harus berupa angka bulat.');
        }
        if (fromBlock < 0 || toBlock < 0) {
            throw new common_1.BadRequestException('fromBlock dan toBlock harus bernilai positif.');
        }
        if (fromBlock > toBlock) {
            throw new common_1.BadRequestException(`fromBlock (${fromBlock}) tidak boleh lebih besar dari toBlock (${toBlock}).`);
        }
        const MAX_BLOCK_RANGE = 100000;
        if (toBlock - fromBlock > MAX_BLOCK_RANGE) {
            throw new common_1.BadRequestException(`Rentang blok tidak boleh lebih dari ${MAX_BLOCK_RANGE}. Anda meminta ${toBlock - fromBlock} blok.`);
        }
        try {
            const events = await this.client.getLogs({
                address: this.contractAddress,
                event: {
                    type: 'event',
                    name: 'ValueUpdated',
                    inputs: [{ name: 'newValue', type: 'uint256', indexed: false }],
                },
                fromBlock: BigInt(fromBlock),
                toBlock: BigInt(toBlock),
            });
            const mappedEvents = events.map((event) => ({
                blockNumber: event.blockNumber?.toString() || '0',
                value: event.args.newValue.toString(),
                txHash: event.transactionHash || '',
            }));
            return {
                data: mappedEvents,
                total: mappedEvents.length,
                fromBlock,
                toBlock,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.handleRpcError(error);
        }
    }
    handleRpcError(error) {
        const message = error?.message?.toLowerCase() || '';
        const details = error?.details?.toLowerCase() || '';
        if (details.includes('invalid block range') ||
            message.includes('invalid block range')) {
            throw new common_1.InternalServerErrorException('Range blok tidak valid. Pastikan fromBlock <= toBlock dan berada dalam range yang masuk akal.');
        }
        if (message.includes('timeout')) {
            throw new common_1.ServiceUnavailableException('RPC timeout. Silakan coba beberapa saat lagi atau kurangi rentang blok.');
        }
        if (message.includes('network') ||
            message.includes('fetch') ||
            message.includes('failed') ||
            message.includes('econnrefused') ||
            message.includes('enotfound')) {
            throw new common_1.ServiceUnavailableException('Tidak dapat terhubung ke blockchain RPC. Silakan coba lagi dalam beberapa saat.');
        }
        if (message.includes('invalid address') ||
            details.includes('invalid address')) {
            throw new common_1.InternalServerErrorException('Alamat kontrak tidak valid. Periksa konfigurasi address.');
        }
        if (message.includes('missing') || message.includes('invalid parameters')) {
            throw new common_1.InternalServerErrorException('Parameter yang diberikan tidak valid. Periksa kembali input Anda.');
        }
        console.error('[Blockchain RPC Error]', {
            message: error?.message,
            details: error?.details,
            code: error?.code,
            timestamp: new Date().toISOString(),
        });
        throw new common_1.InternalServerErrorException('Terjadi kesalahan saat membaca data blockchain. Silakan coba lagi.');
    }
};
exports.BlockchainService = BlockchainService;
__decorate([
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], BlockchainService.prototype, "getValueUpdatedEvents", null);
exports.BlockchainService = BlockchainService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], BlockchainService);
//# sourceMappingURL=blockchain.service.js.map
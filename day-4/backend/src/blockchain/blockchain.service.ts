import {
  Body,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { createPublicClient, http } from 'viem';
import { avalancheFuji } from 'viem/chains';
import StorageContract from './StorageContract.json';
import {
  ValueResponse,
  EventItemResponse,
  PaginatedEventsResponse,
} from './dto/responses.dto';

@Injectable()
export class BlockchainService {
  private client;
  private contractAddress: `0x${string}`;

  constructor() {
    this.client = createPublicClient({
      chain: avalancheFuji,
      transport: http('https://api.avax-test.network/ext/bc/C/rpc', {
        timeout: 10_000, // 10 detik timeout
      }),
    });

    // GANTI dengan address hasil deploy dari Day 2
    this.contractAddress =
      '0x72E67fb22d43C866576D4ada018585D625c2B33f' as `0x${string}`;
  }

  // 🔹 Read latest value
  async getLatestValue(): Promise<ValueResponse> {
    try {
      const value = await this.client.readContract({
        address: this.contractAddress,
        abi: StorageContract.abi,
        functionName: 'getValue',
      });

      return {
        value: value.toString(),
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.handleRpcError(error);
    }
  }

  // 🔹 Read events with validation
  async getValueUpdatedEvents(
    @Body() fromBlock: number,
    toBlock: number,
  ): Promise<PaginatedEventsResponse> {
    // Validate input parameters
    if (!Number.isInteger(fromBlock) || !Number.isInteger(toBlock)) {
      throw new BadRequestException(
        'fromBlock dan toBlock harus berupa angka bulat.',
      );
    }

    if (fromBlock < 0 || toBlock < 0) {
      throw new BadRequestException(
        'fromBlock dan toBlock harus bernilai positif.',
      );
    }

    if (fromBlock > toBlock) {
      throw new BadRequestException(
        `fromBlock (${fromBlock}) tidak boleh lebih besar dari toBlock (${toBlock}).`,
      );
    }

    // Maximum block range validation (e.g., 100,000 blocks at a time)
    const MAX_BLOCK_RANGE = 100000;
    if (toBlock - fromBlock > MAX_BLOCK_RANGE) {
      throw new BadRequestException(
        `Rentang blok tidak boleh lebih dari ${MAX_BLOCK_RANGE}. Anda meminta ${toBlock - fromBlock} blok.`,
      );
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

      const mappedEvents: EventItemResponse[] = events.map((event) => ({
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
    } catch (error: any) {
      this.handleRpcError(error);
    }
  }

  // 🔹 Centralized RPC Error Handler
  private handleRpcError(error: any): never {
    const message = error?.message?.toLowerCase() || '';
    const details = error?.details?.toLowerCase() || '';

    // Handle invalid block range
    if (
      details.includes('invalid block range') ||
      message.includes('invalid block range')
    ) {
      throw new InternalServerErrorException(
        'Range blok tidak valid. Pastikan fromBlock <= toBlock dan berada dalam range yang masuk akal.',
      );
    }

    // Handle timeout
    if (message.includes('timeout')) {
      throw new ServiceUnavailableException(
        'RPC timeout. Silakan coba beberapa saat lagi atau kurangi rentang blok.',
      );
    }

    // Handle network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('failed') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    ) {
      throw new ServiceUnavailableException(
        'Tidak dapat terhubung ke blockchain RPC. Silakan coba lagi dalam beberapa saat.',
      );
    }

    // Handle invalid address
    if (
      message.includes('invalid address') ||
      details.includes('invalid address')
    ) {
      throw new InternalServerErrorException(
        'Alamat kontrak tidak valid. Periksa konfigurasi address.',
      );
    }

    // Handle missing or invalid parameters
    if (message.includes('missing') || message.includes('invalid parameters')) {
      throw new InternalServerErrorException(
        'Parameter yang diberikan tidak valid. Periksa kembali input Anda.',
      );
    }

    console.error('[Blockchain RPC Error]', {
      message: error?.message,
      details: error?.details,
      code: error?.code,
      timestamp: new Date().toISOString(),
    });

    throw new InternalServerErrorException(
      'Terjadi kesalahan saat membaca data blockchain. Silakan coba lagi.',
    );
  }
}

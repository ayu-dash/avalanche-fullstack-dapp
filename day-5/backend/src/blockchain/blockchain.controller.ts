import { Body, Controller, Get, Post } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { GetEventsDto } from './dto/events.dto';

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) { }

  // GET /blockchain/value
  @Get('value')
  async getValue() {
    return this.blockchainService.getLatestValue();
  }

  // GET /blockchain/events - Get recent events (last 10000 blocks)
  @Get('events')
  async getRecentEvents() {
    return this.blockchainService.getRecentEvents();
  }

  // POST /blockchain/events - Get events with custom block range
  @Post('events')
  async getEvents(@Body() body: GetEventsDto) {
    return this.blockchainService.getValueUpdatedEvents(
      body.fromBlock,
      body.toBlock,
    );
  }
}


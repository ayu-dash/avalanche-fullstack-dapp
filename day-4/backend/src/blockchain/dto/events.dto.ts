import { ApiProperty } from '@nestjs/swagger';

export class GetEventsDto {
  @ApiProperty({
    description: 'Starting block number to fetch events from',
    example: 1234567,
  })
  fromBlock: number;

  @ApiProperty({
    description: 'Ending block number to fetch events to',
    example: 1234600,
  })
  toBlock: number;
}

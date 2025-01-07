import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MapsService } from './maps.service';

@Module({
  imports: [HttpModule], 
  providers: [MapsService],
  exports: [MapsService],
})
export class MapsModule {}

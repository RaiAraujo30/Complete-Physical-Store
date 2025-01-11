import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MapsService } from './maps.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule], 
  providers: [MapsService],
  exports: [MapsService],
})
export class MapsModule {}

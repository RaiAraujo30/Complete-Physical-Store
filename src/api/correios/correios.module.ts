import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CorreiosService } from './correios.service';

@Module({
  imports: [HttpModule],
  providers: [CorreiosService],
  exports: [CorreiosService],
})
export class CorreiosModule {}

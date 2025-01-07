import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { Store, StoreSchema } from './entities/store.entity';

import { MongooseModule } from '@nestjs/mongoose';
import { CorreiosModule } from 'src/api/correios/correios.module';
import { MapsModule } from 'src/api/maps/maps.module';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Store.name, schema: StoreSchema }]),
    MapsModule,
    CorreiosModule],
  controllers: [StoreController],
  providers: [StoreService],
})
export class StoreModule {}

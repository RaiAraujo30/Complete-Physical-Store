import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { Store, StoreSchema } from './entities/store.entity';

import { MongooseModule } from '@nestjs/mongoose';
import { CorreiosModule } from '../api/correios/correios.module';
import { MapsModule } from '../api/maps/maps.module';
import { DeliveryCriteriaModule } from '../delivery/delivery-criteria.module';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Store.name, schema: StoreSchema }]),
    MapsModule,
    CorreiosModule,
    DeliveryCriteriaModule
  ],
  controllers: [StoreController],
  providers: [StoreService],
})
export class StoreModule {}

import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { Store, StoreSchema } from './entities/store.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { CorreiosModule } from '../api/correios/correios.module';
import { MapsModule } from '../api/maps/maps.module';
import { DeliveryCriteriaModule } from '../delivery/delivery-criteria.module';
import { ShippingService } from './services/shipping.service';
import { StoreService } from './services/store.service';
import { DistanceService } from './services/distance.service';
import { ValidationService } from './services/validation.service';
import { LoggerService } from 'src/config/Logger';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Store.name, schema: StoreSchema }]),
    MapsModule,
    CorreiosModule,
    DeliveryCriteriaModule
  ],
  controllers: [StoreController],
  providers: [StoreService, ShippingService, DistanceService, ValidationService, LoggerService],
  exports: [StoreService, DistanceService, ShippingService, ValidationService],
})
export class StoreModule {}

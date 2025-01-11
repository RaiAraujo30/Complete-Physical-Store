import { Test, TestingModule } from '@nestjs/testing';
import { StoreService } from './services/store.service';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Store, StoreSchema } from './entities/store.entity';
import {
  DeliveryCriteria,
  DeliveryCriteriaSchema,
} from '../delivery/entities/DeliveryCriteria.entity';
import { ConfigModule } from '@nestjs/config';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { StoreType } from './enum/StoreType.enum';
import { CorreiosModule } from '../api/correios/correios.module';
import { MapsModule } from '../api/maps/maps.module';
import { MapsService } from '../api/maps/maps.service';
import { CorreiosService } from '../api/correios/correios.service';
import { DeliveryCriteriaService } from '../delivery/delivery-criteria.service';
import { HttpModule } from '@nestjs/axios';
import { ShippingService } from './services/shipping.service';
import { DistanceService } from './services/distance.service';
import { PinService } from './services/Pin.service';
import { ValidationService } from './services/validation.service';

describe('StoreService Tests', () => {
  let service: StoreService;
  let mongoServer: MongoMemoryServer;
  let storeModel: mongoose.Model<Store>;
  let deliveryCriteriaModel: mongoose.Model<DeliveryCriteria>;
  const limit = 10;
  const offset = 0;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      instance: { storageEngine: 'wiredTiger' },
    });
    const uri = mongoServer.getUri();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        HttpModule,
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: Store.name, schema: StoreSchema },
          { name: DeliveryCriteria.name, schema: DeliveryCriteriaSchema },
        ]),
        CorreiosModule,
        MapsModule,
      ],
      providers: [
        StoreService,
        ShippingService,
        DistanceService,
        PinService,
        ValidationService,
        MapsService,
        CorreiosService,
        DeliveryCriteriaService,
      ],
    }).compile();

    service = module.get<StoreService>(StoreService);
    storeModel = module.get<mongoose.Model<Store>>(getModelToken(Store.name));
    deliveryCriteriaModel = module.get<mongoose.Model<DeliveryCriteria>>(
      getModelToken(DeliveryCriteria.name),
    );

    // Seed Delivery Criteria
    await deliveryCriteriaModel.deleteMany({});
    await deliveryCriteriaModel.insertMany([
      {
        maxDistance: 10,
        deliveryMethod: 'Motoboy',
        deliveryTime: '1 dia útil',
        price: 15,
      },
      {
        maxDistance: 30,
        deliveryMethod: 'Carro',
        deliveryTime: '2 dias úteis',
        price: 25,
      },
      {
        maxDistance: 50,
        deliveryMethod: 'Van',
        deliveryTime: '3 dias úteis',
        price: 35,
      },
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  beforeEach(async () => {
    await storeModel.deleteMany({});
    await storeModel.insertMany([
      {
        storeID: '101',
        storeName: 'Loja A',
        address1: 'Rua Próxima, 123',
        city: 'Cidade X',
        state: 'SP',
        postalCode: '01010-000',
        type: StoreType.PDV,
        latitude: '-23.5505', // Central de SP
        longitude: '-46.6333',
        shippingTimeInDays: 1,
        emailAddress: 'example@gmail.com',
        telephoneNumber: '11999999999',
        country: 'Brasil',
        district: 'Centro',
        takeOutInStore: true,
      },
      {
        storeID: '102',
        storeName: 'Loja B',
        address1: 'Rua Longe, 456',
        city: 'Cidade Y',
        state: 'SP',
        postalCode: '02030-000',
        type: StoreType.LOJA,
        latitude: '-23.6000', // Mais distante
        longitude: '-46.7000',
        shippingTimeInDays: 2,
        emailAddress: 'example@gmail.com',
        telephoneNumber: '11999999999',
        country: 'Brasil',
        district: 'Zona Sul',
        takeOutInStore: true,
      },
      {
        storeID: '103',
        storeName: 'Loja C',
        address1: 'Rua Muito Longe, 789',
        city: 'Cidade Z',
        state: 'SP',
        postalCode: '99999-999', // Simulando distância > 50km
        type: StoreType.LOJA,
        latitude: '-23.7000', // Bem mais distante
        longitude: '-46.9000',
        shippingTimeInDays: 5,
        emailAddress: 'example@gmail.com',
        telephoneNumber: '11999999999',
        country: 'Brasil',
        district: 'Zona Norte',
        takeOutInStore: true,
      },
    ]);
  });

  afterEach(async () => {
    await storeModel.deleteMany({});
  });

  describe('Delivery Logic Tests', () => {
    it('should return correct delivery method for short distances', async () => {
      const deliveryInfo = await service.getStoreWithShipping(
        '01010-000',
        limit,
        offset,
      );
      expect(deliveryInfo.stores[0].value[0]).toEqual({
        prazo: '1 dia útil',
        price: 'R$ 15.00',
        description: 'Motoboy',
      });
    });

    it('should return correct delivery method for long distances', async () => {
      const deliveryInfo = await service.getStoreWithShipping(
        '55636-000',
        limit,
        offset,
      );
      expect(deliveryInfo.stores[0].value[0]).toEqual({
        prazo: '9 dias úteis',
        price: 'R$ 89,50',
        description: 'Sedex a encomenda expressa dos Correios',
      });
    });

    it('should return delivery method as Correios for stores above 50 km', async () => {
      const deliveryInfo = await service.getStoreWithShipping(
        '99999-999',
        limit,
        offset,
      );
      expect(deliveryInfo.stores[0].value[0]).toEqual({
        prazo: '6 dias úteis',
        price: 'R$ 22,00',
        description: 'Sedex a encomenda expressa dos Correios',
      });
    });

    it('should return delivery method as PDV for stores below 50 km', async () => {
      const deliveryInfo = await service.getStoreWithShipping(
        '02030-000',
        limit,
        offset,
      );
      expect(deliveryInfo.stores[0].value[0]).toEqual({
        prazo: '1 dia útil',
        price: 'R$ 15.00',
        description: 'Motoboy',
      });
    });

    it('should return delivery method as PDV for PDVs below 50 km', async () => {
      const deliveryInfo = await service.getStoreWithShipping(
        '01010-000',
        limit,
        offset,
      );
      expect(deliveryInfo.stores[0].value[0]).toEqual({
        prazo: '1 dia útil',
        price: 'R$ 15.00',
        description: 'Motoboy',
      });
    });

    it('should not list PDVs for distances above 50 km', async () => {
        const deliveryInfo = await service.getStoreWithShipping('99999-999', limit, offset);
      
        // Garantir que nenhum PDV esteja listado
        const hasPDV = deliveryInfo.stores.some(store => store.type === StoreType.PDV);
      
        // Verifica que nenhuma loja é do tipo PDV
        expect(hasPDV).toBe(false);
      });
      
  });
});

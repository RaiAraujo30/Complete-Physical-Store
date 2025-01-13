import { Test, TestingModule } from '@nestjs/testing';
import { StoreController } from './store.controller';
import { StoreService } from './services/store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreType } from './enum/StoreType.enum';
import { MongooseModule } from '@nestjs/mongoose';
import { Store, StoreSchema } from './entities/store.entity';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { DistanceService } from './services/distance.service';
import { LoggerService } from '../config/Logger';
import { MapsService } from '../api/maps/maps.service';
import { CorreiosService } from '../api/correios/correios.service';
import { ShippingService } from './services/shipping.service';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { DeliveryCriteriaService } from '../delivery/delivery-criteria.service';
import { DeliveryCriteriaModule } from '../delivery/delivery-criteria.module';
import {
  DeliveryCriteria,
  DeliveryCriteriaSchema,
} from '../delivery/entities/DeliveryCriteria.entity';

describe('Tests for the CRUD operations', () => {
  let controller: StoreController;
  let service: StoreService;
  let mongod: MongoMemoryServer;
  let connection: Connection;
  let storeModel: Model<Store>;
  let deliveryCriteriaModel: Model<DeliveryCriteria>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: Store.name, schema: StoreSchema },
          { name: DeliveryCriteria.name, schema: DeliveryCriteriaSchema },
        ]),
        HttpModule,
        DeliveryCriteriaModule,
      ],
      controllers: [StoreController],
      providers: [
        StoreService,
        DistanceService,
        LoggerService,
        MapsService,
        CorreiosService,
        ShippingService,
        ConfigService,
        DeliveryCriteriaService,
      ],
    }).compile();

    controller = module.get<StoreController>(StoreController);
    service = module.get<StoreService>(StoreService);
    connection = module.get<Connection>(getConnectionToken());
    storeModel = module.get<Model<Store>>(getModelToken(Store.name));
    deliveryCriteriaModel = module.get<Model<DeliveryCriteria>>(
      getModelToken(DeliveryCriteria.name),
    );
  });

  afterEach(async () => {
    await storeModel.deleteMany(); // Limpa a coleção após cada teste
    await deliveryCriteriaModel.deleteMany();
  });

  afterAll(async () => {
    await connection.close();
    await mongod.stop();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return a list of stores with pagination', async () => {
      await storeModel.insertMany([
        {
          storeName: 'Loja C',
          address1: 'Rua Muito Longe, 789',
          city: 'Cidade Z',
          state: 'SP',
          postalCode: '99999-999', 
          type: StoreType.LOJA,
          latitude: '-23.7000', 
          longitude: '-46.9000',
          shippingTimeInDays: 5,
          emailAddress: 'example@gmail.com',
          telephoneNumber: '11999999999',
          country: 'Brasil',
          district: 'Zona Norte',
          takeOutInStore: true,
        },
        {
          storeName: 'Loja B',
          address1: 'Rua Longe, 456',
          city: 'Cidade Y',
          state: 'SP',
          postalCode: '02030-000',
          type: StoreType.LOJA,
          latitude: '-23.6000', 
          longitude: '-46.7000',
          shippingTimeInDays: 2,
          emailAddress: 'example@gmail.com',
          telephoneNumber: '11999999999',
          country: 'Brasil',
          district: 'Zona Sul',
          takeOutInStore: true,
        },
      ]);

      const result = await controller.findAll(10, 0);

      expect(result.stores.length).toBe(2);
      expect(result.stores[0].storeName).toBe('Loja C');
      expect(result.stores[1].storeName).toBe('Loja B');
    });
  });

  describe('findById', () => {
    it('should return a store by ID', async () => {
      const storeA = await storeModel.create({
        storeName: 'Loja C',
        address1: 'Rua Muito Longe, 789',
        city: 'Cidade Z',
        state: 'SP',
        postalCode: '99999-999', 
        type: StoreType.LOJA,
        latitude: '-23.7000', 
        longitude: '-46.9000',
        shippingTimeInDays: 5,
        emailAddress: 'example@gmail.com',
        telephoneNumber: '11999999999',
        country: 'Brasil',
        district: 'Zona Norte',
        takeOutInStore: true,
      });

      const resultA = await controller.findById(storeA._id.toString());

      expect(resultA.stores[0].storeName).toBe('Loja C');
    });
  });

  describe('update', () => {
    it('should update an existing store', async () => {
      const store = await storeModel.create({
        storeName: 'Loja C',
        address1: 'Rua Muito Longe, 789',
        city: 'Cidade Z',
        state: 'SP',
        postalCode: '99999-999', 
        type: StoreType.LOJA,
        latitude: '-23.7000', 
        longitude: '-46.9000',
        shippingTimeInDays: 5,
        emailAddress: 'example@gmail.com',
        telephoneNumber: '11999999999',
        country: 'Brasil',
        district: 'Zona Norte',
        takeOutInStore: true,
      });
      const dto: UpdateStoreDto = { storeName: 'Updated Store' };

      const result = await controller.update(store._id.toString(), dto);

      expect(result).toEqual(
        expect.objectContaining({ storeName: 'Updated Store' }),
      );
      const updatedStore = await storeModel.findById(store._id);
      expect(updatedStore?.storeName).toBe('Updated Store');
    });
  });

  describe('delete', () => {
    it('should delete a store by ID', async () => {
      const store = await storeModel.create({
        storeName: 'Loja C',
        address1: 'Rua Muito Longe, 789',
        city: 'Cidade Z',
        state: 'SP',
        postalCode: '99999-999', 
        type: StoreType.LOJA,
        latitude: '-23.7000', 
        longitude: '-46.9000',
        shippingTimeInDays: 5,
        emailAddress: 'example@gmail.com',
        telephoneNumber: '11999999999',
        country: 'Brasil',
        district: 'Zona Norte',
        takeOutInStore: true,
      });

      const result = await controller.delete(store._id.toString());

      expect(result).toEqual(expect.objectContaining({ id: store.id }));
      const deletedStore = await storeModel.findById(store._id);
      expect(deletedStore).toBeNull();
    });
  });

  describe('findByState', () => {
    it('should return stores by state with pagination', async () => {
      await storeModel.insertMany([
        {
          storeName: 'Loja C',
          address1: 'Rua Muito Longe, 789',
          city: 'Cidade Z',
          state: 'SP',
          postalCode: '99999-999',
          type: StoreType.LOJA,
          latitude: '-23.7000', 
          longitude: '-46.9000',
          shippingTimeInDays: 5,
          emailAddress: 'example@gmail.com',
          telephoneNumber: '11999999999',
          country: 'Brasil',
          district: 'Zona Norte',
          takeOutInStore: true,
        },
      ]);

      const result = await controller.findByState('SP', 10, 0);

      expect(result.stores.length).toBe(1);
      expect(result.stores[0].storeName).toBe('Loja C');
    });
  });
});

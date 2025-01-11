import { Test, TestingModule } from '@nestjs/testing';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreType } from './enum/StoreType.enum';
import { UpdateStoreDto } from './dto/update-store.dto';

describe('Tests for the CRUD operations', () => {
  let controller: StoreController;
  let service: StoreService;
  let limit = 10;
  let offset = 0;

  const mockStoreService = {
    create: jest.fn(),
    listAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByState: jest.fn(),
    getStoreWithShipping: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoreController],
      providers: [
        {
          provide: StoreService,
          useValue: mockStoreService,
        },
      ],
    }).compile();

    controller = module.get<StoreController>(StoreController);
    service = module.get<StoreService>(StoreService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });


  describe('create', () => {
    it('should create a new store', async () => {
      const dto: CreateStoreDto = {
        storeName: 'Store Chã Grande',
        takeOutInStore: true,
        shippingTimeInDays: 2,
        address1: 'Rua Tiago Barbosa Soares',
        district: 'Augusto David',
        state: 'pe',
        city: 'Chã Grande',
        type: StoreType.PDV,
        country: 'Brazil',
        postalCode: '55636000',
        telephoneNumber: '+55 11 98765-4321',
        emailAddress: 'store@example.com',
      };

      mockStoreService.create.mockResolvedValue({ id: '1', ...dto });

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: '1', ...dto });
    });
  });

  describe('findAll', () => {
    it('should return a list of stores with pagination', async () => {
      const stores = [
        { id: '1', storeName: 'Store A' },
        { id: '2', storeName: 'Store B' },
      ];

      mockStoreService.listAll.mockResolvedValue(stores);

      const result = await controller.findAll(limit, offset);

      expect(service.listAll).toHaveBeenCalledWith(limit, offset);
      expect(result).toEqual(stores);
    });
  });

  describe('findById', () => {
    it('should return a store by ID', async () => {
      const store = { id: '1', storeName: 'Store A' };
      const limit = 1;
      const offset = 0;
  
      mockStoreService.findOne.mockResolvedValue({
        stores: [store],
        limit,
        offset,
        total: 1,
      });
  
      const result = await controller.findById('1');
      expect(service.findOne).toHaveBeenCalledWith('1', limit, offset);
      expect(result).toEqual({ stores: [store], limit, offset, total: 1 });
    });
  });
  
  

  describe('update', () => {
    it('should update an existing store', async () => {
      const dto: UpdateStoreDto = { storeName: 'Updated Store' };
      const updatedStore = { id: '1', ...dto };

      mockStoreService.update.mockResolvedValue(updatedStore);

      const result = await controller.update('1', dto);

      expect(service.update).toHaveBeenCalledWith('1', dto);
      expect(result).toEqual(updatedStore);
    });
  });

  describe('delete', () => {
    it('should delete a store by ID', async () => {
      mockStoreService.remove.mockResolvedValue({ id: '1' });

      const result = await controller.delete('1');

      expect(service.remove).toHaveBeenCalledWith('1');
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('findByState', () => {
    it('should return stores by state with pagination', async () => {
      const stores = [{ id: '1', storeName: 'Store A', state: 'SP' }];

      mockStoreService.findByState.mockResolvedValue(stores);

      const result = await controller.findByState('SP', limit, offset); // Passando limit e offset

      expect(service.findByState).toHaveBeenCalledWith('SP', limit, offset);
      expect(result).toEqual(stores);
    });
  });
});

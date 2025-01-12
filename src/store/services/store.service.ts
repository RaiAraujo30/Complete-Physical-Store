import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateStoreDto } from '../dto/create-store.dto';
import { Store } from '../entities/store.entity';
import { AppError } from '../../common/exceptions/AppError';
import { paginate } from '../../common/utils/Pagination';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { ShippingStore } from '../types/ShippingStore.interface';
import { StorePin } from '../types/StorePin.interface';
import { MapsService } from '../../api/maps/maps.service';
import { ShippingService } from './shipping.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DistanceService } from './distance.service';
import { ValidationService } from './validation.service';
import { createPin } from '../../common/utils/pin-utils';
import { LoggerService } from '../../config/Logger';

@Injectable()
export class StoreService {
  constructor(
    private readonly mapsService: MapsService,
    private readonly shippingService: ShippingService,
    private readonly distanceService: DistanceService,
    private readonly validationService: ValidationService,
    @InjectModel(Store.name) private readonly storeModel: Model<Store>,
    private readonly logger: LoggerService
  ) {}
  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    const address = `${createStoreDto.address1}, ${createStoreDto.city}, ${createStoreDto.state}, ${createStoreDto.country}, ${createStoreDto.postalCode}`;

    // automatically get the latitude and longitude from the address
    try {
      const { lat, lng } = await this.mapsService.getGeocode(address);

      const newStore = new this.storeModel({
        ...createStoreDto,
        latitude: lat,
        longitude: lng,
      });

      return await newStore.save();
    } catch (error) {
      throw new AppError('Store creation failed', 500, 'STORE_CREATION_ERROR', {
        cause: error.message,
      });
    }
  }

  async listAll(
    limit: number = 10,
    offset: number = 0,
  ): Promise<{
    stores: Store[];
    limit: number;
    offset: number;
    total: number;
  }> {
    //this.storeModel is all the collection of stores. {} is the query
    const paginatedResult = await paginate(this.storeModel, {}, limit, offset);
    return {
      stores: paginatedResult.data,
      limit: paginatedResult.pagination.limit,
      offset: paginatedResult.pagination.offset,
      total: paginatedResult.pagination.total,
    };
  }

  async findOne(
    id: string,
    limit: number = 1,
    offset: number = 0,
  ): Promise<{
    stores: Store[];
    limit: number;
    offset: number;
    total: number;
  }> {
    const store = await this.storeModel.findById(id).exec();

    if (!store) {
      throw new AppError(
        `Store with ID ${id} not found`,
        404,
        'STORE_NOT_FOUND',
        { id },
      );
    }

    return {
      stores: [store], // It's an array just to keep the same structure as the listAll method
      limit,
      offset,
      total: 1, // It's always 1
    };
  }

  async update(id: string, updateStoreDto: UpdateStoreDto): Promise<Store> {
    const existingStore = await this.storeModel.findById(id).exec();
    if (!existingStore) {
      throw new AppError(
        `Store with ID ${id} not found`,
        404,
        'STORE_NOT_FOUND',
        { id },
      );
    }

    // see if any address fields have changed
    const addressChanged = [
      'address1',
      'city',
      'state',
      'postalCode',
      'country',
    ].some(
      (field) =>
        updateStoreDto[field] && updateStoreDto[field] !== existingStore[field],
    );

    if (addressChanged) {
      // build the new address string
      const newAddress = `
          ${updateStoreDto.address1 || existingStore.address1}, 
          ${updateStoreDto.city || existingStore.city}, 
          ${updateStoreDto.state || existingStore.state},
          ${updateStoreDto.country || existingStore.country}, 
          ${updateStoreDto.postalCode || existingStore.postalCode}`;

      // automatically get the latitude and longitude from the address
      try {
        const { lat, lng } = await this.mapsService.getGeocode(newAddress);

        // update the latitude and longitude in the DTO
        updateStoreDto.latitude = lat;
        updateStoreDto.longitude = lng;
      } catch (error) {
        throw new AppError(
          'Address geocoding failed',
          500,
          'ADDRESS_GEOCODING_ERROR',
          {
            newAddress,
            cause: error.message,
          },
        );
      }
    }
    return this.storeModel
      .findByIdAndUpdate(id, { $set: updateStoreDto }, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Store> {
    const store = await this.storeModel.findByIdAndDelete(id).exec();
    if (!store) {
      throw new AppError(
        `Store with ID ${id} not found`,
        404,
        'STORE_NOT_FOUND',
        { id },
      );
    }
    return store;
  }

  async findByState(
    state: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{
    stores: Store[];
    limit: number;
    offset: number;
    total: number;
  }> {
    this.validationService.validateState(state);

    const paginatedResult = await paginate(
      this.storeModel,
      { state: state.toUpperCase() },
      limit,
      offset,
    );

    return {
      stores: paginatedResult.data,
      limit: paginatedResult.pagination.limit,
      offset: paginatedResult.pagination.offset,
      total: paginatedResult.pagination.total,
    };
  }

  async getStoreWithShipping(
    cep: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{
    stores: ShippingStore[];
    pins: StorePin[];
    limit: number;
    offset: number;
    total: number;
  }> {
    this.validationService.validateCep(cep);
    this.logger.log(`Getting stores with shipping for CEP ${cep}`);
    
    // get all the stores here to avoid creating a circular dependency on distanceService
    const allStores = await this.listAll();
    const validDistances = await this.distanceService.calculateDistancesFromCep(
      cep,
      allStores.stores,
    );

    if (!validDistances) {
      throw new AppError(
        'No stores found within the specified criteria',
        404,
        'NO_STORES_FOUND',
        { cep },
      );
    }

    const total = validDistances.length;
    this.logger.log(`Found ${total} stores for CEP ${cep}`);

    // Paginate the results
    const paginatedDistances = validDistances.slice(offset, offset + limit);

    const storesWithShipping: ShippingStore[] = [];
    const pins: StorePin[] = [];

    for (const { store, distance } of paginatedDistances) {
      const pin = createPin(store);
      pins.push(pin);

      let storeWithShipping: ShippingStore;

      if (distance <= 50) {
        storeWithShipping =
          await this.shippingService.createPdvStoreWithFixedShipping(
            store,
            distance,
          );
      } else {
        storeWithShipping =
          await this.shippingService.createStoreWithDynamicShipping(
            store,
            cep,
            distance,
          );
      }

      storesWithShipping.push(storeWithShipping);
    }

    return {
      stores: storesWithShipping,
      pins,
      limit,
      offset,
      total,
    };
  }
}

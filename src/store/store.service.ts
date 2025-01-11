import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store } from './entities/store.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CorreiosService } from '../api/correios/correios.service';
import { MapsService } from '../api/maps/maps.service';
import { FreightValue } from './types/FreightValue.interface';
import { ShippingStore } from './types/ShippingStore.interface';
import { StorePin } from './types/StorePin.interface';
import { StoreType } from './enum/StoreType.enum';
import { paginate, PaginatedResult } from '../utils/Pagination';
import { DeliveryCriteriaService } from '../delivery/delivery-criteria.service';
import { AppError } from 'src/utils/AppError';

@Injectable()
export class StoreService {

  constructor(
    @InjectModel(Store.name) private readonly storeModel: Model<Store>,
    private readonly mapsService: MapsService,
    private readonly correiosService: CorreiosService,
    private readonly deliveryCriteriaService: DeliveryCriteriaService,

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
      throw new AppError("Store creation failed", 500, "STORE_CREATION_ERROR", { cause: error.message });
    }
    
  }

  async listAll(
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ stores: Store[]; limit: number; offset: number; total: number }> {

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
  ): Promise<{ stores: Store[]; limit: number; offset: number; total: number }> {
    const store = await this.storeModel.findById(id).exec();
  
    if (!store) {
      throw new AppError(`Store with ID ${id} not found`, 404, "STORE_NOT_FOUND", { id });
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
      throw new AppError(`Store with ID ${id} not found`, 404, "STORE_NOT_FOUND", { id });
    }
  
    // see if any address fields have changed
    const addressChanged = ['address1', 'city', 'state', 'postalCode', 'country'].some(
      (field) => updateStoreDto[field] && updateStoreDto[field] !== existingStore[field],
    );
  
    if (addressChanged) {
      // build the new address string
      const newAddress = `
      ${ updateStoreDto.address1 || existingStore.address1}, 
      ${ updateStoreDto.city || existingStore.city}, 
      ${ updateStoreDto.state || existingStore.state},
      ${ updateStoreDto.country || existingStore.country}, 
      ${updateStoreDto.postalCode || existingStore.postalCode}`;
  
      // automatically get the latitude and longitude from the address
      try{
        const { lat, lng } = await this.mapsService.getGeocode(newAddress);
    
        // update the latitude and longitude in the DTO
        updateStoreDto.latitude = lat;
        updateStoreDto.longitude = lng;
      } catch (error) {
        throw new AppError("Address geocoding failed", 500, "ADDRESS_GEOCODING_ERROR", {
          newAddress,
          cause: error.message,
        });
      }
    }
  
    return this.storeModel
      .findByIdAndUpdate(id, { $set: updateStoreDto }, { new: true })
      .exec();
  }
  
  async remove(id: string): Promise<Store> {
    const store = await this.storeModel.findByIdAndDelete(id).exec();
    if (!store) {
      throw new AppError(`Store with ID ${id} not found`, 404, "STORE_NOT_FOUND", { id });
    }
    return store;
  }

  async findByState(
    state: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ stores: Store[]; limit: number; offset: number; total: number }> {
    this.validateState(state);
  
  const paginatedResult = await paginate(this.storeModel, { state: state.toUpperCase() }, limit, offset);

  return {
    stores: paginatedResult.data,
    limit: paginatedResult.pagination.limit,
    offset: paginatedResult.pagination.offset,
    total: paginatedResult.pagination.total,
  };
}
  
  private validateState(state: string): void {
    if (!state || state.length !== 2) {
      throw new AppError("Invalid state format. Use 'UF' (e.g., RS, SP).", 400, "INVALID_STATE_FORMAT", { state });
    }
  }

  async calculateDistancesFromCep(cep: string): Promise<{ store: Store; distance: number }[]> {
    const stores = await this.listAll();
  
    const distances = await Promise.all(
      stores.stores.map(async (store) => {
        try{ 
          const distance = await this.calculateDistances(cep, `${store.latitude},${store.longitude}`);
          if (distance !== null) {
            return { store, distance };
          }
        } catch (error) {
            throw new AppError("Failed to calculate distance for store", 500, "DISTANCE_CALCULATION_ERROR", {
              storeId: store.id,
              cep,
              cause: error.message,
            });
        }
        return null;
      }),
    );
  
    //TODO: Implementar com o uso de reduce
    // ignores stores that are PDV and are more than 50km away
    const validDistances = distances.filter((item) => {
      if (!item) return false;
      if (item.store.type === StoreType.PDV && item.distance > 50) return false;
      return true;
    });
    if (validDistances.length === 0) return null;
  
    return validDistances.sort((a, b) => a.distance - b.distance);
  }
  

  private async calculateDistances(origin: string, destination: string): Promise<number | null> {
    try {
      const response = await this.mapsService.calculateDistance(origin, destination);
      const distanceInMeters = response.rows[0]?.elements[0]?.distance?.value;
      return distanceInMeters !== undefined ? parseFloat((distanceInMeters / 1000).toFixed(1)) : null;
    } catch (error) {
        throw new AppError(
          "Failed to calculate distance",
          500,
          "DISTANCE_CALCULATION_ERROR",
          { origin, destination, cause: error.message }
        );
    }
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
    total: number 
  }> {
    this.validateCep(cep);
    const validDistances = await this.calculateDistancesFromCep(cep);
    
    if (!validDistances) {
      throw new AppError(
        "No stores found within the specified criteria",
        404,
        "NO_STORES_FOUND",
        { cep }
      );
    }
  
    const total = validDistances.length;
  
    // Paginate the results
    const paginatedDistances = validDistances.slice(offset, offset + limit);
  
    const storesWithShipping: ShippingStore[] = [];
    const pins: StorePin[] = [];
  
    for (const { store, distance } of paginatedDistances) {
      const pin = this.createPin(store);
      pins.push(pin);
  
      let storeWithShipping: ShippingStore;
  
      if (distance <= 50) {
        storeWithShipping = await this.createPdvStoreWithFixedShipping(store, distance);
      } else {
        storeWithShipping = await this.createStoreWithDynamicShipping(store, cep, distance);
      }
  
      storesWithShipping.push(storeWithShipping);
    }
  
    return { 
      stores: storesWithShipping, 
      pins, 
      limit, 
      offset, 
      total 
    };
  }

  private createPin(store: Store): StorePin  {
    return {
      position: {
        lat: parseFloat(store.latitude),
        lng: parseFloat(store.longitude),
      },
      title: store.storeName,
    };
  }

  private async createPdvStoreWithFixedShipping(store: Store, distance: number): Promise<ShippingStore> {
    const criteria = await this.deliveryCriteriaService.findAllSorted();

    const matchedCriterion = criteria.find((c) => distance <= c.maxDistance);

    if (!matchedCriterion) {
      throw new AppError(
        "No delivery criteria found for the given distance",
        404,
        "DELIVERY_CRITERIA_NOT_FOUND",
        { distance }
      );
    }
  
    return {
      name: store.storeName,
      city: store.city,
      postalCode: store.postalCode,
      type: store.type,
      distance: `${distance} km`,
      value: [
        {
          prazo: matchedCriterion.deliveryTime,
          price: `R$ ${matchedCriterion.price.toFixed(2)}`,
          description: matchedCriterion.deliveryMethod,
        },
      ],
    };
  }
  

  private async createStoreWithDynamicShipping(store: Store, cep: string, distance: number,): Promise<ShippingStore> {
    try {
      const freightValues = await this.correiosService.calculateFreight({
        cepDestino: this.cleanCep(cep),
        cepOrigem: this.cleanCep(store.postalCode),
        comprimento: '30',
        largura: '15',
        altura: '10',
      });

      return {
        name: store.storeName,
        city: store.city,
        postalCode: store.postalCode,
        type: store.type,
        distance: `${distance} km`,
        value: freightValues.map((freight: FreightValue) => ({
          price: freight.precoAgencia,
          prazo: `${parseInt(store.shippingTimeInDays.toString(), 10) + parseInt(freight.prazo, 10)} dias úteis`,
          description: freight.urlTitulo,
        })),
      };
    } catch (error) {
      throw new AppError(
        `Failed to calculate freight for store ${store.storeName}`,
        500,
        "FREIGHT_CALCULATION_ERROR",
        {
          storeName: store.storeName,
          cepDestino: this.cleanCep(cep),
          cepOrigem: this.cleanCep(store.postalCode),
          cause: error.message,
        }
      );
    };
    
  }

  private cleanCep(cep: string): string {
    return cep.replace(/\D/g, '');
  }

  private validateCep(cep: string): void {
    if (!cep || cep.trim() === '' || this.cleanCep(cep).length !== 8) {
      throw new AppError("Invalid CEP format. Please provide a valid 8-digit CEP.", 400, "INVALID_CEP_FORMAT", { cep });
    }
  }
}
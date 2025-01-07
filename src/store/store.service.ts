import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store } from './entities/store.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CorreiosService } from '../api/correios/correios.service';
import { MapsService } from '../api/maps/maps.service';
import { FreightValue, ShippingStore, StorePin } from './types/store.types';
import { StoreType } from './enum/StoreType.enum';

@Injectable()
export class StoreService {

  constructor(
    @InjectModel(Store.name) private readonly storeModel: Model<Store>,
    private readonly mapsService: MapsService,
    private readonly correiosService: CorreiosService,

  ) {}
  async create(createStoreDto: CreateStoreDto): Promise<Store> {
   
    const address = `${createStoreDto.address1}, ${createStoreDto.city}, ${createStoreDto.state}, ${createStoreDto.country}, ${createStoreDto.postalCode}`;

    const { lat, lng } = await this.mapsService.getGeocode(address);

    const newStore = new this.storeModel({
      ...createStoreDto,
      latitude: lat,
      longitude: lng,
    });

    return await newStore.save();
  }

  async listAll(): Promise<Store[]> {
    return this.storeModel.find().exec();
  }

  async findOne(id: string): Promise<Store> {
    const store = await this.storeModel.findById(id).exec();
    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }
    return store;
  }

  async update(id: string, updateStoreDto: UpdateStoreDto): Promise<Store> {
    // Certifique-se de que a loja existe
    const existingStore = await this.storeModel.findById(id).exec();
    if (!existingStore) {
      throw new Error(`Loja com ID ${id} não encontrada.`);
    }
  
    // Verificar se o endereço foi alterado
    const addressChanged = ['address1', 'city', 'state', 'postalCode', 'country'].some(
      (field) => updateStoreDto[field] && updateStoreDto[field] !== existingStore[field],
    );
  
    if (addressChanged) {
      // Montar o novo endereço
      const newAddress = `
      ${ updateStoreDto.address1 || existingStore.address1}, 
      ${ updateStoreDto.city || existingStore.city}, 
      ${ updateStoreDto.state || existingStore.state},
      ${ updateStoreDto.country || existingStore.country}, 
      ${updateStoreDto.postalCode || existingStore.postalCode}`;
  
      // Obter as novas coordenadas
      const { lat, lng } = await this.mapsService.getGeocode(newAddress);
  
      // Atualizar latitude e longitude no DTO
      updateStoreDto.latitude = lat;
      updateStoreDto.longitude = lng;
    }
  
    // Atualizar os campos no banco de dados
    return this.storeModel
      .findByIdAndUpdate(id, { $set: updateStoreDto }, { new: true })
      .exec();
  }
  

  async remove(id: string): Promise<void> {
    await this.ensureStoreExists(id);
    await this.storeModel.findByIdAndDelete(id).exec();
  }

  async findByState(state: string): Promise<Store[]> {
    this.validateState(state);
    return this.storeModel.find({ state: state.toUpperCase() }).exec();
  }

  private validateState(state: string): void {
    if (!state || state.length !== 2) {
      throw new Error('Estado inválido. Use o formato "UF" (e.g., RS, SP).');
    }
  }

  private async ensureStoreExists(id: string): Promise<void> {
    const store = await this.storeModel.findById(id).exec();
    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }
  }
  async calculateDistancesFromCep(cep: string): Promise<{ store: Store; distance: number } | null> {
    const stores = await this.listAll();
  
    const distances = await Promise.all(
      stores.map(async (store) => {
        const distance = await this.calculateDistances(cep, `${store.latitude},${store.longitude}`);
        if (distance !== null) {
          return { store, distance };
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
  
    return validDistances.sort((a, b) => a.distance - b.distance)[0];
  }
  

  private async calculateDistances(origin: string, destination: string): Promise<number | null> {
    try {
      const response = await this.mapsService.calculateDistance(origin, destination);
      const distanceInMeters = response.rows[0]?.elements[0]?.distance?.value;
      return distanceInMeters !== undefined ? parseFloat((distanceInMeters / 1000).toFixed(1)) : null;
    } catch (error) {
      console.error(`Erro ao calcular distância:`, error.message);
      return null;
    }
  }

  async getStoreWithShipping(cep: string): Promise<{ store: ShippingStore; pins: StorePin}> {
    const nearestStore = await this.calculateDistancesFromCep(cep);
  
    if (!nearestStore) {
      return {
        store: null,
        pins: null,
      };
    }
  
    const { store, distance } = nearestStore;
    const pins = this.createPin(store);
  
    let storeWithShipping: ShippingStore;

    if (distance <= 50) {
      storeWithShipping = this.createPdvStoreWithFixedShipping(store, distance);
    } else {
      storeWithShipping = await this.createStoreWithDynamicShipping(store, cep, distance);
    }
  
    return { store: storeWithShipping, pins };
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

  private createPdvStoreWithFixedShipping(store: Store, distance: number): ShippingStore {
    return {
      name: store.storeName,
      city: store.city,
      postalCode: store.postalCode,
      type: store.type,
      distance: `${distance} km`,
      value: [
        {
          prazo: '1 dias úteis',
          price: 'R$ 15,00',
          description: 'Motoboy',
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
          prazo: freight.prazo,
          description: freight.urlTitulo,
        })),
      };
    } catch (error) {
      console.error(`Erro ao calcular frete para a loja ${store.storeName}:`, error.message);
      return {
        name: store.storeName,
        city: store.city,
        postalCode: store.postalCode,
        type: store.type,
        distance: `${distance} km`,
        value: [
          {
            price: 'Indisponível',
            prazo: 'Indisponível',
            description: 'Erro ao calcular o frete',
          },
        ],
      };
    }
  }

  private cleanCep(cep: string): string {
    return cep.replace(/\D/g, '');
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store } from './entities/store.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { async } from 'rxjs';
import { CorreiosService } from 'src/api/correios/correios.service';
import { MapsService } from 'src/api/maps/maps.service';

@Injectable()
export class StoreService {

  constructor(
    @InjectModel(Store.name) private readonly storeModel: Model<Store>,
    private readonly mapsService: MapsService,
    private readonly correiosService: CorreiosService,

  ) {}
  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    const newStore = new this.storeModel(createStoreDto);
    return newStore.save();
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
    await this.ensureStoreExists(id);
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
  
    const validDistances = distances.filter((item) => item !== null);
    if (validDistances.length === 0) return null; // Nenhuma loja válida encontrada
  
    // Retornar a loja mais próxima
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

  async getStoreWithShipping(cep: string): Promise<{ store: any; pins: any[] }> {
    const nearestStore = await this.calculateDistancesFromCep(cep);
  
    if (!nearestStore) {
      return {
        store: null,
        pins: [],
      };
    }
  
    const { store, distance } = nearestStore;
    const pins = [this.createPin(store)];
  
    let storeWithShipping;
    if (store.type === 'PDV' && distance <= 50) {
      storeWithShipping = this.createPdvStoreWithFixedShipping(store, distance);
    } else {
      storeWithShipping = await this.createStoreWithDynamicShipping(store, cep, distance);
    }
  
    return { store: storeWithShipping, pins };
  }
  

  private createPin(store: Store): any {
    return {
      position: {
        lat: parseFloat(store.latitude),
        lng: parseFloat(store.longitude),
      },
      title: store.storeName,
    };
  }

  private createPdvStoreWithFixedShipping(store: Store, distance: number): any {
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

  private async createStoreWithDynamicShipping(
    store: Store,
    cep: string,
    distance: number,
  ): Promise<any> {
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
        value: freightValues.map((freight: any) => ({
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
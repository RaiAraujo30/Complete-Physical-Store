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
  async calculateDistancesFromCep(
    cep: string,
  ): Promise<{ store: Store; distance: number }[]> {
    const stores = await this.listAll();

    const distances = await Promise.all(
      stores.map(async (store) => {
        const origin = cep;
        const destination = `${store.latitude},${store.longitude}`;
        const response = await this.mapsService.calculateDistance(
          origin,
          destination,
        );

        const distanceInMeters = response.rows[0]?.elements[0]?.distance?.value;
        if (distanceInMeters !== undefined) {
          const distanceInKm = parseFloat((distanceInMeters / 1000).toFixed(1));
          return { store, distance: distanceInKm };
        }
        return null; // Caso não consiga calcular a distância, retorna null
      }),
    );

    // Filtrar nulos e ordenar as lojas pela distância
    return distances.filter((item) => item !== null).sort((a, b) => a.distance - b.distance);
  }

  // Retornar lojas com informações de frete
  async getStoresWithShipping(cep: string): Promise<{ stores: any[]; pins: any[] }> {
    const distances = await this.calculateDistancesFromCep(cep);
    const stores = [];
    const pins = [];

    for (const { store, distance } of distances) {
      // Criar o objeto do pin
      pins.push({
        position: {
          lat: parseFloat(store.latitude),
          lng: parseFloat(store.longitude),
        },
        title: store.storeName,
      });

      if (store.type === 'PDV' && distance <= 50) {
        // Adiciona o PDV com frete fixo
        stores.push({
          name: store.storeName,
          city: store.city,
          postalCode: store.postalCode,
          type: store.type,
          distance:` ${distance} km`,
          value: [
            {
              prazo: '1 dias úteis',
              price: 'R$ 15,00',
              description: 'Motoboy',
            },
          ],
        });
      } else {
        // Adiciona lojas ou PDVs fora do raio com cálculo de frete
        try {
          const freightValues = await this.correiosService.calculateFreight({
            cepDestino: cleanCep(String(cep)),
            cepOrigem: cleanCep(String(store.postalCode)),
            comprimento: '30',
            largura: '15',
            altura: '10',
          });

          stores.push({
            name: store.storeName,
            city: store.city,
            postalCode: store.postalCode,
            type: store.type,
            distance: ` ${distance} km`,
            value: freightValues.map((freight: any) => ({
              price: freight.precoAgencia,
              prazo: freight.prazo,
              description: freight.urlTitulo,
            })),
          });
        } catch (error) {
          console.error(
            `Erro ao calcular frete para a loja ${store.storeName}:,
            error.message`);
          stores.push({
            name: store.storeName,
            city: store.city,
            postalCode: store.postalCode,
            type: store.type,
            distance: ` ${distance} km`,
            value: [
              {
                price: 'Indisponível',
                prazo: 'Indisponível',
                description: 'Erro ao calcular o frete',
              },
            ],
          });
        }
      }
    }

    return { stores, pins };
  }

  async filterStoresWithinRadius(
    cep: string,
    radiusInKm: number = 50,
  ): Promise<{ store: Store; distance: number }[]> {
    const distances = await this.calculateDistancesFromCep(cep);

    return distances.filter(({ distance }) => distance <= radiusInKm);
  }

}

function cleanCep(cep: string): string {
  return cep.replace(/\D/g, ''); // Remove qualquer caractere não numérico
}
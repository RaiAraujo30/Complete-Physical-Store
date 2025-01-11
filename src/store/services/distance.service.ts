import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Store } from '../entities/store.entity';
import { StoreService } from './store.service';
import { AppError } from '../../common/exceptions/AppError';
import { StoreType } from '../enum/StoreType.enum';
import { MapsService } from '../../api/maps/maps.service';

@Injectable()
export class DistanceService {
  constructor(private readonly mapsService: MapsService) {}
  async calculateDistancesFromCep(
    cep: string,
    stores: Store[],
  ): Promise<{ store: Store; distance: number }[]> {
    const distances = await Promise.all(
      stores.map(async (store) => {
        try {
          const distance = await this.calculateDistances(
            cep,
            `${store.latitude},${store.longitude}`,
          );
          if (distance !== null) {
            return { store, distance };
          }
        } catch (error) {
          throw new AppError(
            'Failed to calculate distance for store',
            500,
            'DISTANCE_CALCULATION_ERROR',
            {
              storeId: store.id,
              cep,
              cause: error.message,
            },
          );
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

  private async calculateDistances(
    origin: string,
    destination: string,
  ): Promise<number | null> {
    try {
      const response = await this.mapsService.calculateDistance(
        origin,
        destination,
      );
      const distanceInMeters = response.rows[0]?.elements[0]?.distance?.value;
      return distanceInMeters !== undefined
        ? parseFloat((distanceInMeters / 1000).toFixed(1))
        : null;
    } catch (error) {
      throw new AppError(
        'Failed to calculate distance',
        500,
        'DISTANCE_CALCULATION_ERROR',
        { origin, destination, cause: error.message },
      );
    }
  }
}

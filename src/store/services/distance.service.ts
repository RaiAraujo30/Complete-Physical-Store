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
          const response = await this.mapsService.calculateDistance(
            cep,
            `${store.latitude},${store.longitude}`,
          );
          const distanceInMeters =
            response.rows[0]?.elements[0]?.distance?.value;
          const distance =
            distanceInMeters !== undefined
              ? parseFloat((distanceInMeters / 1000).toFixed(1))
              : null;

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

    const validDistances = distances.filter((item) => {
      if (!item) return false;
      if (item.store.type === StoreType.PDV && item.distance > 50) return false;
      return true;
    });

    if (validDistances.length === 0) return null;

    return validDistances.sort((a, b) => a.distance - b.distance);
  }
}

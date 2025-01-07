import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class MapsService {
  private readonly googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
  private readonly opencageApiKey = process.env.OPENCAGE_API_KEY;
  private readonly googleBaseUrl = 'https://maps.googleapis.com/maps/api';
  private readonly opencageBaseUrl = 'https://api.opencagedata.com/geocode/v1';

  constructor(private readonly httpService: HttpService) {}

  async calculateDistance(origin: string, destination: string): Promise<GoogleDistanceMatrixResponse> {
    // use the google maps distance Matrix to calculate the distance between two locations
    const url = `${this.googleBaseUrl}/distancematrix/json?origins=${origin}&destinations=${destination}&key=${this.googleApiKey}`;

    const googleResponse = await this.httpService.get(url).toPromise();

    // fallback for specific cases where the google response is not as expected, Use OpenCageData API as a backup
    if (
      !googleResponse.data.origin_addresses.length ||
      !googleResponse.data.destination_addresses.length ||
      googleResponse.data.rows[0]?.elements[0]?.status !== 'OK'
    ) {
      const fallbackCoordinates = await this.getFallbackCoordinates(origin, destination);
      const url = `${this.googleBaseUrl}/distancematrix/json?origins=${fallbackCoordinates.origin.lat},${fallbackCoordinates.origin.lng}&destinations=${fallbackCoordinates.destination.lat},${fallbackCoordinates.destination.lng}&key=${this.googleApiKey}`;
      const googleResponse = await this.httpService.get(url).toPromise();
      return googleResponse.data;
    }

    return googleResponse.data;
  }

  // get the coordinates from the origin and destination using OpenCageData API
  private async getFallbackCoordinates(origin: string, destination: string): Promise<FallbackCoordinates> {
    try {
      // use promise.all to make both requests at the same time
      const [originGeocode, destinationGeocode] = await Promise.all([
        this.getCoordinatesFromOpenCage(origin),
        this.getCoordinatesFromOpenCage(destination),
      ]);
  
      if (!originGeocode || !destinationGeocode) {
        throw new Error('Unable to retrieve coordinates from OpenCageData');
      }
  
      return {
        origin: originGeocode,
        destination: destinationGeocode,
      };
    } catch (error) {
      throw error;
    }
  }
  
  // the interface coordenate use 2 numbers, lat and lng
  async getGeocode(address: string): Promise<{ lat: string; lng: string }> {
    const url = `${this.googleBaseUrl}/geocode/json?address=${encodeURIComponent(address)}&key=${this.googleApiKey}`;
    const response = await this.httpService.get(url).toPromise();
  
    if (response.data.results.length === 0) {
      throw new Error('Endereço não encontrado.');
    }
  
    const location = response.data.results[0].geometry.location;
    return {
      lat: location.lat.toString(),
      lng: location.lng.toString(),
    };
  }
  
  private async getCoordinatesFromOpenCage(address: string): Promise<OpenCageCoordinates | null> {
    const url = `${this.opencageBaseUrl}/json?q=${encodeURIComponent(address)}&key=${this.opencageApiKey}`;
    const response = await this.httpService.get(url).toPromise();

    const data = response.data?.results[0];
    if (!data) {
      console.log('No results from OpenCageData');
      return null;
    }

    return {
      lat: data.geometry.lat,
      lng: data.geometry.lng,
      formatted: data.formatted,
    };
  }
}

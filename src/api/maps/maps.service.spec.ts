import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { MapsService } from './maps.service';
import { of, throwError } from 'rxjs';
import { AxiosHeaders, AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';

describe('MapsService', () => {
  let service: MapsService;
  let httpService: HttpService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'GOOGLE_MAPS_API_KEY') return 'mock-google-maps-api-key';
      if (key === 'OPENCAGE_API_KEY') return 'mock-opencage-api-key';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MapsService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MapsService>(MapsService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterAll(() => {
    consoleErrorMock.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(httpService).toBeDefined();
  });

  describe('calculateDistance', () => {
    const origin = 'Rua A, São Paulo, SP';
    const destination = 'Rua B, Rio de Janeiro, RJ';

    const googleDistanceResponseMock: AxiosResponse = {
      data: {
        destination_addresses: [destination],
        origin_addresses: [origin],
        rows: [
          {
            elements: [
              {
                status: 'OK',
                distance: { text: '430 km', value: 430000 },
                duration: { text: '5 horas', value: 18000 },
              },
            ],
          },
        ],
        status: 'OK',
      },
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: {
        headers: new AxiosHeaders(),
      },
    };

    it('should calculate distance using Google Maps API', async () => {
      mockHttpService.get.mockReturnValue(of(googleDistanceResponseMock));

      const result = await service.calculateDistance(origin, destination);

      expect(result).toEqual(googleDistanceResponseMock.data);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        `${service['googleBaseUrl']}/distancematrix/json?origins=${origin}&destinations=${destination}&key=${mockConfigService.get('GOOGLE_MAPS_API_KEY')}`,
      );
    });

  });
  
  describe('getGeocode', () => {
    const address = 'Rua A, São Paulo, SP';
    const geocodeResponseMock: AxiosResponse = {
      data: {
        results: [
          {
            geometry: {
              location: { lat: -23.55052, lng: -46.633308 },
            },
          },
        ],
      },
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: {
        headers: new AxiosHeaders(),
      },
    };

    it('should throw an error when address is not found', async () => {
      const emptyGeocodeResponseMock: AxiosResponse = {
        data: { results: [] },
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders(),
        config: {
          headers: new AxiosHeaders(),
        },
      };

      mockHttpService.get.mockReturnValue(of(emptyGeocodeResponseMock));

      await expect(service.getGeocode(address)).rejects.toThrow(
        'Failed to retrieve geocode from Google Maps API',
      );
    });
  });
});

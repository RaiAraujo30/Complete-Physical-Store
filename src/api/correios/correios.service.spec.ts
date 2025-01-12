import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { CorreiosService } from './correios.service';
import { of, throwError } from 'rxjs';
import { AxiosHeaders, AxiosResponse } from 'axios';

describe('CorreiosService', () => {
  let service: CorreiosService;
  let httpService: HttpService;

  const mockHttpService = {
    post: jest.fn(),
  };
  const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorreiosService,
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<CorreiosService>(CorreiosService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterAll(() => {
    consoleErrorMock.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(httpService).toBeDefined();
  });

  describe('calculateFreight', () => {
    const freightRequestPayload = {
      cepOrigem: '01001-000',
      cepDestino: '02002-000',
      comprimento: '20',
      largura: '15',
      altura: '10',
    };

    const freightResponseMock: AxiosResponse = {
      data: [
        {
          servico: 'PAC',
          prazoEntrega: '5 dias úteis',
          valorFrete: 20.5,
        },
        {
          servico: 'SEDEX',
          prazoEntrega: '2 dias úteis',
          valorFrete: 45.0,
        },
      ],
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: {
        headers: new AxiosHeaders(),
      },
    };

    it('should calculate freight successfully', async () => {
      // Mocking the HttpService post method
      mockHttpService.post.mockReturnValue(of(freightResponseMock));

      const result = await service.calculateFreight(freightRequestPayload);

      expect(result).toEqual(freightResponseMock.data);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://www.correios.com.br/@@precosEPrazosView',
        freightRequestPayload,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should throw an error when the API request fails', async () => {
      // Mocking the HttpService to simulate an error
      const errorMessage = 'Internal Server Error';
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error(errorMessage)),
      );

      await expect(
        service.calculateFreight(freightRequestPayload),
      ).rejects.toThrow('Failed to calculate freight via Correios API');

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://www.correios.com.br/@@precosEPrazosView',
        freightRequestPayload,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );
    });
  });
});

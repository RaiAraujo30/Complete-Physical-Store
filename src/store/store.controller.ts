import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Query } from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { ApiOperation, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Store } from './entities/store.entity';
import { PaginatedResult } from 'src/utils/Pagination';
import { ShippingStore, StorePin } from './types/store.types';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new store' })
  @ApiBody({ type: CreateStoreDto, description: 'The store data to create' })
  @ApiResponse({ status: 201, description: 'Store created successfully.' })
  async create(@Body() createStoreDto: CreateStoreDto) {
    return this.storeService.create(createStoreDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a list of all stores' })
  @ApiResponse({ status: 200, description: 'List of stores retrieved successfully.' })
  async listAll(
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ): Promise<{ stores: Store[]; limit: number; offset: number; total: number }> {
    return this.storeService.listAll(+limit, +offset);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a store by its ID' })
  @ApiParam({ name: 'id', description: 'The ID of the store to retrieve' })
  @ApiResponse({ status: 200, description: 'Store retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Store not found.' })
  async findOne(
    @Param('id') id: string,
    @Query('limit') limit: number = 1,
    @Query('offset') offset: number = 0,
  ): Promise<{ stores: Store[]; limit: number; offset: number; total: number }> {
    return this.storeService.findOne(id, +limit, +offset);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing store by its ID' })
  @ApiParam({ name: 'id', description: 'The ID of the store to update' })
  @ApiBody({ type: UpdateStoreDto, description: 'The updated store data' })
  @ApiResponse({ status: 200, description: 'Store updated successfully.' })
  @ApiResponse({ status: 404, description: 'Store not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
  ) {
    return this.storeService.update(id, updateStoreDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a store by its ID' })
  @ApiParam({ name: 'id', description: 'The ID of the store to delete' })
  @ApiResponse({ status: 200, description: 'Store deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Store not found.' })
  async delete(@Param('id') id: string) {
    return this.storeService.remove(id);
  }

  @Get('state/:state')
  @ApiOperation({ summary: 'Retrieve stores by state abbreviation' })
  @ApiParam({ name: 'state', description: 'The state abbreviation (e.g., SP, RJ)' })
  @ApiResponse({ status: 200, description: 'Stores retrieved successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid state abbreviation.' })
  async findByState(
    @Param('state') state: string,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ): Promise<{ stores: Store[]; limit: number; offset: number; total: number }> {
    return this.storeService.findByState(state, +limit, +offset);
  }

  @Get('cep/:cep')
  @ApiOperation({ summary: 'Retrieve stores and shipping info based on a postal code (CEP)' })
  @ApiParam({ name: 'cep', description: 'The postal code (CEP) to calculate distances' })
  @ApiResponse({ status: 200, description: 'Stores and shipping info retrieved successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid CEP provided.' })
  async getStoreWithShipping(
    @Param('cep') cep: string,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ): Promise<{ 
    stores: ShippingStore[]; 
    pins: StorePin[]; 
    limit: number; 
    offset: number; 
    total: number 
  }> {
    return this.storeService.getStoreWithShipping(cep, +limit, +offset);
  }

  private validateCep(cep: string): void {
    if (!cep || cep.trim() === '') {
      throw new Error('CEP is required to calculate distances.');
    }
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  async create(@Body() createStoreDto: CreateStoreDto) {
    return this.storeService.create(createStoreDto);
  }

  @Get()
  async findAll() {
    return this.storeService.listAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.storeService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storeService.update(id, updateStoreDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.storeService.remove(id);
  }

  @Get('state/:state')
  async findByState(@Param('state') state: string) {
    return this.storeService.findByState(state);
  }
}

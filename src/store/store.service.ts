import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store } from './entities/store.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class StoreService {

  constructor(
    @InjectModel(Store.name) private readonly storeModel: Model<Store>,

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
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeliveryCriteria } from './entities/DeliveryCriteria.entity';

@Injectable()
export class DeliveryCriteriaService {
  constructor(
    @InjectModel(DeliveryCriteria.name) private readonly criteriaModel: Model<DeliveryCriteria>,
  ) {}

  async findAllSorted(): Promise<DeliveryCriteria[]> {
    return this.criteriaModel.find().sort({ maxDistance: 1 }).exec(); 
  }
  

  async create(criteria: Partial<DeliveryCriteria>): Promise<DeliveryCriteria> {
    const newCriteria = new this.criteriaModel(criteria);
    return newCriteria.save();
  }

  async remove (id: string): Promise<DeliveryCriteria> {
    return this.criteriaModel.findByIdAndDelete(id);
  }
}

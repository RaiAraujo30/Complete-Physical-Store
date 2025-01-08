import { Model } from 'mongoose';

export async function paginate<T>(
    model: Model<T>,
    query: any = {},
    limit: number = 10,
    offset: number = 0,
  ): Promise<PaginatedResult<T>> {
    const total = await model.countDocuments(query).exec();
    const data = await model
      .find(query)
      .skip(offset)
      .limit(limit)
      .exec();
  
    return {
      data,
      pagination: {
        limit,
        offset,
        total,
      },
    };
  }

export type Pagination = {
  limit: number;
  offset: number;
  total: number;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: Pagination;
};

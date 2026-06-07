import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, FindOptionsWhere } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStatus } from '../../common/enums/product-status.enum';
import type { ICache } from '@infra/cache';
import { CACHE_TOKEN } from '@infra/cache';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  fromCache: boolean;
}

interface ProductFilters {
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  private readonly CACHE_TTL = 120; // دقيقتين
  private readonly CACHE_PREFIX = 'products:';

  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @Inject(CACHE_TOKEN)
    private readonly cache: ICache,
  ) {}

  // ============================================
  // ➕ CREATE - With Cache Invalidation
  // ============================================
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create(createProductDto);
    const saved = await this.productsRepository.save(product);

    // إبطال الكاش
    await this.invalidateListCache();

    this.logger.log(`✅ Product created: ${saved.id}`);
    return saved;
  }

  // ============================================
  // 📋 GET ALL - With Caching + Pagination + Filters
  // ============================================
  async findAll(
    page: number = 1,
    limit: number = 20,
    filters?: ProductFilters,
  ): Promise<PaginatedResponse<Product>> {
    // بناء مفتاح الكاش
    const cacheKey = `${this.CACHE_PREFIX}list:${page}:${limit}:${JSON.stringify(filters || {})}`;

    // محاولة جلب من الكاش
    try {
      const cached = await this.cache.get<PaginatedResponse<Product>>(cacheKey);
      if (cached) {
        this.logger.log(`📦 Cache hit: ${cacheKey}`);
        return { ...cached, fromCache: true };
      }
    } catch (error) {
      this.logger.warn(`Cache get failed: ${error.message}`);
    }

    // بناء شروط البحث
    const where: FindOptionsWhere<Product> = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.name = Like(`%${filters.search}%`);
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      // Handle price range - need raw query or Between
    }

    const [products, total] = await this.productsRepository.findAndCount({
      where,
      relations: {
        inventory: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const result: PaginatedResponse<Product> = {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrevious: page > 1,
      fromCache: false,
    };

    // تخزين في الكاش
    try {
      await this.cache.set(cacheKey, result, { ttl: this.CACHE_TTL });
    } catch (error) {
      this.logger.warn(`Cache set failed: ${error.message}`);
    }

    return result;
  }

  // ============================================
  // 🔍 GET ONE - With Caching
  // ============================================
  async findOne(id: string): Promise<Product & { fromCache?: boolean }> {
    const cacheKey = `${this.CACHE_PREFIX}single:${id}`;

    // محاولة جلب من الكاش
    try {
      const cached = await this.cache.get<Product>(cacheKey);
      if (cached) {
        this.logger.log(`📦 Cache hit: ${cacheKey}`);
        return { ...cached, fromCache: true };
      }
    } catch (error) {
      this.logger.warn(`Cache get failed: ${error.message}`);
    }

    // جلب من قاعدة البيانات
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: {
        inventory: true,
        orderItems: false,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    // تخزين في الكاش
    try {
      await this.cache.set(cacheKey, product, { ttl: this.CACHE_TTL });
    } catch (error) {
      this.logger.warn(`Cache set failed: ${error.message}`);
    }

    return { ...product, fromCache: false };
  }

  // ============================================
  // ✏️ UPDATE - With Cache Invalidation
  // ============================================
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    const updated = await this.productsRepository.save(product as Product);

    // إبطال الكاش
    await this.invalidateCache(id);

    return updated;
  }

  // ============================================
  // 🗑️ REMOVE - With Cache Invalidation
  // ============================================
  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product as Product);

    // إبطال الكاش
    await this.invalidateCache(id);
  }

  // ============================================
  // 🔥 FEATURED PRODUCTS - Cached
  // ============================================
  async getFeatured(limit: number = 10): Promise<Product[]> {
    const cacheKey = `${this.CACHE_PREFIX}featured:${limit}`;

    const cached = await this.cache.get<Product[]>(cacheKey);
    if (cached) {
      this.logger.log(`📦 Cache hit: ${cacheKey}`);
      return cached;
    }

    const products = await this.productsRepository.find({
      where: { status: ProductStatus.ACTIVE },
      relations: { inventory: true },
      take: limit,
      order: { createdAt: 'DESC' },
    });

    await this.cache.set(cacheKey, products, { ttl: 300 }); // 5 دقائق

    return products;
  }

  // ============================================
  // 📊 STATISTICS - Cached
  // ============================================
  async getStats(): Promise<any> {
    const cacheKey = `${this.CACHE_PREFIX}stats`;

    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return { ...cached, fromCache: true };

    const total = await this.productsRepository.count();
    const active = await this.productsRepository.count({
      where: { status: ProductStatus.ACTIVE },
    });
    const inactive = await this.productsRepository.count({
      where: { status: ProductStatus.INACTIVE },
    });
    const outOfStock = await this.productsRepository.count({
      where: { status: ProductStatus.OUT_OF_STOCK },
    });

    const stats = { total, active, inactive, outOfStock, fromCache: false };
    await this.cache.set(cacheKey, stats, { ttl: 180 }); // 3 دقائق

    return stats;
  }

  // ============================================
  // 🔄 CACHE INVALIDATION
  // ============================================
  private async invalidateCache(productId: string): Promise<void> {
    try {
      await this.cache.delete(`${this.CACHE_PREFIX}single:${productId}`);
      await this.invalidateListCache();
      this.logger.log(`🗑️ Cache invalidated for product ${productId}`);
    } catch (error) {
      this.logger.warn(`Cache invalidation failed: ${error.message}`);
    }
  }

  private async invalidateListCache(): Promise<void> {
    try {
      // ببساطة الكاش رح ينتهي بـ TTL، مش ضروري نحذف كل المفاتيح
      // لكن نقدر نحذف الـ featured والـ stats
      await this.cache.delete(`${this.CACHE_PREFIX}featured:10`);
      await this.cache.delete(`${this.CACHE_PREFIX}stats`);
    } catch (error) {
      this.logger.warn(`List cache invalidation failed: ${error.message}`);
    }
  }
}

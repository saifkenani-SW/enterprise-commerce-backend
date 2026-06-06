import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import type { ICache } from '@infra/cache';
import { CACHE_TOKEN } from '@infra/cache';
import type { ILock } from '@infra/lock';
import { LOCK_TOKEN } from '@infra/lock';
import { EmailService } from './co';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @Inject(CACHE_TOKEN)
    private readonly cache: ICache,
    @Inject(LOCK_TOKEN)
    private readonly lock: ILock,
    private readonly emailService: EmailService,
  ) {}
  @Get('/cache-test')
  async test() {
    await this.cache.set('user:1', { name: 'Saif' }, { ttl: 60 });
    return this.cache.get('user:1');
  }

  @Get('/lock-test')
  async lockTest() {
    return this.lock.execute('product:1', 100000, async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));

      return {
        success: true,
      };
    });
  }

  @Get('/lock-test2')
  async lockTest2() {
    return this.lock.execute('product:1', 10000, async () => {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      throw new Error('boom');
    });
  }

  @Get('/lock-wait-test')
  async lockWaitTest() {
    const token = await this.lock.acquireWithWait('product:1', 10000, {
      timeoutMs: 30000,
      retryDelayMs: 100,
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      return {
        success: true,
        token,
      };
    } finally {
      await this.lock.release('product:1', token);
    }
  }

  @Get('/lock-wait-timeout')
  async lockWaitTimeout() {
    const token = await this.lock.acquireWithWait('product:1', 10000, {
      timeoutMs: 1000,
      retryDelayMs: 100,
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      return {
        success: true,
      };
    } finally {
      await this.lock.release('product:1', token);
    }
  }

  @Get('/queue-test')
  async queueTest() {
    await this.emailService.sendEmail();

    return {
      queued: true,
    };
  }
  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }
}

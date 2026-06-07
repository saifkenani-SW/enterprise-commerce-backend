import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationLog } from './entities/notification-log.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly BATCH_SIZE = 50;

  constructor(
    @InjectRepository(NotificationLog)
    private notificationLogRepository: Repository<NotificationLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * إرسال إشعارات لجميع المستخدمين على دفعات
   */
  async sendBatchNotifications(
    title: string,
    message: string,
  ): Promise<{
    totalBatches: number;
    totalUsers: number;
    sent: number;
    failed: number;
  }> {
    this.logger.log(`🔔 Starting batch notifications: "${title}"`);

    const totalUsers = await this.userRepository.count();
    const totalBatches = Math.ceil(totalUsers / this.BATCH_SIZE);

    this.logger.log(`📦 ${totalUsers} users in ${totalBatches} batches`);

    let sent = 0;
    let failed = 0;

    for (let batch = 1; batch <= totalBatches; batch++) {
      const skip = (batch - 1) * this.BATCH_SIZE;

      const users = await this.userRepository.find({
        skip,
        take: this.BATCH_SIZE,
        order: { createdAt: 'ASC' },
      });

      this.logger.log(
        `📤 Batch ${batch}/${totalBatches}: ${users.length} users`,
      );

      for (const user of users) {
        try {
          await this.sendToUser(user, title, message, batch);
          sent++;
        } catch (error) {
          failed++;
          this.logger.error(`❌ Failed for user ${user.id}: ${error.message}`);
        }
      }

      this.logger.log(`✅ Batch ${batch} complete`);

      if (batch < totalBatches) {
        await this.delay(1000);
      }
    }

    const result = { totalBatches, totalUsers, sent, failed };
    this.logger.log(`🎉 Done: ${sent}/${totalUsers} sent`);
    return result;
  }

  /**
   * إرسال إشعار لمستخدم واحد
   */
  private async sendToUser(
    user: User,
    title: string,
    message: string,
    batchNumber: number,
  ): Promise<void> {
    const log = this.notificationLogRepository.create({
      userId: user.id,
      title,
      message: message.replace('{name}', user.fullName),
      batchNumber,
      status: 'pending',
    });

    try {
      await this.sendNotification(user, title, message);
      log.status = 'sent';
      log.sentAt = new Date();
    } catch (error) {
      log.status = 'failed';
      log.errorMessage = error.message;
    }

    await this.notificationLogRepository.save(log);
  }

  /**
   * محاكاة إرسال الإشعار (استبدلها بخدمة حقيقية)
   */
  private async sendNotification(
    user: User,
    title: string,
    message: string,
  ): Promise<void> {
    this.logger.log(`📨 ${user.email}: ${title}`);
    // TODO: دمج مع Firebase/SendGrid/etc.
  }

  /**
   * إرسال لمشتري منتج معين
   */
  async notifyUsersWhoBoughtProduct(
    productId: string,
    title: string,
    message: string,
  ): Promise<void> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.orders', 'order')
      .innerJoin('order.items', 'item')
      .where('item.productId = :productId', { productId })
      .distinct(true)
      .getMany();

    this.logger.log(`📦 ${users.length} users who bought product ${productId}`);

    for (let i = 0; i < users.length; i += this.BATCH_SIZE) {
      const batch = users.slice(i, i + this.BATCH_SIZE);
      const batchNumber = Math.floor(i / this.BATCH_SIZE) + 1;

      for (const user of batch) {
        try {
          await this.sendToUser(user, title, message, batchNumber);
        } catch (error) {
          this.logger.error(`Failed for ${user.id}: ${error.message}`);
        }
      }

      await this.delay(1000);
    }
  }

  /**
   * جلب سجل الإشعارات
   */
  async getLogs(
    page: number = 1,
    limit: number = 50,
    status?: 'sent' | 'failed' | 'pending',
  ) {
    const where: any = {};
    if (status) where.status = status;

    const [logs, total] = await this.notificationLogRepository.findAndCount({
      where,
      relations: { user: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * إحصائيات الإشعارات
   */
  async getStats() {
    const total = await this.notificationLogRepository.count();
    const sent = await this.notificationLogRepository.count({
      where: { status: 'sent' },
    });
    const failed = await this.notificationLogRepository.count({
      where: { status: 'failed' },
    });
    const pending = await this.notificationLogRepository.count({
      where: { status: 'pending' },
    });

    return { total, sent, failed, pending };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

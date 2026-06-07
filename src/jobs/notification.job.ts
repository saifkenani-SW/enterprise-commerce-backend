import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationService } from '../module/notification/notification.service';

@Injectable()
export class NotificationJob {
  private readonly logger = new Logger(NotificationJob.name);

  constructor(private notificationService: NotificationService) {}

  /**
   * إشعار يومي - كل يوم 9 صباحاً
   */
  @Cron('0 9 * * *')
  async dailyPromotion(): Promise<void> {
    this.logger.log('📢 Sending daily promotion...');

    await this.notificationService.sendBatchNotifications(
      '🔥 عرض اليوم!',
      'مرحباً {name}! خصم 20% على جميع المنتجات اليوم فقط!',
    );
  }

  /**
   * إشعار أسبوعي - كل اثنين 10 صباحاً
   */
  @Cron('0 10 * * 1')
  async weeklyNewsletter(): Promise<void> {
    this.logger.log('📰 Sending weekly newsletter...');

    await this.notificationService.sendBatchNotifications(
      '📰 النشرة الأسبوعية',
      'مرحباً {name}! تعرف على أحدث منتجاتنا هذا الأسبوع.',
    );
  }

  /**
   * إشعار للمستخدمين غير النشطين - كل جمعة
   */
  @Cron('0 12 * * 5')
  async reEngageInactiveUsers(): Promise<void> {
    this.logger.log('🔄 Re-engaging inactive users...');

    await this.notificationService.sendBatchNotifications(
      '💝 نشتاق إليك!',
      'مرحباً {name}! لدينا عروض خاصة لك. عد إلينا!',
    );
  }
}

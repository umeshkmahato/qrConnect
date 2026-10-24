import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  profile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, phone: true, fullName: true, email: true,
        status: true, platformRole: true, createdAt: true,
      },
    });
  }

  updateProfile(userId: string, dto: { fullName?: string; email?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data: dto });
  }

  async registerDevice(userId: string, fcmToken: string, platform: string) {
    return this.prisma.userDevice.upsert({
      where: { fcmToken },
      create: { userId, fcmToken, platform },
      update: { userId, platform, lastSeenAt: new Date() },
    });
  }
}

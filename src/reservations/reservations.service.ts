import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  private toDate(value: string) {
    const d = new Date(value);
    if (isNaN(d.getTime()))
      throw new BadRequestException('Invalid date format');
    return d;
  }

  private hasConflict(roomId: number, startAt: Date, endAt: Date) {
    return this.prisma.reservation.findFirst({
      where: {
        roomId,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true, startAt: true, endAt: true },
    });
  }

  async create(userId: number, dto: CreateReservationDto) {
    const startAt = this.toDate(dto.startAt);
    const endAt = this.toDate(dto.endAt);

    if (endAt <= startAt)
      throw new BadRequestException('endAt must be after startAt');

    if (dto.repeatWeeks && dto.repeatWeeks > 0) {
      return this.createRecurring(userId, dto, startAt, endAt);
    }

    const conflict = await this.hasConflict(dto.roomId, startAt, endAt);
    if (conflict)
      throw new BadRequestException(
        'Room is already reserved in that time slot',
      );

    return this.prisma.reservation.create({
      data: { title: dto.title, roomId: dto.roomId, userId, startAt, endAt },
    });
  }

  private async createRecurring(
    userId: number,
    dto: CreateReservationDto,
    startAt: Date,
    endAt: Date,
  ) {
    const weeks = dto.repeatWeeks ?? 1;
    const recurringId = randomUUID();

    for (let i = 0; i < weeks; i++) {
      const s = new Date(startAt);
      const e = new Date(endAt);
      s.setDate(s.getDate() + 7 * i);
      e.setDate(e.getDate() + 7 * i);

      const conflict = await this.hasConflict(dto.roomId, s, e);
      if (conflict)
        throw new BadRequestException(`Recurring conflict at week ${i + 1}`);
    }

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < weeks; i++) {
        const s = new Date(startAt);
        const e = new Date(endAt);
        s.setDate(s.getDate() + 7 * i);
        e.setDate(e.getDate() + 7 * i);

        await tx.reservation.create({
          data: {
            title: dto.title,
            roomId: dto.roomId,
            userId,
            startAt: s,
            endAt: e,
            recurringId,
          },
        });
      }
    });

    return { recurringId, created: weeks };
  }

  findAll() {
    return this.prisma.reservation.findMany({
      orderBy: { startAt: 'asc' },
      include: {
        room: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  remove(id: number, userId: number) {
    return this.prisma.reservation.deleteMany({ where: { id, userId } });
  }

  removeSeries(recurringId: string, userId: number) {
    return this.prisma.reservation.deleteMany({
      where: { recurringId, userId },
    });
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { randomUUID } from 'crypto';

type Role = 'USER' | 'ADMIN';

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  private toDate(value: string) {
    const d = new Date(value);
    if (isNaN(d.getTime()))
      throw new BadRequestException('Invalid date format');
    return d;
  }

  private hasConflict(
    roomId: number,
    startAt: Date,
    endAt: Date,
    ignoreId?: number,
  ) {
    return this.prisma.reservation.findFirst({
      where: {
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
        roomId,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true, startAt: true, endAt: true },
    });
  }

  // CREATE: vsak prijavljen user
  async create(userId: number, dto: CreateReservationDto) {
    const startAt = this.toDate(dto.startAt);
    const endAt = this.toDate(dto.endAt);

    if (endAt <= startAt)
      throw new BadRequestException('endAt must be after startAt');

    // recurring
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

    // najprej preverimo vse termine
    for (let i = 0; i < weeks; i++) {
      const s = new Date(startAt);
      const e = new Date(endAt);
      s.setDate(s.getDate() + 7 * i);
      e.setDate(e.getDate() + 7 * i);

      const conflict = await this.hasConflict(dto.roomId, s, e);
      if (conflict)
        throw new BadRequestException(`Recurring conflict at week ${i + 1}`);
    }

    // potem ustvarimo v transakciji
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
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  findOne(id: number) {
    return this.prisma.reservation.findUnique({
      where: { id },
      include: {
        room: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  // UPDATE: USER samo svoje, ADMIN vse
  async update(
    id: number,
    userId: number,
    role: Role,
    dto: UpdateReservationDto,
  ) {
    const existing = await this.prisma.reservation.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        roomId: true,
        startAt: true,
        endAt: true,
        title: true,
      },
    });
    if (!existing) throw new BadRequestException('Reservation not found');

    if (role !== 'ADMIN' && existing.userId !== userId) {
      throw new BadRequestException('Not allowed');
    }

    const roomId = dto.roomId ?? existing.roomId;
    const startAt = dto.startAt ? this.toDate(dto.startAt) : existing.startAt;
    const endAt = dto.endAt ? this.toDate(dto.endAt) : existing.endAt;

    if (endAt <= startAt)
      throw new BadRequestException('endAt must be after startAt');

    const conflict = await this.hasConflict(roomId, startAt, endAt, id);
    if (conflict)
      throw new BadRequestException(
        'Room is already reserved in that time slot',
      );

    return this.prisma.reservation.update({
      where: { id },
      data: {
        title: dto.title ?? existing.title,
        roomId,
        startAt,
        endAt,
      },
    });
  }

  // DELETE: USER samo svoje, ADMIN vse
  async remove(id: number, userId: number, role: Role) {
    if (role === 'ADMIN') {
      return this.prisma.reservation.delete({ where: { id } });
    }
    return this.prisma.reservation.deleteMany({ where: { id, userId } });
  }

  // DELETE SERIES: USER samo svoje, ADMIN vse
  async removeSeries(recurringId: string, userId: number, role: Role) {
    if (role === 'ADMIN') {
      return this.prisma.reservation.deleteMany({ where: { recurringId } });
    }
    return this.prisma.reservation.deleteMany({
      where: { recurringId, userId },
    });
  }
}

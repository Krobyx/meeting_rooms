import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateReservationDto {
  @IsOptional()
  @IsInt()
  roomId?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;
}

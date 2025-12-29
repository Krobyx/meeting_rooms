import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsInt()
  @Min(1)
  capacity: number;
}

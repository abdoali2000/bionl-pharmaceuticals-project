import { IsUUID, IsInt, Min } from 'class-validator';

export class ReorderImageItemDto {
  @IsUUID()
  id!: string;

  @IsInt()
  @Min(1)
  displayOrder!: number;
}

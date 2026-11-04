import { IsIn, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { NAVIGATION_METHODS } from '../schemas/visit.schema';
export class CreateVisitDto {
  @IsMongoId() userId!: string;
  @IsString() @MaxLength(80) address!: string;
  @IsIn(NAVIGATION_METHODS) method!: typeof NAVIGATION_METHODS[number];
  @IsOptional() @IsString() @MaxLength(160) title?: string;
}

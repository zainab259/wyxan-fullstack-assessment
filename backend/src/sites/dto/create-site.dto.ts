import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';
export class CreateSiteDto {
  @IsString() @MinLength(3) @MaxLength(80) address!: string;
  @IsString() @MinLength(1) @MaxLength(120) title!: string;
  @IsString() @MinLength(1) @MaxLength(40000) html!: string;
  @IsMongoId() authorId!: string;
}

import { IsOptional, IsEnum, IsInt, Min, Max, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Genre } from '../entities/movie.entity';

export class SearchMoviesDto {
  @ApiPropertyOptional({
    enum: Genre,
    description: 'Filtrar por género de la película',
    example: Genre.SCIFI,
  })
  @IsOptional()
  @IsEnum(Genre)
  genre?: Genre;

  @ApiPropertyOptional({
    description: 'Filtrar por año de estreno (1888-2030)',
    example: 2010,
    minimum: 1888,
    maximum: 2030,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(2030)
  year?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por calificación mínima (0.0-10.0)',
    example: 8.5,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  minRating?: number;
}

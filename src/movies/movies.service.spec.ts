import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MoreThanOrEqual, ObjectLiteral, Repository } from 'typeorm';
import { MoviesService } from './movies.service';
import { Movie } from './entities/movie.entity';
import { Genre } from './entities/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepository = <T extends ObjectLiteral = any>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  merge: jest.fn(),
  remove: jest.fn(),
});

const movieData: CreateMovieDto = {
  title: 'Inception',
  director: 'Christopher Nolan',
  genre: Genre.SCIFI,
  year: 2010,
  rating: 8.8,
  synopsis: 'A thief who steals corporate secrets through the use of dream-sharing technology.',
};

const mockMovie: Movie = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: movieData.title,
  director: movieData.director,
  genre: movieData.genre,
  year: movieData.year,
  rating: movieData.rating,
  synopsis: movieData.synopsis ?? '',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('MoviesService', () => {
  let service: MoviesService;
  let repository: MockRepository<Movie>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: getRepositoryToken(Movie),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    repository = module.get<MockRepository<Movie>>(getRepositoryToken(Movie));
  });

  // Prueba 1
  it('El servicio debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('search()', () => {
    it('B1: search() sin filtros debe llamar a repository.find con where vacío y retornar todas las películas', async () => {
      repository.find!.mockResolvedValue([mockMovie]);
      const result = await service.search({});
      expect(repository.find).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual([mockMovie]);
    });

    it('B2: search({ genre: "drama" }) debe llamar a repository.find con where: { genre: "drama" }', async () => {
      repository.find!.mockResolvedValue([]);
      await service.search({ genre: Genre.DRAMA });
      expect(repository.find).toHaveBeenCalledWith({
        where: { genre: Genre.DRAMA },
      });
    });

    it('B3: search({ year: 2010 }) debe llamar a repository.find con where: { year: 2010 }', async () => {
      repository.find!.mockResolvedValue([]);
      await service.search({ year: 2010 });
      expect(repository.find).toHaveBeenCalledWith({
        where: { year: 2010 },
      });
    });

    it('B4: search({ minRating: 8.0 }) debe llamar a repository.find con where: { rating: MoreThanOrEqual(8.0) }', async () => {
      repository.find!.mockResolvedValue([]);
      await service.search({ minRating: 8.0 });
      expect(repository.find).toHaveBeenCalledWith({
        where: { rating: MoreThanOrEqual(8.0) },
      });
    });

    it('B5: search({ genre, year, minRating }) debe combinar los tres filtros en el where', async () => {
      repository.find!.mockResolvedValue([]);
      const filters = { genre: Genre.ACTION, year: 2020, minRating: 7.5 };
      await service.search(filters);
      expect(repository.find).toHaveBeenCalledWith({
        where: {
          genre: Genre.ACTION,
          year: 2020,
          rating: MoreThanOrEqual(7.5),
        },
      });
    });

    it('B6: search() debe retornar un array vacío si el repositorio no encuentra coincidencias', async () => {
      repository.find!.mockResolvedValue([]);
      const result = await service.search({ genre: Genre.HORROR });
      expect(result).toEqual([]);
    });
  });
});

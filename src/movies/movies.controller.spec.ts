import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { Genre } from './entities/movie.entity';
import { Movie } from './entities/movie.entity';

const mockMoviesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  search: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const _movieData = {
  title: 'Inception',
  director: 'Christopher Nolan',
  genre: 'sci-fi',
  year: 2010,
  rating: 8.8,
  synopsis: 'A thief who steals corporate secrets through the use of dream-sharing technology.',
};

const mockMovie: Movie = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Inception',
  director: 'Christopher Nolan',
  genre: Genre.SCIFI,
  year: 2010,
  rating: 8.8,
  synopsis: 'A thief who steals corporate secrets through the use of dream-sharing technology.',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const _validUuid = '550e8400-e29b-41d4-a716-446655440000';
const _invalidUuid = 'not-a-valid-uuid';
const _nonExistentUuid = '00000000-0000-4000-a000-000000000000';

describe('MoviesController (Integration)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        errorHttpStatusCode: 422,
      }),
    );
    await app.init();

    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /movies/search', () => {
    it('C1: GET /movies/search debe retornar 200 y llamar a service.search con {}', async () => {
      mockMoviesService.search.mockResolvedValue([mockMovie]);
      const response = await request(app.getHttpServer()).get('/movies/search').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(mockMoviesService.search).toHaveBeenCalledWith({});
    });

    it('C2: GET /movies/search?genre=drama debe retornar 200 y llamar a service.search con { genre: "drama" }', async () => {
      mockMoviesService.search.mockResolvedValue([]);
      await request(app.getHttpServer()).get('/movies/search?genre=drama').expect(200);

      expect(mockMoviesService.search).toHaveBeenCalledWith({
        genre: 'drama',
      });
    });

    it('C3: GET /movies/search?year=2010&minRating=8.5 debe retornar 200 y llamar a service.search con números', async () => {
      mockMoviesService.search.mockResolvedValue([]);
      await request(app.getHttpServer()).get('/movies/search?year=2010&minRating=8.5').expect(200);

      expect(mockMoviesService.search).toHaveBeenCalledWith({
        year: 2010,
        minRating: 8.5,
      });
    });

    it('C4: GET /movies/search?genre=invalid debe retornar 422', async () => {
      await request(app.getHttpServer()).get('/movies/search?genre=invalid').expect(422);
    });

    it('C5: GET /movies/search?year=1500 debe retornar 422', async () => {
      await request(app.getHttpServer()).get('/movies/search?year=1500').expect(422);
    });

    it('C6: GET /movies/search?minRating=11 debe retornar 422', async () => {
      await request(app.getHttpServer()).get('/movies/search?minRating=11').expect(422);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Movie } from '../src/movies/entities/movie.entity';

const _movieData = {
  title: 'Inception',
  director: 'Christopher Nolan',
  genre: 'sci-fi',
  year: 2010,
  rating: 8.8,
  synopsis: 'A thief who steals corporate secrets through the use of dream-sharing technology.',
};

const _updateData = {
  rating: 9.0,
  synopsis: 'Updated synopsis for testing purposes.',
};

const _invalidUuid = 'not-a-valid-uuid';
const _nonExistentUuid = '00000000-0000-4000-a000-000000000000';

describe('Movies E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let _createdMovieId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        errorHttpStatusCode: 422,
      }),
    );
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    await dataSource.query('DELETE FROM movies');
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM movies');
    await app.close();
  });

  describe('GET /movies/search', () => {
    const seedMovies = [
      { title: 'Inception', director: 'C. Nolan', genre: 'sci-fi', year: 2010, rating: 8.8 },
      { title: 'Interstellar', director: 'C. Nolan', genre: 'sci-fi', year: 2014, rating: 8.6 },
      { title: 'The Godfather', director: 'F. Coppola', genre: 'drama', year: 1972, rating: 9.2 },
      { title: 'Pulp Fiction', director: 'Q. Tarantino', genre: 'drama', year: 1994, rating: 8.9 },
      { title: 'The Dark Knight', director: 'C. Nolan', genre: 'action', year: 2008, rating: 9.0 },
      { title: 'Toy Story', director: 'J. Lasseter', genre: 'animation', year: 1995, rating: 8.3 },
    ];

    beforeAll(async () => {
      await dataSource.query('DELETE FROM movies');
      await dataSource.getRepository('Movie').save(seedMovies);
    });

    it('D1: GET /movies/search debe retornar las 6 películas sembradas', async () => {
      const response = await request(app.getHttpServer()).get('/movies/search').expect(200);
      expect(response.body.length).toBe(6);
    });

    it('D2: GET /movies/search?genre=sci-fi debe retornar 2 películas', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/search?genre=sci-fi')
        .expect(200);
      expect(response.body.length).toBe(2);
      const titles = response.body.map((m: Movie) => m.title);
      expect(titles).toContain('Inception');
      expect(titles).toContain('Interstellar');
    });

    it('D3: GET /movies/search?year=1994 debe retornar 1 película (Pulp Fiction)', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/search?year=1994')
        .expect(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('Pulp Fiction');
    });

    it('D4: GET /movies/search?minRating=9.0 debe retornar 2 películas', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/search?minRating=9.0')
        .expect(200);
      expect(response.body.length).toBe(2);
      const titles = response.body.map((m: Movie) => m.title);
      expect(titles).toContain('The Godfather');
      expect(titles).toContain('The Dark Knight');
    });

    it('D5: GET /movies/search?genre=drama&minRating=9.0 debe retornar 1 película (The Godfather)', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/search?genre=drama&minRating=9.0')
        .expect(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('The Godfather');
    });

    it('D6: GET /movies/search?genre=horror debe retornar 0 películas', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/search?genre=horror')
        .expect(200);
      expect(response.body).toEqual([]);
    });

    it('D7: GET /movies/search?year=2030 debe retornar 0 películas', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/search?year=2030')
        .expect(200);
      expect(response.body).toEqual([]);
    });

    it('D8: GET /movies/search?year=invalid debe retornar 422', async () => {
      await request(app.getHttpServer()).get('/movies/search?year=invalid').expect(422);
    });
  });
});

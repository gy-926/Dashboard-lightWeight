import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';
import { QueryUsersDto } from './query-users.dto.js';

describe('QueryUsersDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
  const metadata: ArgumentMetadata = {
    type: 'query',
    metatype: QueryUsersDto,
  };

  it('converts valid URL query strings into typed values', async () => {
    const query = await pipe.transform(
      {
        skip: '5',
        take: '20',
        queryKeys: 'name, email',
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      },
      metadata,
    );

    expect(query).toBeInstanceOf(QueryUsersDto);
    expect(query).toMatchObject({
      skip: 5,
      take: 20,
      queryKeys: ['name', 'email'],
      queryMode: 'fuzzy',
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    });
  });

  it.each([
    { queryKeys: 'password' },
    { skip: '-1' },
    { take: '101' },
    { sortBy: 'password' },
    { sortOrder: 'DOWN' },
  ])('rejects invalid query parameters: %o', async (input) => {
    await expect(pipe.transform(input, metadata)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('defaults to name ascending order', async () => {
    const query = await pipe.transform({}, metadata);

    expect(query).toMatchObject({ sortBy: 'name', sortOrder: 'ASC' });
  });
});

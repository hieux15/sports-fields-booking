import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryCourtsDto } from './query-courts.dto';

/** Chạy đúng luồng của ValidationPipe toàn cục: transform trước, validate sau. */
function validateQuery(query: Record<string, unknown>) {
  return validate(plainToInstance(QueryCourtsDto, query));
}

describe('QueryCourtsDto', () => {
  it('chấp nhận đúng key enum SportType', async () => {
    for (const type of [
      'FOOTBALL',
      'BADMINTON',
      'TENNIS',
      'PICKLEBALL',
      'BASKETBALL',
      'OTHER',
    ]) {
      expect(await validateQuery({ type })).toHaveLength(0);
    }
  });

  it('từ chối biến thể text tự do (nhãn tiếng Việt, hoa/thường, khoảng trắng)', async () => {
    for (const type of ['Bóng đá', 'bong da', 'football', 'FOOTBALL ', '']) {
      const errors = await validateQuery({ type });

      expect(errors.some((error) => error.property === 'type')).toBe(true);
    }
  });

  it('cho phép bỏ trống type', async () => {
    expect(await validateQuery({})).toHaveLength(0);
  });
});

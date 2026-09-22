import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCourtDto } from './create-court.dto';

const validCourt = {
  name: 'Sân bóng đá Mini Cầu Giấy 1',
  type: 'Bóng đá',
  address: 'Cầu Giấy, Hà Nội',
  pricePerHour: 200000,
  openTime: '06:00',
  closeTime: '22:00',
};

/** Chạy đúng luồng của ValidationPipe toàn cục: transform trước, validate sau. */
function validatePayload(payload: Record<string, unknown>) {
  return validate(plainToInstance(CreateCourtDto, payload));
}

describe('CreateCourtDto', () => {
  it('chấp nhận payload hợp lệ', async () => {
    expect(await validatePayload(validCourt)).toHaveLength(0);
  });

  it.each(['abc', '6:00', '24:00', '23:60', '6h', ''])(
    'từ chối openTime không đúng định dạng HH:mm (openTime="%s")',
    async (openTime) => {
      const errors = await validatePayload({ ...validCourt, openTime });

      expect(errors.some((error) => error.property === 'openTime')).toBe(true);
    },
  );

  it('từ chối closeTime không đúng định dạng HH:mm', async () => {
    const errors = await validatePayload({ ...validCourt, closeTime: '22h' });

    expect(errors.some((error) => error.property === 'closeTime')).toBe(true);
  });

  it('từ chối giá thuê ngoài khoảng cho phép', async () => {
    const tooCheap = await validatePayload({
      ...validCourt,
      pricePerHour: 5000,
    });
    const tooExpensive = await validatePayload({
      ...validCourt,
      pricePerHour: 20000000,
    });

    expect(tooCheap.some((error) => error.property === 'pricePerHour')).toBe(
      true,
    );
    expect(
      tooExpensive.some((error) => error.property === 'pricePerHour'),
    ).toBe(true);
  });

  it('từ chối tên/loại sân rỗng', async () => {
    const errors = await validatePayload({
      ...validCourt,
      name: '',
      type: '',
    });

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['name', 'type']),
    );
  });
});

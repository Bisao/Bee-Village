
import InputValidationService from '../../game/services/InputValidationService';

describe('InputValidationService', () => {
  let service;

  beforeEach(() => {
    service = new InputValidationService();
  });

  test('validates position input correctly', () => {
    expect(service.validateInput({ x: 1, y: 1 }, 'position')).toBe(true);
    expect(service.validateInput({ x: 'a', y: 1 }, 'position')).toBe(false);
  });
});

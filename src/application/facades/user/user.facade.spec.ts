import { UserFacade } from './user.facade';
import { UserService } from '../../../domain/user/services/user.service';

describe('UserFacade', () => {
  let userFacade: UserFacade;
  let userService: Partial<UserService>;

  beforeEach(() => {
    userService = {
      createUser: jest.fn(),
      chargePoint: jest.fn(),
      getPoint: jest.fn(),
    };
    userFacade = new UserFacade(userService as UserService);
  });

  it('should create a user', async () => {
    await userFacade.createUser(1, 'Test User');
    expect(userService.createUser).toHaveBeenCalledWith(1, 'Test User');
  });

  it('should charge points', async () => {
    await userFacade.chargePoint(1, 100);
    expect(userService.chargePoint).toHaveBeenCalledWith(1, 100);
  });

  it('should check user points', async () => {
    await userFacade.checkPoint(1);
    expect(userService.getPoint).toHaveBeenCalledWith(1);
  });
});

import jwt from 'jsonwebtoken';
import { jsonResponse } from '../api-response';

export const createToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

export const sendTokenResponse = (user: any, statusCode = 200) => {
  const token = createToken(user._id ? user._id.toString() : user.id);
  return jsonResponse(
    {
      success: true,
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
    statusCode
  );
};

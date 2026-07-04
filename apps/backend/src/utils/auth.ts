import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;

export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, SALT_ROUNDS);

export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

type TokenUser = {
  id: string;
  username?: string;
  email?: string;
  name?: string;
};

export const signAccessToken = (user: TokenUser): string =>
  jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY } as jwt.SignOptions
  );

export const signRefreshToken = (user: TokenUser): string =>
  jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY } as jwt.SignOptions
  );

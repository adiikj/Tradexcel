import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import prisma from "../db/prisma.js";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
} from "../utils/auth.js";
import { google } from "googleapis";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/mailer.js";
import { otpEmailTemplate } from "../services/emailTemplates.js";
import { recordLogin } from "../services/streak.js";

const randomAvatars = [
  "https://res.cloudinary.com/dcpudiuoh/image/upload/v1736361259/rf2tm0acjgmcawzvardw.png",
  "https://res.cloudinary.com/dcpudiuoh/image/upload/v1736361259/stel0tavrlhrxxvfq0mj.png",
  "https://res.cloudinary.com/dcpudiuoh/image/upload/v1736361259/fh6ryx53hoc9ioxgzz6n.png",
  "https://res.cloudinary.com/dcpudiuoh/image/upload/v1736361259/zbwoszxkryveenz5d2am.png",
  "https://res.cloudinary.com/dcpudiuoh/image/upload/v1736361259/jrcjbhxn0njurj9u71vr.png",
];

const pickRandomAvatar = () =>
  randomAvatars[Math.floor(Math.random() * randomAvatars.length)];

// Starting virtual cash every new wallet is seeded with.
const STARTING_BALANCE = "100000";

const PUBLIC_USER_FIELDS = {
  id: true,
  name: true,
  username: true,
  email: true,
  avatar: true,
  dob: true,
  otpVerified: true,
  createdAt: true,
  currentStreak: true,
  longestStreak: true,
} as const;

async function sendOtpEmail(email: string, otp: string) {
  try {
    const { html, text } = otpEmailTemplate(otp);
    await sendEmail({
      to: email,
      subject: "Your Tradexcel verification code",
      html,
      text,
    });
  } catch (error: any) {
    console.error("Error sending OTP email:", error.message);
    throw new ApiError(500, "Error sending verification email");
  }
}

function generateOtp() {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  return { otp, otpExpiry };
}

async function generateUniqueUsername(seed: string) {
  const base = seed.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15) || "user";
  let candidate = base;
  let suffix = 0;
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
}

const generateAccessAndRefreshTokens = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    console.error("Error generating tokens:", error);
    throw new ApiError(500, "Error generating tokens");
  }
};

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: "none" as const,
  path: "/",
  expires: new Date(Date.now() + 3600000),
};

async function issueSession(userId: string, res: any, message: string, recordStreak = true) {
  if (recordStreak) {
    await recordLogin(userId).catch((error) => console.error("Error recording login streak:", error));
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: PUBLIC_USER_FIELDS,
  });

  return res
    .status(200)
    .cookie("accessToken", accessToken, AUTH_COOKIE_OPTIONS)
    .cookie("refreshToken", refreshToken, AUTH_COOKIE_OPTIONS)
    .json(new ApiResponse(200, message, { user, accessToken, refreshToken }));
}

const refreshAccessToken = asyncHandler(async (req: any, res: any) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  let decodedToken: any;
  try {
    decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET as string);
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: decodedToken?.id } });
  if (!user) {
    throw new ApiError(404, "Invalid refresh token");
  }

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh Token is expired or used");
  }

  return issueSession(user.id, res, "Access token refreshed successfully", false);
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "name is required"),
  username: z
    .string()
    .trim()
    .min(3, "username must be at least 3 characters")
    .max(20, "username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "username can only contain letters, numbers, and underscores"),
  email: z.string().trim().toLowerCase().email("invalid email address"),
  password: z.string().min(8, "password must be at least 8 characters"),
  pin: z.string().regex(/^\d{4}$/, "pin must be exactly 4 digits"),
  dob: z.coerce.date().optional(),
});

const registerUser = asyncHandler(async (req: any, res: any) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }
  const { name, username, email, password, pin, dob } = parsed.data;

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existingUser) {
    if (existingUser.otpVerified) {
      throw new ApiError(400, "Email or username is already registered.");
    }
    // Abandoned/unverified signup with the same identity - clear it and retry fresh.
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  const [hashedPassword, hashedPin] = await Promise.all([
    hashPassword(password),
    hashPassword(pin),
  ]);
  const { otp, otpExpiry } = generateOtp();

  await prisma.user.create({
    data: {
      name,
      username,
      email,
      password: hashedPassword,
      pin: hashedPin,
      dob,
      avatar: pickRandomAvatar(),
      otp,
      otpExpiry,
      otpVerified: false,
    },
  });

  await sendOtpEmail(email, otp);

  res.status(200).json(
    new ApiResponse(200, "Registered. Check your email for the verification code.", null)
  );
});

// Creates the wallet and logs the user in on first successful verification.
const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: z.string().trim().length(6, "otp must be 6 digits"),
});

const verifyOTP = asyncHandler(async (req: any, res: any) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }
  const { email, otp } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(404, "No pending signup found for this email.");
  }
  if (user.otpVerified) {
    throw new ApiError(400, "This account is already verified.");
  }
  if (user.otp !== otp) {
    throw new ApiError(400, "Invalid verification code.");
  }
  if (!user.otpExpiry || Date.now() > user.otpExpiry.getTime()) {
    throw new ApiError(400, "Verification code has expired.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { otpVerified: true, otp: null, otpExpiry: null },
    });
    await tx.wallet.create({
      data: { userId: user.id, balance: STARTING_BALANCE },
    });
  });

  return issueSession(user.id, res, "Email verified. You're logged in.");
});

const loginSchema = z
  .object({
    emailOrUsername: z.string().trim().min(1, "email or username is required"),
    password: z.string().optional(),
    pin: z.string().optional(),
  })
  .refine((data) => Boolean(data.password) !== Boolean(data.pin), {
    message: "Provide either password or pin, not both",
    path: ["password"],
  });

const loginUser = asyncHandler(async (req: any, res: any) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }
  const { emailOrUsername, password, pin } = parsed.data;

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: emailOrUsername }, { username: emailOrUsername }] },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (!user.otpVerified) {
    throw new ApiError(403, "Please verify your email before logging in.");
  }

  const credential = password ?? pin!;
  const storedHash = password ? user.password : user.pin;

  if (!storedHash) {
    if (user.googleId) {
      throw new ApiError(
        400,
        `This account uses Google Sign-In. Continue with Google, or set a ${
          password ? "password" : "PIN"
        } from your profile to enable this login method.`
      );
    }
    throw new ApiError(
      400,
      password ? "This account has no password set - try logging in with your PIN." : "This account has no PIN set."
    );
  }

  const isValid = await verifyPassword(credential, storedHash);
  if (!isValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  return issueSession(user.id, res, "User logged in successfully");
});

// New Google accounts still go through the OTP-email step like password signups.
const googleLoginSchema = z.object({
  idToken: z.string().min(1, "idToken is required"),
});

const googleLogin = asyncHandler(async (req: any, res: any) => {
  const parsed = googleLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }

  const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID);
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: parsed.data.idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error: any) {
    throw new ApiError(401, "Invalid Google ID token");
  }

  if (!payload?.email || !payload.email_verified) {
    throw new ApiError(401, "Google account email is not verified");
  }

  const existingByGoogleId = await prisma.user.findUnique({
    where: { googleId: payload.sub },
  });
  if (existingByGoogleId) {
    return issueSession(existingByGoogleId.id, res, "User logged in successfully");
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existingByEmail) {
    const linked = await prisma.user.update({
      where: { id: existingByEmail.id },
      data: { googleId: payload.sub },
    });
    if (linked.otpVerified) {
      return issueSession(linked.id, res, "User logged in successfully");
    }
    // Had signed up before but never finished verifying - re-send the code.
    const { otp, otpExpiry } = generateOtp();
    await prisma.user.update({ where: { id: linked.id }, data: { otp, otpExpiry } });
    await sendOtpEmail(linked.email, otp);
    return res
      .status(200)
      .json(new ApiResponse(200, "Verify the code we emailed you to finish signing in.", { email: linked.email }));
  }

  const username = await generateUniqueUsername(payload.email.split("@")[0]);
  const { otp, otpExpiry } = generateOtp();

  await prisma.user.create({
    data: {
      name: payload.name ?? username,
      username,
      email: payload.email,
      googleId: payload.sub,
      avatar: payload.picture ?? pickRandomAvatar(),
      otp,
      otpExpiry,
      otpVerified: false,
    },
  });

  await sendOtpEmail(payload.email, otp);

  res
    .status(200)
    .json(new ApiResponse(200, "Almost there - verify the code we emailed you.", { email: payload.email }));
});

const logoutUser = asyncHandler(async (req: any, res: any) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { refreshToken: null },
  });

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "strict" as const,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully", null));
});

const getName = asyncHandler(async (req: any, res: any) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { name: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  res.status(200).json(new ApiResponse(200, "Name fetched successfully", { name: user.name }));
});

const getProfile = asyncHandler(async (req: any, res: any) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { ...PUBLIC_USER_FIELDS, googleId: true, password: true, pin: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Never leak the raw googleId/password/pin, only whether each is set.
  const { googleId, password, pin, ...publicFields } = user;
  res.status(200).json(
    new ApiResponse(200, "Profile fetched successfully", {
      ...publicFields,
      hasGoogleLogin: Boolean(googleId),
      hasPassword: Boolean(password),
      hasPin: Boolean(pin),
    })
  );
});

const changePasswordPinSchema = z.object({
  oldPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
  oldPin: z.string().optional(),
  newPin: z.string().regex(/^\d{4}$/).optional(),
});

// oldPassword/oldPin are only required when the account already has one.
const changeCurrentPasswordAndPin = asyncHandler(async (req: any, res: any) => {
  const parsed = changePasswordPinSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }
  const { oldPassword, newPassword, oldPin, newPin } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const updateData: { password?: string; pin?: string } = {};

  if (newPassword) {
    if (user.password && (!oldPassword || !(await verifyPassword(oldPassword, user.password)))) {
      throw new ApiError(401, "Invalid old password");
    }
    updateData.password = await hashPassword(newPassword);
  }

  if (newPin) {
    if (user.pin && (!oldPin || !(await verifyPassword(oldPin, user.pin)))) {
      throw new ApiError(401, "Invalid old PIN");
    }
    updateData.pin = await hashPassword(newPin);
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "Nothing to update");
  }

  await prisma.user.update({ where: { id: user.id }, data: updateData });

  return res.status(200).json(new ApiResponse(200, "Password and/or PIN changed successfully", null));
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  dob: z.coerce.date().optional(),
});

const updateUser = asyncHandler(async (req: any, res: any) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }

  if (Object.keys(parsed.data).length === 0) {
    throw new ApiError(400, "No fields provided for update");
  }

  const user = await prisma.user.update({
    where: { id: req.user?.id },
    data: parsed.data,
    select: PUBLIC_USER_FIELDS,
  });

  return res.status(200).json(new ApiResponse(200, "User details updated successfully", user));
});

const getAvatar = asyncHandler(async (req: any, res: any) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { avatar: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (!user.avatar) {
    throw new ApiError(404, "Avatar not found");
  }

  res.status(200).json(new ApiResponse(200, "Avatar fetched successfully", { avatar: user.avatar }));
});

const updateAvatar = asyncHandler(async (req: any, res: any) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar?.url) {
    throw new ApiError(500, "Error uploading avatar");
  }

  const user = await prisma.user.update({
    where: { id: req.user?.id },
    data: { avatar: avatar.url },
    select: PUBLIC_USER_FIELDS,
  });

  return res.status(200).json(new ApiResponse(200, "Avatar updated successfully", user));
});

export {
  registerUser,
  loginUser,
  googleLogin,
  logoutUser,
  verifyOTP,
  refreshAccessToken,
  getName,
  updateUser,
  getProfile,
  changeCurrentPasswordAndPin,
  getAvatar,
  updateAvatar,
};

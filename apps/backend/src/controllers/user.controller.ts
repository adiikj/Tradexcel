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
import twilio from "twilio";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

dotenv.config();

//Email Configuration
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const { token } = await oAuth2Client.getAccessToken();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
        user: process.env.GOOGLE_GMAIL_ID,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: token,
  }
} as any);

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

// Utility function to generate tokens
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
    console.error("Error generating tokens:", error);
    throw new ApiError(500, "Error generating tokens");
  }
};

const refreshAccessToken = asyncHandler(async (req: any, res: any) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodedToken: any = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    );

    const user = await prisma.user.findUnique({ where: { id: decodedToken?.id } });
    if (!user) {
      throw new ApiError(404, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user.id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken } as any,
          "Access Token refreshed successfully"
        )
      );
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// User Login
const loginUser = asyncHandler(async (req: any, res: any) => {
  const { emailOrUsername, password, pin } = req.body;
  console.log("Login Request:", req.body);

  if (!emailOrUsername || !password || !pin) {
    throw new ApiError(400, "Email or Username, Password, and PIN are required");
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
    },
  });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await verifyPassword(password, user.password);

  if (!isPasswordValid) {
    res.status(401).json({ message: "Invalid credentials" });
    throw new ApiError(401, "Invalid credentials");
  }

  if (user.pin !== pin) {
    res.status(403).json({ message: "Invalid PIN" });
    throw new ApiError(403, "Invalid PIN");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

  const loggedInUser = await prisma.user.findUnique({
    where: { id: user.id },
    omit: { password: true, refreshToken: true, pin: true },
  });

  const options = {
    httpOnly: true,
    secure: false,
    sameSite: "none", // Cross-origin cookies
    path: "/",
    expires: new Date(Date.now() + 3600000),
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      status: 200,
      data: { user: loggedInUser, accessToken, refreshToken },
      message: "User logged in successfully",
    });
});

// User Logout
const logoutUser = asyncHandler(async (req: any, res: any) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { refreshToken: null },
  });

  const options = {
    httpOnly: true,
    secure: true, // Set to true in production
    sameSite: "strict",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully", null));
});

// Generate OTP and expiry
const generateOTP = async (contact: any, otpMethod: any, countryCode: any) => {
  const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expiry: 10 minutes

  if (otpMethod === "email") {
    // Send OTP via email
    await sendOTP(contact, null, otpMethod, otp, null); // Pass email as the first parameter
  } else if (otpMethod === "phone") {
    // Send OTP via phone
    await sendOTP(null, contact, otpMethod, otp, countryCode); // Pass phoneNumber and countryCode
  } else {
    throw new Error("Invalid OTP method");
  }

  return { otp: String(otp), otpExpiry };
};

// Utility function to send OTP via email or SMS
const sendOTP = async (email: any, phoneNumber: any, otpMethod: any, otp: any, countryCode: any) => {
  if (otpMethod === "email") {
    // Ensure email is provided for email-based OTP
    if (!email) {
      throw new ApiError(400, "Email is required for OTP method 'email'");
    }

    const mailOptions = {
      from: process.env.GOOGLE_GMAIL_ID,
      to: email, // Use email directly
      subject: "Welcome to TradeXcel",
      html : `<h3>Your OTP Code for TradeXcel Registration is <b>${otp}</b>. It is valid for 10 minutes.</h3>`,
      text: `Your OTP Code for TradeXcel Registration is ${otp}. It is valid for 10 minutes.`,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent: ", info.response);
    } catch (error: any) {
      console.error("Error sending OTP via email:", error);
      throw new ApiError(500, "Error sending OTP via email");
    }
  }

  else if (otpMethod === "phone") {
    // Ensure phone number and country code are provided for SMS-based OTP
    if (!phoneNumber || !countryCode) {
      throw new ApiError(400, "Phone number and country code are required for OTP method 'phone'");
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    try {
      await client.messages.create({
        body: `Your OTP for TradeXcel Registration is ${otp}. It is valid for 10 minutes.`,
        to: `${countryCode}${phoneNumber}`, // Format phone number with country code
        from: process.env.TWILIO_PHONE_NUMBER,
      });
    } catch (error: any) {
      console.error("Error sending OTP via SMS:", error);
      throw new ApiError(500, "Error sending OTP via SMS");
    }
  } else {
    throw new ApiError(400, "Invalid OTP method");
  }
};

// User Registration
const registerUser = asyncHandler(async (req: any, res: any) => {
  const { name, username, email, password, dob, phoneNumber, countryCode, pin, otpMethod } = req.body;

  // Validate required fields
  if (!name || !username || !email || !password || !dob || !phoneNumber || !countryCode || !pin || !otpMethod) {
    throw new ApiError(400, "All fields are required.");
  }

  // Validate OTP method
  if (!["email", "phone"].includes(otpMethod)) {
    throw new ApiError(400, "Invalid OTP method.");
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username },
        { AND: [{ phoneNumber }, { countryCode }] },
      ],
    },
  });

  if (existingUser) {
    throw new ApiError(400, "Email, phone number, or username is already registered.");
  }

  // Generate OTP
  const { otp, otpExpiry } = await generateOTP(
    otpMethod === "email" ? email : phoneNumber,
    otpMethod,
    countryCode
  );

  // Hash the password up front so plaintext is never stored, even temporarily.
  const hashedPassword = await hashPassword(password);

  // Assign a random avatar
  const randomAvatar = pickRandomAvatar();

  // Replace any stale pending registration for this identity, then create fresh.
  await prisma.pendingUser.deleteMany({
    where: { OR: [{ email }, { username }, { phoneNumber }] },
  });

  await prisma.pendingUser.create({
    data: {
      name,
      username,
      email,
      password: hashedPassword,
      dob: new Date(dob),
      phoneNumber,
      countryCode,
      otp,
      otpExpiry,
      otpMethod,
      otpVerified: false,
      pin,
      avatar: randomAvatar,
    },
  });

  res.status(200).json({
    message: "User registered successfully. Please verify the OTP.",
  });
});

const verifyOTP = asyncHandler(async (req: any, res: any) => {
  const { email, phoneNumber, otp, otpMethod } = req.body;

  // Ensure required fields are present
  if (!otpMethod || !otp) {
    throw new ApiError(400, "OTP method and OTP are required.");
  }

  if (otpMethod === "email" && !email) {
    throw new ApiError(400, "Email is required for email OTP method.");
  }
  if (otpMethod === "phone" && !phoneNumber) {
    throw new ApiError(400, "Phone number is required for phone OTP method.");
  }

  // Look for the pending user based on contact method
  let pendingUser;
  if (otpMethod === "email") {
    pendingUser = await prisma.pendingUser.findUnique({ where: { email } });
  } else if (otpMethod === "phone") {
    pendingUser = await prisma.pendingUser.findUnique({ where: { phoneNumber } });
  } else {
    throw new ApiError(400, "Invalid OTP method.");
  }

  if (!pendingUser) {
    throw new ApiError(404, "No pending user found.");
  }

  // Check if OTP matches
  if (pendingUser.otp !== String(otp)) {
    throw new ApiError(400, "Invalid OTP.");
  }

  // Check if OTP has expired
  if (Date.now() > pendingUser.otpExpiry.getTime()) {
    throw new ApiError(400, "OTP has expired.");
  }

  // Move user to the Users table (password is already hashed in PendingUser),
  // seeding their wallet with starting virtual cash in the same transaction.
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: pendingUser.name,
        username: pendingUser.username,
        email: pendingUser.email,
        password: pendingUser.password,
        dob: pendingUser.dob,
        phoneNumber: pendingUser.phoneNumber,
        countryCode: pendingUser.countryCode,
        otp: pendingUser.otp,
        otpVerified: true,
        pin: pendingUser.pin,
        avatar: pendingUser.avatar ?? pickRandomAvatar(),
      },
    });

    await tx.wallet.create({
      data: { userId: user.id, balance: STARTING_BALANCE },
    });

    await tx.pendingUser.delete({ where: { id: pendingUser.id } });
  });

  res.status(200).json({ message: "User verified and confirmed successfully. You can now log in." });
});

const getName = asyncHandler(async (req: any, res: any) => {
  // Fetching only the name field of the user by ID
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { name: true },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  // Return the user's name in the response
  res.status(200).json({ status: 200, data: { name: user.name } });
});

const getProfile = asyncHandler(async (req: any, res: any) => {
  // Fetching the user by ID, returning only public profile fields
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      name: true,
      email: true,
      phoneNumber: true,
      username: true,
      avatar: true,
      dob: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  // Return the user's profile in the response
  res.status(200).json({
    status: 200,
    data: {
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      username: user.username,
      avatar: user.avatar,
      dob: user.dob,
    },
  });
});

const changeCurrentPasswordAndPin = asyncHandler(async (req: any, res: any) => {
  const { oldPassword, newPassword, oldPin, newPin } = req.body;

  // Fetch user from the database
  const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const updateData: { password?: string; pin?: string } = {};

  // Update password if provided
  if (oldPassword || newPassword) {
    if (!oldPassword || !newPassword) {
      throw new ApiError(400, "Both oldPassword and newPassword are required to update the password");
    }

    const isPasswordCorrect = await verifyPassword(oldPassword, user.password);
    if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid old password");
    }

    updateData.password = await hashPassword(newPassword);
  }

  // Update PIN if provided
  if (oldPin || newPin) {
    if (!oldPin || !newPin) {
      throw new ApiError(400, "Both oldPin and newPin are required to update the PIN");
    }

    if (user.pin !== oldPin) {
      throw new ApiError(401, "Invalid old PIN");
    }

    updateData.pin = newPin;
  }

  // Save user with updated fields
  await prisma.user.update({ where: { id: user.id }, data: updateData });

  return res.status(200).json(
    new ApiResponse(200, "Password and/or PIN changed successfully", null)
  );
});

const updateUser = asyncHandler(async (req: any, res: any) => {
  const { name, username, email, phoneNumber, dob } = req.body;

  // Create a dynamic update object
  const updateFields: any = {};
  if (name) updateFields.name = name;
  if (username) updateFields.username = username;
  if (email) updateFields.email = email;
  if (phoneNumber) updateFields.phoneNumber = phoneNumber;
  if (dob) updateFields.dob = new Date(dob);

  try {
    // Check if any fields are provided for update
    if (Object.keys(updateFields).length === 0) {
      throw new ApiError(400, "No fields provided for update");
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: req.user?.id },
      data: updateFields,
      omit: { password: true },
    });

    // Respond with success
    return res.status(200).json(
      new ApiResponse(200, "User details updated successfully", user)
    );
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    // Handle unexpected errors
    throw new ApiError(500, error.message || "Internal Server Error");
  }
});

const getAvatar = asyncHandler(async (req: any, res: any) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { avatar: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if the user has an avatar
  if (!user.avatar) {
    throw new ApiError(404, "Avatar not found");
  }

  res.status(200).json({
    avatar: user.avatar, // Return the avatar URL
  });
});

const updateAvatar = asyncHandler(async (req: any, res: any) => {
  const avatarLocalPath = req.file?.path;

  // Check if avatar file exists
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // Upload avatar to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  // Check if avatar was uploaded successfully
  if (!avatar?.url) {
    throw new ApiError(500, "Error uploading avatar");
  }

  // Find user and update avatar URL
  const user = await prisma.user.update({
    where: { id: req.user?.id },
    data: { avatar: avatar.url },
    omit: { password: true },
  });

  // Return successful response
  return res.status(200).json(
    new ApiResponse(200, "Avatar updated successfully", user)
  );
});


export {
  registerUser,
  loginUser,
  logoutUser,
  verifyOTP,
  sendOTP,
  getName,
  updateUser,
  getProfile,
  changeCurrentPasswordAndPin,
  getAvatar,
  updateAvatar,
  refreshAccessToken };

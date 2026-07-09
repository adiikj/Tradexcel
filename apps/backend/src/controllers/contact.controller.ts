import { z } from "zod";
import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../services/mailer.js";
import { contactFormEmailTemplate, supportRequestEmailTemplate } from "../services/emailTemplates.js";

interface AuthRequest extends Request {
  user?: { name: string; email: string };
}

const CONTACT_DESTINATION_EMAIL = "contact@tradexcel.site";

const contactSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(100, "name is too long"),
  email: z.string().trim().email("a valid email is required").max(200, "email is too long"),
  message: z.string().trim().min(1, "message is required").max(5000, "message is too long"),
});

const sendContactMessage = asyncHandler(async (req: Request, res: Response) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }
  const { name, email, message } = parsed.data;

  const { html, text } = contactFormEmailTemplate(name, email, message);
  await sendEmail({
    to: CONTACT_DESTINATION_EMAIL,
    subject: `New contact form message from ${name}`,
    html,
    text,
    replyTo: email,
  });

  return res.status(200).json(new ApiResponse(200, "Message sent successfully"));
});

const supportSchema = z.object({
  subject: z.string().trim().min(1, "subject is required").max(100, "subject is too long"),
  message: z.string().trim().min(1, "message is required").max(5000, "message is too long"),
});

// Authenticated - name/email come from the logged-in user's account, not the
// request body, so a caller can't spoof who the message is "from".
const sendSupportMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = supportSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }
  const { subject, message } = parsed.data;
  const { name, email } = req.user!;

  const { html, text } = supportRequestEmailTemplate(name, email, subject, message);
  await sendEmail({
    to: CONTACT_DESTINATION_EMAIL,
    subject: `[Support - ${subject}] from ${name}`,
    html,
    text,
    replyTo: email,
  });

  return res.status(200).json(new ApiResponse(200, "Message sent successfully"));
});

export { sendContactMessage, sendSupportMessage };

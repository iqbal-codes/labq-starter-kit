import { Resend } from "resend";
import { env } from "@labq-modules/env/server";

export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const FROM_EMAIL = env.RESEND_FROM_EMAIL ?? "";

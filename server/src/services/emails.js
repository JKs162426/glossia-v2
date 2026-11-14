import { RESET_TTL_MINUTES } from "../models/passwordResetModel.js";

// Usernames are only letters, numbers and underscores (validators.js and
// passport.js), so they're safe to put in the HTML as they are.
const layout = (paragraphs) =>
  `<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#1f2937;max-width:480px">
${paragraphs.map((p) => `<p>${p}</p>`).join("\n")}
<p style="color:#6b7280;font-size:13px">Glossia</p>
</div>`;

export const passwordResetEmail = ({ to, username, link }) => ({
  to,
  subject: "Reset your Glossia password",
  text: [
    `Hi ${username},`,
    `Someone asked to reset the password of your Glossia account. To choose a new one, open this link (it works once, for ${RESET_TTL_MINUTES} minutes):`,
    link,
    "If it wasn't you, ignore this email: your password stays the same.",
  ].join("\n\n"),
  html: layout([
    `Hi ${username},`,
    `Someone asked to reset the password of your Glossia account. The link works once, for ${RESET_TTL_MINUTES} minutes.`,
    `<a href="${link}" style="display:inline-block;background:#0e7490;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Choose a new password</a>`,
    "If it wasn't you, ignore this email: your password stays the same.",
  ]),
});

export const passwordChangedEmail = ({ to, username, forgotLink }) => ({
  to,
  subject: "Your Glossia password was changed",
  text: [
    `Hi ${username},`,
    "The password of your Glossia account was just changed, and every device was logged out.",
    `If it wasn't you, reset it right away: ${forgotLink}`,
  ].join("\n\n"),
  html: layout([
    `Hi ${username},`,
    "The password of your Glossia account was just changed, and every device was logged out.",
    `If it wasn't you, <a href="${forgotLink}">reset it right away</a>.`,
  ]),
});

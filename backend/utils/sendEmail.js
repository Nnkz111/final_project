// utils/sendEmail.js
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email using Resend
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @returns {Promise}
 */
async function sendEmail(to, subject, html) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "you@onresend.com",
      to,
      subject,
      html,
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Resend email error:", err);
    throw err;
  }
}

module.exports = sendEmail;

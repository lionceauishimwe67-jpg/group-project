import nodemailer from 'nodemailer';
import { query, run } from '../config/database';

type EmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

const getEmailProvider = () => (process.env.EMAIL_PROVIDER || 'mock').toLowerCase();

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP_HOST, SMTP_USER, and SMTP_PASS must be configured');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
};

export const sendEmail = async (
  to: string,
  subject: string,
  text: string
): Promise<EmailResult> => {
  try {
    if (!to) {
      return { success: false, error: 'Email address is required' };
    }

    if (getEmailProvider() === 'mock') {
      console.log(`[MOCK EMAIL] To: ${to}`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Message: ${text}`);
      return { success: true, messageId: `mock-email-${Date.now()}` };
    }

    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Email service error:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
};

export const sendEmailNotificationToTeacher = async (
  teacherId: number,
  title: string,
  body: string,
  timetableId: number | null,
  notificationType: string
): Promise<EmailResult> => {
  try {
    const teachers = await query<any[]>(
      'SELECT id, name, email, notification_enabled FROM teachers WHERE id = ?',
      [teacherId]
    );

    if (teachers.length === 0) {
      return { success: false, error: 'Teacher not found' };
    }

    const teacher = teachers[0];
    if (!teacher.notification_enabled) {
      return { success: false, error: 'Notifications disabled for teacher' };
    }

    if (!teacher.email) {
      return { success: false, error: 'Teacher has no email address' };
    }

    const result = await sendEmail(teacher.email, title, body);

    await run(
      `INSERT INTO notifications
        (teacher_id, timetable_id, notification_type, title, body, status, error_message, sent_via, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'email', CURRENT_TIMESTAMP)`,
      [
        teacherId,
        timetableId,
        notificationType,
        title,
        body,
        result.success ? 'sent' : 'failed',
        result.error || null
      ]
    );

    return result;
  } catch (error: any) {
    console.error('Error sending email notification to teacher:', error);
    return { success: false, error: error.message || 'Failed to send teacher email' };
  }
};

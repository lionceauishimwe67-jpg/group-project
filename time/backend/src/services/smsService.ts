// SMS Notification Service
// Supports multiple SMS providers (Twilio, AfricasTalking, etc.)

interface SMSProvider {
  sendSMS(phone: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// Mock SMS Provider for development
class MockSMSProvider implements SMSProvider {
  async sendSMS(phone: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(`[MOCK SMS] Sending SMS to ${phone}:`);
    console.log(`  Message: ${message}`);
    
    // Simulate successful SMS send
    return {
      success: true,
      messageId: `mock-sms-${Date.now()}`,
    };
  }
}

// AfricasTalking Provider (common in Rwanda)
class AfricasTalkingProvider implements SMSProvider {
  private apiKey: string;
  private username: string;
  private senderId: string;

  constructor() {
    this.apiKey = process.env.AFRICASTALKING_API_KEY || '';
    this.username = process.env.AFRICASTALKING_USERNAME || '';
    this.senderId = process.env.SMS_SENDER_ID || 'SCHOOL';
  }

  async sendSMS(phone: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.apiKey || !this.username) {
        throw new Error('AfricasTalking credentials not configured');
      }

      // Format phone number (remove leading 0, add +250 for Rwanda)
      const formattedPhone = this.formatPhoneNumber(phone);

      // Call AfricasTalking API
      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: this.username,
          to: formattedPhone,
          message: message,
          from: this.senderId,
        }).toString(),
      });

      const data: any = await response.json();

      if (data.SMSMessageData?.Recipients?.[0]?.statusCode === '101') {
        return {
          success: true,
          messageId: data.SMSMessageData.Recipients[0].messageId,
        };
      } else {
        throw new Error(data.SMSMessageData?.Recipients?.[0]?.status || 'Failed to send SMS');
      }
    } catch (error: any) {
      console.error('AfricasTalking SMS error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      };
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, replace with +250
    if (cleaned.startsWith('0')) {
      cleaned = '+250' + cleaned.substring(1);
    }
    // If doesn't start with +, add +250 for Rwanda
    else if (!cleaned.startsWith('+')) {
      cleaned = '+250' + cleaned;
    }
    
    return cleaned;
  }
}

// Twilio Provider (international)
class TwilioProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_FROM_NUMBER || '';
  }

  async sendSMS(phone: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.accountSid || !this.authToken || !this.fromNumber) {
        throw new Error('Twilio credentials not configured');
      }

      // Call Twilio API
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
          },
          body: new URLSearchParams({
            From: this.fromNumber,
            To: phone,
            Body: message,
          }).toString(),
        }
      );

      const data: any = await response.json();

      if (data.status === 'queued' || data.status === 'sent') {
        return {
          success: true,
          messageId: data.sid,
        };
      } else {
        throw new Error(data.message || 'Failed to send SMS');
      }
    } catch (error: any) {
      console.error('Twilio SMS error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      };
    }
  }
}

// Factory function to get the appropriate SMS provider
const getSMSProvider = (): SMSProvider => {
  const provider = process.env.SMS_PROVIDER || 'mock';
  
  switch (provider.toLowerCase()) {
    case 'africastalking':
      return new AfricasTalkingProvider();
    case 'twilio':
      return new TwilioProvider();
    case 'mock':
    default:
      return new MockSMSProvider();
  }
};

// Main SMS service
export const sendSMS = async (
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    if (!phone) {
      return { success: false, error: 'Phone number is required' };
    }

    if (!message) {
      return { success: false, error: 'Message is required' };
    }

    const provider = getSMSProvider();
    return await provider.sendSMS(phone, message);
  } catch (error: any) {
    console.error('SMS service error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
};

// Send SMS notification to a teacher
export const sendSMSNotificationToTeacher = async (
  teacherId: number,
  message: string,
  notificationType: string = 'class_arrival'
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const { query } = await import('../config/database');
    
    // Get teacher's phone number
    const teachers = await query<any[]>(
      'SELECT id, name, phone, notification_enabled FROM teachers WHERE id = ?',
      [teacherId]
    );

    if (teachers.length === 0) {
      return { success: false, error: 'Teacher not found' };
    }

    const teacher = teachers[0];

    // Check if notifications are enabled for this teacher
    if (!teacher.notification_enabled || !teacher.phone) {
      console.log(`SMS notifications disabled or no phone number for teacher ${teacher.name}`);
      return { success: false, error: 'SMS notifications disabled or no phone number' };
    }

    // Send SMS
    const result = await sendSMS(teacher.phone, message);

    // Log notification to database
    if (result.success) {
      await query(
        `INSERT INTO notifications (teacher_id, notification_type, title, body, status, sent_via)
         VALUES (?, ?, ?, ?, 'sent', 'sms')`,
        [teacherId, notificationType, 'SMS Notification', message]
      );
    } else {
      await query(
        `INSERT INTO notifications (teacher_id, notification_type, title, body, status, error_message, sent_via)
         VALUES (?, ?, ?, ?, 'failed', ?, 'sms')`,
        [teacherId, notificationType, 'SMS Notification', message, result.error]
      );
    }

    return result;
  } catch (error: any) {
    console.error('Error sending SMS notification to teacher:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS notification to teacher',
    };
  }
};

// Send SMS to all active phone numbers
export const sendSMSToAllPhoneNumbers = async (
  message: string,
  notificationType: string = 'general'
): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> => {
  try {
    const { query } = await import('../config/database');
    
    // Get all active phone numbers
    const phoneNumbers = await query<any[]>(
      'SELECT id, phone_number, name FROM phone_numbers WHERE is_active = 1'
    );

    if (phoneNumbers.length === 0) {
      return { success: true, sent: 0, failed: 0, errors: ['No active phone numbers'] };
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const phone of phoneNumbers) {
      try {
        const result = await sendSMS(phone.phone_number, message);
        
        if (result.success) {
          sent++;
          console.log(`SMS sent to ${phone.phone_number} (${phone.name || 'No name'})`);
        } else {
          failed++;
          errors.push(`${phone.phone_number}: ${result.error}`);
          console.error(`Failed to send SMS to ${phone.phone_number}: ${result.error}`);
        }
      } catch (error: any) {
        failed++;
        errors.push(`${phone.phone_number}: ${error.message}`);
        console.error(`Error sending SMS to ${phone.phone_number}:`, error);
      }
    }

    return {
      success: true,
      sent,
      failed,
      errors,
    };
  } catch (error: any) {
    console.error('Error sending SMS to all phone numbers:', error);
    return {
      success: false,
      sent: 0,
      failed: 0,
      errors: [error.message || 'Failed to send SMS to all phone numbers'],
    };
  }
};

// Send SMS to teachers who have SMS notifications enabled
export const sendSMSToTeachers = async (
  message: string,
  notificationType: string = 'general'
): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> => {
  try {
    const { query } = await import('../config/database');
    
    // Get all teachers with SMS notifications enabled and phone numbers
    const teachers = await query<any[]>(
      'SELECT id, name, phone FROM teachers WHERE sms_notification_enabled = 1 AND phone IS NOT NULL AND phone != ""'
    );

    if (teachers.length === 0) {
      return { success: true, sent: 0, failed: 0, errors: ['No teachers with SMS notifications enabled'] };
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const teacher of teachers) {
      try {
        const result = await sendSMS(teacher.phone, message);
        
        if (result.success) {
          sent++;
          console.log(`SMS sent to teacher ${teacher.name} (${teacher.phone})`);
        } else {
          failed++;
          errors.push(`${teacher.name} (${teacher.phone}): ${result.error}`);
          console.error(`Failed to send SMS to teacher ${teacher.name}: ${result.error}`);
        }
      } catch (error: any) {
        failed++;
        errors.push(`${teacher.name} (${teacher.phone}): ${error.message}`);
        console.error(`Error sending SMS to teacher ${teacher.name}:`, error);
      }
    }

    return {
      success: true,
      sent,
      failed,
      errors,
    };
  } catch (error: any) {
    console.error('Error sending SMS to teachers:', error);
    return {
      success: false,
      sent: 0,
      failed: 0,
      errors: [error.message || 'Failed to send SMS to teachers'],
    };
  }
};

import { sendSMSNotificationToTeacher } from '../services/smsService';

async function testSMS() {
  try {
    console.log('Testing SMS notification service...');
    console.log('Current SMS provider:', process.env.SMS_PROVIDER || 'mock');
    
    // Test with a teacher ID (using teacher ID 19 from the database)
    const teacherId = 19;
    const message = 'Test SMS notification from School Timetable System. This is a test message.';
    
    console.log(`\nSending test SMS to teacher ID ${teacherId}...`);
    const result = await sendSMSNotificationToTeacher(teacherId, message, 'test');
    
    console.log('\nResult:', result);
    
    if (result.success) {
      console.log('✓ SMS sent successfully');
      console.log('  Message ID:', result.messageId);
    } else {
      console.log('✗ SMS failed to send');
      console.log('  Error:', result.error);
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testSMS();

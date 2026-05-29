const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Reminder = require('../models/Reminder.model'); // Adjust path to your Reminder model

// Set up Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to AWS SES, SendGrid, etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const initCronJobs = () => {
  // Schedule task to run every single day at 09:00 AM
  cron.schedule('* * * * *', async () => {
    console.log('Running daily court hearing reminder check...');
    
    try {
      // Define the time window for "tomorrow"
      const tomorrowStart = new Date();
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      tomorrowStart.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date();
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
      tomorrowEnd.setHours(23, 59, 59, 999);

      // Find reminders scheduled for tomorrow that haven't been notified yet
      const reminders = await Reminder.find({
        hearingDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
        isNotified: false
      });

      if (reminders.length === 0) {
        console.log('No hearings scheduled for tomorrow.');
        return;
      }

      // Loop through and send emails
      for (const reminder of reminders) {
        // In a real production app, you would populate the user's email from the DB:
        // const userEmail = reminder.userId.email; 
        const recipientEmail = process.env.TEST_RECEIVER_EMAIL || "user@example.com"; 

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: recipientEmail,
          subject: `⚠️ Urgent: Court Hearing Reminder - ${reminder.caseTitle}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #6a1b9a;">NyayaAI Court Hearing Reminder</h2>
              <p>Hello,</p>
              <p>This is an automated reminder that you have an upcoming court hearing scheduled for tomorrow.</p>
              <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Case Title:</strong> ${reminder.caseTitle}</p>
                <p><strong>Details:</strong> ${reminder.description}</p>
                <p><strong>Date:</strong> ${reminder.hearingDate.toDateString()}</p>
              </div>
              <p>Please ensure all your legal documentation is organized and ready.</p>
              <p>Best regards,<br/><strong>NyayaAI Team</strong></p>
            </div>
          `
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        
        // Mark as notified in the database to prevent duplicate emails
        reminder.isNotified = true;
        await reminder.save();
        
        console.log(`Successfully sent notification for case: ${reminder.caseTitle}`);
      }
    } catch (error) {
      console.error('Error executing daily cron job:', error);
    }
  });
};

module.exports = { initCronJobs };
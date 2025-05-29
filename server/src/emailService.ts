import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use an app password if using Gmail
    },
    });
  };

const emailTemplates = {
    challengeReminder: (userName: string, anxietyName: string, challengeDescription: string, challengeLevel: string) => ({
        subject: 'Anxiety Shredder Challenge Reminder',
        html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
            <h2 style="color: black;">Hello ${userName},</h2>
            <p>This is a reminder to give your ${challengeLevel} challenge for ${anxietyName} a try!</p>
            <p style="font-style: italic;">Challenge Description: ${challengeDescription}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Please visit the Anxiety Shredder app to adjust your notification settings or to mark this challenge as completed.
        </p>
        </div>
        `,  
    }),
};

export const sendEmail = async (to: string, template: any) => {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject: template.subject,
            html: template.html,
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent: ', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Error sending email: ', error);
        return { success: false, error: error };
    }
};

export const sendChallengeReminder = async (
    userEmail: string,
    userName: string,
    anxietyName: string,
    challengeDescription: string,
    challengeLevel: string
  ) => {
    const template = emailTemplates.challengeReminder(userName, anxietyName, challengeDescription, challengeLevel);
    return await sendEmail(userEmail, template);
  };

export default {
    sendEmail,
    sendChallengeReminder,
    emailTemplates,
};
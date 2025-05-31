import Mailgun from 'mailgun.js';
import formData from 'form-data';

const mailgun = new Mailgun(formData);
const mailgunClient = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY || '',
});

const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || '';
const emailTemplates = {
    challengeReminder: (userName: string, anxietyName: string, challengeDescription: string, challengeLevel: string) => ({
        subject: 'Anxiety Shredder Challenge Reminder',
        html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
            <h2 style="color: black;">Hello ${userName},</h2>
            <p>This is a reminder to give your ${challengeLevel} challenge for ${anxietyName} a try!</p>
            <p style="font-style: italic;">Challenge Description: ${challengeDescription}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Please visit the Anxiety Shredder app **INSERT LINK HERE** to adjust your notification settings or to mark this challenge as completed.
        </p>
        </div>
        `,  
    }),
};

export const sendEmail = async (to: string, template: any) => {
    try {
        const messageData = {
            from: `Anxiety Shredder <no-reply@${MAILGUN_DOMAIN}>`,
            to: [to],
            subject: template.subject,
            html: template.html,
        };

        const result = await mailgunClient.messages.create(MAILGUN_DOMAIN, messageData);
        console.log('Email sent via Mailgun: ', result.id);
        return { success: true, messageId: result.id};
    } catch (error) {
        console.error('Error sending email via Mailgun: ', error);
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
    console.log('EMAIL SERVICE: Sending challenge reminder email to:', userEmail);
    const template = emailTemplates.challengeReminder(userName, anxietyName, challengeDescription, challengeLevel);
    return await sendEmail(userEmail, template);
  };

export default {
    sendEmail,
    sendChallengeReminder,
    emailTemplates,
};
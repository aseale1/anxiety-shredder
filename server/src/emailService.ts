import Mailgun from 'mailgun.js';
import FormData from 'form-data';

const mailgun = new Mailgun(FormData as any);
const mailgunClient = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY || '',
});

const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || '';

const fontImport = `
  <head>
    <link href="https://fonts.googleapis.com/css2?family=Faster+One&family=Afacad:wght@400;500&display=swap" rel="stylesheet">
  </head>
`;

const typographyStyles = {
  base: {
    color: 'black',
  },
  /* Faster One Styles */
  h1: {
    fontFamily: 'Faster One, cursive',
    fontWeight: 400,
    fontSize: 34,
  },
  h2: {
    fontFamily: 'Faster One, cursive',
    fontWeight: 400,
    fontSize: 24,
  },
  /* Afacad Styles */
  h3: {
    fontFamily: 'Afacad, Inter, system-ui, sans-serif',
    fontWeight: 500,
    fontSize: 18,
  },
  body: {
    fontFamily: 'Afacad, Inter, system-ui, sans-serif',
    fontSize: 13,
  },
};
const emailTemplates = {
    challengeReminder: (userName: string, anxietyName: string, challengeDescription: string, challengeLevel: string) => ({
        subject: 'Anxiety Shredder Challenge Reminder',
        html: `
        ${fontImport}
        <div>
            <h2>Hello ${userName}!</h2>
            <h3>This is a reminder to give your ${anxietyName} challenge a try!</h3>
            <p style="font-weight: semibold;">Challenge Level: ${challengeLevel}</p>
            <p style="font-weight: bold;">Challenge Description:</p>
            <p style="font-style: italic;">${challengeDescription}</p>
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
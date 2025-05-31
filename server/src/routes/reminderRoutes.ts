import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import {sendChallengeReminder} from '../emailService';
import { parse } from 'path';

const prisma = new PrismaClient();
const reminderRouter = Router();

// Create or update a reminder
const createOrUpdateReminder: RequestHandler = async (req, res): Promise<void> => {
    const { firebase_uid, chall_id, reminder_enabled, frequency} = req.body;

    try {
        const existingReminder = await prisma.challenge_reminders.findUnique({
            where: { 
                chall_id_firebase_uid: {
                    chall_id: parseInt(chall_id),
                    firebase_uid,
                },
            },
        });

        let reminder;
        if (existingReminder) {
            reminder = await prisma.challenge_reminders.update({
                where: { 
                    chall_id_firebase_uid: {
                        chall_id: parseInt(chall_id),
                        firebase_uid,
                    },
                },
                data: {
                    reminder_enabled,
                    frequency,
                    updated_at: new Date(), 
                },
            });
        } else {
            reminder = await prisma.challenge_reminders.create({
                data: {
                    chall_id: parseInt(chall_id),
                    firebase_uid,
                    reminder_enabled,
                    frequency,
                },
            });
        }

        res.status(200).json(reminder);
    } catch (error) {
        console.error('Error creating or updating reminder:', error);
        res.status(500).json({ error: 'Failed to create or update reminder' });
    }
};

// Get a reminder for some challenge
const getChallengeReminder: RequestHandler = async (req, res): Promise<void> => {
    const { firebase_uid } = req.query;
    const { chall_id } = req.params;

    if (typeof firebase_uid !== 'string') {
        res.status(400).json({ error: 'Invalid firebase_uid' });
        return;
    }

    try {
        const reminder = await prisma.challenge_reminders.findUnique({
            where: { 
                chall_id_firebase_uid: {
                    chall_id: parseInt(chall_id),
                    firebase_uid,
                },
            },
        });

        res.status(200).json(reminder);
    } catch (error) {
        console.error('Error fetching reminder:', error);
        res.status(500).json({ error: 'Failed to fetch reminder' });
    }
};

// Get all reminders for a user
const getUserReminders: RequestHandler = async (req, res): Promise<void> => {
    const { firebase_uid } = req.params;
    try {
        const reminders = await prisma.challenge_reminders.findMany({
            where: { 
                firebase_uid,
                reminder_enabled: true,
            },
            include: {
                challenge: {
                    include: {
                        anxiety_source: true,
                    },
                },
            user: true,
            },
        });
        res.status(200).json(reminders);
    } catch (error) {
        console.error('Error fetching user reminders:', error);
        res.status(500).json({ error: 'Failed to fetch reminders' });
    }
};

// Send reminder emails
const sendDueReminders: RequestHandler = async (req, res): Promise<void> => {
    try {
        const now = new Date();
        const reminders = await prisma.challenge_reminders.findMany({
            where: {
                reminder_enabled: true,
                challenge: {
                    completed: false,
                },
            },
            include: {
                challenge: {
                    include: {
                        anxiety_source: true,
                    },
                },
                user: true,
            },
        });

        const emailPromises = []
        const updatePromises = []

        for (const reminder of reminders) {
            let shouldSend = false;

            if (!reminder.last_sent) {
                shouldSend = true;
            } else {
                const daysSinceLastSent = Math.floor(
                    (now.getTime() - reminder.last_sent.getTime()) / (1000 * 60 * 60 * 24)
                );
            switch (reminder.frequency) {
                case 'daily':
                    shouldSend = daysSinceLastSent >= 1;
                    break;
                case 'weekly':
                    shouldSend = daysSinceLastSent >= 7;
                    break;
                case 'bi-weekly':
                    shouldSend = daysSinceLastSent >= 4;
                    break;
            }}

            if (shouldSend) {
                emailPromises.push(sendChallengeReminder(
                    reminder.user.email,
                    reminder.user.first_name || 'there',
                    reminder.challenge.anxiety_source?.anx_name || 'your anxiety',
                    reminder.challenge.description || 'your challenge',
                    reminder.challenge.chall_level || 'challenge level',
                ));
                
                updatePromises.push(
                    prisma.challenge_reminders.update({
                        where: {
                            reminder_id: reminder.reminder_id,
                        },
                        data: {
                            last_sent: now,
                        },
                    })
                );
            }
        }
        const emailResults = await Promise.allSettled(emailPromises);
        await Promise.all(updatePromises);

        const successfulEmailsCount = emailResults.filter(result => result.status === 'fulfilled').length;
        const failedEmailsCount = emailResults.filter(result => result.status === 'rejected').length;
        res.status(200).json({
            message: `Sent ${successfulEmailsCount} reminders successfully, failed to send ${failedEmailsCount} reminders.`,
        });
    } catch (error) {
        console.error('Error sending due reminders:', error);
        res.status(500).json({ error: 'Failed to send due reminders' });
    }
};          
// Send a test reminder email
const sendTestReminder: RequestHandler = async (req, res): Promise<void> => {
    const { firebase_uid, chall_id } = req.body;
    try {
        const challenge = await prisma.challenges.findUnique({
            where: { chall_id: parseInt(chall_id) },
            include: {
                anxiety_source: true,
            },
        });
        console.log('Fetching user with uid:', firebase_uid);
        const user = await prisma.users.findUnique({
            where: { firebase_uid },
        });

        console.log('User email:', user?.email);
        if (!challenge || !user) {
            res.status(404).json({ error: 'Challenge or user not found' });
            return;
        }
        await sendChallengeReminder(
            user.email,
            user.first_name || 'there',
            challenge.anxiety_source?.anx_name || 'your anxiety',
            challenge.description || 'your challenge',
            challenge.chall_level || 'challenge level',
        );
        res.status(200).json({ message: 'Test reminder sent successfully' });
    } catch (error) {
        console.error('Error sending test reminder:', error);
        res.status(500).json({ error: 'Failed to send test reminder' });
    }
};

//TODO: Delete reminder

reminderRouter.post('/create-update-reminder', createOrUpdateReminder);
reminderRouter.get('/challenge/:chall_id/reminder', getChallengeReminder);
reminderRouter.get('/:firebase_uid/reminders', getUserReminders);
reminderRouter.post('/send-duereminders', sendDueReminders);
reminderRouter.post('/send-test-reminder', sendTestReminder);
// reminderRouter.delete('/delete-reminder', deleteReminder);

export default reminderRouter;
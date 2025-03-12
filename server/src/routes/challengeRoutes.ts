import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { create } from 'domain';

const prisma = new PrismaClient();
const challengeRouter = Router();

const CHALLENGE_RULES = {
    Green: { 1: 3, 2: 0, 3: 0 },
    Blue: { 1: 2, 2: 1, 3: 0 },
    Black: { 1: 1, 2: 2, 3: 0 },
    DoubleBlack: { 1: 0, 2: 2, 3: 1 },
  };

// Generate a challenge based on condition ratings
// Generate a challenge based on condition ratings
const generateChallenge: RequestHandler = async (req, res) => {
    const { firebase_uid, anx_id, chall_level }: { firebase_uid: string; anx_id: string; chall_level: keyof typeof CHALLENGE_RULES } = req.body;
    try {
        const conditions = await prisma.user_con_rating.findMany({
            where: { firebase_uid },
            select: {
                con_id: true,
                rating: true,
                conditions: {
                    select: {
                        condition_name: true,
                    },
                },
            },
        });
        console.log('Conditions:', conditions);

        // Categorize conditions based on their ratings
        const conditionsByRating: Record<number, { con_id: string, condition_name: string }[]> = {};
        conditions.forEach((condition) => {
            if (condition.rating !== null) {
                const rating = condition.rating;
                if (!conditionsByRating[rating]) {
                    conditionsByRating[rating] = []; 
                }
                conditionsByRating[rating].push({ con_id: condition.con_id.toString(), condition_name: condition.conditions.condition_name });
            }
        });
        console.log('Conditions by rating:', conditionsByRating);


        // Select conditions based on challenge rules
        const requiredConditions = CHALLENGE_RULES[chall_level];
        const selectedConditions: { con_id: string, condition_name: string }[] = [];

        [1, 2, 3].forEach((rating) => {
            const needed = requiredConditions[rating as 1 | 2 | 3];
            if (needed > 0) {
                const available = conditionsByRating[rating] || [];
                if (available.length < needed) {
                return res.status(400).json({ error: `Not enough conditions with rating ${rating} to generate challenge` });
                //throw new Error(`Not enough conditions with rating ${rating}`);
                }
                selectedConditions.push(...available.slice(0, needed));
            }
        });

        if (selectedConditions.length < 3) {
          throw new Error("Not enough conditions to generate challenge");
        }

        // Create the challenge description
        const challengeDescription = selectedConditions.map(cond => cond.condition_name).join(', ');
        console.log('Challenge description:', challengeDescription);

        // Create the challenge
        const challenge = await prisma.challenges.create({
            data: {
                firebase_uid,
                anx_id: parseInt(anx_id),
                chall_level,
                completed: false,
                description: challengeDescription,
                chall_conditions: {
                    create: selectedConditions.map((cond) => ({
                        conditions: { connect: { con_id: parseInt(cond.con_id) } },
                    })),
                },
            },
        });

        res.status(201).json(challenge);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error generating challenge" });
    }
};

// Fetch all challenges for some user
const getUserChallenges: RequestHandler = async (req, res) => {
    const { firebase_uid } = req.params;
    try {
      const challenges = await prisma.challenges.findMany({
        where: { firebase_uid },
      });
      res.status(200).json(challenges);
    } catch (err) {
      res.status(500).json({ error: "Error fetching challenges" });
    }
  };


// Update a challenge to mark it as completed
//TODO: Implement this route


challengeRouter.post('/generate-challenge', generateChallenge);
challengeRouter.get('/:firebase_uid/user-challenges', getUserChallenges);

export default challengeRouter;
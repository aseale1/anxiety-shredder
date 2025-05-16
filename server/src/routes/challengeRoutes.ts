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
const generateChallenge: RequestHandler = async (req, res): Promise<void> => {
    const { firebase_uid, anx_id, chall_level }: { firebase_uid: string; anx_id: string; chall_level: keyof typeof CHALLENGE_RULES } = req.body;
    try {
        const conditions = await prisma.user_con_rating.findMany({
          where: { 
            firebase_uid,
            conditions: {
                factor: {
                    anx_id: parseInt(anx_id)
                }
            }
        },
        select: {
            con_id: true,
            rating: true,
            conditions: {
                select: {
                    condition_name: true,
                    factor_id: true,
                    factor: {
                        select: {
                            factor_id: true,
                            factor_name: true,
                            anx_id: true
                        }
                    }
                },
            },
        },
    });
        console.log('Conditions:', conditions);

        if (conditions.length == 0) {
            res.status(400).json({ error: "No rated conditions found" });
        }

        // Ensure there are at least 3 different factors
        const uniqueFactors = new Set(conditions.map(c => c.conditions.factor_id));
        if (uniqueFactors.size < 3) {
            res.status(400).json({ error: "Conditions must come from at least 3 different factors" });
        }

        // Categorize conditions based on their ratings
        const conditionsByRating: Record<number, { con_id: string, condition_name: string, factor_id: number, factor_name: string }[]> = {};
        conditions.forEach((condition) => {
            if (condition.rating !== null) {
                const rating = condition.rating;
                if (!conditionsByRating[rating]) {
                    conditionsByRating[rating] = []; 
                }
                conditionsByRating[rating].push({ 
                  con_id: condition.con_id.toString(), 
                  condition_name: condition.conditions.condition_name,
                  factor_id: condition.conditions.factor_id ?? 0, // Default to 0 if null
                  factor_name: condition.conditions.factor?.factor_name ?? 'Unknown'
                
                });
            }
        });
        console.log('Conditions by rating:', conditionsByRating);
        
        // Select conditions based on challenge rules
        const requiredConditions = CHALLENGE_RULES[chall_level];
        const selectedConditions: { con_id: string, condition_name: string, factor_id: number }[] = [];

        const usedFactorIds = new Set<number>();
        
        [1, 2, 3].forEach((rating) => {
            const needed = requiredConditions[rating as 1 | 2 | 3];
            if (needed > 0) {
                const available = conditionsByRating[rating] || [];
                if (available.length < needed) {
                return res.status(400).json({ error: `Not enough conditions with rating ${rating} to generate a ${chall_level} challenge` });
              }
              const shuffled = [...available].sort(() => 0.5 - Math.random());
                
                // Try to select conditions from different factors
                let selected = 0;
                for (const condition of shuffled) {
                    // Skip if we already have enough conditions of this rating
                    if (selected >= needed) break;
                    
                    // Skip if we already used this factor
                    if (usedFactorIds.has(condition.factor_id)) continue;
                    
                    // Add this condition and mark its factor as used
                    selectedConditions.push({
                        con_id: condition.con_id,
                        condition_name: condition.condition_name,
                        factor_id: condition.factor_id
                    });
                    usedFactorIds.add(condition.factor_id);
                    selected++;
                }
                
                // If we couldn't find enough conditions from different factors,
                // fall back to allowing duplicate factors
                if (selected < needed) {
                    // Sort available conditions to prioritize unused factors
                    const prioritized = shuffled.sort((a, b) => {
                        const aUsed = usedFactorIds.has(a.factor_id) ? 1 : 0;
                        const bUsed = usedFactorIds.has(b.factor_id) ? 1 : 0;
                        return aUsed - bUsed;
                    });
                    
                    // Take what we need
                    for (let i = 0; i < needed - selected; i++) {
                        if (i < prioritized.length) {
                            const condition = prioritized[i];
                            selectedConditions.push({
                                con_id: condition.con_id,
                                condition_name: condition.condition_name,
                                factor_id: condition.factor_id
                            });
                            usedFactorIds.add(condition.factor_id);
                        }
                    }
                }
            }
        });

        if (selectedConditions.length < 3) {
          throw new Error("Not enough conditions to generate challenge");
        }
        const selectedFactorCount = new Set(selectedConditions.map(cond => cond.factor_id)).size;

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

// Fetch a user's challenges for a specific anxiety
const getUserChallengesForAnxiety: RequestHandler = async (req, res) => {
    const { firebase_uid } = req.params;
    const { anx_id } = req.query;
    try {
      const challenges = await prisma.challenges.findMany({
        where: {
          firebase_uid,
          anx_id: parseInt(anx_id as string),
        },
      });
      res.status(200).json(challenges);
    } catch (err) {
      res.status(500).json({ error: "Error fetching user's challenges" });
    }
  };



// Update a challenge to mark it as completed
const completeChallenge: RequestHandler = async (req, res) => {
    const { firebase_uid, chall_id } = req.body;
    try {
      const challenge = await prisma.challenges.update({
        where: { chall_id },
        data: {
          completed: true,
        },
      });
      res.status(200).json(challenge);
    } catch (err) {
      res.status(500).json({ error: "Error completing challenge" });
    }
  };


// Delete a challenge
const deleteChallenge: RequestHandler = async (req, res) => {
    const { firebase_uid, chall_id } = req.body;
    try {
      const challenge = await prisma.challenges.delete({
        where: { chall_id },
      });
      res.status(200).json(challenge);
    } catch (err) {
      res.status(500).json({ error: "Error deleting challenge" });
    }
  };

// Generate max number of challenges
const generateMaxChallenges: RequestHandler = async (req, res) => {
    const { firebase_uid, anx_id } = req.body;
    try {
        const conditions = await prisma.user_con_rating.findMany({
            where: {
                firebase_uid,
                conditions: {
                    factor: {
                        anx_id: parseInt(anx_id as string)
                    }}},
            select: {
                con_id: true,
                rating: true,
                conditions: {
                    select: {
                        condition_name: true,
                        con_desc: true,
                        factor_id: true,
                        factor: {
                            select: {
                                factor_id: true,
                                factor_name: true,
                            }}}}}
        });

        const conditionsByRating: { [key in 1 | 2 | 3]: typeof conditions[0][] } = {
            1: [],
            2: [],
            3: []
        };

        conditions.forEach(condition => {
          if (condition.rating) {
            conditionsByRating[condition.rating as 1 | 2 | 3].push(condition);
          }
        });
        // Calculate the maximum number of challenges for each level
        const maxChallenges: Record<keyof typeof CHALLENGE_RULES, number> = {
          Green: 0,
          Blue: 0,
          Black: 0,
          DoubleBlack: 0,
        };
      
        (Object.keys(CHALLENGE_RULES) as Array<keyof typeof CHALLENGE_RULES>).forEach(level => {
          const rules = CHALLENGE_RULES[level];

        // Calculate min possible challenges based on rules and conditions available
          let maxPossible = Number.MAX_SAFE_INTEGER;

          Object.entries(rules).forEach(([rating, conCount]) => {
            if (conCount > 0) {
              const available = conditionsByRating[Number(rating) as 1 | 2 | 3].length;
              const possibleChallenges = Math.floor(available / conCount);
              maxPossible = Math.min(maxPossible, possibleChallenges);
            }
          });

          maxChallenges[level] = maxPossible;
        });

        res.status(200).json(maxChallenges);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error generating max challenges" });
    }
};

// Generate multiple challenges at once
const generateFullMountain: RequestHandler = async (req, res) => {
    try {
        const { firebase_uid, anx_id } = req.body;
        
        if (!firebase_uid || !anx_id) {
            res.status(400).json({ error: 'Missing required parameters' });
            return;
        }

        const challenges = await prisma.challenges.findMany({
            where: {
                firebase_uid,
                anx_id: parseInt(anx_id),
            },
        });
        res.json(challenges);
    } catch (error) {
        console.error('Error generating mountain:', error);
        res.status(500).json({ error: 'Failed to generate mountain' });
    }
};

challengeRouter.post('/generate-challenge', generateChallenge);
challengeRouter.get('/:firebase_uid/user-challenges', getUserChallengesForAnxiety);
challengeRouter.put('/complete-challenge', completeChallenge);
challengeRouter.delete('/delete-challenge', deleteChallenge);
challengeRouter.get('/generate-max-challenges/:anx_id', generateMaxChallenges);
challengeRouter.post('/generate-full-mountain', generateFullMountain);

export default challengeRouter;
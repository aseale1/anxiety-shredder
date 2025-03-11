import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const conditionRouter = Router();

// Fetch conditions for some factor
const getConditionsForFactor = async (req: Request, res: Response) => {
    const factor_id = parseInt(req.params.factor_id);
    try {
      const conditions = await prisma.conditions.findMany({
        where: { factor_id },
      });
      res.status(200).json(conditions);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error fetching conditions" });
    }
  };

  // Add a condition to a user
  const addUserCondition: RequestHandler = async (req, res) => {
    const { firebase_uid, conditions } = req.body;
      try {
        const newCondition = await prisma.$transaction(
          conditions.map((condition: any) => {
            return prisma.user_con_rating.create({
              data: {
                firebase_uid,
                con_id: condition.condition_id,
                rating: condition.rating,
              },
            })
          })
        )
        res.status(201).json(newCondition);
      } catch (err) {
        res.status(500).json({ error: "Error adding condition to user" });
      }
    };

// Fetch user's conditions for some factor and the details of that condition
const getUserConditions: RequestHandler = async (req, res) => {
    const { firebase_uid, factor_id } = req.params;
      try {
        const trackedConditions = await prisma.conditions.findMany({
          where: { 
            factor_id: parseInt(factor_id),
            user_con_rating: {
              some: {
                firebase_uid,
              },
            },
          },
          include: {
            user_con_rating: {
              where: {
                firebase_uid,
              },
            },
          },
        });
        res.status(200).json(trackedConditions);
      } catch (err) {
        res.status(500).json({ error: "Error fetching conditions" });
      }
  };

conditionRouter.get("/factors/:factor_id/conditions", getConditionsForFactor);
conditionRouter.post("/:firebase_uid/user-condition", addUserCondition);
conditionRouter.get("/:firebase_uid/factors/:factor_id/conditions", getUserConditions);

export default conditionRouter;
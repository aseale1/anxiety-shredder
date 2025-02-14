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

conditionRouter.get("/factors/:factor_id/conditions", getConditionsForFactor);
conditionRouter.post("/:firebase_uid/user-condition", addUserCondition);

export default conditionRouter;
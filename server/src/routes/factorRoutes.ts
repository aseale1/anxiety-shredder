import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const factorRouter = Router();
  
// Fetch all factors for some anxiety
const getFactorsForAnx = async (req: Request, res: Response) => {
    const anx_id = parseInt(req.params.anx_id);
      try {
        const factors = await prisma.factor.findMany({
          where: { anx_id },
      });
      res.status(200).json(factors);
      } catch (err) {
      res.status(500).json({ error: "Error fetching factors"})
      }
    };
  
// Add a factor to a user
const addUserFactor: RequestHandler = async (req, res) => {
    const { firebase_uid, factor_id } = req.body;
      try {
        const newFactor = await prisma.user_factor.create({
          data: {
          firebase_uid,
          factor_id,
          },
        });
          res.status(201).json(newFactor);
          } catch (err) {
          res.status(500).json({ error: "Error adding factor to user" });
          }
      };

// Fetch all user's factors for some anxiety
const getUserFactors: RequestHandler<{ firebase_uid: string, anx_id: string }> = async (req, res) => {
    const { firebase_uid } = req.params;
    const anx_id = parseInt(req.params.anx_id, 10);
      try {
        const trackedFactors = await prisma.factor.findMany({
          where: {
            anx_id,
            user_factor: {
              some: {
                firebase_uid,
              },
            },
          },
          include: {
            user_factor: true,
          },
        });
        res.status(200).json(trackedFactors);
      } catch (err) {
        res.status(500).json({ error: "Error fetching factors"})
      }
  };

// Delete a factor from a user and delete the conditions associated with it
const deleteFactor: RequestHandler<{ firebase_uid: string, factor_id: string }> = async (req, res) => {
    const { firebase_uid } = req.params;
    const factor_id = parseInt(req.params.factor_id, 10);
    try {
      await prisma.user_factor.delete({
        where: {
          firebase_uid_factor_id: {
            firebase_uid,
            factor_id,
          },
        },
      });
      await prisma.user_con_rating.deleteMany({
        where: {
          firebase_uid,
        },
      });
      res.status(200).json({ message: "Factor deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error deleting factor" });
    }
  };

factorRouter.get("/anxieties/:anx_id/factors", getFactorsForAnx);
factorRouter.post("/user-factor", addUserFactor);
factorRouter.get("/:firebase_uid/anxieties/:anx_id/factors", getUserFactors);
factorRouter.delete("/:firebase_uid/factors/:factor_id/delete-factor", deleteFactor);

export default factorRouter;
import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const homeRouter = Router();

const getUserAnxietiesHandler: RequestHandler<{ firebase_uid: string }> = async (req, res) => {
    const { firebase_uid } = req.params;
    console.log("getUserAnxietiesHandler activated");

    try {
      const anxieties = await prisma.user_anx.findMany({
        where: { firebase_uid },
        include: {
          anxiety_source: true,
        },
      });
      console.log("Number of anxieties", anxieties.length);

      if (anxieties.length > 0) {
        res.json(anxieties);
      } else {
        res.status(404).json({ error: 'No anxieties found for the user' });
      }
    } catch (error) {
      console.error("Error fetching user anxieties:", error);
      res.status(500).json({ error: 'Failed to fetch anxieties' });
    }
  };

  homeRouter.get('/:firebase_uid/anxieties', getUserAnxietiesHandler);

  export default homeRouter;
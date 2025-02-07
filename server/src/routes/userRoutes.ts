import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const userRouter = Router();

interface UserRequestParams {
  firebase_uid: string;
}

const getUserHandler: RequestHandler<UserRequestParams> = async (req, res) => {
  //console.log("getUserHandler activated");
  const { firebase_uid } = req.params;

  try {
    const user = await prisma.users.findUnique({
      where: { firebase_uid },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
};

const getUserAnxietiesHandler: RequestHandler<{ firebase_uid: string }> = async (req, res) => {
    const { firebase_uid } = req.params;
    //console.log("getUserAnxietiesHandler activated");

    try {
      const anxieties = await prisma.user_anx.findMany({
        where: { firebase_uid },
        include: {
          anxiety_source: true,
        },
      });
      //console.log("Number of anxieties", anxieties.length);

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

userRouter.get('/:firebase_uid/anxieties', getUserAnxietiesHandler);
userRouter.get('/:firebase_uid', getUserHandler);

export default userRouter;


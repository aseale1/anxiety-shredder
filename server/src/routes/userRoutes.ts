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

  // Update condition ratings for a user
  userRouter.post('/:firebase_uid/condition-ratings', async (req, res) => {
    const { firebase_uid } = req.params;
    const { condition_ratings }: { condition_ratings: { condition_id: string; rating: number }[] } = req.body;

    try {
      const user = await prisma.$transaction(
        condition_ratings.map(({ condition_id, rating }) =>
          prisma.user_con_rating.upsert({
            where: { firebase_uid_con_id: { firebase_uid, con_id: Number(condition_id) } },
            update: { rating },
            create: { firebase_uid, con_id: Number(condition_id), rating },
          })
        )
      );
      res.json({ message: 'Condition ratings updated successfully' });
    } catch (error) {
      console.error('Error updating condition ratings:', error);
      res.status(500).json({ error: 'Failed to update condition ratings' });
    }
  });



userRouter.get('/:firebase_uid/anxieties', getUserAnxietiesHandler);
userRouter.get('/:firebase_uid', getUserHandler);

export default userRouter;


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

  // Add a condition to a user
  userRouter.post("/:firebase_uid/user-condition", async (req, res) => {
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
    });

  // Fetch all user's factors for some anxiety
  userRouter.get("/:firebase_uid/anxieties/:anx_id/factors", async (req, res) => {
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
  });

// Delete an anxiety from a user as well as the factors and conditions associated with it
userRouter.delete("/:firebase_uid/anxieties/:anx_id/delete-anx", async (req, res) => {
  const { firebase_uid } = req.params;
  const anx_id = parseInt(req.params.anx_id, 10);

  try {
    await prisma.user_factor.deleteMany({
      where: {
        firebase_uid,
        factor: {
          anx_id,
        },
      },
    });
    await prisma.user_con_rating.deleteMany({
      where: {
        firebase_uid,
      },
    });
    await prisma.user_anx.delete({
      where: {
        firebase_uid_anx_id: {
          firebase_uid,
          anx_id,
        },
      },
    });
    res.status(200).json({ message: "Anxiety deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting anxiety" });
  }
});

// Delete a factor from a user and delete the conditions associated with it
userRouter.delete("/:firebase_uid/factors/:factor_id/delete-factor", async (req, res) => {
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
    res.status(500).json({ error: "Error deleting factor" });
  }
});

userRouter.get('/:firebase_uid/anxieties', getUserAnxietiesHandler);
userRouter.get('/:firebase_uid', getUserHandler);

export default userRouter;


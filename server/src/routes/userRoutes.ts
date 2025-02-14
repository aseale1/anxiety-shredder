import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const userRouter = Router();

interface UserRequestParams {
  firebase_uid: string;
}
// Get all user information
const getUserInfo: RequestHandler<UserRequestParams> = async (req, res) => {
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

// TODO: Create user

// TODO: Update user information

// TODO: Delete user

userRouter.get('/:firebase_uid', getUserInfo);

export default userRouter;


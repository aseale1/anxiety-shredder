import express, { Request, Response, RequestHandler } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  console.log('Server hit.')
  res.send('Hello from Express server');
});

interface UserRequestParams {
  firebase_uid: string;
}

const getUserHandler: RequestHandler<UserRequestParams> = async (req, res) => {
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

app.get('/api/user/:firebase_uid', getUserHandler);

app.get('/home', async (req: Request, res: Response) => {
  const { firebase_uid } = req.params;
  console.log(await prisma.users.findMany())
  try {
    const user = await prisma.users.findUnique({
      where: { firebase_uid },
    });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error("Error fetching user by UID:", error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

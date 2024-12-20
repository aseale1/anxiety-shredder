import express, { Request, Response, RequestHandler } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import userRouter from './routes/userRoutes';
import homeRouter from './routes/homeRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Check server status
app.get('/', (req: Request, res: Response) => {
  console.log('Server hit.')
  res.send('Hello from Express server');
});

// Routes
app.use('/api/user/', userRouter);
app.use('/api/home/', homeRouter);
console.log("Home router mounted on /home");

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

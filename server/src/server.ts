import express, { Request, Response, RequestHandler } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import userRouter from './routes/userRoutes';
import anxietyRouter from './routes/anxietyRoutes';
import factorRouter from './routes/factorRoutes';
import conditionRouter from './routes/conditionRoutes';
import challengeRouter from './routes/challengeRoutes';
import reminderRouter from './routes/reminderRoutes';

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
app.use('/api', userRouter);
app.use('/api', anxietyRouter);
app.use('/api', factorRouter);
app.use('/api', conditionRouter);
app.use('/api', challengeRouter);
app.use('/api', reminderRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

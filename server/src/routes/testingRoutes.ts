import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const testingRouter = Router();

testingRouter.get("/testing", async (req, res) => {
    try {
      const factors = await prisma.factor.findMany({
        include: {
          anxiety_source: true,
        },
      });
      res.status(200).json(factors);
    } catch (err) {
      res.status(500).json({ error: "Error fetching anxieties and factors"})
    }
  });

  export default testingRouter;
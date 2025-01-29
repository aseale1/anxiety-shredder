import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import express from 'express';

const prisma = new PrismaClient();
const testingRouter = express.Router();

testingRouter.get("/testing", async (req, res) => {
    try {
      const anxieties = await prisma.anxiety_source.findMany({
        distinct: ['anx_id'],
        include: {
          factor: true,
        },
      });
      console.log('Anxiety data:', anxieties);
      res.status(200).json(anxieties);
    } catch (err) {
      res.status(500).json({ error: "Error fetching anxieties and factors"})
    }
  });

  export default testingRouter;
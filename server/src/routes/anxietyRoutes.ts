import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import express from 'express';

const prisma = new PrismaClient();
const anxietyRouter = express.Router();

// Fetch all anxieties
anxietyRouter.get("/anxieties", async (req, res) => {
    try {
      const anxieties = await prisma.anxiety_source.findMany({
        distinct: ['anx_id'],
        include: {
          factor: true,
        },
      });
      //console.log('Anxiety data:', anxieties);
      res.status(200).json(anxieties);
    } catch (err) {
      res.status(500).json({ error: "Error fetching anxieties and factors"})
    }
  });

// Fetch specific anxiety
anxietyRouter.get("/anxieties/:anx_id", async (req, res) => {
  const anx_id = parseInt(req.params.anx_id);
    try {
      const anxiety = await prisma.anxiety_source.findUnique({
        where: { anx_id },
        include: {
          factor: true,
        },
      });
      res.status(200).json(anxiety);
    } catch (err) {
    res.status(500).json({ error: "Error fetching anxiety"})
    }
  });

// Fetch all factors for some anxiety
anxietyRouter.get("/anxieties/:anx_id/factors", async (req, res) => {
  const anx_id = parseInt(req.params.anx_id);
    try {
      const factors = await prisma.factor.findMany({
        where: { anx_id },
    });
    res.status(200).json(factors);
    } catch (err) {
    res.status(500).json({ error: "Error fetching factors"})
    }
  });

// Add an anxiety to a user
  anxietyRouter.post("/user-anxiety", async (req, res) => {
    const { firebase_uid, anx_id } = req.body;
      try {
        const newAnxiety = await prisma.user_anx.create({
          data: {
            firebase_uid,
            anx_id,
          },
        });
        res.status(201).json(newAnxiety);
      } catch (err) {
        res.status(500).json({ error: "Error adding anxiety to user" });
      }
    });

// Add a factor to a user
 anxietyRouter.post("/user-factor", async (req, res) => {
  const { firebase_uid, factor_id } = req.body;
    try {
      const newFactor = await prisma.user_factor.create({
        data: {
        firebase_uid,
        factor_id,
        },
      });
        res.status(201).json(newFactor);
        } catch (err) {
        res.status(500).json({ error: "Error adding factor to user" });
        }
    });

    // Fetch a user's untracked anxieties
    anxietyRouter.get("/user/:firebase_uid/anxieties/untracked-anxieties", async (req, res) => {
      const { firebase_uid } = req.params;
      try {
        const untrackedAnxieties = await prisma.anxiety_source.findMany({
          where: {
            NOT: {
              user_anx: {
                some: {
                  firebase_uid,
                },
              },
            },
          },
        });
        res.status(200).json(untrackedAnxieties);
      } catch (err) {
        res.status(500).json({ error: "Error fetching untracked anxieties" });
      }
    });

    // Fetch conditions for some factor
    anxietyRouter.get("/factors/:factor_id/conditions", async (req, res) => {
      const factor_id = parseInt(req.params.factor_id);
      try {
        const conditions = await prisma.conditions.findMany({
          where: { factor_id },
        });
        res.status(200).json(conditions);
      } catch (err) {
        res.status(500).json({ error: "Error fetching conditions" });
      }
    });

      
export default anxietyRouter;
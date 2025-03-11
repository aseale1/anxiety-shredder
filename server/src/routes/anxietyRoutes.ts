import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import express from 'express';

const prisma = new PrismaClient();
const anxietyRouter = express.Router();

// Fetch all anxieties
const getAllAnxieties: RequestHandler = async (req, res) => {
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
  };

// Fetch specific anxiety
const getAnxiety: RequestHandler<{ anx_id: string }> = async (req, res) => {
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
  };

// Add an anxiety to a user
const addUserAnxiety: RequestHandler = async (req, res) => {
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
    };

    // Fetch anxieties for some user
    const getUserAnxieties: RequestHandler<{ firebase_uid: string }> = async (req, res) => {
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
  

    // Fetch untracked anxieties for some user
    const getUntrackedAnxieties: RequestHandler<{ firebase_uid: string }> = async (req, res) => {
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
    };

// Delete an anxiety from a user as well as the factors and conditions associated with it
const deleteAnxiety: RequestHandler<{ firebase_uid: string, anx_id: string }> = async (req, res) => {
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
    console.error(err);
    res.status(500).json({ error: "Error deleting anxiety" });
  }
};


anxietyRouter.get("/anxieties", getAllAnxieties);
anxietyRouter.get("/anxieties/:anx_id", getAnxiety);
anxietyRouter.post("/user-anxiety", addUserAnxiety);
anxietyRouter.get('/:firebase_uid/anxieties', getUserAnxieties);
anxietyRouter.get("/user/:firebase_uid/anxieties/untracked-anxieties", getUntrackedAnxieties);
anxietyRouter.delete("/:firebase_uid/anxieties/:anx_id/delete-anx", deleteAnxiety);

      
export default anxietyRouter;
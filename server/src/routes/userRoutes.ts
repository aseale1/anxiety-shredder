import { Router, Request, Response, RequestHandler } from 'express';
import express from 'express';
import * as admin from 'firebase-admin';
const firebaseConfig = require('../firebase-config.json');
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Firebase Admin SDK
try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '';
  const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

const prisma = new PrismaClient();
const userRouter = Router();

interface UserRequestParams {
  firebase_uid: string;
}

interface CustomAnxietyRequest {
  anx_name: string;
  factors: {
    factor_name: string;
    conditions: {
      condition_name: string;
      con_desc: string;
    }[];
  }[];
}
// Get all user information
const getUserInfo: RequestHandler<UserRequestParams> = async (req, res) => {
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

// Create new user
const createUser: RequestHandler = async (req, res) => {
  try {
    const { firebase_uid, email, first_name } = req.body;
    const user = await prisma.users.create({
      data: {
        firebase_uid,
        email,
        first_name,
      },
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating user' });
  }
};

// Custom anxiety source creation
const customAnxiety: RequestHandler = async (req, res) => {
  const {anx_name, factors, firebase_uid }: CustomAnxietyRequest & { firebase_uid: string} = req.body;

  try {

    const existingAnxiety = await prisma.anxiety_source.findFirst({
      where: { 
        anx_name: anx_name.trim(),
        created_by: firebase_uid
      }
    });

    if (existingAnxiety) {
      res.status(400).json({ 
        error: 'An anxiety source with this name already exists. Please choose a different name' });
      return;
    }

    // Create new anxiety source
    console.log('Req body:', req.body);
    const anxietySource = await prisma.anxiety_source.create({
      data: {
        anx_name: anx_name,
        is_system: false,
        created_by: firebase_uid,
      },
    });
    console.log('Created anxiety source:', anxietySource);
    // Create factors for the anxiety source
    const createdFactors = await Promise.all(
      factors.map(async (factor: any) => {
        if (!factor.factor_name) {
          throw new Error('Factor name required');
        }

        const createdFactor = await prisma.factor.create({
          data: {
            factor_name: factor.factor_name,
              anx_id: anxietySource.anx_id,
          },
        });

        console.log('Created factor:', createdFactor);
         return { ...createdFactor, originalConditions: factor.conditions };
      })
    );

    // Create conditions for each factor
    await Promise.all(
      createdFactors.map(async (factor: any) => {
        if (factor.originalConditions &&factor.originalConditions.length > 0) {
          await Promise.all(
            factor.originalConditions.map(async (condition: any) => {
              if (!condition.condition_name ) {
                throw new Error('Condition name required');
              }
              const createdCondition = await prisma.conditions.create({
                data: {
                  condition_name: condition.condition_name,
                  con_desc: condition.con_desc || condition.condition_name,
                  factor_id: factor.factor_id,
                },
              });
              console.log('Created condition:', createdCondition);
              return createdCondition;
            })
          );
        }})
      );
    res.status(201).json({ message: 'Anxiety source created successfully' });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating anxiety source' });
  }
};

const editUserInfo: RequestHandler<UserRequestParams> = async (req, res) => {
  const { firebase_uid } = req.params;
  const { first_name, email } = req.body;
  try {
    const user = await admin.auth().updateUser(firebase_uid, {
    email,
    displayName: first_name,
    });

    const updatedUser = await prisma.users.update({
      where: { firebase_uid },
      data: {
        first_name,
        email,
      },
    });
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating user information' });
  }
};

// TODO: Delete user

userRouter.get('/:firebase_uid', getUserInfo);
userRouter.post('/new-user', createUser);
userRouter.post('/create-custom-anxiety', customAnxiety);
userRouter.put('/:firebase_uid/edit-profile', express.json(), editUserInfo);

export default userRouter;
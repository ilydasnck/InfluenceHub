import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { instagramRouter } from './modules/instagram/instagram.routes';
import { authRouter } from './modules/auth/auth.routes';
import { testRouter } from './modules/test/test.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.get('/test', (req, res) => {
  res.sendFile(path.resolve(process.cwd(), 'public', 'test.html'));
});

app.get('/', (req, res) => {
  res.json({ message: 'InfluenceHub API çalışıyor 🚀' });
});

app.use('/api/auth', authRouter);
app.use('/api/instagram', instagramRouter);
app.use('/api/test', testRouter);

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});
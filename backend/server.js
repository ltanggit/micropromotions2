import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jobRoutes from './routes/jobRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded body (optional)

// Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/users', userRoutes);

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// app.post('/api/job', (req, res) => {
//   const { title } = req.body;
//   res.json({ received: title });
// });


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));

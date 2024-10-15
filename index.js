const express = require("express");
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const { faker } = require('@faker-js/faker');
dotenv.config();
const app =express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const NodeCache = require('node-cache');
app.use(cors());
// MongoDB connection

// Initialize cache with a default TTL of 60 seconds
const cache = new NodeCache({ stdTTL: 60 });
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

  const UserSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    address: String,
    username: String,
  });
  
  const User = mongoose.model('User', UserSchema);


  app.post('/api/users', async (req, res) => {
    try {
      const users = [];
      // Generate 50 fake users
      for (let i = 0; i < 50; i++) {
        users.push({
        fullName: faker.person.fullName(),
        username: faker.internet.userName(),
        email: faker.internet.email(),
        address: faker.location.streetAddress(),
      });
   
    }
      
    const savedUser =  await User.insertMany(users);
    cache.del('allUsers');
    res.status(201).json(savedUser);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
    
  });

  
// Get all users
app.get('/api/users', async (req, res) => {

        const cacheKey = 'allUsers';        
        // Check if items are cached
        if (cache.has(cacheKey)) {
          console.log('Returning cached items');
          return res.status(200).json({ data: cache.get(cacheKey), cached: true });
        }        
        try {

              const users = await User.find();
              // Cache the items
              cache.set(cacheKey, users);
              res.status(200).json({ data: users, cached: false});

        } catch (error) {

          res.status(500).json({ message: error.message });

        }
  });
  
  // Get a user by ID
  app.get('/api/users/:id', async (req, res) => {

    const { id } = req.params;
    const cacheKey = `user_${id}`;

        // Check if the item is cached
        if (cache.has(cacheKey)) {
          console.log(`Returning cached user with id: ${id}`);
          return res.status(200).json({ data: cache.get(cacheKey), cached: true });
        }
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
        // Cache the item
      cache.set(cacheKey, item);
    res.status(200).json({ data: user, cached: false });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Update a user by ID
  app.put('/api/users/:id', async (req, res) => {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedUser) return res.status(404).json({ message: 'User not found' });

      res.status(200).json(updatedUser);

      cache.del(`user_${id}`);
      cache.del('allUsers');
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete a user by ID
  app.delete('/api/users/:id', async (req, res) => {
    try {
      const deletedUser = await User.findByIdAndDelete(req.params.id);
      if (!deletedUser) return res.status(404).json({ message: 'User not found' });

      cache.del(`user_${id}`);
      cache.del('allUsers');
      res.status(200).json({ message: 'User deleted' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>
    console.log(`server start on Port: ${PORT}`)
)
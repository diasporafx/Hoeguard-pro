const express = require('express');
const cors = require('cors');
const { body } = require('express-validator');

// Import controllers (we'll inline them for Vercel)
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mock user database
let users = [
    {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'client@demo.com',
        password: 'password123',
        role: 'client'
    },
    {
        id: '2',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'tech@demo.com',
        password: 'password123',
        role: 'technician'
    },
    {
        id: '3',
        firstName: 'Sarah',
        lastName: 'Admin',
        email: 'admin@demo.com',
        password: 'password123',
        role: 'admin'
    }
];

// Mock jobs database
let jobs = [
    {
        id: '1',
        title: 'HVAC - Air Conditioner Not Cooling',
        description: 'AC unit not cooling properly. Warm air from vents.',
        category: 'hvac',
        urgency: 'urgent',
        status: 'pending',
        clientId: '1',
        clientName: 'John Doe',
        clientEmail: 'client@demo.com',
        address: '123 Main Street, Anytown, ST 12345',
        zipCode: '12345',
        preferredDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        maxBudget: 300,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// Auth routes
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user || user.password !== password) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    res.json({
        success: true,
        message: 'Login successful',
        token: 'demo-token-' + user.id,
        user: {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role
        }
    });
});

app.post('/api/auth/signup', async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;
    
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'User already exists'
        });
    }

    const newUser = {
        id: (users.length + 1).toString(),
        firstName,
        lastName,
        email: email.toLowerCase(),
        password,
        role: role || 'client'
    };

    users.push(newUser);

    res.json({
        success: true,
        message: 'User created successfully',
        token: 'demo-token-' + newUser.id,
        user: {
            id: newUser.id,
            email: newUser.email,
            name: `${newUser.firstName} ${newUser.lastName}`,
            role: newUser.role
        }
    });
});

// Job routes
app.get('/api/jobs', (req, res) => {
    const { status } = req.query;
    let filteredJobs = [...jobs];
    
    if (status) {
        filteredJobs = filteredJobs.filter(job => job.status === status);
    }
    
    res.json({
        success: true,
        jobs: filteredJobs
    });
});

app.post('/api/jobs', (req, res) => {
    const newJob = {
        id: (jobs.length + 1).toString(),
        ...req.body,
        status: 'pending',
        clientId: '1', // Demo client
        clientName: 'Demo Client',
        clientEmail: 'client@demo.com',
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    jobs.push(newJob);
    
    res.json({
        success: true,
        message: 'Job created successfully',
        job: newJob
    });
});

app.get('/api/users', (req, res) => {
    const userList = users.map(user => ({
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role
    }));
    
    res.json({
        success: true,
        users: userList
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        message: "HomeGuard Pro API is working!",
        status: "success",
        timestamp: new Date().toISOString()
    });
});

// Export for Vercel
module.exports = app;
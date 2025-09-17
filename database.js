const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        
        console.log(`✅ Database Connected: ${conn.connection.host}`);
        console.log(`📊 Database Name: ${conn.connection.name}`);
        return conn;
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        console.log('💡 Check your .env file and MongoDB Atlas setup');
        return null;
    }
};

module.exports = connectDB;
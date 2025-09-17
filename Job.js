const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 1000
    },
    category: {
        type: String,
        required: true,
        enum: ['hvac', 'plumbing', 'electrical', 'appliance', 'other']
    },
    urgency: {
        type: String,
        enum: ['normal', 'urgent', 'emergency'],
        default: 'normal'
    },
    status: {
        type: String,
        enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    // Client information
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    clientName: {
        type: String,
        required: true
    },
    clientEmail: {
        type: String,
        required: true
    },
    // Technician information (filled when job is accepted)
    technicianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    technicianName: String,
    technicianEmail: String,
    // Location details
    address: {
        type: String,
        required: true,
        trim: true
    },
    zipCode: {
        type: String,
        required: true,
        trim: true,
        match: /^\d{5}(-\d{4})?$/
    },
    // Scheduling
    preferredDate: {
        type: Date,
        required: true
    },
    estimatedDuration: {
        type: Number,
        default: 60,
        min: 30,
        max: 480
    },
    // Financial
    maxBudget: {
        type: Number,
        default: 0,
        min: 0
    },
    // Media
    photos: [{
        type: String,
        validate: {
            validator: function(v) {
                return /^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(v);
            },
            message: 'Invalid image URL format'
        }
    }],
    // Job lifecycle timestamps
    acceptedAt: Date,
    completedAt: Date,
    // Additional notes
    notes: String
}, {
    timestamps: true // This adds createdAt and updatedAt automatically
});

// Indexes for better query performance
jobSchema.index({ status: 1, category: 1 });
jobSchema.index({ clientId: 1 });
jobSchema.index({ technicianId: 1 });
jobSchema.index({ zipCode: 1 });
jobSchema.index({ createdAt: -1 });

// Virtual for job age in days
jobSchema.virtual('daysOld').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to check if job can be accepted
jobSchema.methods.canBeAccepted = function() {
    return this.status === 'pending';
};

// Method to check if job can be updated by user
jobSchema.methods.canBeUpdatedBy = function(userId, userRole) {
    if (userRole === 'admin') return true;
    if (this.clientId.toString() === userId) return true;
    if (this.technicianId && this.technicianId.toString() === userId) return true;
    return false;
};

// Static method to find jobs by area
jobSchema.statics.findByZipCode = function(zipCode, status = null) {
    const query = { zipCode };
    if (status) query.status = status;
    return this.find(query).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Job', jobSchema);
// Job Controller - Handles all job-related operations
const { validationResult } = require('express-validator');
const Job = require('./Job'); // Import the Job model

// Get all jobs (with filtering)
const getAllJobs = async (req, res) => {
    try {
        const { status, category, zipCode, urgency } = req.query;
        let filter = {};

        // Apply filters
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (zipCode) filter.zipCode = zipCode;
        if (urgency) filter.urgency = urgency;

        // Find jobs and sort by creation date (newest first)
        const jobs = await Job.find(filter).sort({ createdAt: -1 });

        res.json({
            success: true,
            jobs: jobs,
            total: jobs.length
        });
    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get jobs for a specific client
const getClientJobs = async (req, res) => {
    try {
        const clientJobs = await Job.find({ clientId: req.userId }).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            jobs: clientJobs,
            total: clientJobs.length
        });
    } catch (error) {
        console.error('Get client jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get jobs for a specific technician
const getTechnicianJobs = async (req, res) => {
    try {
        const techJobs = await Job.find({ technicianId: req.userId }).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            jobs: techJobs,
            total: techJobs.length
        });
    } catch (error) {
        console.error('Get technician jobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Create a new job (client only)
const createJob = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            title,
            description,
            category,
            urgency,
            address,
            zipCode,
            preferredDate,
            estimatedDuration,
            maxBudget
        } = req.body;

        // Create new job with database
        const newJob = new Job({
            title,
            description,
            category,
            urgency: urgency || 'normal',
            status: 'pending',
            clientId: req.userId,
            clientName: req.userName || 'Unknown Client',
            clientEmail: req.userEmail || 'unknown@email.com',
            address,
            zipCode,
            preferredDate: new Date(preferredDate),
            estimatedDuration: parseInt(estimatedDuration) || 60,
            maxBudget: parseFloat(maxBudget) || 0
        });

        const savedJob = await newJob.save();

        console.log('✅ New job created:', savedJob.title);

        res.status(201).json({
            success: true,
            message: 'Job created successfully',
            job: savedJob
        });

    } catch (error) {
        console.error('Create job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during job creation'
        });
    }
};

// Accept a job (technician only)
const acceptJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const technicianId = req.userId;
        const technicianName = req.userName || 'Unknown Technician';
        const technicianEmail = req.userEmail || 'unknown@email.com';

        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        if (job.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Job is no longer available'
            });
        }

        // Update job with technician info
        job.status = 'assigned';
        job.technicianId = technicianId;
        job.technicianName = technicianName;
        job.technicianEmail = technicianEmail;
        job.acceptedAt = new Date();

        const updatedJob = await job.save();

        console.log('✅ Job accepted:', updatedJob.title, 'by', technicianName);

        res.json({
            success: true,
            message: 'Job accepted successfully',
            job: updatedJob
        });

    } catch (error) {
        console.error('Accept job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update job status
const updateJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { status, notes } = req.body;

        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check authorization
        if (!job.canBeUpdatedBy(req.userId, req.userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this job'
            });
        }

        const validStatuses = ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        job.status = status;
        if (notes) job.notes = notes;
        if (status === 'completed') job.completedAt = new Date();

        const updatedJob = await job.save();

        console.log('✅ Job status updated:', updatedJob.title, 'to', status);

        res.json({
            success: true,
            message: 'Job updated successfully',
            job: updatedJob
        });

    } catch (error) {
        console.error('Update job error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get job details
const getJobDetails = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        res.json({
            success: true,
            job: job
        });

    } catch (error) {
        console.error('Get job details error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    getAllJobs,
    getClientJobs,
    getTechnicianJobs,
    createJob,
    acceptJob,
    updateJobStatus,
    getJobDetails
};
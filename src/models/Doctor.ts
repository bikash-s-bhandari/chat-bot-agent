import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctor extends Document {
  doctorId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  department: string;
  licenseNumber: string;

  experience: number; // years of experience
  availability: {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    isAvailable: boolean;
  }[];
  currentPatients: string[]; // patient IDs
  maxPatientsPerDay: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>({
  doctorId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  specialization: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  experience: {
    type: Number,
    required: true,
    min: 0,
  },
  availability: [{
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  }],
  currentPatients: [{
    type: String, // patient IDs
    ref: 'Patient',
  }],
  maxPatientsPerDay: {
    type: Number,
    default: 20,
    min: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Generate doctor ID on creation
DoctorSchema.pre('save', function(next) {
  if (this.isNew && !this.doctorId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.doctorId = `D${timestamp}${random}`;
  }
  next();
});

// Virtual for full name
DoctorSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Index for efficient queries (email already indexed via unique)
DoctorSchema.index({ department: 1 });
DoctorSchema.index({ specialization: 1 });
DoctorSchema.index({ isActive: 1 });

// Ensure virtuals are serialized
DoctorSchema.set('toJSON', { virtuals: true });
DoctorSchema.set('toObject', { virtuals: true });

export const Doctor = mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema);

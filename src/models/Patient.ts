import mongoose, { Document, Schema } from "mongoose";

export interface IPatient extends Document {
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  email: string;
  phone: string;
  address: string;
  symptoms: Array<{
    description: string;
    severity: "mild" | "moderate" | "severe";
    duration: string;
    timestamp: Date;
  }>;

  assignedDepartment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: function () {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `P${timestamp}${random}`;
      },
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
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
      required: true,
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
    address: {
      type: String,
      required: true,
      trim: true,
    },

    symptoms: [
      {
        description: { type: String, required: true },
        severity: {
          type: String,
          enum: ["mild", "moderate", "severe"],
          required: true,
        },
        duration: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    assignedDepartment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure patientId exists before validation if not set explicitly
PatientSchema.pre("validate", function (next) {
  if (!this.patientId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.patientId = `P${timestamp}${random}`;
  }
  next();
});

// Index for efficient queries (email already indexed via unique)
PatientSchema.index({ phone: 1 });
PatientSchema.index({ assignedDepartment: 1 });

export const Patient =
  mongoose.models.Patient || mongoose.model<IPatient>("Patient", PatientSchema);

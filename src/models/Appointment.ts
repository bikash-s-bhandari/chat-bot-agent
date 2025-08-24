import mongoose, { Document, Schema } from "mongoose";

export interface IAppointment extends Document {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format

  type: "consultation" | "follow-up" | "emergency" | "routine" | "specialist";
  status:
    | "scheduled"
    | "confirmed"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "no-show";
  reason: string;
  symptoms?: string[];
  notes?: string;
  doctorNotes?: string;

  reminders: {
    sent: boolean;
    sentAt?: Date;
    type: "email" | "sms" | "both";
  };
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    appointmentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: function () {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `A${timestamp}${random}`;
      },
    },
    patientId: {
      type: String,
      required: true,
      ref: "Patient",
      index: true,
    },
    doctorId: {
      type: String,
      required: true,
      ref: "Doctor",
      index: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
    },
    endTime: {
      type: String,
      required: false,
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
    },

    type: {
      type: String,
      enum: ["consultation", "follow-up", "emergency", "routine", "specialist"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "scheduled",
        "confirmed",
        "in-progress",
        "completed",
        "cancelled",
        "no-show",
      ],
      default: "scheduled",
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    symptoms: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    doctorNotes: {
      type: String,
      trim: true,
    },

    reminders: {
      sent: {
        type: Boolean,
        default: false,
      },
      sentAt: {
        type: Date,
      },
      type: {
        type: String,
        enum: ["email", "sms", "both"],
        default: "both",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure appointmentId exists before validation if not set explicitly
AppointmentSchema.pre("validate", function (next) {
  if (!this.appointmentId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.appointmentId = `A${timestamp}${random}`;
  }
  next();
});

// Calculate end time based on start time (default 30 minutes duration)
AppointmentSchema.pre("validate", function (next) {
  const hasStart = typeof this.startTime === 'string' && /^([01]?\d|2[0-3]):([0-5]\d)$/.test(this.startTime);
  const needsEnd = !this.endTime || !/^([01]?\d|2[0-3]):([0-5]\d)$/.test(this.endTime);
  if (hasStart && needsEnd) {
    const startTimeDate = new Date(`2000-01-01T${this.startTime}:00`);
    const endTimeDate = new Date(startTimeDate.getTime() + 30 * 60000);
    this.endTime = endTimeDate.toTimeString().slice(0, 5);
  }
  next();
});

// Index for efficient queries
AppointmentSchema.index({ appointmentDate: 1, startTime: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ type: 1 });

// Compound index for doctor availability
AppointmentSchema.index({ doctorId: 1, appointmentDate: 1, startTime: 1 });

// Virtual for checking if appointment is in the past
AppointmentSchema.virtual("isPast").get(function () {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  appointmentDateTime.setHours(
    parseInt(this.startTime.split(":")[0]),
    parseInt(this.startTime.split(":")[1])
  );
  return appointmentDateTime < now;
});

// Virtual for checking if appointment is today
AppointmentSchema.virtual("isToday").get(function () {
  const today = new Date();
  const appointmentDate = new Date(this.appointmentDate);
  return today.toDateString() === appointmentDate.toDateString();
});

// Ensure virtuals are serialized
AppointmentSchema.set("toJSON", { virtuals: true });
AppointmentSchema.set("toObject", { virtuals: true });

export const Appointment =
  mongoose.models.Appointment ||
  mongoose.model<IAppointment>("Appointment", AppointmentSchema);

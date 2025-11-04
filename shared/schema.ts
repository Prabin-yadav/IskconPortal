import { z } from "zod";

// TypeScript interfaces for Firestore documents
// These match the Firestore data model from requirements

export interface User {
  uid: string;
  name: string;
  email: string;
  role: "admin" | "volunteer";
  phone?: string;
  joinedAt: string;
}

export interface Event {
  id: string;
  title: string;
  date: string; // ISO date
  time: string;
  venue: string;
  address: string;
  lat?: number;
  lng?: number;
  description: string;
  category: string;
  createdBy: string;
  createdAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  name: string;
  contact: string;
  role: string;
  status: "pending" | "confirmed" | "cancelled";
  timestamp: string;
}

export interface Donation {
  id: string;
  donorName: string;
  email: string;
  phone?: string;
  amount: number;
  date: string;
  purpose: string;
  note?: string;
}

export interface SevaLog {
  id: string;
  userId: string;
  eventId: string;
  hours: number;
  role: string;
  date: string;
  note?: string;
}

export interface Book {
  id: string;
  title: string;
  authors: string[];
  language: string;
  categories: string[];
  storagePath: string;
  description: string;
  uploadedBy: string;
  createdAt: string;
  fileType: "pdf" | "text";
}

export interface Verse {
  id: string;
  verseTextEn: string;
  verseTextNe: string;
  verseTextHi: string;
  source: string;
  chapter?: number;
  verse?: number;
}

// Zod schemas for validation
export const insertUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
});

export const insertEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  date: z.string(),
  time: z.string(),
  venue: z.string().min(2, "Venue is required"),
  address: z.string().min(5, "Address is required"),
  lat: z.number().optional(),
  lng: z.number().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string(),
});

export const insertRegistrationSchema = z.object({
  eventId: z.string(),
  name: z.string().min(2, "Name is required"),
  contact: z.string().min(10, "Contact is required"),
  role: z.string().min(2, "Role is required"),
});

export const insertDonationSchema = z.object({
  donorName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  amount: z.number().min(1, "Amount must be greater than 0"),
  purpose: z.string(),
  note: z.string().optional(),
});

export const insertSevaLogSchema = z.object({
  eventId: z.string(),
  hours: z.number().min(0.5, "Hours must be at least 0.5"),
  role: z.string().min(2, "Role is required"),
  date: z.string(),
  note: z.string().optional(),
});

export const insertBookSchema = z.object({
  title: z.string().min(2, "Title is required"),
  authors: z.array(z.string()),
  language: z.string(),
  categories: z.array(z.string()),
  description: z.string(),
  fileType: z.enum(["pdf", "text"]),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type InsertSevaLog = z.infer<typeof insertSevaLogSchema>;
export type InsertBook = z.infer<typeof insertBookSchema>;

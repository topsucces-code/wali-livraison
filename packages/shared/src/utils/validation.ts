import { z } from 'zod';

// Schémas de validation Zod

export const phoneSchema = z.string()
  .regex(/^\+225[0-9]{8,10}$/, 'Numéro de téléphone ivoirien invalide');

export const emailSchema = z.string()
  .email('Adresse email invalide')
  .optional();

export const passwordSchema = z.string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre');

export const userRegistrationSchema = z.object({
  phone: phoneSchema,
  email: emailSchema,
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  password: passwordSchema,
  role: z.enum(['CLIENT', 'DRIVER', 'PARTNER']).default('CLIENT')
});

export const addressSchema = z.object({
  street: z.string().min(5, 'L\'adresse doit contenir au moins 5 caractères'),
  city: z.string().min(2, 'La ville doit contenir au moins 2 caractères'),
  district: z.string().optional(),
  landmark: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  label: z.string().optional()
});

export const orderCreationSchema = z.object({
  type: z.enum(['DELIVERY', 'FOOD', 'SHOPPING']),
  pickupAddress: z.string().min(5),
  pickupLatitude: z.number().min(-90).max(90),
  pickupLongitude: z.number().min(-180).max(180),
  deliveryAddress: z.string().min(5),
  deliveryLatitude: z.number().min(-90).max(90),
  deliveryLongitude: z.number().min(-180).max(180),
  notes: z.string().optional(),
  scheduledAt: z.date().optional(),
  items: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0)
  })).optional()
});

// Fonctions utilitaires de validation

export const validatePhone = (phone: string): boolean => {
  return phoneSchema.safeParse(phone).success;
};

export const validateEmail = (email: string): boolean => {
  return z.string().email().safeParse(email).success;
};

export const formatPhone = (phone: string): string => {
  // Formate le numéro de téléphone ivoirien
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('225')) {
    return `+${cleaned}`;
  }
  if (cleaned.length === 8 || cleaned.length === 10) {
    return `+225${cleaned}`;
  }
  return phone;
};

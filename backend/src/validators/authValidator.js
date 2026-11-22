const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long').max(100),
    email: z.string().email('Please enter a valid email address').toLowerCase(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .max(100),
    studentId: z
      .string()
      .min(3, 'Student ID must be at least 3 characters long')
      .max(30),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address').toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    avatar: z.string().url('Avatar must be a valid URL').optional().or(z.literal('')),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6).optional(),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
};

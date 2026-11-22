const { z } = require('zod');

const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Group name must be at least 3 characters long').max(100),
    maxMembers: z.number().int().min(2).max(10).default(5),
  }),
});

const addMemberSchema = z.object({
  body: z.object({
    identifier: z
      .string()
      .min(1, 'Please enter a student email or student ID to add them to the group'),
  }),
  params: z.object({
    id: z.string().min(1, 'Group ID is required'),
  }),
});

const removeMemberSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Group ID is required'),
    userId: z.string().min(1, 'User ID is required'),
  }),
});

module.exports = {
  createGroupSchema,
  addMemberSchema,
  removeMemberSchema,
};

const { z } = require('zod');

const createAssignmentSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long').max(255),
    description: z.string().min(10, 'Description must be at least 10 characters long'),
    dueDate: z.string().datetime({ message: 'Due date must be a valid ISO 8601 datetime' }),
    onedriveUrl: z.string().url('OneDrive link must be a valid URL'),
    targetType: z.enum(['ALL', 'GROUPS']).default('ALL'),
    assignedGroupIds: z.array(z.string()).optional(),
  }),
});

const updateAssignmentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Assignment ID is required'),
  }),
  body: z.object({
    title: z.string().min(3).max(255).optional(),
    description: z.string().min(10).optional(),
    dueDate: z.string().datetime().optional(),
    onedriveUrl: z.string().url().optional(),
    targetType: z.enum(['ALL', 'GROUPS']).optional(),
    assignedGroupIds: z.array(z.string()).optional(),
  }),
});

module.exports = {
  createAssignmentSchema,
  updateAssignmentSchema,
};

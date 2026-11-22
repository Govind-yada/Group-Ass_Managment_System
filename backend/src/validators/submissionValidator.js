const { z } = require('zod');

const confirmSubmissionSchema = z.object({
  params: z.object({
    assignmentId: z.string().min(1, 'Assignment ID is required'),
  }),
  body: z.object({
    notes: z.string().max(500).optional(),
  }),
});

module.exports = {
  confirmSubmissionSchema,
};

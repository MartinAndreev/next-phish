import { z } from "zod";

export const CreateJobSchema = z.object({
  type: z.string().min(1),
  input: z.unknown(),
});

export const GetJobByIdSchema = z.object({
  id: z.string(),
});

export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type GetJobByIdInput = z.infer<typeof GetJobByIdSchema>;

import { z } from 'zod'

export const onboardingSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  school: z.string().trim().min(1, 'School is required'),
  program: z.string().trim().min(1, 'Program is required'),
  gpa: z.coerce.number().min(0).max(4),
  province: z.string().trim().min(2, 'Province is required'),
  citizenship: z.string().trim().min(2, 'Citizenship is required'),
  ethnicity: z.string().trim().min(1, 'Ethnicity is required'),
  interests: z.array(z.string().trim().min(1)).min(1, 'Add at least one interest'),
  demographics: z.string().trim().optional(),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>

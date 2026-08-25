import { z } from 'zod';

export const createClassSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Sinf nomini kiriting (masalan: 7-A)')
    .max(40, 'Sinf nomi 40 belgidan oshmasligi kerak'),
  subject: z
    .string()
    .trim()
    .min(1, 'Fan nomini kiriting (masalan: Matematika)')
    .max(60, 'Fan nomi 60 belgidan oshmasligi kerak'),
});

export const updateClassSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Sinf nomini kiriting (masalan: 7-A)')
    .max(40, 'Sinf nomi 40 belgidan oshmasligi kerak')
    .optional(),
  subject: z
    .string()
    .trim()
    .min(1, 'Fan nomini kiriting (masalan: Matematika)')
    .max(60, 'Fan nomi 60 belgidan oshmasligi kerak')
    .optional(),
});

export const createStudentSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "O'quvchi ism-familiyasini kiriting (kamida 2 belgi)")
    .max(120, "O'quvchi ism-familiyasi 120 belgidan oshmasligi kerak"),
});

export const updateStudentSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "O'quvchi ism-familiyasini kiriting (kamida 2 belgi)")
    .max(120, "O'quvchi ism-familiyasi 120 belgidan oshmasligi kerak"),
});

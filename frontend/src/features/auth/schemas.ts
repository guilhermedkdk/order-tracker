import { z } from 'zod'

// The API repeats every rule; these only spare a round trip.
const email = z.string().trim().toLowerCase().pipe(z.email('Informe um e-mail válido.'))

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha.'),
})

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome deve ter entre 2 e 100 caracteres.')
    .max(100, 'O nome deve ter entre 2 e 100 caracteres.'),
  email,
  password: z
    .string()
    .min(8, 'A senha deve ter entre 8 e 72 caracteres.')
    .max(72, 'A senha deve ter entre 8 e 72 caracteres.'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>

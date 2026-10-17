import { z } from 'zod'

const foundSchema = z.object({
  logradouro: z.string(),
  bairro: z.string(),
  localidade: z.string(),
  uf: z.string(),
})

// ViaCEP answers 200 with {"erro": "true"} (or true, in older answers) for a CEP that does not exist.
const notFoundSchema = z.object({ erro: z.union([z.literal(true), z.literal('true')]) })

export type CepAddress = { street: string; neighborhood: string; city: string; state: string }

/**
 * The address of an 8-digit CEP from ViaCEP, the one call that leaves this origin. `null` when the
 * CEP does not exist; a thrown error when ViaCEP cannot be reached.
 */
export async function lookupCep(digits: string): Promise<CepAddress | null> {
  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
  if (!response.ok) {
    throw new Error(`ViaCEP respondeu ${response.status}`)
  }
  const payload: unknown = await response.json()
  if (notFoundSchema.safeParse(payload).success) {
    return null
  }
  const found = foundSchema.parse(payload)
  return {
    street: found.logradouro,
    neighborhood: found.bairro,
    city: found.localidade,
    state: found.uf,
  }
}

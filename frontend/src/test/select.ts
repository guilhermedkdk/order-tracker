import { screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'

/** Picks `option` in the select labelled `label` as a person does: opens it and clicks the option. */
export async function choose({
  user,
  label,
  option,
}: {
  user: UserEvent
  label: string
  option: string | RegExp
}): Promise<void> {
  await user.click(screen.getByRole('combobox', { name: label }))
  await user.click(await screen.findByRole('option', { name: option }))
}

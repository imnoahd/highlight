import { Box, Form, Stack } from '@highlight-run/ui'
import { useState } from 'react'

import { useMatchErrorTagQuery } from '@/graph/generated/hooks'

export function MatchErrorTag() {
	const [query, setQuery] = useState('')
	const { data, loading } = useMatchErrorTagQuery({
		variables: { query: query },
		skip: !query,
	})

	console.log({ queryValue: query, data, loading })

	async function onMatchErrorTagSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()

		const formData = new FormData(e.target as HTMLFormElement)
		const query = (formData.get('query') as string) || ''

		setQuery(query)
	}

	return (
		<section>
			<h2>Match Error Tag</h2>
			<form onSubmit={onMatchErrorTagSubmit}>
				<Stack gap="8">
					<Form.Input name="query" />
					<Box>
						<Form.Submit disabled={loading} type="submit">
							Search
						</Form.Submit>
					</Box>
				</Stack>
			</form>
		</section>
	)
}

'use client'

import { HighlightOptions, H as localH } from 'highlight.run'

import { useEffect } from 'react'

export { localH as H }
export { ErrorBoundary } from '@highlight-run/react'

export interface Props extends HighlightOptions {
	excludedHostnames?: string[]
	projectId?: string
}

export function HighlightInit({
	excludedHostnames = [],
	projectId,
	...highlightOptions
}: Props) {
	useEffect(() => {
		const shouldRender =
			projectId &&
			excludedHostnames.every(
				(hostname) => !window.location.hostname.includes(hostname),
			)

		shouldRender && localH.init(projectId, highlightOptions)
	}, []) // eslint-disable-line react-hooks/exhaustive-deps

	return null
}

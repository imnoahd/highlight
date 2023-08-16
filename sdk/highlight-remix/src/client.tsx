import React, { useEffect } from 'react'

import Cookies from 'js-cookie'
import { H } from 'highlight.run'
import type { HighlightOptions } from 'highlight.run'
import { SESSION_STORAGE_KEYS } from '@highlight-run/client/src/utils/sessionStorage/sessionStorageKeys'

export { H } from 'highlight.run'

interface Props extends HighlightOptions {
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

		if (shouldRender) {
			const { sessionSecureID } = H.init(projectId, highlightOptions) || {
				sessionSecureID: '',
			}

			if (sessionSecureID) {
				Cookies.set(
					SESSION_STORAGE_KEYS.SESSION_SECURE_ID,
					sessionSecureID,
				)
			}
		}
	}, [projectId, highlightOptions])

	return null
}

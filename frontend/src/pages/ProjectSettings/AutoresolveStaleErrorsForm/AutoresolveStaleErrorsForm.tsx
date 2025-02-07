import { LoadingBar } from '@components/Loading/Loading'
import { Box, Callout, Form, Label, Stack } from '@highlight-run/ui'
import { useEffect, useState } from 'react'

import BorderBox from '@/components/BorderBox/BorderBox'
import { ToggleRow } from '@/components/ToggleRow/ToggleRow'
import { useProjectSettingsContext } from '@/pages/ProjectSettings/ProjectSettingsContext/ProjectSettingsContext'

const DAY_VALUES = Array.from({ length: 30 }, (_, i) => i + 1)

export const AutoresolveStaleErrorsForm = () => {
	const [enableAutoResolveStaleErrors, setEnableAutoResolveStaleErrors] =
		useState<boolean>(false)

	const {
		allProjectSettings: data,
		loading,
		setAllProjectSettings,
	} = useProjectSettingsContext()

	const setAutoResolveStaleErrorsDayInterval = (interval: number) => {
		setAllProjectSettings((currentProjectSettings) =>
			currentProjectSettings?.projectSettings
				? {
						projectSettings: {
							...currentProjectSettings.projectSettings,
							autoResolveStaleErrorsDayInterval: interval,
						},
				  }
				: currentProjectSettings,
		)
	}

	useEffect(() => {
		if (!loading) {
			const interval =
				data?.projectSettings?.autoResolveStaleErrorsDayInterval ?? 0

			if (interval > 0) {
				setEnableAutoResolveStaleErrors(true)
			}
		}
	}, [data?.projectSettings?.autoResolveStaleErrorsDayInterval, loading])

	if (loading) {
		return <LoadingBar />
	}

	const categories = [
		{
			key: 'Auto-resolve stale errors',
			message:
				"Enable this feature to automatically resolve errors that haven't been seen for the configured time period.",
			checked: enableAutoResolveStaleErrors,
		},
	]

	return (
		<>
			{categories.map((c) => (
				<BorderBox key={c.key}>
					<Box py="8">
						{ToggleRow(
							c.key,
							c.message,
							c.checked,
							(isOptIn: boolean) => {
								setEnableAutoResolveStaleErrors(isOptIn)

								if (!isOptIn) {
									setAutoResolveStaleErrorsDayInterval(0)
								}
							},
							false,
						)}
					</Box>

					<Box borderTop="dividerWeak" />

					<Stack
						direction="row"
						alignItems="center"
						justify="space-between"
						py="8"
					>
						<Box display="flex">
							<Label
								label="Auto-resolve errors not seen in"
								name="Auto-resolve errors not seen in"
							/>
						</Box>
						<Box>
							<Form.Select
								name="Auto-resolve errors not seen in"
								value={
									data?.projectSettings
										?.autoResolveStaleErrorsDayInterval
								}
								onChange={(e) =>
									setAutoResolveStaleErrorsDayInterval(
										Number(e.target.value),
									)
								}
								disabled={!enableAutoResolveStaleErrors}
							>
								{DAY_VALUES.map((day) => {
									if (day === 1) {
										return (
											<option value={day} key={day}>
												{day} day
											</option>
										)
									}
									return (
										<option value={day} key={day}>
											{day} days
										</option>
									)
								})}
							</Form.Select>
						</Box>
					</Stack>
					{enableAutoResolveStaleErrors && (
						<Callout kind="warning">
							Enabling auto-resolve will close all errors in that
							time period.
						</Callout>
					)}
				</BorderBox>
			))}
		</>
	)
}

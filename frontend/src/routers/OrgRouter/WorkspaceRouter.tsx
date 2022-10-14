import { useAuthContext } from '@authentication/AuthContext'
import { ErrorState } from '@components/ErrorState/ErrorState'
import { Header } from '@components/Header/Header'
import {
	AppLoadingState,
	useAppLoadingContext,
} from '@context/AppLoadingContext'
import { useGetWorkspaceDropdownOptionsQuery } from '@graph/hooks'
import LoginForm from '@pages/Login/Login'
import UserSettings from '@pages/UserSettings/UserSettings'
import { WorkspaceTabs } from '@pages/WorkspaceTabs/WorkspaceTabs'
import { GlobalContextProvider } from '@routers/OrgRouter/context/GlobalContext'
import { WorkspaceRedirectionRouter } from '@routers/OrgRouter/WorkspaceRedirectionRouter'
import { isOnPrem } from '@util/onPrem/onPremUtils'
import { useParams } from '@util/react-router/useParams'
import classNames from 'classnames'
import React, { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useToggle } from 'react-use'

import commonStyles from '../../Common.module.scss'
import { ApplicationContextProvider } from './ApplicationContext'

export const WorkspaceRouter = () => {
	const { isLoggedIn } = useAuthContext()
	const [showKeyboardShortcutsGuide, toggleShowKeyboardShortcutsGuide] =
		useToggle(false)
	const [showBanner, toggleShowBanner] = useToggle(false)

	const { workspace_id } = useParams<{
		workspace_id: string
	}>()
	const { setLoadingState } = useAppLoadingContext()

	const { data, loading } = useGetWorkspaceDropdownOptionsQuery({
		variables: { workspace_id },
		skip: !isLoggedIn, // Higher level routers decide when guests are allowed to hit this router
	})

	useEffect(() => {
		if (!isOnPrem) {
			window.Intercom('update', {
				hide_default_launcher: true,
			})
		}
		return () => {
			if (!isOnPrem) {
				window.Intercom('update', {
					hide_default_launcher: false,
				})
			}
		}
	}, [])

	useEffect(() => {
		if (isLoggedIn) {
			document.documentElement.style.setProperty(
				'--sidebar-width',
				'64px',
			)
		} else {
			document.documentElement.style.setProperty('--sidebar-width', '0')
		}
	}, [isLoggedIn])

	useEffect(() => {
		if (isLoggedIn) {
			setLoadingState(AppLoadingState.LOADED)
		}
	}, [isLoggedIn, setLoadingState])

	if (loading) {
		return null
	}

	// if the user can join this workspace, give them that option via the ErrorState
	const joinableWorkspace = data?.joinable_workspaces
		?.filter((w) => w?.id === workspace_id)
		?.pop()

	return (
		<GlobalContextProvider
			value={{
				showKeyboardShortcutsGuide,
				toggleShowKeyboardShortcutsGuide,
				showBanner,
				toggleShowBanner,
			}}
		>
			<ApplicationContextProvider
				value={{
					currentProject: undefined,
					allProjects: data?.workspace?.projects || [],
					currentWorkspace: data?.workspace || undefined,
					workspaces: data?.workspaces || [],
				}}
			>
				<Header />
				<div
					className={classNames(
						commonStyles.bodyWrapper,
						commonStyles.sidebarHidden,
					)}
				>
					{isLoggedIn && joinableWorkspace ? (
						<ErrorState
							shownWithHeader
							joinableWorkspace={joinableWorkspace}
						/>
					) : isLoggedIn && data?.workspace === null ? (
						<ErrorState
							title={'Enter this Workspace?'}
							message={`
                        Sadly, you don’t have access to the workspace 😢
                        Request access and we'll shoot an email to your workspace admin.
                        Alternatively, feel free to make an account!
                        `}
							shownWithHeader
						/>
					) : (
						<>
							<Routes>
								<Route
									path="/w/:page_id"
									element={
										isLoggedIn ? (
											<WorkspaceRedirectionRouter />
										) : (
											<LoginForm />
										)
									}
								/>
								<Route
									path="/w/:workspace_id/:page_id"
									element={<WorkspaceTabs />}
								/>
								{/*
								Probably doesn't belong here, but we wanted to reuse the Header,
								which requires context of a project or workspace.
								*/}
								<Route
									path="/w/:workspace_id/account"
									element={<UserSettings />}
								/>
								<Route
									path="/w/:workspace_id"
									element={
										isLoggedIn ? (
											<WorkspaceRedirectionRouter />
										) : (
											<LoginForm />
										)
									}
								/>
							</Routes>
						</>
					)}
				</div>
			</ApplicationContextProvider>
		</GlobalContextProvider>
	)
}

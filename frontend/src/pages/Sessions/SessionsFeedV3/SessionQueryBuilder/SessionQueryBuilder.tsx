import {
	useEditSegmentMutation,
	useGetFieldsOpensearchQuery,
	useGetFieldTypesQuery,
	useGetSegmentsQuery,
} from '@graph/hooks'
import { useSearchContext } from '@pages/Sessions/SearchContext/SearchContext'
import { useParams } from '@util/react-router/useParams'
import React from 'react'

import QueryBuilder, {
	BOOLEAN_OPERATORS,
	CUSTOM_TYPE,
	CustomField,
	FetchFieldVariables,
	RANGE_OPERATORS,
	SelectOption,
	TIME_OPERATORS,
	VIEWED_BY_OPERATORS,
} from '@/components/QueryBuilder/QueryBuilder'
import CreateSegmentModal from '@/pages/Sessions/SearchSidebar/SegmentButtons/CreateSegmentModal'
import DeleteSessionSegmentModal from '@/pages/Sessions/SearchSidebar/SegmentPicker/DeleteSessionSegmentModal/DeleteSessionSegmentModal'

export const InitialSearchParamsForUrl = {
	browser: undefined,
	date_range: undefined,
	device_id: undefined,
	excluded_properties: undefined,
	excluded_track_properties: undefined,
	first_time: undefined,
	hide_viewed: undefined,
	identified: undefined,
	length_range: undefined,
	os: undefined,
	referrer: undefined,
	track_properties: undefined,
	user_properties: undefined,
	visited_url: undefined,
	show_live_sessions: undefined,
	environments: undefined,
	app_versions: undefined,
} as const

export const TIME_RANGE_FIELD: SelectOption = {
	kind: 'single',
	label: 'created_at',
	value: 'custom_created_at',
}

const CUSTOM_FIELDS: CustomField[] = [
	{
		type: CUSTOM_TYPE,
		name: 'app_version',
		options: {
			type: 'text',
		},
	},
	{
		type: CUSTOM_TYPE,
		name: 'active_length',
		options: {
			operators: TIME_OPERATORS,
			type: 'long',
		},
	},
	{
		type: CUSTOM_TYPE,
		name: 'pages_visited',
		options: {
			operators: RANGE_OPERATORS,
			type: 'long',
		},
	},
	{
		type: CUSTOM_TYPE,
		name: 'viewed',
		options: {
			type: 'boolean',
		},
	},
	{
		type: CUSTOM_TYPE,
		name: 'viewed_by_me',
		options: {
			type: 'boolean',
			operators: VIEWED_BY_OPERATORS,
		},
	},
	{
		type: CUSTOM_TYPE,
		name: 'has_errors',
		options: {
			type: 'boolean',
			operators: BOOLEAN_OPERATORS,
		},
	},
	{
		type: CUSTOM_TYPE,
		name: 'has_rage_clicks',
		options: {
			type: 'boolean',
			operators: BOOLEAN_OPERATORS,
		},
	},
	{
		type: CUSTOM_TYPE,
		name: 'processed',
		options: {
			type: 'boolean',
		},
	},
	{
		type: CUSTOM_TYPE,
		name: 'first_time',
		options: {
			type: 'boolean',
		},
	},
	{
		type: CUSTOM_TYPE,
		name: 'starred',
		options: {
			type: 'boolean',
		},
	},
	{
		type: CUSTOM_TYPE,
		name: 'has_comments',
		options: {
			type: 'boolean',
			operators: BOOLEAN_OPERATORS,
		},
	},
]

const SessionQueryBuilder = React.memo((props: { readonly?: boolean }) => {
	const { refetch } = useGetFieldsOpensearchQuery({
		skip: true,
	})
	const fetchFields = (variables: FetchFieldVariables) =>
		refetch(variables).then((r) => r.data.fields_opensearch)

	const { project_id } = useParams<{
		project_id: string
	}>()
	const { data: fieldData } = useGetFieldTypesQuery({
		variables: { project_id: project_id! },
		skip: !project_id,
	})

	return (
		<QueryBuilder
			searchContext={useSearchContext()}
			timeRangeField={TIME_RANGE_FIELD}
			customFields={CUSTOM_FIELDS}
			fetchFields={fetchFields}
			fieldData={fieldData}
			useEditAnySegmentMutation={useEditSegmentMutation}
			useGetAnySegmentsQuery={useGetSegmentsQuery}
			CreateAnySegmentModal={CreateSegmentModal}
			DeleteAnySegmentModal={DeleteSessionSegmentModal}
			{...props}
		/>
	)
})
export default SessionQueryBuilder

import { HighlightOptions } from 'highlight.run'

export interface NodeOptions extends HighlightOptions {
	/**
	 * ID used to associate payloads with a Highlight project.
	 */
	projectID: string

	/**
	 * The endpoint string to send opentelemetry data to.
	 * @default https://otel.highlight.io:4318
	 */
	otlpEndpoint?: string

	/**
	 * This app's service name.
	 */
	serviceName?: string

	/**
	 * This app's version ideally set to the latest deployed git SHA.
	 */
	serviceVersion?: string
}

// scripts/generate-api.mjs
import { resolve } from 'path'
import { generateApi } from 'swagger-typescript-api'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

generateApi({
	name: 'Api.ts',
	output: resolve(__dirname, '../src/api'),
	url: 'http://localhost:8080/swagger/doc.json',
	httpClientType: 'axios',
	generateClient: true,
	generateRouteTypes: true,
	generateResponses: true,
	singleHttpClient: true,
	unwrapResponseData: true,
	defaultResponseAsSuccess: false,
	modular: false,
	cleanOutput: true,
	enumNamesAsValues: false,
	moduleNameFirstTag: false,
	generateUnionEnums: false,
	extractRequestParams: true,
	extractRequestBody: true,
	extractEnums: true,
	sortTypes: true,
	sortRoutes: true,
})

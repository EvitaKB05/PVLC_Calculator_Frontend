import { resolve } from 'path'
import { generateApi } from 'swagger-typescript-api'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

generateApi({
	name: 'Api.ts',
	output: resolve(__dirname, '../src/api'),
	url: 'http://localhost:8080/swagger/doc.json', // ИЗМЕНЕНО: правильный URL
	httpClientType: 'axios',
	generateResponses: true,
	generateRouteTypes: true,
	generateClient: true,
	extractRequestParams: true,
	extractRequestBody: true,
	extractResponseBody: true,
	extractResponseError: true,
})
	.then(() => {
		console.log('API успешно сгенерирован')
	})
	.catch(error => {
		console.error('Ошибка генерации API:', error)
		process.exit(1)
	})

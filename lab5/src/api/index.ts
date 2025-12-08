// src/api/index.ts
import { Api, HttpClient } from './Api'
import type {
	InternalAxiosRequestConfig,
	AxiosResponse,
	AxiosError,
} from 'axios'

// Создаем HTTP клиент с базовым URL
const httpClient = new HttpClient({
	baseURL: 'http://localhost:8080',
})

// Настраиваем интерцепторы для автоматического добавления JWT токена
httpClient.instance.interceptors.request.use(
	(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
		// ИСПРАВЛЕНИЕ: Используем localStorage для текущей сессии
		const token = localStorage.getItem('token')

		// Отключаем логи для /api/med_card/icon чтобы не засорять консоль
		if (config.url && !config.url.includes('/med_card/icon')) {
			console.log('🔧 Interceptor - URL:', config.url)
			console.log('🔧 Interceptor - Token exists:', !!token)
		}

		if (token && config.headers) {
			// Добавляем токен
			config.headers.Authorization = `Bearer ${token}`
			if (config.url && !config.url.includes('/med_card/icon')) {
				console.log('🔧 Interceptor - Added Authorization header')
			}
		}
		return config
	},
	(error: AxiosError): Promise<AxiosError> => {
		console.error('🔧 Interceptor request error:', error)
		return Promise.reject(error)
	}
)

// Интерцептор для обработки ошибок 401
httpClient.instance.interceptors.response.use(
	(response: AxiosResponse): AxiosResponse => response,
	(error: AxiosError): Promise<AxiosError> => {
		if (error.response?.status === 401) {
			localStorage.removeItem('token')
			window.location.reload()
		}
		return Promise.reject(error)
	}
)

// Создаем инстанс API с настроенным HTTP клиентом
export const api = new Api(httpClient)

// Вспомогательная функция для установки токена
export const setAuthToken = (token: string | null): void => {
	if (token) {
		localStorage.setItem('token', token)
	} else {
		localStorage.removeItem('token')
	}
}

// Вспомогательная функция для получения текущего токена
export const getAuthToken = (): string | null => {
	return localStorage.getItem('token')
}

// Экспортируем типы для удобства
export type {
	ApiLoginRequest,
	ApiLoginResponse,
	DsCartIconResponse,
	DsCompletePvlcMedCardRequest,
	DsCreatePvlcMedFormulaRequest,
	DsDeleteMedMmPvlcCalculationRequest,
	DsLoginMedUserRequest,
	DsMedMmPvlcCalculationResponse,
	DsMedUserRegistrationRequest,
	DsMedUserResponse,
	DsPvlcMedCardResponse,
	DsPvlcMedFormulaResponse,
	DsUpdateMedMmPvlcCalculationAPIRequest,
	DsUpdateMedMmPvlcCalculationRequest,
	DsUpdateMedUserRequest,
	DsUpdatePvlcMedCardRequest,
	DsUpdatePvlcMedFormulaRequest,
} from './Api'

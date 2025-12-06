import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {
	api,
	type ApiLoginRequest,
	type DsMedUserResponse,
	type DsMedUserRegistrationRequest,
} from '../../api'

// Интерфейс состояния аутентификации
interface AuthState {
	user: DsMedUserResponse | null
	isAuthenticated: boolean
	loading: boolean
	error: string | null
}

// Тип для ошибки API
interface ApiError {
	response?: {
		data?: string | Record<string, string>
		status?: number
	}
	message?: string
}

// Начальное состояние
const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	loading: false,
	error: null,
}

// Проверяем наличие токена при загрузке
const token = localStorage.getItem('token')
if (token) {
	// Восстанавливаем состояние из localStorage
	const userData = localStorage.getItem('user')
	if (userData) {
		try {
			initialState.user = JSON.parse(userData)
			initialState.isAuthenticated = true
		} catch (error) {
			console.error('Ошибка парсинга user из localStorage:', error)
			localStorage.removeItem('token')
			localStorage.removeItem('user')
		}
	}
}

// Асинхронное действие для входа
export const loginUser = createAsyncThunk(
	'auth/loginUser',
	async (credentials: ApiLoginRequest, { rejectWithValue }) => {
		try {
			const response = await api.api.authLoginCreate(credentials)

			// Сохраняем токен
			if (response.token) {
				localStorage.setItem('token', response.token)
			}

			// Сохраняем данные пользователя
			if (response.user) {
				localStorage.setItem('user', JSON.stringify(response.user))
			}

			return response.user || null
		} catch (error: unknown) {
			const apiError = error as ApiError
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка авторизации'
			)
		}
	}
)

// Асинхронное действие для выхода
export const logoutUser = createAsyncThunk(
	'auth/logoutUser',
	async (_, { rejectWithValue }) => {
		try {
			await api.api.authLogoutCreate()

			// Очищаем localStorage
			localStorage.removeItem('token')
			localStorage.removeItem('user')

			return true
		} catch (error: unknown) {
			// Все равно очищаем localStorage даже при ошибке
			localStorage.removeItem('token')
			localStorage.removeItem('user')
			const apiError = error as ApiError
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка выхода'
			)
		}
	}
)

// Асинхронное действие для получения профиля
export const getProfile = createAsyncThunk(
	'auth/getProfile',
	async (_, { rejectWithValue }) => {
		try {
			const response = await api.api.authProfileList()

			// Сохраняем данные пользователя
			localStorage.setItem('user', JSON.stringify(response))

			return response
		} catch (error: unknown) {
			// Если ошибка 401, очищаем данные
			const apiError = error as ApiError
			if (apiError.response?.status === 401) {
				localStorage.removeItem('token')
				localStorage.removeItem('user')
			}
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка загрузки профиля'
			)
		}
	}
)

// Асинхронное действие для регистрации
export const registerUser = createAsyncThunk(
	'auth/registerUser',
	async (userData: DsMedUserRegistrationRequest, { rejectWithValue }) => {
		try {
			const response = await api.api.medUsersRegisterCreate(userData)
			return response
		} catch (error: unknown) {
			const apiError = error as ApiError
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка регистрации'
			)
		}
	}
)

// Создаем слайс
const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		// Редьюсер для очистки ошибки
		clearError: state => {
			state.error = null
		},
		// Редьюсер для принудительного выхода (например, при 401)
		forceLogout: state => {
			state.user = null
			state.isAuthenticated = false
			localStorage.removeItem('token')
			localStorage.removeItem('user')
		},
	},
	extraReducers: builder => {
		builder
			// Обработка loginUser
			.addCase(loginUser.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(
				loginUser.fulfilled,
				(state, action: PayloadAction<DsMedUserResponse | null>) => {
					state.loading = false
					state.user = action.payload
					state.isAuthenticated = true
					state.error = null
				}
			)
			.addCase(loginUser.rejected, (state, action) => {
				state.loading = false
				state.isAuthenticated = false
				state.error = action.payload as string
			})

			// Обработка logoutUser
			.addCase(logoutUser.pending, state => {
				state.loading = true
			})
			.addCase(logoutUser.fulfilled, state => {
				state.loading = false
				state.user = null
				state.isAuthenticated = false
				state.error = null
			})
			.addCase(logoutUser.rejected, (state, action) => {
				state.loading = false
				// Все равно сбрасываем состояние даже при ошибке
				state.user = null
				state.isAuthenticated = false
				state.error = action.payload as string
			})

			// Обработка getProfile
			.addCase(getProfile.pending, state => {
				state.loading = true
			})
			.addCase(
				getProfile.fulfilled,
				(state, action: PayloadAction<DsMedUserResponse>) => {
					state.loading = false
					state.user = action.payload
					state.isAuthenticated = true
					state.error = null
				}
			)
			.addCase(getProfile.rejected, (state, action) => {
				state.loading = false
				// Не сбрасываем isAuthenticated здесь, чтобы избежать мерцания
				state.error = action.payload as string
			})

			// Обработка registerUser
			.addCase(registerUser.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(registerUser.fulfilled, state => {
				state.loading = false
				state.error = null
			})
			.addCase(registerUser.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload as string
			})
	},
})

// Экспортируем действия и редьюсер
export const { clearError, forceLogout } = authSlice.actions
export default authSlice.reducer

// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {
	api,
	type ApiLoginRequest,
	type DsMedUserResponse,
	type DsMedUserRegistrationRequest,
	type ApiLoginResponse,
	type DsUpdateMedUserRequest, // ИСПРАВЛЕНО: добавляем импорт типа
} from '../../api'

// Интерфейс состояния аутентификации
interface AuthState {
	user: DsMedUserResponse | null
	isAuthenticated: boolean
	loading: boolean
	error: string | null
	passwordChanging: boolean // ИСПРАВЛЕНО: добавляем состояние смены пароля
	passwordChangeError: string | null // ИСПРАВЛЕНО: добавляем ошибку смены пароля
}

// Тип для ошибки API
interface ApiError {
	response?: {
		data?: string | Record<string, string>
		status?: number
	}
	message?: string
}

// Тип для ответа API с оберткой data
interface ApiWrappedResponse<T> {
	data?: T
}

// Начальное состояние
const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	loading: false,
	error: null,
	passwordChanging: false, // ИСПРАВЛЕНО: инициализация
	passwordChangeError: null, // ИСПРАВЛЕНО: инициализация
}

// Проверяем наличие токена при загрузке
const token = localStorage.getItem('token')
if (token) {
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
			console.log('Logging in with:', credentials)

			const response = await api.api.authLoginCreate(credentials)
			console.log('Raw API response:', response)

			const apiResponse =
				response as unknown as ApiWrappedResponse<ApiLoginResponse>

			const responseData = apiResponse.data
			console.log('Response data:', responseData)

			let token: string | null = null
			let userData: DsMedUserResponse | null = null

			if (responseData) {
				if (responseData.token) {
					token = responseData.token
					console.log('Found token:', token.substring(0, 20) + '...')
				}

				if (responseData.user) {
					userData = responseData.user
					console.log('Found user:', userData)
				}
			}

			if (token) {
				localStorage.setItem('token', token)
				console.log('✅ Token saved to localStorage')
			} else {
				console.warn('❌ No token found in response.data')
			}

			if (userData) {
				localStorage.setItem('user', JSON.stringify(userData))
				console.log('✅ User saved to localStorage:', userData)
			}

			return userData
		} catch (error: unknown) {
			const apiError = error as ApiError
			console.error('Login error:', apiError)
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

			localStorage.removeItem('token')
			localStorage.removeItem('user')

			console.log('✅ Logout successful, localStorage cleared')
			return true
		} catch (error: unknown) {
			localStorage.removeItem('token')
			localStorage.removeItem('user')
			const apiError = error as ApiError
			console.error('Logout error, but cleared localStorage:', apiError)
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
			console.log('Profile API response:', response)

			let profileData: DsMedUserResponse

			if (response && typeof response === 'object' && 'data' in response) {
				const apiResponse = response as ApiWrappedResponse<DsMedUserResponse>
				if (apiResponse.data) {
					profileData = apiResponse.data
					console.log('Extracted profile from response.data')
				} else {
					throw new Error('No data in response')
				}
			} else {
				profileData = response as DsMedUserResponse
				console.log('Profile is direct response')
			}

			console.log('Profile data:', profileData)

			localStorage.setItem('user', JSON.stringify(profileData))
			console.log('✅ Profile saved to localStorage')

			return profileData
		} catch (error: unknown) {
			const apiError = error as ApiError
			if (apiError.response?.status === 401) {
				localStorage.removeItem('token')
				localStorage.removeItem('user')
				console.log('❌ 401 error, cleared localStorage')
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
			console.log('Registering user:', userData)
			const response = await api.api.medUsersRegisterCreate(userData)
			console.log('Registration response:', response)
			return response
		} catch (error: unknown) {
			const apiError = error as ApiError
			console.error('Registration error:', apiError)
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка регистрации'
			)
		}
	}
)

// ИСПРАВЛЕНО: Асинхронное действие для смены пароля
export const changePassword = createAsyncThunk(
	'auth/changePassword',
	async (passwordData: DsUpdateMedUserRequest, { rejectWithValue }) => {
		try {
			console.log('Changing password...')
			const response = await api.api.medUsersProfileUpdate(passwordData)
			console.log('Password change response:', response)
			return response
		} catch (error: unknown) {
			const apiError = error as ApiError
			console.error('Password change error:', apiError)
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка смены пароля'
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
		// ИСПРАВЛЕНО: Редьюсер для очистки ошибки смены пароля
		clearPasswordChangeError: state => {
			state.passwordChangeError = null
		},
		// Редьюсер для принудительного выхода (например, при 401)
		forceLogout: state => {
			state.user = null
			state.isAuthenticated = false
			localStorage.removeItem('token')
			localStorage.removeItem('user')
			console.log('Force logout executed')
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
					console.log('Login fulfilled, user set:', action.payload)
				}
			)
			.addCase(loginUser.rejected, (state, action) => {
				state.loading = false
				state.isAuthenticated = false
				state.error = action.payload as string
				console.log('Login rejected:', action.payload)
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
				console.log('Logout fulfilled')
			})
			.addCase(logoutUser.rejected, (state, action) => {
				state.loading = false
				state.user = null
				state.isAuthenticated = false
				state.error = action.payload as string
				console.log('Logout rejected but state cleared')
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
					console.log('GetProfile fulfilled, user set:', action.payload)
				}
			)
			.addCase(getProfile.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload as string
				console.log('GetProfile rejected:', action.payload)
			})

			// Обработка registerUser
			.addCase(registerUser.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(registerUser.fulfilled, state => {
				state.loading = false
				state.error = null
				console.log('RegisterUser fulfilled')
			})
			.addCase(registerUser.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload as string
				console.log('RegisterUser rejected:', action.payload)
			})

			// ИСПРАВЛЕНО: Обработка changePassword
			.addCase(changePassword.pending, state => {
				state.passwordChanging = true
				state.passwordChangeError = null
			})
			.addCase(changePassword.fulfilled, state => {
				state.passwordChanging = false
				state.passwordChangeError = null
				console.log('Password changed successfully')
			})
			.addCase(changePassword.rejected, (state, action) => {
				state.passwordChanging = false
				state.passwordChangeError = action.payload as string
				console.log('Password change rejected:', action.payload)
			})
	},
})

// Экспортируем действия и редьюсер
export const { clearError, clearPasswordChangeError, forceLogout } =
	authSlice.actions
export default authSlice.reducer

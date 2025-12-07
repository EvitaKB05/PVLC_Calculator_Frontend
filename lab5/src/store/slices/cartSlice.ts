//src/slices/cartSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../../api'

// Интерфейс состояния корзины
interface CartState {
	medCardId: number | null
	medItemCount: number
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
const initialState: CartState = {
	medCardId: null,
	medItemCount: 0,
	loading: false,
	error: null,
}

// Асинхронное действие для получения иконки корзины
export const getCartIcon = createAsyncThunk(
	'cart/getCartIcon',
	async (_, { rejectWithValue }) => {
		try {
			const response = await api.api.medCardIconList()
			return response
		} catch (error: unknown) {
			const apiError = error as ApiError
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка загрузки корзины'
			)
		}
	}
)

// Асинхронное действие для добавления формулы в корзину
// Асинхронное действие для добавления формулы в корзину
export const addToCart = createAsyncThunk(
	'cart/addToCart',
	async (formulaId: number, { rejectWithValue }) => {
		try {
			console.log('Adding to cart, formulaId:', formulaId) // Логирование

			// Проверяем токен
			const token = localStorage.getItem('token')
			console.log('Token exists:', !!token) // Логирование

			const response = await api.api.pvlcMedFormulasAddToCartCreate({
				id: formulaId,
			})
			console.log('Add to cart response:', response) // Логирование
			return { formulaId, response }
		} catch (error: unknown) {
			const apiError = error as ApiError
			console.error(
				'Add to cart error:',
				apiError.response?.data,
				apiError.response?.status
			) // Логирование
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка добавления в корзину'
			)
		}
	}
)

// Создаем слайс
const cartSlice = createSlice({
	name: 'cart',
	initialState,
	reducers: {
		// Редьюсер для очистки ошибки
		clearCartError: state => {
			state.error = null
		},
		// Редьюсер для сброса корзины (при выходе)
		resetCart: state => {
			state.medCardId = null
			state.medItemCount = 0
		},
	},
	extraReducers: builder => {
		builder
			// Обработка getCartIcon
			.addCase(getCartIcon.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(getCartIcon.fulfilled, (state, action) => {
				state.loading = false
				state.medCardId = action.payload.med_card_id || null
				state.medItemCount = action.payload.med_item_count || 0
				state.error = null
			})
			.addCase(getCartIcon.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload as string
			})

			// Обработка addToCart
			.addCase(addToCart.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(addToCart.fulfilled, state => {
				state.loading = false
				state.error = null
				// После добавления обновляем счетчик
				state.medItemCount += 1
			})
			.addCase(addToCart.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload as string
			})
	},
})

// Экспортируем действия и редьюсер
export const { clearCartError, resetCart } = cartSlice.actions
export default cartSlice.reducer

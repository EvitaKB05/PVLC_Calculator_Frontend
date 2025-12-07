// src/store/slices/cartSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../../api'
import type { DsCartIconResponse } from '../../api' // ИСПРАВЛЕНО: Используем тип из API

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
			// ИСПРАВЛЕНО: API возвращает { data: DsCartIconResponse }
			const apiResponse = response as { data: DsCartIconResponse }
			return apiResponse.data
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
export const addToCart = createAsyncThunk(
	'cart/addToCart',
	async (formulaId: number, { rejectWithValue, dispatch }) => {
		try {
			console.log('Adding to cart, formulaId:', formulaId)
			const token = localStorage.getItem('token')
			console.log('Token exists:', !!token)

			const response = await api.api.pvlcMedFormulasAddToCartCreate({
				id: formulaId,
			})
			console.log('Add to cart response:', response)

			// ИСПРАВЛЕНО: После успешного добавления обновляем иконку корзины
			await dispatch(getCartIcon())

			return { formulaId }
		} catch (error: unknown) {
			const apiError = error as ApiError
			console.error(
				'Add to cart error:',
				apiError.response?.data,
				apiError.response?.status
			)
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
				console.log('Cart icon updated:', {
					medCardId: state.medCardId,
					medItemCount: state.medItemCount,
				})
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
				// ИСПРАВЛЕНО: Счетчик уже обновлен через getCartIcon
				console.log('Add to cart successful')
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

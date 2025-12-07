//src/slices/ordersSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {
	api,
	type DsPvlcMedCardResponse,
	type DsUpdatePvlcMedCardRequest,
} from '../../api'

// Интерфейс состояния заявок
interface OrdersState {
	orders: DsPvlcMedCardResponse[]
	currentOrder: DsPvlcMedCardResponse | null
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

// Тип для параметров списка заявок
interface OrdersListParams {
	date_from?: string
	date_to?: string
	status?: string
}

// Начальное состояние
const initialState: OrdersState = {
	orders: [],
	currentOrder: null,
	loading: false,
	error: null,
}

// Асинхронное действие для получения списка заявок
export const getOrdersList = createAsyncThunk(
	'orders/getOrdersList',
	async (params: OrdersListParams = {}, { rejectWithValue }) => {
		try {
			const response = await api.api.pvlcMedCardsList(params)
			return response
		} catch (error: unknown) {
			const apiError = error as ApiError
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка загрузки заявок'
			)
		}
	}
)

// Асинхронное действие для получения деталей заявки
export const getOrderDetail = createAsyncThunk(
	'orders/getOrderDetail',
	async (id: number, { rejectWithValue }) => {
		try {
			const response = await api.api.pvlcMedCardsDetail({ id })
			return response
		} catch (error: unknown) {
			const apiError = error as ApiError
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка загрузки заявки'
			)
		}
	}
)

// Асинхронное действие для обновления заявки
export const updateOrder = createAsyncThunk(
	'orders/updateOrder',
	async (
		{ id, data }: { id: number; data: DsUpdatePvlcMedCardRequest },
		{ rejectWithValue }
	) => {
		try {
			const response = await api.api.pvlcMedCardsUpdate({ id }, data)
			return { id, data, response }
		} catch (error: unknown) {
			const apiError = error as ApiError
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка обновления заявки'
			)
		}
	}
)

// Асинхронное действие для удаления заявки
export const deleteOrder = createAsyncThunk(
	'orders/deleteOrder',
	async (id: number, { rejectWithValue }) => {
		try {
			const response = await api.api.pvlcMedCardsDelete({ id })
			return { id, response }
		} catch (error: unknown) {
			const apiError = error as ApiError
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка удаления заявки'
			)
		}
	}
)

// Асинхронное действие для формирования заявки
export const formOrder = createAsyncThunk(
	'orders/formOrder',
	async (id: number, { rejectWithValue }) => {
		try {
			const response = await api.api.pvlcMedCardsFormUpdate({ id })
			return { id, response }
		} catch (error: unknown) {
			const apiError = error as ApiError
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка формирования заявки'
			)
		}
	}
)

// Создаем слайс
const ordersSlice = createSlice({
	name: 'orders',
	initialState,
	reducers: {
		// Редьюсер для очистки ошибки
		clearOrdersError: state => {
			state.error = null
		},
		// Редьюсер для сброса текущей заявки
		clearCurrentOrder: state => {
			state.currentOrder = null
		},
	},
	extraReducers: builder => {
		builder
			// Обработка getOrdersList
			.addCase(getOrdersList.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(
				getOrdersList.fulfilled,
				(state, action: PayloadAction<DsPvlcMedCardResponse[]>) => {
					state.loading = false
					state.orders = action.payload
					state.error = null
				}
			)
			.addCase(getOrdersList.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload as string
			})

			// Обработка getOrderDetail
			.addCase(getOrderDetail.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(
				getOrderDetail.fulfilled,
				(state, action: PayloadAction<DsPvlcMedCardResponse>) => {
					state.loading = false
					state.currentOrder = action.payload
					state.error = null
				}
			)
			.addCase(getOrderDetail.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload as string
			})

			// Обработка updateOrder
			.addCase(updateOrder.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(updateOrder.fulfilled, (state, action) => {
				state.loading = false
				// Обновляем заявку в списке
				const index = state.orders.findIndex(
					order => order.id === action.payload.id
				)
				if (index !== -1 && state.currentOrder) {
					state.orders[index] = {
						...state.orders[index],
						...action.payload.data,
					}
					state.currentOrder = { ...state.currentOrder, ...action.payload.data }
				}
				state.error = null
			})
			.addCase(updateOrder.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload as string
			})

			// Обработка deleteOrder
			.addCase(deleteOrder.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(deleteOrder.fulfilled, (state, action) => {
				state.loading = false
				// Удаляем заявку из списка
				state.orders = state.orders.filter(
					order => order.id !== action.payload.id
				)
				if (state.currentOrder?.id === action.payload.id) {
					state.currentOrder = null
				}
				state.error = null
			})
			.addCase(deleteOrder.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload as string
			})

			// Обработка formOrder
			.addCase(formOrder.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(formOrder.fulfilled, (state, action) => {
				state.loading = false
				// Обновляем статус заявки
				const index = state.orders.findIndex(
					order => order.id === action.payload.id
				)
				if (index !== -1) {
					state.orders[index] = {
						...state.orders[index],
						status: 'сформирован',
					}
				}
				if (state.currentOrder?.id === action.payload.id) {
					state.currentOrder = { ...state.currentOrder, status: 'сформирован' }
				}
				state.error = null
			})
			.addCase(formOrder.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload as string
			})
	},
})

// Экспортируем действия и редьюсер
export const { clearOrdersError, clearCurrentOrder } = ordersSlice.actions
export default ordersSlice.reducer

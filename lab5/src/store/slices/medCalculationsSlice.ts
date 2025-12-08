// src/store/slices/medCalculationsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../../api'
import type { DsDeleteMedMmPvlcCalculationRequest } from '../../api'

// Интерфейс состояния расчетов
interface MedCalculationsState {
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
const initialState: MedCalculationsState = {
	loading: false,
	error: null,
}

// Асинхронное действие для удаления расчета из заявки
export const deleteCalculation = createAsyncThunk(
	'medCalculations/deleteCalculation',
	async (
		request: DsDeleteMedMmPvlcCalculationRequest,
		{ rejectWithValue } //
	) => {
		try {
			await api.api.medMmPvlcCalculationsDelete(request)
			return request
		} catch (error: unknown) {
			const apiError = error as ApiError
			return rejectWithValue(
				typeof apiError.response?.data === 'string'
					? apiError.response.data
					: 'Ошибка удаления расчета'
			)
		}
	}
)

// Создаем слайс
const medCalculationsSlice = createSlice({
	name: 'medCalculations',
	initialState,
	reducers: {
		// Редьюсер для очистки ошибки
		clearCalculationsError: state => {
			state.error = null
		},
	},
	extraReducers: builder => {
		builder
			// Обработка deleteCalculation
			.addCase(deleteCalculation.pending, state => {
				state.loading = true
				state.error = null
			})
			.addCase(deleteCalculation.fulfilled, state => {
				state.loading = false
				state.error = null
			})
			.addCase(deleteCalculation.rejected, (state, action) => {
				state.loading = false
				state.error = action.payload as string
			})
	},
})

// Экспортируем действия и редьюсер
export const { clearCalculationsError } = medCalculationsSlice.actions
export default medCalculationsSlice.reducer

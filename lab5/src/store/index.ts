import { configureStore } from '@reduxjs/toolkit'
import filterReducer from './slices/filterSlice'
// ИМПОРТИРУЕМ НОВЫЕ СЛАЙСЫ
import authReducer from './slices/authSlice'
import cartReducer from './slices/cartSlice'
import ordersReducer from './slices/ordersSlice'

export const store = configureStore({
	reducer: {
		filters: filterReducer,
		// ДОБАВЛЯЕМ НОВЫЕ РЕДЬЮСЕРЫ
		auth: authReducer,
		cart: cartReducer,
		orders: ordersReducer,
	},
})

// Экспортируем типы
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

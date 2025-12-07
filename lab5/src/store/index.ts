// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import filterReducer from './slices/filterSlice'
import authReducer from './slices/authSlice'
import cartReducer from './slices/cartSlice'
import ordersReducer from './slices/ordersSlice'
import medCalculationsReducer from './slices/medCalculationsSlice' // ДОБАВЛЯЕМ НОВЫЙ СЛАЙС

export const store = configureStore({
	reducer: {
		filters: filterReducer,
		auth: authReducer,
		cart: cartReducer,
		orders: ordersReducer,
		medCalculations: medCalculationsReducer, // ДОБАВЛЯЕМ НОВЫЙ СЛАЙС
	},
})

// Экспортируем типы
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

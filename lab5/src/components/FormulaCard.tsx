//src/components/FormulaCard.tsx
import React from 'react'
import type { PvlcMedFormula } from '../types'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { addToCart } from '../store/slices/cartSlice'
import { apiService } from '../services/api'

interface FormulaCardProps {
	formula: PvlcMedFormula
}

const FormulaCard: React.FC<FormulaCardProps> = ({ formula }) => {
	const navigate = useNavigate()
	const dispatch = useAppDispatch()

	// Получаем состояние из Redux
	const { isAuthenticated } = useAppSelector(state => state.auth)

	const handleDetailsClick = () => {
		navigate(`/pvlc_patient/${formula.id}`)
	}

	const handleAddToCart = async () => {
		if (!isAuthenticated) {
			navigate('/pvlc_login')
			return
		}

		try {
			await dispatch(addToCart(formula.id!))
			alert('Формула добавлена в заявку!')
		} catch (error) {
			console.error('Ошибка при добавлении в корзину:', error)
			alert('Ошибка при добавлении в заявку')
		}
	}

	const imageUrl = apiService.getImageUrl(formula.image_url)

	return (
		<div className='service-card'>
			<div className='card-image'>
				<img
					src={imageUrl}
					alt={formula.title}
					className='service-image'
					onError={e => {
						;(e.target as HTMLImageElement).src = '/DefaultImage.jpg'
					}}
				/>
			</div>
			<div className='card-content'>
				<h3 className='card-title'>{formula.title}</h3>

				<div className='card-buttons'>
					<button className='btn btn-details' onClick={handleDetailsClick}>
						Подробнее
					</button>

					{/* Кнопка "Добавить" показывается только авторизованным пользователям */}
					{isAuthenticated && (
						<button className='btn btn-select' onClick={handleAddToCart}>
							Добавить
						</button>
					)}
				</div>
			</div>
		</div>
	)
}

export default FormulaCard

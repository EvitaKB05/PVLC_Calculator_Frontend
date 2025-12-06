import React, { useState, useEffect, useRef } from 'react'
import { Container, Alert, Spinner, Form } from 'react-bootstrap'
import { useSearchParams, Link } from 'react-router-dom'
import type { PvlcMedFormula } from '../types'
import { apiService } from '../services/api'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { setSearchTerm, resetFilters } from '../store/slices/filterSlice'
import { getCartIcon } from '../store/slices/cartSlice'
import Breadcrumbs from '../components/Breadcrumbs'
import FormulaCard from '../components/FormulaCard'

const PvlcPatientsPage: React.FC = () => {
	const dispatch = useAppDispatch()

	// Получаем состояние фильтров из Redux
	const searchTerm = useAppSelector(state => state.filters.searchTerm)

	const [searchParams, setSearchParams] = useSearchParams()
	const [formulas, setFormulas] = useState<PvlcMedFormula[]>([])
	const [filteredFormulas, setFilteredFormulas] = useState<PvlcMedFormula[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [inputValue, setInputValue] = useState('')
	const searchInputRef = useRef<HTMLInputElement>(null)

	// Получаем состояние корзины и аутентификации из Redux
	const { medCardId, medItemCount } = useAppSelector(state => state.cart)
	const { isAuthenticated } = useAppSelector(state => state.auth)

	// Загружаем формулы при первом рендере
	useEffect(() => {
		loadFormulas()
		loadCartIcon()
	}, []) // Загружаем только при первом рендере

	// ИНИЦИАЛИЗАЦИЯ: Восстанавливаем поиск ТОЛЬКО из URL параметров при первом рендере
	useEffect(() => {
		const urlSearchTerm = searchParams.get('search') || ''

		// Синхронизируем Redux с URL параметрами только при первом рендере
		if (urlSearchTerm && urlSearchTerm !== searchTerm) {
			dispatch(setSearchTerm(urlSearchTerm))
			setInputValue(urlSearchTerm)
		}
	}, []) // Только при первом рендере

	// Синхронизация inputValue с searchTerm из Redux
	useEffect(() => {
		setInputValue(searchTerm)
	}, [searchTerm])

	// Применяем фильтры к уже загруженным данным
	useEffect(() => {
		applyFilters()
	}, [formulas, searchTerm]) // Применяем фильтры при изменении формул или поискового запроса

	const loadCartIcon = async () => {
		try {
			// Используем Redux для загрузки иконки корзины
			await dispatch(getCartIcon())
		} catch (error) {
			console.error('Error loading cart icon:', error)
		}
	}

	const loadFormulas = async () => {
		try {
			setLoading(true)
			setError(null)
			// Загружаем ВСЕ формулы (без фильтров)
			const data = await apiService.getFormulas()
			setFormulas(data)
		} catch (err) {
			setError('Ошибка загрузки категорий пациентов')
			console.error('Error loading formulas:', err)
		} finally {
			setLoading(false)
		}
	}

	const applyFilters = () => {
		let filtered = [...formulas]

		// Применяем ТОЛЬКО текстовый поиск (клиентская фильтрация)
		if (searchTerm) {
			filtered = filtered.filter(
				formula =>
					formula.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					formula.description.toLowerCase().includes(searchTerm.toLowerCase())
			)
		}

		setFilteredFormulas(filtered)
	}

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value)
	}

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		// Обновляем URL только при отправке формы
		if (inputValue) {
			setSearchParams({ search: inputValue })
		} else {
			setSearchParams({})
		}
		dispatch(setSearchTerm(inputValue))
	}

	const handleClearSearch = () => {
		dispatch(setSearchTerm(''))
		dispatch(resetFilters())
		setInputValue('')
		setSearchParams({})
		if (searchInputRef.current) {
			searchInputRef.current.focus()
		}
	}

	if (loading) {
		return (
			<Container className='text-center py-5'>
				<Spinner animation='border' role='status'>
					<span className='visually-hidden'>Загрузка...</span>
				</Spinner>
				<div className='mt-2'>Загрузка категорий пациентов...</div>
			</Container>
		)
	}

	return (
		<Container fluid className='px-0'>
			<Breadcrumbs
				items={[{ label: 'Категории пациентов', path: '/pvlc_patients' }]}
				onPatientsClick={handleClearSearch}
			/>

			<div className='page-header'>
				<Container>
					<h1 className='page-title'>
						Расчёт должной жизненной емкости лёгких (ДЖЕЛ)
					</h1>
				</Container>
			</div>
			<Container>
				{error && (
					<Alert variant='warning' className='mb-4'>
						{error}
					</Alert>
				)}

				<section className='search-section'>
					<Form onSubmit={handleSearchSubmit} className='search-form'>
						<div className='search-group'>
							<input
								ref={searchInputRef}
								type='text'
								name='query'
								placeholder='Поиск категорий...'
								value={inputValue}
								onChange={handleSearchChange}
								className='search-input'
							/>
							<button type='submit' className='search-button'>
								Найти
							</button>
						</div>
					</Form>
				</section>

				{filteredFormulas.length === 0 ? (
					<Alert variant='info'>
						{searchTerm
							? `По запросу "${searchTerm}" категории не найдены. Попробуйте изменить параметры поиска.`
							: 'Категории не найдены.'}
					</Alert>
				) : (
					<section className='services-section'>
						<div className='services-grid'>
							{filteredFormulas.map(formula => (
								<FormulaCard key={formula.id} formula={formula} />
							))}
						</div>
					</section>
				)}

				{/* Иконка корзины - ОБНОВЛЕНА ДЛЯ REDUX */}
				{medCardId && medItemCount > 0 && isAuthenticated ? (
					<Link
						to={`/pvlc_med_card/${medCardId}`}
						className='folder-icon'
						title='Перейти к заявке'
					>
						<img src='./folder.png' alt='Корзина' width='100' height='70' />
						<span className='notification-badge'>{medItemCount}</span>
					</Link>
				) : (
					<div className='folder-icon inactive' title='Корзина пуста'>
						<img src='./folder.png' alt='Корзина' width='100' height='70' />
					</div>
				)}
			</Container>
		</Container>
	)
}

export default PvlcPatientsPage

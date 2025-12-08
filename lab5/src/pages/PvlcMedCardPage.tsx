// src/pages/PvlcMedCardPage.tsx
import React, { useState, useEffect } from 'react'
import {
	Container,
	Button,
	Alert,
	Spinner,
	Form,
	Row,
	Col,
} from 'react-bootstrap'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
	getOrderDetail,
	updateOrder,
	deleteOrder,
	formOrder,
	clearOrdersError,
	updateCalculationHeight,
} from '../store/slices/ordersSlice'
import { deleteCalculation } from '../store/slices/medCalculationsSlice'
import { getCartIcon } from '../store/slices/cartSlice'
import Breadcrumbs from '../components/Breadcrumbs'
import { apiService } from '../services/api'

// Тип для состояния сохранения роста
interface HeightSaveState {
	[formulaId: number]: boolean
}

const PvlcMedCardPage: React.FC = () => {
	const { id } = useParams<{ id: string }>()
	const dispatch = useAppDispatch()
	const navigate = useNavigate()

	// Получаем состояние из Redux
	const { currentOrder, loading, error, updatingHeight } = useAppSelector(
		state => state.orders
	)
	const { isAuthenticated } = useAppSelector(state => state.auth)
	const { loading: deletingCalculation } = useAppSelector(
		state => state.medCalculations
	)

	// Локальное состояние для редактирования
	const [editMode, setEditMode] = useState(false)
	const [formData, setFormData] = useState({
		patient_name: '',
		doctor_name: '',
	})

	// Локальное состояние для роста (убраны таймеры автосохранения)
	const [heightValues, setHeightValues] = useState<Record<number, number>>({})
	const [heightSaved, setHeightSaved] = useState<HeightSaveState>({})

	// Загружаем данные заявки при монтировании
	useEffect(() => {
		if (id && isAuthenticated) {
			dispatch(getOrderDetail(parseInt(id)))
		}
	}, [dispatch, id, isAuthenticated])

	// Синхронизация формы с данными из Redux
	useEffect(() => {
		if (currentOrder) {
			// Обновляем форму данными из текущей заявки
			setFormData({
				patient_name: currentOrder.patient_name || '',
				doctor_name: currentOrder.doctor_name || '',
			})

			// Инициализируем значения роста из расчетов
			const initialHeights: Record<number, number> = {}
			const initialSaved: HeightSaveState = {}
			if (currentOrder.med_calculations) {
				currentOrder.med_calculations.forEach(calc => {
					if (calc.pvlc_med_formula_id && calc.input_height) {
						initialHeights[calc.pvlc_med_formula_id] = calc.input_height
						initialSaved[calc.pvlc_med_formula_id] = true // Уже сохранено в БД
					}
				})
			}
			setHeightValues(initialHeights)
			setHeightSaved(initialSaved)
		}
	}, [currentOrder])

	// Если пользователь не авторизован, перенаправляем на вход
	useEffect(() => {
		if (!isAuthenticated) {
			navigate('/pvlc_login')
		}
	}, [isAuthenticated, navigate])

	// Очищаем ошибку при размонтировании
	useEffect(() => {
		return () => {
			dispatch(clearOrdersError())
		}
	}, [dispatch])

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setFormData({
			...formData,
			[name]: value,
		})
	}

	const handleHeightChange = (formulaId: number, value: string) => {
		const numValue = parseFloat(value) || 0

		// Обновляем локальное состояние
		setHeightValues({
			...heightValues,
			[formulaId]: numValue,
		})

		// Сбрасываем статус сохранения при изменении значения
		setHeightSaved({
			...heightSaved,
			[formulaId]: false,
		})
	}

	// Функция ручного сохранения роста
	const handleSaveHeight = async (formulaId: number) => {
		if (!id || !currentOrder?.id) return

		const height = heightValues[formulaId]
		if (!height || height <= 0) {
			alert('Введите корректное значение роста (больше 0)')
			return
		}

		try {
			await dispatch(
				updateCalculationHeight({
					cardId: currentOrder.id,
					formulaId,
					height,
				})
			).unwrap()

			// Помечаем как сохраненное
			setHeightSaved({
				...heightSaved,
				[formulaId]: true,
			})

			console.log(`Рост для формулы ${formulaId} сохранен`)
		} catch (error) {
			console.error('Ошибка сохранения роста:', error)
			alert('Ошибка при сохранении роста')
		}
	}

	// Функция сохранения данных заявки
	const handleSave = async () => {
		if (id) {
			try {
				const result = await dispatch(
					updateOrder({
						id: parseInt(id),
						data: formData,
					})
				).unwrap()

				console.log('Заявка сохранена:', result)

				// Выходим из режима редактирования
				setEditMode(false)

				// Обновляем данные заявки после сохранения
				dispatch(getOrderDetail(parseInt(id)))
			} catch (error) {
				console.error('Ошибка сохранения заявки:', error)
				alert('Ошибка сохранения заявки')
			}
		}
	}

	// Функция отмены редактирования
	const handleCancel = () => {
		// Восстанавливаем исходные данные из currentOrder
		if (currentOrder) {
			setFormData({
				patient_name: currentOrder.patient_name || '',
				doctor_name: currentOrder.doctor_name || '',
			})
		}
		setEditMode(false)
	}

	const handleDelete = async () => {
		if (id && window.confirm('Вы уверены, что хотите удалить эту заявку?')) {
			await dispatch(deleteOrder(parseInt(id)))
			// Обновляем иконку корзины
			dispatch(getCartIcon())
			navigate('/pvlc_med_cards')
		}
	}

	const handleFormOrder = async () => {
		if (
			id &&
			window.confirm(
				'Сформировать заявку? После этого редактирование будет невозможно.'
			)
		) {
			await dispatch(formOrder(parseInt(id)))
			// Обновляем данные
			dispatch(getOrderDetail(parseInt(id)))
		}
	}

	// Функция для удаления формулы из заявки
	const handleDeleteCalculation = async (cardId: number, formulaId: number) => {
		if (window.confirm('Удалить эту формулу из заявки?')) {
			try {
				await dispatch(
					deleteCalculation({
						card_id: cardId,
						pvlc_med_formula_id: formulaId,
					})
				).unwrap()

				// Обновляем данные заявки
				if (id) {
					dispatch(getOrderDetail(parseInt(id)))
					// Обновляем иконку корзины
					dispatch(getCartIcon())
				}
			} catch (error) {
				console.error('Ошибка удаления формулы:', error)
				alert('Ошибка удаления формулы')
			}
		}
	}

	// Функция форматирования даты
	const formatDate = (dateString?: string) => {
		if (!dateString) return '—'
		try {
			const date = new Date(dateString)
			if (isNaN(date.getTime())) {
				return '—'
			}
			return date.toLocaleDateString('ru-RU', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			})
		} catch {
			return '—'
		}
	}

	const isDraft = currentOrder?.status === 'черновик'

	if (loading) {
		return (
			<Container className='text-center py-5'>
				<Spinner animation='border' role='status'>
					<span className='visually-hidden'>Загрузка...</span>
				</Spinner>
				<div className='mt-2'>Загрузка заявки...</div>
			</Container>
		)
	}

	if (error) {
		return (
			<Container>
				<Breadcrumbs
					items={[
						{ label: 'Главная', path: '/pvlc_home_page' },
						{ label: 'Мои заявки', path: '/pvlc_med_cards' },
						{ label: 'Ошибка' },
					]}
				/>
				<Alert variant='danger'>{error}</Alert>
				<Button variant='primary' onClick={() => navigate('/pvlc_med_cards')}>
					Вернуться к списку
				</Button>
			</Container>
		)
	}

	if (!currentOrder) {
		return (
			<Container>
				<Breadcrumbs
					items={[
						{ label: 'Главная', path: '/pvlc_home_page' },
						{ label: 'Мои заявки', path: '/pvlc_med_cards' },
						{ label: 'Не найдено' },
					]}
				/>
				<Alert variant='warning'>Заявка не найдена</Alert>
				<Button variant='primary' onClick={() => navigate('/pvlc_med_cards')}>
					Вернуться к списку
				</Button>
			</Container>
		)
	}

	// Получаем URL изображения
	const getImageUrl = (imageUrl?: string) => {
		return imageUrl ? apiService.getImageUrl(imageUrl) : '/DefaultImage.jpg'
	}

	return (
		<Container fluid className='px-0'>
			<Breadcrumbs
				items={[
					{ label: 'Главная', path: '/pvlc_home_page' },
					{ label: 'Мои заявки', path: '/pvlc_med_cards' },
					{ label: `Заявка #${currentOrder.id}` },
				]}
			/>

			<main className='main-content'>
				<div className='container'>
					{/* Заголовок страницы */}
					<div className='page-header'>
						<h1 className='page-title'>
							Расчёт должной жизненной емкости лёгких (ДЖЕЛ)
						</h1>
					</div>

					{/* Информация о заявке */}
					<div
						className='card mb-4'
						style={{ margin: '0 auto', maxWidth: '1050px' }}
					>
						<div className='card-body'>
							<Row className='mb-3'>
								<Col md={3}>
									<Form.Group>
										<Form.Label>Статус</Form.Label>
										<div>
											<span
												className={`badge bg-${isDraft ? 'warning' : 'info'}`}
											>
												{currentOrder.status}
											</span>
										</div>
									</Form.Group>
								</Col>
								<Col md={3}>
									<Form.Group>
										<Form.Label>Общий результат ДЖЕЛ</Form.Label>
										<div>
											<strong>{currentOrder.total_result || '0'} л</strong>
										</div>
									</Form.Group>
								</Col>
								<Col md={3}>
									<Form.Group>
										<Form.Label>Дата создания</Form.Label>
										<div>
											<strong>{formatDate(currentOrder.created_at)}</strong>
										</div>
									</Form.Group>
								</Col>
								<Col md={3}>
									<Form.Group>
										<Form.Label>Дата обновления</Form.Label>
										<div>
											<strong>
												{formatDate(
													currentOrder.updated_at ||
														currentOrder.finalized_at ||
														currentOrder.completed_at ||
														currentOrder.created_at
												)}
											</strong>
										</div>
									</Form.Group>
								</Col>
							</Row>

							<Row>
								<Col md={6}>
									<Form.Group className='mb-3'>
										<Form.Label>Пациент</Form.Label>
										{editMode ? (
											<Form.Control
												type='text'
												name='patient_name'
												value={formData.patient_name}
												onChange={handleInputChange}
												placeholder='Введите ФИО пациента'
												disabled={!isDraft}
											/>
										) : (
											<div>{formData.patient_name || '-'}</div>
										)}
									</Form.Group>
								</Col>
								<Col md={6}>
									<Form.Group className='mb-3'>
										<Form.Label>Врач</Form.Label>
										{editMode ? (
											<Form.Control
												type='text'
												name='doctor_name'
												value={formData.doctor_name}
												onChange={handleInputChange}
												placeholder='Введите ФИО врача'
												disabled={!isDraft}
											/>
										) : (
											<div>{formData.doctor_name || '-'}</div>
										)}
									</Form.Group>{' '}
									{/* ИСПРАВЛЕНИЕ: Закрывающий тег должен быть </Form.Group> */}
								</Col>
							</Row>
						</div>
					</div>

					{/* Выбранные формулы в стиле HTML-примера */}
					<section className='selected-categories'>
						<h2 className='section-title'>Выбранные категории</h2>

						{currentOrder.med_calculations &&
						currentOrder.med_calculations.length > 0 ? (
							<div className='categories-grid'>
								{currentOrder.med_calculations.map(calc => (
									<div key={calc.pvlc_med_formula_id} className='category-card'>
										<div className='category-image-container'>
											<div className='category-image'>
												<img
													src={getImageUrl(calc.image_url)}
													alt={calc.title}
													className='category-img'
												/>
											</div>
											<div className='category-title-plain'>{calc.title}</div>
										</div>
										<div className='category-info'>
											<div className='category-details'>
												<div className='parameters-row'>
													{/* Поле для ввода роста с кнопкой сохранения */}
													<div className='parameter-group'>
														<span className='parameter-label'>Рост:</span>
														<input
															type='number'
															className='height-input'
															placeholder='см'
															min='50'
															max='250'
															value={
																heightValues[calc.pvlc_med_formula_id!] || ''
															}
															onChange={e =>
																handleHeightChange(
																	calc.pvlc_med_formula_id!,
																	e.target.value
																)
															}
															disabled={!isDraft || updatingHeight}
															style={{ marginRight: '10px' }}
														/>
														{/* Кнопка сохранения роста - ИЗМЕНЕНИЕ: добавлена кнопка с галочкой */}
														{isDraft && calc.pvlc_med_formula_id && (
															<button
																type='button'
																className={`btn btn-${
																	heightSaved[calc.pvlc_med_formula_id]
																		? 'success'
																		: 'outline-primary'
																} btn-sm`}
																onClick={() =>
																	handleSaveHeight(calc.pvlc_med_formula_id!)
																}
																disabled={updatingHeight}
																title={
																	heightSaved[calc.pvlc_med_formula_id]
																		? 'Сохранено'
																		: 'Сохранить рост'
																}
																style={{
																	padding: '0.4rem 0.6rem',
																	minWidth: '40px',
																	display: 'flex',
																	alignItems: 'center',
																	justifyContent: 'center',
																}}
															>
																{updatingHeight ? (
																	<Spinner
																		as='span'
																		animation='border'
																		size='sm'
																	/>
																) : heightSaved[calc.pvlc_med_formula_id] ? (
																	<span style={{ fontSize: '16px' }}>✓</span>
																) : (
																	<span style={{ fontSize: '16px' }}>✓</span>
																)}
															</button>
														)}
													</div>
													{/* Результат ДЖЕЛ */}
													<div className='parameter-group'>
														<span className='parameter-label'>
															Результат ДЖЕЛ:
														</span>
														<input
															type='text'
															className='result-input'
															value={
																calc.final_result
																	? `${calc.final_result} л`
																	: 'не рассчитано'
															}
															placeholder='л'
															readOnly
														/>
													</div>
													{/* Кнопка удаления формулы */}
													{isDraft && (
														<div className='parameter-group'>
															<button
																type='button'
																className='btn btn-danger btn-sm'
																onClick={() =>
																	handleDeleteCalculation(
																		currentOrder.id!,
																		calc.pvlc_med_formula_id!
																	)
																}
																title='Удалить из заявки'
																disabled={deletingCalculation || updatingHeight}
																style={{
																	padding: '0.4rem 0.8rem',
																	marginLeft: '10px',
																	display: 'flex',
																	alignItems: 'center',
																	justifyContent: 'center',
																}}
															>
																{deletingCalculation ? (
																	<Spinner
																		as='span'
																		animation='border'
																		size='sm'
																	/>
																) : (
																	'🗑️'
																)}
															</button>
														</div>
													)}
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<Alert variant='info'>
								В этой заявке нет выбранных формул. Добавьте формулы на странице
								категорий.
							</Alert>
						)}
					</section>

					{/* Кнопки действий */}
					<section className='action-buttons'>
						<div className='buttons-container'>
							{isDraft && (
								<>
									{editMode ? (
										<>
											<Button
												variant='success'
												onClick={handleSave}
												className='btn-calculate'
												disabled={updatingHeight}
											>
												Сохранить
											</Button>
											<Button
												variant='secondary'
												onClick={handleCancel}
												disabled={updatingHeight}
											>
												Отмена
											</Button>
										</>
									) : (
										<Button
											variant='primary'
											onClick={() => setEditMode(true)}
											className='btn-calculate'
											disabled={updatingHeight}
										>
											Редактировать
										</Button>
									)}
									<Button
										variant='warning'
										onClick={handleFormOrder}
										className='btn-calculate'
										disabled={updatingHeight}
									>
										Сформировать
									</Button>
									<Button
										variant='danger'
										onClick={handleDelete}
										className='btn-delete'
										disabled={updatingHeight}
									>
										Удалить заявку
									</Button>
								</>
							)}
						</div>
					</section>
				</div>
			</main>
		</Container>
	)
}

export default PvlcMedCardPage

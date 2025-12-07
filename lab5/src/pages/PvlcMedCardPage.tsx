//src/components/PvlcMedCardPage.tsx
import React, { useState, useEffect } from 'react'
import {
	Container,
	Button,
	Alert,
	Spinner,
	Form,
	Row,
	Col,
	InputGroup,
	FormControl,
} from 'react-bootstrap'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
	getOrderDetail,
	updateOrder,
	deleteOrder,
	formOrder,
	clearOrdersError,
} from '../store/slices/ordersSlice'
import { getCartIcon } from '../store/slices/cartSlice'
import Breadcrumbs from '../components/Breadcrumbs'
import { apiService } from '../services/api'

const PvlcMedCardPage: React.FC = () => {
	const { id } = useParams<{ id: string }>()
	const dispatch = useAppDispatch()
	const navigate = useNavigate()

	// Получаем состояние из Redux
	const { currentOrder, loading, error } = useAppSelector(state => state.orders)
	const { isAuthenticated } = useAppSelector(state => state.auth)

	// Локальное состояние для редактирования
	const [editMode, setEditMode] = useState(false)
	const [formData, setFormData] = useState({
		patient_name: '',
		doctor_name: '',
	})

	// Локальное состояние для роста
	const [heightValues, setHeightValues] = useState<Record<number, number>>({})

	// Загружаем данные заявки при монтировании
	useEffect(() => {
		if (id && isAuthenticated) {
			dispatch(getOrderDetail(parseInt(id)))
		}
	}, [dispatch, id, isAuthenticated])

	// Инициализируем форму при загрузке данных
	useEffect(() => {
		if (currentOrder) {
			setFormData({
				patient_name: currentOrder.patient_name || '',
				doctor_name: currentOrder.doctor_name || '',
			})

			// Инициализируем значения роста из расчетов
			const initialHeights: Record<number, number> = {}
			if (currentOrder.med_calculations) {
				currentOrder.med_calculations.forEach(calc => {
					if (calc.pvlc_med_formula_id && calc.input_height) {
						initialHeights[calc.pvlc_med_formula_id] = calc.input_height
					}
				})
			}
			setHeightValues(initialHeights)
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
		setHeightValues({
			...heightValues,
			[formulaId]: numValue,
		})
	}

	const handleSave = async () => {
		if (id) {
			await dispatch(
				updateOrder({
					id: parseInt(id),
					data: formData,
				})
			)
			setEditMode(false)
		}
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

			{/* Синий блок */}
			<div className='page-header'>
				<Container>
					<h1 className='page-title'>Заявка на расчет ДЖЕЛ</h1>
				</Container>
			</div>

			<Container>
				{/* Информация о заявке */}
				<div className='card mb-4'>
					<div className='card-body'>
						<h5 className='card-title'>Информация о заявке</h5>
						<Row className='mb-3'>
							<Col md={6}>
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
							<Col md={6}>
								<Form.Group>
									<Form.Label>Общий результат ДЖЕЛ</Form.Label>
									<div>
										<strong>{currentOrder.total_result || '0'} л</strong>
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
										/>
									) : (
										<div>{currentOrder.patient_name || '-'}</div>
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
										/>
									) : (
										<div>{currentOrder.doctor_name || '-'}</div>
									)}
								</Form.Group>
							</Col>
						</Row>

						{/* Кнопки действий */}
						<div className='d-flex gap-2'>
							{isDraft && (
								<>
									{editMode ? (
										<>
											<Button variant='success' onClick={handleSave}>
												Сохранить
											</Button>
											<Button
												variant='secondary'
												onClick={() => setEditMode(false)}
											>
												Отмена
											</Button>
										</>
									) : (
										<Button variant='primary' onClick={() => setEditMode(true)}>
											Редактировать
										</Button>
									)}
									<Button variant='warning' onClick={handleFormOrder}>
										Сформировать
									</Button>
									<Button variant='danger' onClick={handleDelete}>
										Удалить
									</Button>
								</>
							)}
						</div>
					</div>
				</div>

				{/* Выбранные формулы */}
				<h4 className='mb-3'>Выбранные формулы для расчета</h4>

				{currentOrder.med_calculations &&
				currentOrder.med_calculations.length > 0 ? (
					<div className='row'>
						{currentOrder.med_calculations.map(calc => (
							<div key={calc.pvlc_med_formula_id} className='col-md-6 mb-4'>
								<div className='card h-100'>
									<div className='card-body'>
										<Row>
											<Col md={4}>
												<img
													src={getImageUrl(calc.image_url)}
													alt={calc.title}
													className='img-fluid rounded'
													style={{ maxHeight: '150px', objectFit: 'cover' }}
													onError={e => {
														;(e.target as HTMLImageElement).src =
															'/DefaultImage.jpg'
													}}
												/>
											</Col>
											<Col md={8}>
												<h5>{calc.title}</h5>
												<p className='text-muted small'>{calc.description}</p>

												<div className='mb-2'>
													<strong>Формула:</strong> {calc.formula}
												</div>

												<Row className='align-items-center'>
													<Col>
														<Form.Group>
															<Form.Label>Рост (см)</Form.Label>
															<InputGroup>
																<FormControl
																	type='number'
																	value={
																		heightValues[calc.pvlc_med_formula_id!] ||
																		''
																	}
																	onChange={e =>
																		handleHeightChange(
																			calc.pvlc_med_formula_id!,
																			e.target.value
																		)
																	}
																	disabled={!isDraft}
																	min='50'
																	max='250'
																/>
																<InputGroup.Text>см</InputGroup.Text>
															</InputGroup>
														</Form.Group>
													</Col>
													<Col>
														<Form.Group>
															<Form.Label>Результат ДЖЕЛ</Form.Label>
															<InputGroup>
																<FormControl
																	type='text'
																	value={
																		calc.final_result
																			? `${calc.final_result} л`
																			: 'не рассчитано'
																	}
																	readOnly
																/>
																<InputGroup.Text>л</InputGroup.Text>
															</InputGroup>
														</Form.Group>
													</Col>
												</Row>
											</Col>
										</Row>
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
			</Container>
		</Container>
	)
}

export default PvlcMedCardPage

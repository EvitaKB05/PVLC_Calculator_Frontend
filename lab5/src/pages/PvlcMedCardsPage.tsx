import React, { useEffect, useState } from 'react'
import {
	Container,
	Table,
	Button,
	Alert,
	Spinner,
	Badge,
	Form,
	Row,
	Col,
} from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
	getOrdersList,
	// ИСПРАВЛЕНО: импортируем новые действия
	setOrdersFilter,
	resetOrdersFilter,
} from '../store/slices/ordersSlice'
import Breadcrumbs from '../components/Breadcrumbs'
import type { DsPvlcMedCardResponse } from '../api'
import type { PvlcMedCardFilter } from '../types' // ИСПРАВЛЕНО: добавляем импорт типа

const PvlcMedCardsPage: React.FC = () => {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()

	// ИСПРАВЛЕНО: получаем состояние фильтров из Redux
	const { orders, loading, error, filter } = useAppSelector(
		state => state.orders
	)
	const { isAuthenticated } = useAppSelector(state => state.auth)

	// ИСПРАВЛЕНО: таймер для debounce фильтрации (используем number вместо NodeJS.Timeout)
	const [filterTimer, setFilterTimer] = useState<number | null>(null)

	// ИСПРАВЛЕНО: локальное состояние для формы фильтрации
	const [localFilter, setLocalFilter] = useState<PvlcMedCardFilter>({
		date_from: '',
		updated_date_from: '',
		status: '',
	})

	// ИСПРАВЛЕНО: инициализируем локальное состояние при загрузке
	useEffect(() => {
		setLocalFilter(filter)
	}, [filter])

	// ИСПРАВЛЕНО: загружаем заявки с фильтрами
	useEffect(() => {
		if (isAuthenticated) {
			// Преобразуем пустые строки в undefined для API
			const apiParams = {
				date_from: filter.date_from || undefined,
				updated_date_from: filter.updated_date_from || undefined,
				status: filter.status || undefined,
			}
			dispatch(getOrdersList(apiParams))
		}
	}, [dispatch, isAuthenticated, filter]) // ИСПРАВЛЕНО: добавляем filter в зависимости

	useEffect(() => {
		if (!isAuthenticated) {
			navigate('/pvlc_login')
		}
	}, [isAuthenticated, navigate])

	// ИСПРАВЛЕНО: обработчик изменения фильтра с debounce
	const handleFilterChange = (
		field: keyof PvlcMedCardFilter,
		value: string
	) => {
		const newFilter = {
			...localFilter,
			[field]: value,
		}
		setLocalFilter(newFilter)

		// Очищаем предыдущий таймер
		if (filterTimer !== null) {
			clearTimeout(filterTimer)
		}

		// Устанавливаем новый таймер для debounce (500ms)
		const timer = window.setTimeout(() => {
			dispatch(setOrdersFilter(newFilter))
		}, 500)

		setFilterTimer(timer)
	}

	// ИСПРАВЛЕНО: обработчик сброса фильтра
	const handleResetFilter = () => {
		dispatch(resetOrdersFilter())
		setLocalFilter({
			date_from: '',
			updated_date_from: '',
			status: '',
		})
	}

	// ИСПРАВЛЕНО: очищаем таймер при размонтировании
	useEffect(() => {
		return () => {
			if (filterTimer !== null) {
				clearTimeout(filterTimer)
			}
		}
	}, [filterTimer])

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'черновик':
				return 'warning'
			case 'сформирован':
				return 'info'
			case 'завершен':
				return 'success'
			case 'отклонен':
				return 'danger'
			default:
				return 'secondary'
		}
	}

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

	// ИСПРАВЛЕНО: Используем created_at напрямую
	const getCreatedDate = (order: DsPvlcMedCardResponse) => {
		return order.created_at
	}

	// ИСПРАВЛЕНО: Используем updated_at если есть, иначе другие даты
	const getUpdatedDate = (order: DsPvlcMedCardResponse) => {
		return (
			order.updated_at ||
			order.finalized_at ||
			order.completed_at ||
			order.created_at
		)
	}

	const handleOrderClick = (id: number) => {
		navigate(`/pvlc_med_card/${id}`)
	}

	// ИСПРАВЛЕНО: список доступных статусов
	const statusOptions = [
		{ value: '', label: 'Все статусы' },
		{ value: 'черновик', label: 'Черновик' },
		{ value: 'сформирован', label: 'Сформирован' },
		{ value: 'завершен', label: 'Завершен' },
		{ value: 'отклонен', label: 'Отклонен' },
	]

	return (
		<Container fluid className='px-0'>
			<Breadcrumbs
				items={[
					{ label: 'Главная', path: '/pvlc_home_page' },
					{ label: 'Мои заявки' },
				]}
			/>

			<div className='page-header'>
				<Container>
					<h1 className='page-title'>Мои заявки</h1>
				</Container>
			</div>

			<Container>
				{/* ИСПРАВЛЕНО: добавляем панель фильтрации */}
				<div className='bg-light p-4 rounded mb-4'>
					<h5 className='mb-3'>Фильтрация заявок</h5>
					<Form>
						<Row className='g-3'>
							<Col md={4}>
								<Form.Group>
									<Form.Label>Дата создания</Form.Label>
									<Form.Control
										type='date'
										value={localFilter.date_from || ''}
										onChange={e =>
											handleFilterChange('date_from', e.target.value)
										}
									/>
									<Form.Text className='text-muted'>
										Фильтр по дате создания заявки
									</Form.Text>
								</Form.Group>
							</Col>

							<Col md={4}>
								<Form.Group>
									<Form.Label>Дата обновления</Form.Label>
									<Form.Control
										type='date'
										value={localFilter.updated_date_from || ''}
										onChange={e =>
											handleFilterChange('updated_date_from', e.target.value)
										}
									/>
									<Form.Text className='text-muted'>
										Фильтр по дате последнего обновления
									</Form.Text>
								</Form.Group>
							</Col>

							<Col md={4}>
								<Form.Group>
									<Form.Label>Статус</Form.Label>
									<Form.Select
										value={localFilter.status || ''}
										onChange={e => handleFilterChange('status', e.target.value)}
									>
										{statusOptions.map(option => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</Form.Select>
								</Form.Group>
							</Col>
						</Row>

						<Row className='mt-3'>
							<Col className='d-flex gap-2'>
								{/* ИСПРАВЛЕНО: только кнопка сброса фильтров */}
								<Button
									variant='outline-secondary'
									onClick={handleResetFilter}
									disabled={loading}
								>
									Сбросить фильтры
								</Button>
							</Col>
						</Row>
					</Form>
				</div>

				{error && (
					<Alert variant='danger' className='mb-4'>
						{error}
					</Alert>
				)}

				{loading ? (
					<div className='text-center py-5'>
						<Spinner animation='border' role='status'>
							<span className='visually-hidden'>Загрузка...</span>
						</Spinner>
						<div className='mt-2'>Загрузка заявок...</div>
					</div>
				) : orders.length === 0 ? (
					<Alert variant='info'>
						{/* ИСПРАВЛЕНО: улучшаем сообщение при активных фильтрах */}
						{filter.date_from || filter.updated_date_from || filter.status
							? 'По выбранным фильтрам заявки не найдены. Попробуйте изменить параметры поиска.'
							: 'У вас пока нет заявок. Создайте первую заявку, добавив формулы на странице категорий.'}
					</Alert>
				) : (
					<>
						{/* ИСПРАВЛЕНО: показываем информацию о примененных фильтрах */}
						{(filter.date_from ||
							filter.updated_date_from ||
							filter.status) && (
							<div className='mb-3'>
								<small className='text-muted'>
									Применены фильтры:
									{filter.date_from && ` Дата создания от: ${filter.date_from}`}
									{filter.updated_date_from &&
										` Дата оформления от: ${filter.updated_date_from}`}
									{filter.status &&
										` Статус: ${
											statusOptions.find(opt => opt.value === filter.status)
												?.label
										}`}
								</small>
							</div>
						)}

						<Table striped bordered hover responsive className='mt-4'>
							<thead>
								<tr>
									<th>ID</th>
									<th>Пациент</th>
									<th>Врач</th>
									<th>Статус</th>
									<th>Результат ДЖЕЛ</th>
									<th>Дата создания</th>
									<th>Дата обновления</th>
									<th>Действия</th>
								</tr>
							</thead>
							<tbody>
								{orders.map(order => (
									<tr key={order.id}>
										<td>{order.id}</td>
										<td>{order.patient_name || '—'}</td>
										<td>{order.doctor_name || '—'}</td>
										<td>
											<Badge bg={getStatusColor(order.status || '')}>
												{order.status}
											</Badge>
										</td>
										<td>
											{order.total_result ? `${order.total_result} л` : '—'}
										</td>
										<td>{formatDate(getCreatedDate(order))}</td>
										<td>{formatDate(getUpdatedDate(order))}</td>
										<td>
											<Button
												variant='outline-primary'
												size='sm'
												onClick={() => handleOrderClick(order.id!)}
											>
												Подробнее
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</Table>
					</>
				)}
			</Container>
		</Container>
	)
}

export default PvlcMedCardsPage

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
import { getOrdersList } from '../store/slices/ordersSlice'
import Breadcrumbs from '../components/Breadcrumbs'
import type { DsPvlcMedCardResponse } from '../api'
import type { OrderFilter } from '../types' // ДОБАВЛЕНО: импорт типа фильтра

const PvlcMedCardsPage: React.FC = () => {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()

	const { orders, loading, error } = useAppSelector(state => state.orders)
	const { isAuthenticated } = useAppSelector(state => state.auth)

	// ДОБАВЛЕНО: состояние фильтров
	const [filters, setFilters] = useState<OrderFilter>({
		date_from: '',
		date_to: '',
		status: '',
	})

	// ДОБАВЛЕНО: обработчики изменения фильтров
	const handleFilterChange = (field: keyof OrderFilter, value: string) => {
		const newFilters = { ...filters, [field]: value }
		setFilters(newFilters)
		// Применяем фильтры при изменении
		dispatch(getOrdersList(newFilters))
	}

	// ДОБАВЛЕНО: обработчик сброса фильтров
	const handleResetFilters = () => {
		const resetFilters: OrderFilter = {
			date_from: '',
			date_to: '',
			status: '',
		}
		setFilters(resetFilters)
		dispatch(getOrdersList({}))
	}

	useEffect(() => {
		if (isAuthenticated) {
			dispatch(getOrdersList(filters)) // ИЗМЕНЕНО: передаем текущие фильтры
		}
	}, [dispatch, isAuthenticated])

	useEffect(() => {
		if (!isAuthenticated) {
			navigate('/pvlc_login')
		}
	}, [isAuthenticated, navigate])

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
				{error && (
					<Alert variant='danger' className='mb-4'>
						{error}
					</Alert>
				)}

				{/* ДОБАВЛЕНО: Панель фильтров */}
				<div className='bg-light p-4 rounded mb-4'>
					<h5 className='mb-3'>Фильтрация заявок</h5>
					<Form>
						<Row className='g-3'>
							<Col md={3}>
								<Form.Group controlId='filterDateFrom'>
									<Form.Label>Дата создания</Form.Label>
									<Form.Control
										type='date'
										value={filters.date_from || ''}
										onChange={e =>
											handleFilterChange('date_from', e.target.value)
										}
										max={filters.date_to || undefined}
									/>
								</Form.Group>
							</Col>

							<Col md={3}>
								<Form.Group controlId='filterDateTo'>
									<Form.Label>Дата обновления</Form.Label>
									<Form.Control
										type='date'
										value={filters.date_to || ''}
										onChange={e =>
											handleFilterChange('date_to', e.target.value)
										}
										min={filters.date_from || undefined}
									/>
								</Form.Group>
							</Col>

							<Col md={3}>
								<Form.Group controlId='filterStatus'>
									<Form.Label>Статус</Form.Label>
									<Form.Select
										value={filters.status || ''}
										onChange={e => handleFilterChange('status', e.target.value)}
									>
										<option value=''>Все статусы</option>
										<option value='черновик'>Черновик</option>
										<option value='сформирован'>Сформирован</option>
										<option value='завершен'>Завершен</option>
										<option value='отклонен'>Отклонен</option>
									</Form.Select>
								</Form.Group>
							</Col>

							<Col md={3} className='d-flex align-items-end'>
								<Button
									variant='outline-secondary'
									onClick={handleResetFilters}
									className='w-100'
								>
									Сбросить
								</Button>
							</Col>
						</Row>
					</Form>
				</div>
				{/* КОНЕЦ ДОБАВЛЕНИЯ: Панель фильтров */}

				{loading ? (
					<div className='text-center py-5'>
						<Spinner animation='border' role='status'>
							<span className='visually-hidden'>Загрузка...</span>
						</Spinner>
						<div className='mt-2'>Загрузка заявок...</div>
					</div>
				) : orders.length === 0 ? (
					<Alert variant='info'>
						{filters.date_from || filters.date_to || filters.status
							? 'По указанным фильтрам заявки не найдены'
							: 'У вас пока нет заявок. Создайте первую заявку, добавив формулы на странице категорий.'}
					</Alert>
				) : (
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
				)}
			</Container>
		</Container>
	)
}

export default PvlcMedCardsPage

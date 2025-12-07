import React, { useEffect } from 'react'
import {
	Container,
	Table,
	Button,
	Alert,
	Spinner,
	Badge,
} from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { getOrdersList } from '../store/slices/ordersSlice'
import Breadcrumbs from '../components/Breadcrumbs'
import type { DsPvlcMedCardResponse } from '../api'

const PvlcMedCardsPage: React.FC = () => {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()

	const { orders, loading, error } = useAppSelector(state => state.orders)
	const { isAuthenticated } = useAppSelector(state => state.auth)

	useEffect(() => {
		if (isAuthenticated) {
			dispatch(getOrdersList({}))
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

				{loading ? (
					<div className='text-center py-5'>
						<Spinner animation='border' role='status'>
							<span className='visually-hidden'>Загрузка...</span>
						</Spinner>
						<div className='mt-2'>Загрузка заявок...</div>
					</div>
				) : orders.length === 0 ? (
					<Alert variant='info'>
						У вас пока нет заявок. Создайте первую заявку, добавив формулы на
						странице категорий.
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

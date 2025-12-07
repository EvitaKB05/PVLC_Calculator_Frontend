//src/components/PvlcMedCardsPage.tsx
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

const PvlcMedCardsPage: React.FC = () => {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()

	// Получаем состояние из Redux
	const { orders, loading, error } = useAppSelector(state => state.orders)
	const { isAuthenticated } = useAppSelector(state => state.auth)

	// Загружаем список заявок при монтировании
	useEffect(() => {
		if (isAuthenticated) {
			dispatch(getOrdersList({}))
		}
	}, [dispatch, isAuthenticated])

	// Если пользователь не авторизован, перенаправляем на вход
	useEffect(() => {
		if (!isAuthenticated) {
			navigate('/pvlc_login')
		}
	}, [isAuthenticated, navigate])

	// Функция для получения цвета статуса
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

	// Функция для форматирования даты
	const formatDate = (dateString?: string) => {
		if (!dateString) return '-'
		return new Date(dateString).toLocaleDateString('ru-RU')
	}

	// Обработчик клика по заявке
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

			{/* Синий блок */}
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
								<th>Создана</th>
								<th>Действия</th>
							</tr>
						</thead>
						<tbody>
							{orders.map(order => (
								<tr key={order.id}>
									<td>{order.id}</td>
									<td>{order.patient_name || '-'}</td>
									<td>{order.doctor_name || '-'}</td>
									<td>
										<Badge bg={getStatusColor(order.status || '')}>
											{order.status}
										</Badge>
									</td>
									<td>
										{order.total_result ? `${order.total_result} л` : '-'}
									</td>
									<td>{formatDate(order.created_at)}</td>
									<td>
										<Button
											variant='outline-primary'
											size='sm'
											onClick={() => handleOrderClick(order.id!)}
										>
											Просмотр
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

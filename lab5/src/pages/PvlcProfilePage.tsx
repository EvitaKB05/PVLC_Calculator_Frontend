import React, { useState, useEffect } from 'react'
import { Container, Form, Button, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { getProfile } from '../store/slices/authSlice'
import Breadcrumbs from '../components/Breadcrumbs'

const PvlcProfilePage: React.FC = () => {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()

	// Получаем состояние из Redux
	const { user, isAuthenticated, loading } = useAppSelector(state => state.auth)

	// Локальное состояние формы
	const [formData, setFormData] = useState({
		password: '',
		confirmPassword: '',
	})

	// Если пользователь не авторизован, перенаправляем на вход
	useEffect(() => {
		if (!isAuthenticated) {
			navigate('/pvlc_login')
		}
	}, [isAuthenticated, navigate])

	// Загружаем профиль при монтировании
	useEffect(() => {
		if (isAuthenticated) {
			dispatch(getProfile())
		}
	}, [dispatch, isAuthenticated])

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setFormData({
			...formData,
			[name]: value,
		})
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		// Проверка совпадения паролей
		if (formData.password !== formData.confirmPassword) {
			alert('Пароли не совпадают')
			return
		}

		// Здесь будет обновление профиля
		alert('Функция смены пароля будет реализована позже')
	}

	if (!user) {
		return (
			<Container className='text-center py-5'>
				<Spinner animation='border' role='status'>
					<span className='visually-hidden'>Загрузка...</span>
				</Spinner>
				<div className='mt-2'>Загрузка профиля...</div>
			</Container>
		)
	}

	return (
		<Container fluid className='px-0'>
			<Breadcrumbs
				items={[
					{ label: 'Главная', path: '/pvlc_home_page' },
					{ label: 'Мой профиль' },
				]}
			/>

			{/* Синий блок */}
			<div className='page-header'>
				<Container>
					<h1 className='page-title'>Мой профиль</h1>
				</Container>
			</div>

			<Container>
				<div className='row justify-content-center'>
					<div className='col-md-8 col-lg-6'>
						<div className='card mb-4'>
							<div className='card-body'>
								<h5 className='card-title'>Информация о пользователе</h5>
								<div className='mb-3'>
									<strong>Логин:</strong> {user.login}
								</div>
								<div className='mb-3'>
									<strong>ID:</strong> {user.id}
								</div>
								<div className='mb-3'>
									<strong>Роль:</strong>{' '}
									{user.is_moderator ? 'Модератор' : 'Пользователь'}
								</div>
							</div>
						</div>

						<Form onSubmit={handleSubmit} className='mt-4'>
							<h5 className='mb-3'>Смена пароля</h5>

							<Form.Group className='mb-3'>
								<Form.Label>Новый пароль</Form.Label>
								<Form.Control
									type='password'
									name='password'
									value={formData.password}
									onChange={handleInputChange}
									placeholder='Введите новый пароль'
									required
									disabled={loading}
								/>
							</Form.Group>

							<Form.Group className='mb-4'>
								<Form.Label>Подтверждение пароля</Form.Label>
								<Form.Control
									type='password'
									name='confirmPassword'
									value={formData.confirmPassword}
									onChange={handleInputChange}
									placeholder='Повторите новый пароль'
									required
									disabled={loading}
								/>
							</Form.Group>

							<div className='d-grid'>
								<Button
									type='submit'
									variant='primary'
									size='lg'
									disabled={loading}
								>
									{loading ? (
										<>
											<Spinner
												as='span'
												animation='border'
												size='sm'
												role='status'
												aria-hidden='true'
												className='me-2'
											/>
											Сохранение...
										</>
									) : (
										'Сменить пароль'
									)}
								</Button>
							</div>
						</Form>
					</div>
				</div>
			</Container>
		</Container>
	)
}

export default PvlcProfilePage

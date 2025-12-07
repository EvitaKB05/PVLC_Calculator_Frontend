// src/pages/PvlcProfilePage.tsx
import React, { useState, useEffect } from 'react'
import { Container, Form, Button, Spinner, Alert, Card } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
	getProfile,
	changePassword,
	clearPasswordChangeError,
} from '../store/slices/authSlice'
import Breadcrumbs from '../components/Breadcrumbs'

const PvlcProfilePage: React.FC = () => {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()

	// Получаем состояние из Redux
	const {
		user,
		isAuthenticated,
		//loading,
		passwordChanging,
		passwordChangeError,
	} = useAppSelector(state => state.auth)

	// Локальное состояние формы смены пароля
	const [formData, setFormData] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	})

	const [errors, setErrors] = useState<Record<string, string>>({})
	const [successMessage, setSuccessMessage] = useState('')

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

	// Очищаем ошибки при размонтировании
	useEffect(() => {
		return () => {
			dispatch(clearPasswordChangeError())
		}
	}, [dispatch])

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setFormData({
			...formData,
			[name]: value,
		})

		// Очищаем ошибку для этого поля при вводе
		if (errors[name]) {
			setErrors({
				...errors,
				[name]: '',
			})
		}

		// Очищаем общую ошибку при любом вводе
		if (passwordChangeError) {
			dispatch(clearPasswordChangeError())
		}

		// Очищаем сообщение об успехе
		if (successMessage) {
			setSuccessMessage('')
		}
	}

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {}

		// Проверка текущего пароля
		if (!formData.currentPassword.trim()) {
			newErrors.currentPassword = 'Введите текущий пароль'
		}

		// Проверка нового пароля
		if (!formData.newPassword.trim()) {
			newErrors.newPassword = 'Введите новый пароль'
		} else if (formData.newPassword.length < 6) {
			newErrors.newPassword = 'Пароль должен содержать минимум 6 символов'
		}

		// Проверка подтверждения пароля
		if (!formData.confirmPassword.trim()) {
			newErrors.confirmPassword = 'Подтвердите новый пароль'
		} else if (formData.newPassword !== formData.confirmPassword) {
			newErrors.confirmPassword = 'Пароли не совпадают'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!validateForm()) {
			return
		}

		try {
			// ИСПРАВЛЕНО: Отправляем только поле password (текущая реализация API)
			// В соответствии с DsUpdateMedUserRequest, который ожидает только password
			const result = await dispatch(
				changePassword({
					password: formData.newPassword,
				})
			).unwrap()

			console.log('Password change result:', result)

			// Показываем сообщение об успехе
			setSuccessMessage('Пароль успешно изменен!')

			// Очищаем форму
			setFormData({
				currentPassword: '',
				newPassword: '',
				confirmPassword: '',
			})

			// Очищаем ошибки
			setErrors({})

			// Через 3 секунды скрываем сообщение об успехе
			setTimeout(() => {
				setSuccessMessage('')
			}, 3000)
		} catch (error) {
			console.error('Password change failed:', error)
			// Ошибка уже обработана в changePassword.rejected
		}
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
						{/* Карточка с информацией о пользователе */}
						<Card className='mb-4'>
							<Card.Body>
								<Card.Title>Информация о пользователе</Card.Title>
								<div className='mb-3'>
									<strong>Логин:</strong> {user.login}
								</div>
								{/* <div className='mb-3'>
									<strong>ID:</strong> {user.id}
								</div> */}
								<div className='mb-3'>
									<strong>Роль:</strong>{' '}
									{user.is_moderator ? 'Модератор' : 'Пользователь'}
								</div>
							</Card.Body>
						</Card>

						{/* Форма смены пароля */}
						<Card>
							<Card.Body>
								<Card.Title>Смена пароля</Card.Title>

								{/* Сообщение об успехе */}
								{successMessage && (
									<Alert variant='success' className='mb-3'>
										{successMessage}
									</Alert>
								)}

								{/* Ошибка смены пароля */}
								{passwordChangeError && (
									<Alert variant='danger' className='mb-3'>
										{passwordChangeError}
									</Alert>
								)}

								<Form onSubmit={handleSubmit}>
									{/* Текущий пароль */}
									<Form.Group className='mb-3'>
										<Form.Label>Текущий пароль</Form.Label>
										<Form.Control
											type='password'
											name='currentPassword'
											value={formData.currentPassword}
											onChange={handleInputChange}
											placeholder='Введите текущий пароль'
											isInvalid={!!errors.currentPassword}
											disabled={passwordChanging}
										/>
										<Form.Control.Feedback type='invalid'>
											{errors.currentPassword}
										</Form.Control.Feedback>
									</Form.Group>

									{/* Новый пароль */}
									<Form.Group className='mb-3'>
										<Form.Label>Новый пароль</Form.Label>
										<Form.Control
											type='password'
											name='newPassword'
											value={formData.newPassword}
											onChange={handleInputChange}
											placeholder='Введите новый пароль'
											isInvalid={!!errors.newPassword}
											disabled={passwordChanging}
										/>
										<Form.Control.Feedback type='invalid'>
											{errors.newPassword}
										</Form.Control.Feedback>
										{/* <Form.Text className='text-muted'>
											Минимум 6 символов
										</Form.Text> */}
									</Form.Group>

									{/* Подтверждение пароля */}
									<Form.Group className='mb-4'>
										<Form.Label>Подтверждение пароля</Form.Label>
										<Form.Control
											type='password'
											name='confirmPassword'
											value={formData.confirmPassword}
											onChange={handleInputChange}
											placeholder='Повторите новый пароль'
											isInvalid={!!errors.confirmPassword}
											disabled={passwordChanging}
										/>
										<Form.Control.Feedback type='invalid'>
											{errors.confirmPassword}
										</Form.Control.Feedback>
									</Form.Group>

									{/* Кнопка отправки */}
									<div className='d-grid'>
										<Button
											type='submit'
											variant='primary'
											size='lg'
											disabled={passwordChanging}
										>
											{passwordChanging ? (
												<>
													<Spinner
														as='span'
														animation='border'
														size='sm'
														role='status'
														aria-hidden='true'
														className='me-2'
													/>
													Смена пароля...
												</>
											) : (
												'Сменить пароль'
											)}
										</Button>
									</div>
								</Form>
							</Card.Body>
						</Card>
					</div>
				</div>
			</Container>
		</Container>
	)
}

export default PvlcProfilePage

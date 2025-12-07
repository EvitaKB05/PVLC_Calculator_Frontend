import React, { useState, useEffect } from 'react'
import { Container, Form, Button, Spinner } from 'react-bootstrap'
import { useNavigate, Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { registerUser, clearError, loginUser } from '../store/slices/authSlice'
import Breadcrumbs from '../components/Breadcrumbs'

const PvlcRegisterPage: React.FC = () => {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()

	// Получаем состояние из Redux
	const { isAuthenticated, loading } = useAppSelector(state => state.auth)

	// Локальное состояние формы
	const [formData, setFormData] = useState({
		login: '',
		password: '',
		confirmPassword: '',
	})

	// Если пользователь уже авторизован, перенаправляем на главную
	useEffect(() => {
		if (isAuthenticated) {
			navigate('/pvlc_patients')
		}
	}, [isAuthenticated, navigate])

	// Очищаем ошибку при размонтировании
	useEffect(() => {
		return () => {
			dispatch(clearError())
		}
	}, [dispatch])

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

		// Отправляем данные для регистрации
		const userData = {
			login: formData.login,
			password: formData.password,
			is_moderator: false, // Явно указываем
		}

		console.log('Registering user:', userData)

		try {
			const result = await dispatch(registerUser(userData))

			if (registerUser.fulfilled.match(result)) {
				console.log('Registration successful, now logging in...')
				alert('Регистрация успешна! Выполняется вход...')

				// Автоматически входим после регистрации
				const loginResult = await dispatch(
					loginUser({
						login: formData.login,
						password: formData.password,
					})
				)

				if (loginUser.fulfilled.match(loginResult)) {
					console.log('Auto-login successful')
					// Редирект произойдет автоматически благодаря useEffect
				} else {
					console.log('Auto-login failed, redirecting to login page')
					navigate('/pvlc_login')
				}
			} else {
				console.log('Registration failed:', result.payload)
				alert('Ошибка регистрации: ' + (result.payload as string))
			}
		} catch (error) {
			console.error('Registration error:', error)
		}
	}

	return (
		<Container fluid className='px-0'>
			<Breadcrumbs
				items={[
					{ label: 'Главная', path: '/pvlc_home_page' },
					{ label: 'Регистрация' },
				]}
			/>

			{/* Синий блок */}
			<div className='page-header'>
				<Container>
					<h1 className='page-title'>Регистрация</h1>
				</Container>
			</div>

			<Container>
				<div className='row justify-content-center'>
					<div className='col-md-6 col-lg-4'>
						<Form onSubmit={handleSubmit} className='mt-4'>
							<Form.Group className='mb-3'>
								<Form.Label>Логин</Form.Label>
								<Form.Control
									type='text'
									name='login'
									value={formData.login}
									onChange={handleInputChange}
									placeholder='Введите логин'
									required
									disabled={loading}
								/>
							</Form.Group>

							<Form.Group className='mb-3'>
								<Form.Label>Пароль</Form.Label>
								<Form.Control
									type='password'
									name='password'
									value={formData.password}
									onChange={handleInputChange}
									placeholder='Введите пароль'
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
									placeholder='Повторите пароль'
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
											Регистрация...
										</>
									) : (
										'Зарегистрироваться'
									)}
								</Button>

								<div className='text-center mt-3'>
									<p className='mb-0'>
										Уже есть аккаунт?{' '}
										<Link to='/pvlc_login' className='text-decoration-none'>
											Войти
										</Link>
									</p>
								</div>
							</div>
						</Form>
					</div>
				</div>
			</Container>
		</Container>
	)
}

export default PvlcRegisterPage

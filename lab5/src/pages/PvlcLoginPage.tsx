import React, { useState, useEffect } from 'react'
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap'
import { useNavigate, Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { loginUser, clearError, getProfile } from '../store/slices/authSlice'
import Breadcrumbs from '../components/Breadcrumbs'

const PvlcLoginPage: React.FC = () => {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()

	// Получаем состояние из Redux
	const { isAuthenticated, loading, error } = useAppSelector(
		state => state.auth
	)

	// Локальное состояние формы
	const [formData, setFormData] = useState({
		login: '',
		password: '',
	})

	// Если пользователь уже авторизован, перенаправляем на главную
	useEffect(() => {
		if (isAuthenticated) {
			console.log('Already authenticated, redirecting to /pvlc_patients')
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
		console.log('Submitting login form') // Логирование

		try {
			// Входим
			const result = await dispatch(loginUser(formData))
			console.log('Login result:', result) // Логирование

			if (loginUser.fulfilled.match(result)) {
				console.log('Login successful, getting profile...')
				// Успешный вход, загружаем профиль
				await dispatch(getProfile())
				console.log('Profile loaded, redirecting...')
				// Редирект произойдет автоматически благодаря useEffect
			} else {
				console.log('Login failed:', result.payload)
			}
		} catch (error) {
			console.error('Login error:', error)
		}
	}

	return (
		<Container fluid className='px-0'>
			<Breadcrumbs
				items={[
					{ label: 'Главная', path: '/pvlc_home_page' },
					{ label: 'Вход' },
				]}
			/>

			{/* Синий блок */}
			<div className='page-header'>
				<Container>
					<h1 className='page-title'>Вход в систему</h1>
				</Container>
			</div>

			<Container>
				<div className='row justify-content-center'>
					<div className='col-md-6 col-lg-4'>
						{error && (
							<Alert
								variant='danger'
								dismissible
								onClose={() => dispatch(clearError())}
							>
								{error}
							</Alert>
						)}

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

							<Form.Group className='mb-4'>
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

							<div className='d-grid gap-2'>
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
											Вход...
										</>
									) : (
										'Войти'
									)}
								</Button>

								<div className='text-center mt-3'>
									<p className='mb-0'>
										Нет аккаунта?{' '}
										<Link to='/pvlc_register' className='text-decoration-none'>
											Зарегистрироваться
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

export default PvlcLoginPage

//src/components/Breadcrumbs.tsx
import React from 'react'
import { Breadcrumb } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import type { BreadcrumbItem } from '../types'

interface BreadcrumbsProps {
	items: BreadcrumbItem[]
	onPatientsClick?: () => void
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
	items,
	onPatientsClick,
}) => {
	const navigate = useNavigate()

	const handlePatientsClick = (e: React.MouseEvent) => {
		e.preventDefault()
		if (onPatientsClick) {
			onPatientsClick() //поиск сброс
		}
		navigate('/pvlc_patients')
	}

	// ИСПРАВЛЕНИЕ: Добавляем обработчик для всех ссылок кроме текущей страницы
	const handleBreadcrumbClick = (
		e: React.MouseEvent,
		item: BreadcrumbItem,
		index: number,
		totalItems: number
	) => {
		// Если это не последний элемент (не активный)
		if (index < totalItems - 1) {
			// И если это ссылка на "Мои заявки"
			if (item.path === '/pvlc_med_cards') {
				// При переходе на "Мои заявки" сбрасываем фильтры
				// Это происходит автоматически через useEffect размонтирования в PvlcMedCardsPage
				console.log('Transition to My Orders - filters will be reset')
			}

			// Для ссылки "Категории пациентов" вызываем специальный обработчик
			if (item.path === '/pvlc_patients' && onPatientsClick) {
				handlePatientsClick(e)
				return
			}
		}
	}

	return (
		<Breadcrumb className='mb-4'>
			<Breadcrumb.Item linkAs={Link} linkProps={{ to: '/pvlc_home_page' }}>
				Главная
			</Breadcrumb.Item>
			{items.map((item, index) => (
				<Breadcrumb.Item
					key={index}
					linkAs={item.path ? Link : undefined}
					linkProps={
						item.path
							? {
									to: item.path,
									onClick: (e: React.MouseEvent) => {
										// ИСПРАВЛЕНИЕ: Используем общий обработчик
										if (item.path === '/pvlc_patients') {
											handlePatientsClick(e)
										} else {
											handleBreadcrumbClick(e, item, index, items.length)
										}
									},
							  }
							: undefined
					}
					active={index === items.length - 1}
				>
					{item.label}
				</Breadcrumb.Item>
			))}
		</Breadcrumb>
	)
}

export default Breadcrumbs

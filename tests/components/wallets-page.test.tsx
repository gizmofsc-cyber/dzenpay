/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { InsuranceDepositBanner } from '@/components/wallets/InsuranceDepositBanner'
import { InsuranceBalanceCard } from '@/components/wallets/InsuranceBalanceCard'

describe('Компоненты страхового депозита', () => {
  it('отображает баннер при полностью оплаченном депозите и вызывает подтверждение', () => {
    const acknowledgeMock = jest.fn()

    render(
      <InsuranceDepositBanner
        amount={1000}
        paid={1000}
        acknowledged={false}
        onAcknowledge={acknowledgeMock}
      />
    )

    expect(
      screen.getByText('Страховой депозит полностью оплачен. Вы можете работать с кошельками.')
    ).toBeInTheDocument()
    expect(screen.getByText('1 000,00 $ / 1 000,00 $')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Ознакомлен/i }))
    expect(acknowledgeMock).toHaveBeenCalledTimes(1)
  })

  it('не рендерит баннер, если депозит уже подтверждён', () => {
    const { container } = render(
      <InsuranceDepositBanner amount={1000} paid={1000} acknowledged onAcknowledge={() => {}} />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('отображает нехватку страхового депозита', () => {
    render(<InsuranceBalanceCard amount={1200} paid={800} />)

    expect(screen.getByText('Не хватает: 400,00 $')).toBeInTheDocument()
  })

  it('показывает статус “Полностью оплачен”, когда депозит закрыт', () => {
    render(<InsuranceBalanceCard amount={1000} paid={1000} />)

    expect(screen.getByText('Полностью оплачен')).toBeInTheDocument()
  })
})


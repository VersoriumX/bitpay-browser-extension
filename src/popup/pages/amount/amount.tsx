import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './amount.scss';
import CardDenoms from '../../components/card-denoms/card-denoms';
import PayWithBitpay from '../../components/pay-with-bitpay/pay-with-bitpay';
import { GiftCardInvoiceParams, CardConfig } from '../../../services/gift-card.types';
import { getPrecision } from '../../../services/currency';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Amount: React.FC<any> = ({ location, clientId, email, history, setPurchasedGiftCards }) => {
  const { cardConfig } = location.state as { cardConfig: CardConfig };
  const hasFixedDenoms = cardConfig.supportedAmounts && cardConfig.supportedAmounts[0];
  const initialAmount =
    cardConfig.supportedAmounts && cardConfig.supportedAmounts[0] ? cardConfig.supportedAmounts[0] : 0;
  const [amount, setAmount] = useState(initialAmount);
  const hasDiscount = false;
  const discounts = (cardConfig.discounts || []).map(discount => discount.code);
  const invoiceParams: GiftCardInvoiceParams = {
    brand: cardConfig.name,
    currency: cardConfig.currency,
    amount: initialAmount,
    clientId,
    discounts,
    email
  };
  const changeFixedAmount = (delta: number): void => {
    const denoms = cardConfig.supportedAmounts as number[];
    const maxIndex = denoms.length - 1;
    const currentIndex = denoms.indexOf(amount);
    const indexDelta = delta > 0 ? 1 : -1;
    const newIndex = currentIndex + indexDelta;
    // eslint-disable-next-line no-nested-ternary
    const index = newIndex < 0 ? 0 : newIndex > maxIndex ? maxIndex : newIndex;
    setAmount(denoms[index]);
  };
  const changeVariableAmount = (delta: number): void => {
    if (amount === 0 && delta < 0) {
      return setAmount(0);
    }
    const newValue = amount + delta;
    const maxAmount = cardConfig.maxAmount as number;
    const minAmount = cardConfig.minAmount as number;
    // eslint-disable-next-line no-nested-ternary
    const newAmount = newValue > maxAmount ? maxAmount : newValue < minAmount ? minAmount : newValue;
    setAmount(parseFloat(newAmount.toFixed(getPrecision(cardConfig.currency))));
  };
  const changeAmount = (delta: number): void =>
    hasFixedDenoms ? changeFixedAmount(delta) : changeVariableAmount(delta);
  return (
    <div className="amount-page">
      <div className="amount-page__title">
        <div className="amount-page__merchant-name">{cardConfig.displayName}</div>
        {hasDiscount ? <div className="amount-page__promo">3% Off Each Purchase</div> : null}
      </div>
      <div className="amount-page__amount-box__wrapper">
        <div className="amount-page__amount-box">
          <div className="amount-page__amount-box__currency">USD</div>
          <div className="amount-page__amount-box__amount">
            <button type="button" onClick={(): void => changeAmount(-0.01)}>
              <img src="../../assets/icons/decrement-icon.svg" alt="minus" />
            </button>
            <div
              className="amount-page__amount-box__amount__value"
              style={{
                color: amount === 0 ? '#DFDFDF' : 'inherit'
              }}
            >
              {amount}
            </div>
            <button type="button" onClick={(): void => changeAmount(0.01)}>
              <img src="../../assets/icons/increment-icon.svg" alt="minus" />
            </button>
          </div>
          <div className="amount-page__amount-box__denoms">
            <CardDenoms cardConfig={cardConfig} />
          </div>
        </div>
      </div>
      <div className="amount-page__cta">
        {hasDiscount || !email ? (
          <div className="action-button__footer">
            <Link
              className="action-button"
              to={{
                pathname: `/payment/${cardConfig.name}`,
                state: {
                  amount,
                  cardConfig,
                  invoiceParams
                }
              }}
            >
              Continue
            </Link>
          </div>
        ) : (
          <PayWithBitpay
            invoiceParams={{ ...invoiceParams, amount }}
            cardConfig={cardConfig}
            history={history}
            setPurchasedGiftCards={setPurchasedGiftCards}
          />
        )}
      </div>
    </div>
  );
};

export default Amount;

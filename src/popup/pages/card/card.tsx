import React, { useRef, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { usePopupState, bindTrigger, bindMenu } from 'material-ui-popup-state/hooks';
import { Tooltip, makeStyles, createStyles } from '@material-ui/core';
import { GiftCard, CardConfig } from '../../../services/gift-card.types';
import './card.scss';
import { set, get } from '../../../services/storage';
import { resizeToFitPage } from '../../../services/frame';
import LineItems from '../../components/line-items/line-items';
import CardHeader from '../../components/card-header/card-header';
import { launchNewTab } from '../../../services/browser';

const Card: React.FC<RouteComponentProps & { setPurchasedGiftCards: (cards: GiftCard[]) => void }> = ({
  location,
  history,
  setPurchasedGiftCards
}) => {
  const useStyles = makeStyles(() =>
    createStyles({
      customWidth: {
        borderRadius: '6px',
        color: 'white',
        backgroundColor: '#303133',
        maxWidth: 200,
        padding: '12px 15px',
        fontWeight: 400,
        fontSize: '11px',
        textAlign: 'center',
        top: '10px'
      }
    })
  );
  const classes = useStyles();

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    resizeToFitPage(ref, 80);
  }, [ref]);
  const { card, cardConfig } = location.state as { card: GiftCard; cardConfig: CardConfig };
  // card.status = 'PENDING';
  const [archived, setArchived] = useState(card.archived);
  const initiallyArchived = card.archived;
  // const cardObj = location.state.card as GiftCard;
  // const card = { ...cardObj, discounts: [{ type: 'percentage', amount: 5 }], totalDiscount: 0.05 } as GiftCard;
  const redeemUrl = `${cardConfig.redeemUrl}${card.claimCode}`;
  const popupState = usePopupState({ variant: 'popover', popupId: 'cardActions' });
  const launchClaimLink = (): void => {
    const url = cardConfig.defaultClaimCodeType === 'link' ? (card.claimLink as string) : redeemUrl;
    launchNewTab(url);
  };
  const shouldShowRedeemButton = (): boolean => !!(cardConfig.redeemUrl || cardConfig.defaultClaimCodeType === 'link');
  const archive = async (): Promise<void> => {
    const cards = await get<GiftCard[]>('purchasedGiftCards');
    const newCards = cards.map(purchasedCard =>
      purchasedCard.invoiceId === card.invoiceId ? { ...purchasedCard, archived: true } : { ...purchasedCard }
    );
    await set<GiftCard[]>('purchasedGiftCards', newCards);
    setPurchasedGiftCards(newCards);
    setArchived(true);
    initiallyArchived ? resizeToFitPage(ref, 80) : history.goBack();
  };
  const unarchive = async (): Promise<void> => {
    const cards = await get<GiftCard[]>('purchasedGiftCards');
    const newCards = cards.map(purchasedCard =>
      purchasedCard.invoiceId === card.invoiceId ? { ...purchasedCard, archived: false } : { ...purchasedCard }
    );
    await set<GiftCard[]>('purchasedGiftCards', newCards);
    setPurchasedGiftCards(newCards);
    const paddingBottom = shouldShowRedeemButton() ? 136 : 80;
    resizeToFitPage(ref, paddingBottom);
    setTimeout(() => setArchived(false), 300);
  };
  const handleMenuClick = (item: string): void => {
    switch (item) {
      case 'Edit Balance':
        console.log('edit balance');
        break;
      case 'Archive':
        archive();
        break;
      case 'Unarchive':
        unarchive();
        break;
      case 'Help':
        return launchNewTab('https://bitpay.com/request-help');
      default:
        console.log('Unknown Menu Option Selected');
    }
    popupState.close();
  };
  return (
    <div className="card-details">
      <div ref={ref}>
        <button className="card-details__more" type="button" {...bindTrigger(popupState)}>
          <img src="../../assets/icons/dots.svg" alt="More" />
        </button>
        <Menu
          {...bindMenu(popupState)}
          getContentAnchorEl={null}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          className="card-details__more__menu"
          style={{ boxShadow: 'none' }}
        >
          {['Edit Balance', archived ? 'Unarchive' : 'Archive', 'Help'].map(option => (
            <MenuItem
              className="card-details__more__menu__item"
              key={option}
              onClick={(): void => handleMenuClick(option)}
            >
              {option}
            </MenuItem>
          ))}
        </Menu>
        <CardHeader cardConfig={cardConfig} card={card} />
        <LineItems cardConfig={cardConfig} card={card} />
        {card.status === 'SUCCESS ' && cardConfig.defaultClaimCodeType !== 'link' ? (
          <>
            <div className="card-details__claim-box">
              <div className="card-details__claim-box__value">{card.claimCode}</div>
              <div className="card-details__claim-box__label">Claim Code</div>
            </div>
            {card.pin ? (
              <div className="card-details__claim-box">
                <div className="card-details__claim-box__value">{card.pin}</div>
                <div className="card-details__claim-box__label">Pin</div>
              </div>
            ) : null}
          </>
        ) : null}

        {card.status === 'SUCCESS' && !archived && shouldShowRedeemButton() ? (
          <button
            className="action-button"
            type="button"
            onClick={(): void => launchClaimLink()}
            style={{ marginBottom: '-10px' }}
          >
            Redeem Now
          </button>
        ) : null}

        {card.status === 'PENDING' ? (
          <>
            <Tooltip
              title="We’ll update your claim code here when your payment confirms"
              placement="top"
              classes={{ tooltip: classes.customWidth }}
              arrow
            >
              <button className="action-button action-button--warn" type="button" style={{ marginBottom: '-10px' }}>
                Pending Confirmation
              </button>
            </Tooltip>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Card;

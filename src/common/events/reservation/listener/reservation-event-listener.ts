import { HttpStatus, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RESERVATION_EVENT } from '../reservation-event';
import { COMMON_ERRORS } from '../../../../common/constants/error';
import { BusinessException } from '../../../../common/exception/business-exception';

@Injectable()
export class ReservationEventListener {
  @OnEvent(RESERVATION_EVENT.PAYMENT_EXTERNAL_INVOKE)
  async handlePaymentExternalInvoke(payload: {
    userId: string;
    price: number;
    token: string;
  }) {
    const { userId, price, token } = payload;
    let callPaymentApiReq = await fetch('http://127.0.0.1:4000/api/payment', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        price: price,
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
    });

    const callPaymentApi = await callPaymentApiReq.json();

    if (!callPaymentApi.isSuccess) {
      throw new BusinessException(
        COMMON_ERRORS.INTERNAL_SERVER_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return callPaymentApi;
  }

  @OnEvent(RESERVATION_EVENT.PAYMENT_COMPLETED)
  async handlePaymentCompleted(payload: { reservation: any; price: number }) {
    const { reservation, price } = payload;
    console.log('SAVE PAYMENT HISTORY OR SEND EMAIL TO USER');
  }
}

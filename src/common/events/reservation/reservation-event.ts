export const RESERVATION_EVENT = {
  RESERVATION_CREATED: 'reservation.created',
  RESERVATION_COMPLETED: 'reservation.completed',
  PAYMENT_EXTERNAL_INVOKE: 'payment.external.invoke',
  PAYMENT_COMPLETED: 'payment.completed',
};

export interface IReservationCreatedEvent {
  reservationId: number;
  userId: number;
  concertId: number;
  performanceDate: Date;
  seatNumber: number;
  price: number;
}

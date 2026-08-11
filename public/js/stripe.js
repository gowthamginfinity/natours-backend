import axios from 'axios';
import { showAlert } from './alert.js';

export const bookTour = async (tourId) => {
  try {
    // 1) Request Stripe Checkout Session from our Express Backend
    const res = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // 2) 🚨 2026 MODERN REDIRECT: Redirect directly using Stripe Hosted Payment Page URL
    if (res.data.status === 'success' && res.data.session.url) {
      window.location.replace(res.data.session.url);
    }
  } catch (err) {
    showAlert(
      'error',
      err?.response?.data?.message ||
        'Booking request failed! Please try again.',
    );
  }
};

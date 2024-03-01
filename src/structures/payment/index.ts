import { env } from "node:process";
import askForConfirmation from "./askForConfirmation";
import cancelled from "./cancelled";
import copy from "./copy";
import created from "./created";
import deletePayment from "./delete";
import generateQRCode from "./generateQRCode";
import paymentOpened from "./paymentOpened";
import showSelectMenuValues from "./showSelectMenuValues";
import validateMercadoPagoIDButtons from "./validateMercadoPagoIDButtons";

function getAccessToken() {
  return env.MACHINE === "localhost"
    ? env.MERCADO_PAGO_TEST_ACCESS_TOKEN
    : env.MERCADO_PAGO_PRODUCTION_ACCESS_TOKEN;
}

export {
  askForConfirmation,
  cancelled,
  copy,
  created,
  deletePayment,
  generateQRCode,
  paymentOpened,
  showSelectMenuValues,
  validateMercadoPagoIDButtons,
  getAccessToken
};
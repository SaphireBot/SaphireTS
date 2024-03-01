export interface Payment {
  accounts_info: null
  acquirer_reconciliation: []
  additional_info: {
    authentication_code: null
    available_balance: null
    nsu_processadora: null
  }
  authorization_code: null
  binary_mode: false
  brand_id: null
  build_version: string
  call_for_authorize_id: null
  callback_url: null
  captured: true
  card: object
  charges_details: [
    {
      accounts: {
        from: string
        to: string
      }
      amounts: {
        original: number
        refunded: number
      }
      client_id: number
      date_created: string
      id: string
      last_updated: string
      metadata: object
      name: string
      refund_charges: []
      reserve_id: null
      type: string
    }
  ]
  collector_id: number
  corporation_id: null
  counter_currency: null
  coupon_amount: number
  currency_id: "ARS" | "BRL" | "CLP" | "MXN" | "COP" | "PEN" | "UYU" | "VES" | "MCN" | "BTC" | "USD" | "USDP" | "DCE" | "ETH" | "FDI" | "CDB"
  date_approved: null
  date_created: string
  date_last_updated: string
  date_of_expiration: string
  deduction_schema: string
  description: null
  differential_pricing_id: null
  external_reference: null
  fee_details: []
  financing_group: null
  id: number
  installments: 1
  integrator_id: null
  issuer_id: string
  live_mode: false
  marketplace_owner: null
  merchant_account_id: null
  merchant_number: null
  metadata: Metadata
  money_release_date: null
  money_release_schema: null
  money_release_status: "released"
  notification_url: null
  operation_type: "investment" | "regular_payment" | "money_transfer" | "recurring_payment" | "account_fund" | "payment_addition" | "cellphone_recharge" | "pos_payment" | "money_exchange"
  order: object
  payer: {
    identification: {
      number: string | null
      type: "CPF" | "CNPJ" | "CUIT" | "CUIL" | "DNI" | "CURP" | "RFC" | "CC" | "RUT" | "CI"
    }
    entity_type: null
    phone: {
      number: null | null
      extension: null | null
      area_code: null | null
    }
    last_name: string | null
    id: string | null
    type: "customer" | "guest"
    first_name: string | null
    email: string | null
  }
  payment_method: {
    id: string
    issuer_id: string
    type: string
  }
  payment_method_id: "pix" | "account_money" | "debin_transfer"
  payment_type_id: "account_money" | "ticket" | "bank_transfer"
  platform_id: null
  point_of_interaction: {
    application_data: {
      name: null
      version: null
    }
    business_info: {
      branch: null
      sub_unit: string
      unit: string
    }
    location: {
      source: null
      state_id: null
    }
    transaction_data: {
      bank_info: {
        collector: {
          account_holder_name: string
          account_id: null
          long_name: null
          transfer_account_id: null
        }
        is_same_bank_account_owner: null
        origin_bank_id: null
        origin_wallet_id: null
        payer: {
          account_holder_name: null
          account_id: null
          external_account_id: null
          id: null
          identification: {
            number: null
            type: null
          }
          long_name: null
        }
      }
      bank_transfer_id: null
      e2e_id: null
      financial_institution: null
      infringement_notification: {
        status: null
        type: null
      }
      qr_code: string
      qr_code_base64: string
      ticket_url: string
      transaction_id: null
    }
    type: string
  }
  pos_id: null
  processing_mode: string
  refunds: []
  shipping_amount: number
  sponsor_id: null
  statement_descriptor: null
  status: "pending" | "approved" | "authorized"
  status_detail: "accredited"
  | "pending_contingency"
  | "pending_review_manual"
  | "cc_rejected_bad_filled_date"
  | "cc_rejected_bad_filled_other"
  | "cc_rejected_bad_filled_security_code"
  | "cc_rejected_blacklist"
  | "cc_rejected_call_for_authorize"
  | "cc_rejected_card_disabled"
  | "cc_rejected_duplicated_payment"
  | "cc_rejected_high_risk"
  | "cc_rejected_insufficient_amount"
  | "cc_rejected_invalid_installments"
  | "cc_rejected_max_attempts"
  | "cc_rejected_other_reason"
  store_id: null
  tags: null
  taxes_amount: number
  transaction_amount: number
  transaction_amount_refunded: number
  transaction_details: {
    acquirer_reference: null
    bank_transfer_id: null
    external_resource_url: null
    financial_institution: null
    installment_amount: number
    net_received_amount: number
    overpaid_amount: number
    payable_deferral_period: null
    payment_method_reference_id: null
    total_paid_amount: number
    transaction_id: null
  }
}

export interface Metadata {
  guild_id: string
  user_id: string
  message_id: string
  channel_id: string
}

export interface BasePayment {
  action: "payment.created" | "payment.updated"
  api_version: string
  data: { id: string }
  date_created: string
  id: number
  live_mode: boolean
  type: "payment"
  user_id: string
}

export interface CreateRequestPayment {
  guild_id: string
  user_id: string
  channel_id: string
  message_id: string
  username: string
  email: string
  amount: number
}
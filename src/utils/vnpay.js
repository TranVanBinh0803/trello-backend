import crypto from "crypto";

const VNPAY_SANDBOX_PAYMENT_URL =
  "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

const sortObject = (input) => {
  const sorted = {};
  Object.keys(input)
    .sort()
    .forEach((key) => {
      if (input[key] !== undefined && input[key] !== null && input[key] !== "") {
        sorted[key] = input[key];
      }
    });
  return sorted;
};

const formatDate = (date) => {
  const pad = (value) => value.toString().padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
};

const stringifyParams = (params) => {
  return new URLSearchParams(params).toString();
};

const signParams = (params, hashSecret) => {
  return crypto
    .createHmac("sha512", hashSecret)
    .update(stringifyParams(sortObject(params)), "utf-8")
    .digest("hex");
};

const buildPaymentUrl = ({
  amount,
  bankCode,
  clientIp,
  hashSecret,
  orderInfo,
  returnUrl,
  tmnCode,
  txnRef,
}) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
  const paymentUrl = process.env.VNPAY_PAYMENT_URL || VNPAY_SANDBOX_PAYMENT_URL;
  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Amount: amount * 100,
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: clientIp,
    vnp_CreateDate: formatDate(now),
    vnp_ExpireDate: formatDate(expiresAt),
  };

  if (bankCode) {
    params.vnp_BankCode = bankCode;
  }

  const sortedParams = sortObject(params);
  const secureHash = signParams(sortedParams, hashSecret);

  return `${paymentUrl}?${stringifyParams({
    ...sortedParams,
    vnp_SecureHash: secureHash,
  })}`;
};

const verifyReturnParams = (query, hashSecret) => {
  const params = { ...query };
  const secureHash = params.vnp_SecureHash;
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const signedHash = signParams(params, hashSecret);
  return signedHash === secureHash;
};

export const vnpayUtils = {
  buildPaymentUrl,
  verifyReturnParams,
};

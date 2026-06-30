import { WHITELIST_DOMAINS } from "~/utils/constants";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "~/utils/types";

export const corsOptions = {
  origin: function (origin, callback) {
    // Requests without Origin are not browser CORS requests.
    // Examples: VNPAY return redirect, Postman, curl, health checks.
    if (!origin) {
      return callback(null, true);
    }

    if (WHITELIST_DOMAINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(
      new ApiError(
        StatusCodes.FORBIDDEN,
        `${origin} not allowed by our CORS Policy.`
      )
    );
  },
  optionsSuccessStatus: 200,
  credentials: true,
};

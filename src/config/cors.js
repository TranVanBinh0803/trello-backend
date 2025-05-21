import { WHITELIST_DOMAINS } from '~/utils/constants'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

export const corsOptions = {
  origin: function (origin, callback) {
    // Cho phép gọi API bằng POSTMAN trên môi trường dev
    if (!origin && process.env.BUILD_MODE === 'dev') {
      return callback(null, true)
    }
    if (WHITELIST_DOMAINS.includes(origin)) {
      return callback(null, true)
    }
    return callback(new ApiError(StatusCodes.FORBIDDEN, `${origin} not allowed by our CORS Policy.`))
  },
  optionsSuccessStatus: 200,
  //   CORS sẽ cho phép nhận cookies từ requestrequest    
  credentials: true
}
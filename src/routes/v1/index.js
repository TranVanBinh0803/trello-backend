import express from "express";
import { boardRoute } from "./boardRoute";
import { columnRoute } from "./columnRoute";
import { cardRoute } from "./cardRoute";
import { authRoute } from "./authRoute";
import { userRoute } from "./userRoute";

const Router = express.Router();

Router.use('/boards', boardRoute)

Router.use('/columns', columnRoute)

Router.use('/cards', cardRoute)

Router.use('/auths', authRoute)

Router.use('/users', userRoute)



export const APIs_V1 = Router
import express from "express";
import { userController } from "~/controllers/userController";

const Router = express.Router();

Router.route("/:id").get(userController.getUser);
Router.route("/:id").patch(userController.updateProfile);


export const userRoute = Router;

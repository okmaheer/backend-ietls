import express from "express";
import {
  index,
  create,
  store,
  edit,
  update,
  deleteUser,
} from "../controllers/userController.js";

const router = express.Router();

// Match Laravel route structure
router.get("/index", index);           // user.index
router.get("/create", create);         // user.create
router.post("/store", store);          // user.store
router.get("/edit/:id", edit);         // user.edit
router.post("/update", update);        // user.update
router.get("/delete/:id", deleteUser); // user.delete

export default router;
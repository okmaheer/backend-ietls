// routes/userRoutes.js
import express from "express";
import {
  index,
  create,
  store,
  edit,
  update,
  deleteUser,
} from "../controllers/userController.js";
import { authenticate, isAdmin, isOwnerOrAdmin } from "../middleware/auth.js";

const router = express.Router();

// ✅ Admin only - List all users
router.get("/index", authenticate, isAdmin, index);

// ✅ Admin only - Show create user form (for admin panel)
router.get("/create", authenticate, isAdmin, create);

// ✅ Admin only - Create new user
router.post("/store", authenticate, isAdmin, store);

// ✅ Admin only - Edit user form
router.get("/edit/:id", authenticate, isAdmin, edit);

// ✅ Admin only - Update user
router.post("/update", authenticate, isAdmin, update);

// ✅ Admin only - Delete user
router.get("/delete/:id", authenticate, isAdmin, deleteUser);

// ==========================================
// ADDITIONAL USER ROUTES (Recommended)
// ==========================================

// ✅ Any authenticated user can view their own profile
router.get("/profile", authenticate, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id.toString(),
      name: req.user.name,
      email: req.user.email,
      roles: req.user.roles,
      isAdmin: req.user.isAdmin,
    },
  });
});

// ✅ User can update their own profile OR admin can update any profile
router.put("/profile/:id", authenticate, isOwnerOrAdmin("id"), async (req, res) => {
  // Your update profile logic here
  res.json({
    success: true,
    message: "Profile updated successfully",
  });
});

export default router;
import { prisma } from "../../config/prismaClient.js";
import { success, error } from "../../utils/response.js";

// 🧾 Get all active academic writing tests
export const getAcademicWritingTests = async (req, res) => {
  try {
    const tests = await prisma.tests.findMany({ 
      where: {
        status: 1,
        category: 1  
      },
      select: {
        id: true,
        name: true,
        category: true,
        type: true,
        created_at: true,
        updated_at: true
      },
      orderBy: { 
        name: "asc" 
      } 
    });

    // Return empty array if no tests found
    if (!tests || tests.length === 0) {
      return success(res, [], "No active tests available");
    }

    success(res, tests, "Active tests fetched successfully");
  } catch (err) {
    console.error("❌ Error fetching tests:", err);
    error(res, "Failed to fetch tests", 500);
  }
};


// 🧾 Get all active writing tests
export const getGeneralTrainingWritingTests = async (req, res) => {
  try {
    const tests = await prisma.tests.findMany({ 
      where: {
        status: 1,
        category: 2  
      },
      select: {
        id: true,
        name: true,
        category: true,
        type: true,
        created_at: true,
        updated_at: true
      },
      orderBy: { 
        id: "desc" 
      } 
    });

    // Return empty array if no tests found
    if (!tests || tests.length === 0) {
      return success(res, [], "No active tests available");
    }

    success(res, tests, "Active tests fetched successfully");
  } catch (err) {
    console.error("❌ Error fetching tests:", err);
    error(res, "Failed to fetch tests", 500);
  }
};
import { getLTdata, getCRSFtoken } from "./authService.js";

export const authenticateUser = async (req, res, next) => {
  try {
    const ltData = await getLTdata();
    if (!ltData ) {
      throw new Error("Invalid LT data");
    }

    const lt = ltData[0]?.lt;
    const cookies = ltData[1];
    const authData = await getCRSFtoken(lt, cookies);

    if (!authData || !authData.csrf || !authData.cookies) {
      throw new Error("Invalid authentication data");
    }

    if (req) {
      req.authData = { ...authData };
    }

    if (next) {
      next();
    } else {
      return authData; // Return authData if next is not provided
    }
  } catch (error) {
    console.error("Authentication failed:", error.message);

    if (res) {
      res
        .status(500)
        .json({ error: "Authentication failed", message: error.message });
    } else {
      throw new Error("Authentication failed: " + error.message);
    }
  }
};

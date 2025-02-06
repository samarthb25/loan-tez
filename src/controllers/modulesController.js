import Modules from "../models/modules.js"

/**
 * @swagger
 * /getModules:
 *   get:
 *     summary: Get the default modules
 *     tags:
 *       - Modules
 *     description: Retrieve the default modules using their ID. Requires proper authentication.
 *     parameters:
 *       - in: header
 *         name: token
 *         description: Bearer token for super admin authentication
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Modules retrieved successfully.
 *       '404':
 *         description: Modules not found.
 *       '403':
 *         description: Forbidden - Invalid or missing token.
 *       '500':
 *         description: Internal Server Error.
 */
export const getModules = async (req, res) => {
  try {
    const modules = await Modules.findOne({ id: 1 });
    if (!modules) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Module not found." });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Module retrieved successfully.",
      data: modules,
    });
  } catch (error) {
    console.error("Error retrieving modules:", error);
    res
      .status(500)
      .json({ statusCode: 500, message: "Internal Server Error", error });
  }
};

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import logger from "./logger.js";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath: string) => {
    try {
        if (!localFilePath) return { success: false, error: "Invalid file path" };

        // Upload to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // Delete local file after successful upload
        try {
            fs.unlinkSync(localFilePath);
        } catch (fsError) {
            logger.error({ err: fsError }, "Error deleting local file");
        }

        return { success: true, url: response.secure_url, data: response };

    } catch (error) {
        // Ensure local file is deleted even if upload fails
        if (fs.existsSync(localFilePath)) {
            try {
                fs.unlinkSync(localFilePath);
            } catch (fsError) {
                logger.error({ err: fsError }, "Error deleting local file after upload failure");
            }
        }

        logger.error({ err: error }, "Error uploading file on Cloudinary");
        return { success: false, error: "Failed to upload file to Cloudinary" };
    }
};

export { uploadOnCloudinary };

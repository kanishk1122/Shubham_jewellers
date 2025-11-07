import axios from "axios";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function seedAdmin() {
  console.log("🌱 Seeding admin user...");

  try {
    const response = await axios.post(`${API_URL}/api/auth/seed`, {
      email: process.env.SEED_ADMIN_EMAIL || "admin@example.com",
      phone: process.env.SEED_ADMIN_PHONE || "9999999999",
      password: process.env.SEED_ADMIN_PASSWORD || "Admin@123",
    });

    const result = response.data;

    if (result.success) {
      console.log("✅ Success:", result.message);
      console.log("📧 Email:", result.data.user.email);
      console.log("📱 Phone:", result.data.user.phone);
      console.log("🔑 Token:", result.data.token);
      console.log("\n💡 You can now login with these credentials");
    } else {
      console.error("❌ Failed:", result.error);
      process.exit(1);
    }
  } catch (error) {
    if (error.response) {
      console.error("❌ Error:", error.response.data);
    } else if (error.code === "ECONNREFUSED") {
      console.error(
        "❌ Connection refused. Make sure your Next.js dev server is running:"
      );
      console.error("   npm run dev");
    } else {
      console.error("❌ Error:", error.message);
    }
    process.exit(1);
  }
}

seedAdmin();

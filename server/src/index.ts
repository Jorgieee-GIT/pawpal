import "dotenv/config";
import { createApp } from "./app.js";
import { startLiveUpdates } from "./live.js";

const app = createApp();
startLiveUpdates();
const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`PawPal API running on port ${PORT}`);
});

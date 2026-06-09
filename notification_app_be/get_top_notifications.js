import { Log } from '../logging_middleware/logger.js';

const NOTIFICATION_API = "http://4.224.186.213/evaluation-service/notifications";


const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PRIORITY_MAP = {
  'placement': 3,
  'result': 2,
  'event': 1
};

async function fetchAndSortNotifications() {
  try {
    await Log('backend', 'info', 'api', 'Initiating connection to protected notification stream');

    const response = await fetch(NOTIFICATION_API, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    const notifications = data.notifications;

    await Log('backend', 'info', 'service', `Successfully fetched ${notifications.length} records`);

    const sorted = notifications.sort((a, b) => {
      const weightA = PRIORITY_MAP[a.Type.toLowerCase()] || 0;
      const weightB = PRIORITY_MAP[b.Type.toLowerCase()] || 0;

      if (weightB !== weightA) {
        return weightB - weightA; 
      }
      return new Date(b.Timestamp) - new Date(a.Timestamp);
    });

    const top10 = sorted.slice(0, 10);
    
    console.log("\n=== TOP 10 PRIORITY NOTIFICATIONS ===");
    console.dir(top10, { depth: null, colors: true });
    
    await Log('backend', 'info', 'service', 'Isolated top 10 priority notification vectors successfully');

  } catch (error) {
    await Log('backend', 'error', 'api', `Processing sequence breakdown: ${error.message}`);
    console.error("\nExecution failed:", error.message);
  }
}

fetchAndSortNotifications();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
let cachedToken = process.env.ACCESS_TOKEN;
async function refreshAuthToken() {
  try {
    const res = await fetch("http://4.224.186.213/evaluation-service/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientID: CLIENT_ID, clientSecret: CLIENT_SECRET })
    });
    const data = await res.json();
    if (data.access_token) {
      cachedToken = data.access_token;
      return cachedToken;
    }
  } catch (err) {
    console.error("Failed to refresh logging auth token:", err);
  }
  return cachedToken;
}

/**
 * Global Logger Utility
 * @param {'backend' | 'frontend'} stack
 * @param {'debug' | 'info' | 'warn' | 'error' | 'fatal'} level
 * @param {'component' | 'hook' | 'api' | 'auth' | 'middleware'} pkg
 * @param {string} message
 */
export async function Log(stack, level, pkg, message) {
  const url = "http://4.224.186.213/evaluation-service/logs";
  
  const payload = {
    stack: stack.toLowerCase(),
    level: level.toLowerCase(),
    package: pkg.toLowerCase(),
    message: message
  };

  try {
    let response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${cachedToken}`
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 401) {
      const newToken = await refreshAuthToken();
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${newToken}`
        },
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      console.error(`Remote logger failed [${response.status}]`);
    }
  } catch (error) {
    console.error("Failed sending log downstream:", error);
  }
}
const https = require('https');

const TELEGRAM_TOKEN = "8379832818:AAHVFxVrDSc9Ppy7TW3hddZxakVPKkKHgmE";
const ALLOWED_CHAT_ID = 1081049215;

function callTelegram(method, payload) {
  const data = JSON.stringify(payload);
  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${TELEGRAM_TOKEN}/${method}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendMsg(text) {
  const formattedText = `🤖 <b>[ANTIGRAVITY]</b>\n\n${text}`;
  return callTelegram("sendMessage", {
    chat_id: ALLOWED_CHAT_ID,
    text: formattedText,
    parse_mode: "HTML"
  });
}

async function waitForApproval(promptText, timeoutMs = 300000) {
  await sendMsg(`⚠️ <b>בקשת אישור פעולה:</b>\n${promptText}\n\n<i>הגב בהודעה 'כן', 'מאשר' או 'ok' כדי לאשר.</i>`);
  
  let lastUpdateId = 0;
  
  // Get initial offset to ignore past messages
  try {
    const init = await callTelegram("getUpdates", { limit: 10, timeout: 0 });
    if (init.ok && init.result.length > 0) {
      lastUpdateId = init.result[init.result.length - 1].update_id;
    }
  } catch (e) {
    console.error("Error getting initial Telegram updates:", e);
  }

  const startTime = Date.now();
  console.log(`Waiting for Telegram approval: "${promptText}"`);

  while (Date.now() - startTime < timeoutMs) {
    try {
      const resp = await callTelegram("getUpdates", {
        offset: lastUpdateId + 1,
        timeout: 5,
        limit: 10
      });
      if (resp.ok && resp.result.length > 0) {
        for (const update of resp.result) {
          lastUpdateId = update.update_id;
          if (update.message && update.message.chat.id === ALLOWED_CHAT_ID) {
            const text = (update.message.text || "").trim().toLowerCase();
            console.log(`Received reply on Telegram: "${text}"`);
            if (text === "כן" || text === "מאשר" || text === "ok" || text === "yes" || text === "אושר") {
              await sendMsg("✅ <b>האישור התקבל! אני ממשיך בביצוע המשימה.</b>");
              return true;
            } else if (text === "לא" || text === "cancel" || text === "no" || text === "בטל") {
              await sendMsg("❌ <b>הפעולה בוטלה על ידי המשתמש.</b>");
              return false;
            }
          }
        }
      }
    } catch (err) {
      console.error("Polling error in waitForApproval:", err);
    }
    // Sleep 1 second between polls
    await new Promise(r => setTimeout(r, 1000));
  }
  
  await sendMsg("⏰ <b>פג זמן ההמתנה לאישור (Timeout). הפעולה לא תבוצע.</b>");
  return false;
}

module.exports = {
  sendMsg,
  waitForApproval
};

// If run directly from command line (e.g. for simple notifications/testing)
if (require.main === module) {
  const args = process.argv.slice(2);
  const action = args[0];
  const text = args.slice(1).join(' ');
  
  if (action === 'send') {
    sendMsg(text).then(() => process.exit(0)).catch(() => process.exit(1));
  } else if (action === 'wait') {
    waitForApproval(text)
      .then(approved => process.exit(approved ? 0 : 1))
      .catch(() => process.exit(1));
  }
}

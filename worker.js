const BOT_TOKEN = ""; 
const FILE_STORE_CHANNEL_ID = ""; 
const BOT_USERNAME = "";
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// အောက်ဆုံးတွင် အမြဲပေါ်နေမယ့် Reply Keyboard မီနူးများ
const MENU_BUTTONS = [
  [{ text: "🎬 Movies" }, { text: "📺 Series" }],
  [{ text: "🔥 Ongoing" }, { text: "💃 Bollywood" }]
];

const MAIN_KEYBOARD = {
  keyboard: MENU_BUTTONS,
  resize_keyboard: true,
  is_persistent: true
};

// Menu စာသား → (message, button text, channel url)
const MENU_ACTIONS = {
  "🎬 Movies": [
    "🎬 ရုပ်ရှင်ကားများကြည့်ရန် ",
    "👉 Movies Channel သို့သွားရန်",
    "https://t.me/+6HBh8JhOyhY5YzFl"
  ],
  "📺 Series": [
    "📺 Kdrama နှင့် Tv Series များကြည့်ရန်",
    "👉 TV Series Channel သို့သွားရန်",
    "https://t.me/+IvlPKP5wTU01YzJl"
  ],
  "🔥 Ongoing": [
    "🔥 Ongoing ဇာတ်ကားများကြည့်ရန်",
    "👉 Ongoing Channel သို့သွားရန်",
    "https://t.me/+sgJPqkSyIFJlZGE1"
  ],
  "💃 Bollywood": [
    "💃 India ကားများကြည့်ရန်",
    "👉 Bollywood Channel သို့သွားရန်",
    "https://t.me/+PZKYvFumiRkxYzc9"
  ]
};

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") return new Response("OK", { status: 200 });

    try {
      const update = await request.json();

      if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const text = update.message.text;

        // ၁။ Reply Keyboard ခလုတ်များ နှိပ်သောအခါ
        if (MENU_ACTIONS[text]) {
          const [msg, btnText, url] = MENU_ACTIONS[text];
          await sendMenuWithInlineLink(chatId, msg, btnText, url);
        }
        // ၂။ /start (Deep Link payload ပါ/မပါ)
        else if (text.startsWith("/start")) {
          const args = text.split(" ");

          if (args.length > 1) {
            const rawPayload = args[1];
            let targetMessageIds = [];

            try {
              const decodedPayload = safeBase64Decode(rawPayload);

              if (decodedPayload.includes("-") && !decodedPayload.startsWith("http")) {
                const [startId, endId] = decodedPayload.split("-").map(n => Number(n.trim()));
                if (!isNaN(startId) && !isNaN(endId) && endId >= startId) {
                  for (let id = startId; id <= endId; id++) targetMessageIds.push(id);
                }
              } else if (decodedPayload.includes(",")) {
                targetMessageIds = decodedPayload
                  .split(",")
                  .map(id => Number(id.trim()))
                  .filter(id => !isNaN(id));
              } else if (decodedPayload.startsWith("http")) {
                const urlParts = decodedPayload.split("/");
                const id = Number(urlParts[urlParts.length - 1]);
                if (!isNaN(id)) targetMessageIds = [id];
              } else {
                const id = Number(decodedPayload.trim());
                if (!isNaN(id)) targetMessageIds = [id];
              }

              if (targetMessageIds.length === 0) throw new Error("Invalid ID");
            } catch (e) {
              console.error("Payload Decode Error:", e);
              await sendWelcomeMenu(chatId, "❌ Link မှားယွင်းနေပါသည်။");
              return new Response("OK", { status: 200 });
            }

            if (targetMessageIds.length === 1) {
              // Keyboard ကို ဇာတ်ကားပို့ပြီးနောက် sendMovieAndAutoDelete ထဲမှာ ပို့မည်
              ctx.waitUntil(sendMovieAndAutoDelete(chatId, targetMessageIds[0], rawPayload));
            } else {
              await sendSeriesMenu(chatId, targetMessageIds);
              // Series menu ပို့ပြီးနောက် Reply Keyboard ပို့
              await sendWelcomeMenu(chatId, "👇 အခြားဇာတ်ကားများကို အောက်ပါမီနူးမှ ရွေးချယ်နိုင်ပါသည်။");
            }
          } else {
            await sendWelcomeMenu(chatId, "မင်္ဂလာပါ၊ အောက်ပါ မီနူးမှ လိုချင်တာကို ရွေးချယ်နိုင်ပါသည်။");
          }
        }
        // ၃။ အခြားစာသားများ
        else {
          await sendWelcomeMenu(chatId, "ကျေးဇူးပြု၍ အောက်ပါမီနူးမှ ရွေးချယ်ပါ -");
        }
      }
    } catch (err) {
      console.error("❌ Main Fetch Error:", err);
    }

    return new Response("OK", { status: 200 });
  }
};

// ---------- Helpers ----------

async function tg(method, body) {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res.json();
}

// Reply Keyboard မီနူးပြပေးသည့် Function
async function sendWelcomeMenu(chatId, text) {
  await tg("sendMessage", {
    chat_id: chatId,
    text: text,
    reply_markup: MAIN_KEYBOARD
  });
}

// ခလုတ်တစ်ခုချင်းစီအလိုက် စာသားနှင့် လင့်ခ်ခလုတ် ပို့ပေးရန်
async function sendMenuWithInlineLink(chatId, messageText, buttonText, channelUrl) {
  await tg("sendMessage", {
    chat_id: chatId,
    text: messageText,
    reply_markup: MAIN_KEYBOARD
  });

  await tg("sendMessage", {
    chat_id: chatId,
    text: "👇 အောက်ပါခလုတ်ကို နှိပ်ပြီး ဝင်ရောက်ပါ",
    reply_markup: {
      inline_keyboard: [[{ text: buttonText, url: channelUrl }]]
    }
  });
}

// Safe Base64 Helper
function safeBase64Decode(str) {
  try {
    let cleanStr = decodeURIComponent(str).replace(/-/g, "+").replace(/_/g, "/");
    while (cleanStr.length % 4) cleanStr += "=";
    return atob(cleanStr);
  } catch (e) {
    return str;
  }
}

// Series ခလုတ်များ (တစ်လိုင်းလျှင် ၄ ခု)
async function sendSeriesMenu(chatId, messageIds) {
  const keyboard = [];
  const buttonsPerRow = 4;

  for (let i = 0; i < messageIds.length; i += buttonsPerRow) {
    const row = [];
    for (let j = i; j < i + buttonsPerRow && j < messageIds.length; j++) {
      const epNum = j + 1;
      const epPayload = btoa(String(messageIds[j])).replace(/=/g, "");
      row.push({ text: `Ep ${epNum}`, url: `https://t.me/${BOT_USERNAME}?start=${epPayload}` });
    }
    keyboard.push(row);
  }

  await tg("sendMessage", {
    chat_id: chatId,
    text: `🎬 **Series ဖိုင်များ ရွေးချယ်ရန် အောက်ပါ ခလုတ်များကို နှိပ်ပါ။**\n\nစုစုပေါင်း အပိုင်း **${messageIds.length}** ပိုင်း ရှိပါသည်။`,
    parse_mode: "Markdown",
    reply_markup: { inline_keyboard: keyboard }
  });
}

async function sendMessage(chatId, text) {
  await tg("sendMessage", { chat_id: chatId, text: text });
}

async function deleteMessage(chatId, messageId) {
  if (!messageId) return;
  await tg("deleteMessage", { chat_id: chatId, message_id: Number(messageId) });
}

async function sendMovieAndAutoDelete(chatId, targetMessageId, payload) {
  const movieResult = await tg("copyMessage", {
    chat_id: chatId,
    from_chat_id: FILE_STORE_CHANNEL_ID,
    message_id: Number(targetMessageId)
  });

  if (movieResult.ok) {
    const movieMessageId = movieResult.result.message_id;

    const warningText =
      "⚠️ **သတိပေးချက်**\n\nဒီ Video သည် **၃၀ စက္ကန့်** ပြည့်သည်နှင့် အလိုအလျောက် ပျက်သွားမည် ဖြစ်သည်။ Video မပျောက်ပျက်စေရန် သင်၏ **Saved Messages** ထဲသို့ Forward ပြုလုပ်ထားပေးပါ။";
    const warnResult = await tg("sendMessage", {
      chat_id: chatId,
      text: warningText,
      parse_mode: "Markdown"
    });
    const warningMessageId = warnResult.ok ? warnResult.result.message_id : null;

    // ✅ ဇာတ်ကားပို့ပြီးတာနဲ့ Reply Keyboard ကို တန်းပို့ (၂၈ စက္ကန့်မစောင့်ခင်)
    await sendWelcomeMenu(chatId, "👇 အခြားဇာတ်ကားများကို အောက်ပါမီနူးမှ ရွေးချယ်နိုင်ပါသည်။");

    await new Promise(resolve => setTimeout(resolve, 28 * 1000));

    await deleteMessage(chatId, movieMessageId);
    if (warningMessageId) await deleteMessage(chatId, warningMessageId);

    const cleanPayload = payload.replace(/=/g, "");
    const getAgainUrl = `https://t.me/${BOT_USERNAME}?start=${cleanPayload}`;
    await tg("sendMessage", {
      chat_id: chatId,
      text: "🗑️ **ဖိုင် ဖျက်ပြီးသွားပါပြီ။**\n\nဖိုင်ကို ပြန်လည်ရယူလိုပါက အောက်ပါ **Get File** ခလုတ်ကို နှိပ်ပြီး ထပ်မံတောင်းယူနိုင်ပါသည်။",
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: [[{ text: "📥 Get File", url: getAgainUrl }]] }
    });
  } else {
    await sendMessage(chatId, `❌ Telegram Error: ${movieResult.description}`);
  }
}

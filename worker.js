const BOT_TOKEN = ""; 
const FILE_STORE_CHANNEL_ID = ""; 
const BOT_USERNAME = ""; // မိမိ Bot ရဲ့ Username ကို ဒီမှာ ထည့်ပါ (ဥပမာ - my_series_bot)

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") return new Response("OK", { status: 200 });

    try {
      const update = await request.json();

      if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const text = update.message.text;

        if (text.startsWith("/start")) {
          const args = text.split(" ");
          
          if (args.length > 1) {
            const rawPayload = args[1];
            let targetMessageIds = [];
            
            try {
              let decodedPayload = safeBase64Decode(rawPayload);

              // 1. "10-30" ပုံစံပါလာပါက (Start ID မှ End ID အထိ Range ဖတ်ခြင်း)
              if (decodedPayload.includes('-') && !decodedPayload.startsWith('http')) {
                const [startId, endId] = decodedPayload.split('-').map(num => Number(num.trim()));
                if (!isNaN(startId) && !isNaN(endId) && endId >= startId) {
                  for (let id = startId; id <= endId; id++) {
                    targetMessageIds.push(id);
                  }
                }
              }
              // 2. "10,11,12" ပုံစံပါလာပါက
              else if (decodedPayload.includes(',')) {
                targetMessageIds = decodedPayload
                  .split(',')
                  .map(id => Number(id.trim()))
                  .filter(id => !isNaN(id));
              }
              // 3. Link အပြည့် သို့မဟုတ် ID ၁ ခုတည်း ပါလာပါက
              else if (decodedPayload.startsWith('http')) {
                const urlParts = decodedPayload.split('/');
                const id = Number(urlParts[urlParts.length - 1]);
                if (!isNaN(id)) targetMessageIds = [id];
              } else {
                const id = Number(decodedPayload.trim());
                if (!isNaN(id)) targetMessageIds = [id];
              }

              if (targetMessageIds.length === 0) throw new Error("Invalid ID");
            } catch (e) {
              console.error("Payload Decode Error:", e);
              await sendMessage(chatId, "❌ Link မှားယွင်းနေပါသည်။");
              return new Response("OK", { status: 200 });
            }

            // Movie သို့မဟုတ် Series ခွဲခြားခြင်း
            if (targetMessageIds.length === 1) {
              ctx.waitUntil(sendMovieAndAutoDelete(chatId, targetMessageIds[0], rawPayload));
            } else {
              await sendSeriesMenu(chatId, targetMessageIds);
            }

          } else {
            await sendMessage(chatId, "မင်္ဂလာပါ၊ Movie ကြည့်ရန် Channel မှ Link ကို နှိပ်အသုံးပြုပါ။");
          }
        }
      }
    } catch (err) {
      console.error("❌ Main Fetch Error:", err);
    }

    return new Response("OK", { status: 200 });
  }
};

// Safe Base64 Helper
function safeBase64Decode(str) {
  try {
    let cleanStr = decodeURIComponent(str).replace(/-/g, '+').replace(/_/g, '/');
    while (cleanStr.length % 4) {
      cleanStr += '=';
    }
    return atob(cleanStr);
  } catch (e) {
    return str;
  }
}

// Series ခလုတ်များ ထုတ်ပေးသည့် Function (တစ်လိုင်းလျှင် ၄ ခုနှုန်း)
async function sendSeriesMenu(chatId, messageIds) {
  const keyboard = [];
  const buttonsPerRow = 4; // တစ်လိုင်းလျှင် ၄ ခု

  for (let i = 0; i < messageIds.length; i += buttonsPerRow) {
    const row = [];
    for (let j = i; j < i + buttonsPerRow && j < messageIds.length; j++) {
      const epNum = j + 1;
      // အပိုင်းတစ်ပိုင်းစီအတွက် Payload ကို ရိုးရိုး ID သာ encode လုပ်သည်
      const epPayload = btoa(String(messageIds[j])).replace(/=/g, ''); 
      row.push({ text: `Ep ${epNum}`, url: `https://t.me/${BOT_USERNAME}?start=${epPayload}` });
    }
    keyboard.push(row);
  }

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: `🎬 **Series ဖိုင်များ ရွေးချယ်ရန် အောက်ပါ ခလုတ်များကို နှိပ်ပါ။**\n\nစုစုပေါင်း အပိုင်း **${messageIds.length}** ပိုင်း ရှိပါသည်။`,
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: keyboard }
    })
  });
}

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
}

async function deleteMessage(chatId, messageId) {
  if (!messageId) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: Number(messageId) })
  });
}

async function sendMovieAndAutoDelete(chatId, targetMessageId, payload) {
  const movieRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/copyMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      from_chat_id: FILE_STORE_CHANNEL_ID,
      message_id: Number(targetMessageId)
    })
  });

  const movieResult = await movieRes.json();

  if (movieResult.ok) {
    const movieMessageId = movieResult.result.message_id;

    const warningText = "⚠️ **သတိပေးချက်**\n\nဒီ Video သည် **၃၀ စက္ကန့်** ပြည့်သည်နှင့် အလိုအလျောက် ပျက်သွားမည် ဖြစ်သည်။ Video မပျောက်ပျက်စေရန် သင်၏ **Saved Messages** ထဲသို့ Forward ပြုလုပ်ထားပေးပါ။";
    const warnRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: warningText, parse_mode: "Markdown" })
    });

    const warnResult = await warnRes.json();
    const warningMessageId = warnResult.ok ? warnResult.result.message_id : null;

    await new Promise(resolve => setTimeout(resolve, 28 * 1000));

    await deleteMessage(chatId, movieMessageId);
    if (warningMessageId) await deleteMessage(chatId, warningMessageId);

    const cleanPayload = payload.replace(/=/g, '');
    const getAgainUrl = `https://t.me/${BOT_USERNAME}?start=${cleanPayload}`;
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        chat_id: chatId,
        text: "🗑️ **ဖိုင် ဖျက်ပြီးသွားပါပြီ။**\n\nဖိုင်ကို ပြန်လည်ရယူလိုပါက အောက်ပါ **Get File** ခလုတ်ကို နှိပ်ပြီး ထပ်မံတောင်းယူနိုင်ပါသည်။",
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: [[{ text: "📥 Get File", url: getAgainUrl }]] }
      })
    });
  } else {
    await sendMessage(chatId, `❌ Telegram Error: ${movieResult.description}`);
  }
}

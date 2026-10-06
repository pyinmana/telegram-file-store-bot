# Telegram File Store & Series Bot (Cloudflare Worker)

Telegram Channel မှ Movie နှင့် Series ဗီဒီယိုဖိုင်များကို Auto-delete စနစ်၊ Base64 Link Encoding စနစ်တို့ဖြင့် လုံခြုံစွာ မျှဝေပေးနိုင်သော Cloudflare Worker Bot Server ဖြစ်ပါသည်။

---

## 🌟 Features (ပါဝင်သော လုပ်ဆောင်ချက်များ)

* **Movie Single Link Support:** ရိုးရိုး ရုပ်ရှင်ဖိုင်များကို နှိပ်လိုက်ပါက ချက်ချင်း ပို့ပေးပြီး **၃၀ စက္ကန့်အတွင်း အလိုအလျောက် ပြန်လည်ဖျက်ဆီးပေးခြင်း (Auto Delete)**။
* **Series Menu System:** အပိုင်းများစွာပါသော Series များအတွက် Ep 1, Ep 2 ခလုတ်များဖြင့် သပ်သပ်ရပ်ရပ် Display ပြပေးခြင်း (၁ လိုင်းလျှင် ၄ ခလုတ်)။
* **Base64 Payload Support:** Link များကို တိုက်ရိုက်မပြဘဲ Base64 ဖြင့် လုံခြုံစွာ Encode လုပ်ထားသော Payload များကို Decode လုပ်၍ ဖတ်ရှုနိုင်ခြင်း။
* **Range & Multiple IDs Support:** 
  * Range: `10-30` (ID 10 မှ 30 အထိ အပိုင်းများစွာကို တစ်ခါတည်း ဆွဲယူခြင်း)
  * List: `10,11,12` (သီးသန့် ID များကို ရွေးချယ် ဆွဲယူခြင်း)

---

## 🛠️ Setup Instructions (အသုံးပြုနည်း)

### 1. Variables ထည့်သွင်းခြင်း
Code ထဲရှိ အောက်ပါ Variables ၃ ခုတွင် မိမိ၏ Bot အချက်အလက်များကို ဖြည့်သွင်းပါ-
```
javascript
const BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"; 
const FILE_STORE_CHANNEL_ID = "-100XXXXXXXXXX"; 
const BOT_USERNAME = "your_bot_username"; // (@ မပါဘဲ ရေးရန်)
```
2. Cloudflare Worker သို့ Deploy လုပ်ခြင်း
Cloudflare Dashboard သို့ ဝင်ပါ။

Workers & Pages > Create Application > Create Worker ကို နှိပ်ပါ။

Worker Name ပေးပြီး Deploy လုပ်ပါ။

Edit Code ကိုနှိပ်၍ worker.js (သို့မဟုတ် index.js) ထဲတွင် ဒီ Repository မှ Code များကို ကူးထည့်ပါ။

Save and Deploy ကို နှိပ်ပါ။

🔗 Webhook ချိတ်ဆက်ခြင်း (Setting up Webhook)
Worker Deploy လုပ်ပြီးပါက Telegram မှ စာများကို Worker ထံ ပေးပို့နိုင်ရန် Webhook ချိတ်ပေးရပါမည်။

နည်းလမ်း (၁) Browser မှတစ်ဆင့် ချိတ်ဆက်ခြင်း
မိမိ၏ Browser (Chrome / Firefox / Edge) ကိုဖွင့်၍ အောက်ပါ Link တွင် မိမိ၏ BOT_TOKEN နှင့် WORKER_URL တို့ကို အစားထိုးပြီး ရိုက်ထည့်၍ Enter နှိပ်ပါ-
Webhook ချိတ်ဆက်နည်း
```
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_WORKER_URL>"
```
နည်းလမ်း (၂) Terminal / Command Prompt မှတစ်ဆင့် ချိတ်ဆက်ခြင်း (cURL)
```
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_WORKER_URL>"
```
Browsr မှာ True ဆိုတဲ့စာလုံးတွေ့ရင် Webhook အောက်မြင်စွာချိတ်ဆက်ပြီးပါပြီ

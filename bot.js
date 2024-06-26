const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const ytdl = require("ytdl-core");
const { isURL } = require("validator");

const botToken = process.env.BOT_TOKEN; // Retrieve bot token from environment variable
const bot = new TelegramBot(botToken);

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post("/webhook", (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.on("new_chat_member", async (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `أهلا وسهلا بك للبدء اضغط على الأمر التالي :`;
  await bot.sendMessage(chatId, welcomeMessage);
  await bot.sendMessage(chatId, "/start");
});

// Listen for /start command
bot.onText(/\/start$/, async (msg, match) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(
    chatId,
    "مرحبا بك مجددا ,أنا روبوت جاهز لمساعدتك في تحميل أي فيديو من اليوتيوب"
  );
  await bot.sendMessage(chatId, "للبدأ بالتحميل اضغط على الأمر التالي  : ");
  await bot.sendMessage(chatId, "/download ");
});

// Listen for /download command
bot.onText(/\/download$/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, "الآن قم بادخال الرابط المطلوب:");

  bot.once("message", async (reply) => {
    if (reply.chat.id === chatId) {
      const youtubeUrl = reply.text;

      // Check if the provided URL is a valid YouTube URL
      if (!isValidYoutubeUrl(youtubeUrl)) {
        await bot.sendMessage(
          chatId,
          "الرابط الذي قمت بإدخاله غير صحيح تأكد من أنه رابط يوتيوب ثم حاول مرة أخرى"
        );
        await bot.sendMessage(chatId, "/download");
        return;
      }

      try {
        await bot.sendMessage(chatId, `يتم تحضير الرابط, الرجاء الإنتظار....`);
        const fullYoutubeUrl = getFullYoutubeUrl(youtubeUrl);
        const info = await ytdl.getBasicInfo(fullYoutubeUrl);
        console.log(info);

        /* Send image  */
        const imageUrl =
          info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]
            .url;
        await bot.sendPhoto(chatId, imageUrl, {
          caption: info.videoDetails.title,
        });

        // Send the formats as links
        for (const item of info.formats) {
          const VideoFile = `<a href="${item.url}" target="_blank" download="Video.mp4">${item.qualityLabel}</a>`;
          const AudioFile = `<a href="${item.url}" target="_blank" download="Audio.mp3">Audio</a>`;
          await bot.sendMessage(
            chatId,
            item.qualityLabel ? VideoFile : AudioFile,
            {
              parse_mode: "HTML",
            }
          );
        }
        await bot.sendMessage(chatId, "Happy Download :)");

        await bot.sendMessage(chatId, "للمزيد اضغط على :");
        await bot.sendMessage(chatId, "/download");
      } catch (error) {
        await bot.sendMessage(
          chatId,
          "لايوجد معلومات تاكد من الرابط ثم حاول مرة أخرى"
        );
        await bot.sendMessage(chatId, "/download");
        console.error(error);
      }
    }
  });
});

/* Check shortcuts video links */
function getFullYoutubeUrl(url) {
  if (url.includes("youtu.be")) {
    const startIndex = url.lastIndexOf("/") + 1;
    const endIndex = url.indexOf("?") !== -1 ? url.indexOf("?") : url.length;
    const videoId = url.substring(startIndex, endIndex);
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return url;
}

/* Check domain link */
function isValidYoutubeUrl(url) {
  return (
    isURL(url) && (url.includes("youtube.com") || url.includes("youtu.be"))
  );
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

/* Set up webhook */
const webhookUrl = process.env.WEBHOOK_URL; // Retrieve webhook URL from environment variable
bot.setWebHook(`${webhookUrl}/webhook`);

/*  bot
  .startPolling()
  .then(() => {
    console.log("Bot is ready!");
  })
  .catch((error) => {
    console.error("Error starting bot:", error);
  }); 
 */
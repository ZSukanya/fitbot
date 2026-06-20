// require('dotenv').config();
// const express = require('express');
// const line = require('@line/bot-sdk');
// const OpenAI = require('openai');
// const app = express();
// const config = {
//   channelSecret: process.env.LINE_CHANNEL_SECRET,
//   channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
// };
// const client = new line.messagingApi.MessagingApiClient({
//   channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
// });
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY
// });
// app.get('/', (req, res) => {
//   res.send('FitBot is running');
// });
// app.post('/webhook', line.middleware(config), async (req, res) => {
//   try {
//     console.log('Webhook called'); // สำหรับ LINE Verify 
//     if (!req.body.events || req.body.events.length === 0) {
//       return res.sendStatus(200);
//     }
//     const event = req.body.events[0];
//     if (event.type !== 'message') {
//       return res.sendStatus(200);
//     }
//     const userText = event.message.text;
//     const completion = await openai.chat.completions.create({
//       model: 'gpt-4.1-mini',
//       messages: [{
//         role: 'system',
//         content: ` Extract workout data. Return JSON only. { "activity":"", "distance":"", "distance_unit":"", "time":"", "time_unit":"" } Example: running 20 km 1 hr { "activity":"running", "distance":20, "distance_unit":"km", "time":1, "time_unit":"hr" } `
//       }, {
//         role: 'user',
//         content: userText
//       }]
//     });
//     const raw = completion.choices[0].message.content;
//     console.log(raw);
//     const data = JSON.parse(raw);
//     let replyText = '';
//     if (!data.time) {
//       replyText = 'กรุณาระบุเวลาที่ใช้ในการออกกำลังกายด้วยค่ะ';
//     } else {
//       replyText = `บันทึกเรียบร้อย Activity : ${data.activity} Distance : ${data.distance || '-'} ${data.distance_unit || ''} Time : ${data.time} ${data.time_unit} ต้องการดูข้อมูลเดือนนี้หรือไม่? พิมพ์ ใช่ หรือ ไม่`;
//     }
//     await client.replyMessage({
//       replyToken: event.replyToken,
//       messages: [{
//         type: 'text',
//         text: replyText
//       }]
//     });
//     return res.sendStatus(200);
//   } catch (error) {
//     console.error('ERROR:', error);
//     return res.sendStatus(200);
//   }
// });
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const app = express();
const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});
app.get('/', (req, res) => {
  res.send('FitBot is running');
});
const supabase = require('./supabase');
app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    if (!req.body.events || req.body.events.length === 0) {
      return res.sendStatus(200);
    }
    const event = req.body.events[0];
    if (event.type !== 'message') {
      return res.sendStatus(200);
    }
    const text = event.message.text.trim(); // ตัวอย่าง: // running 20 km 1 hr // swimming 30 min // ride 50 km 2 hr 
    const regex = /^(running|swimming|ride|walk)\s*(\d+)?\s*(km)?\s*(\d+)\s*(hr|min)$/i; 
    const match = text.match(regex);
    let replyText = '';
    if (!match) {
      replyText = `Pattern: running 20 km 1 hr swimming 30 min ride 50 km 2 hr`;
    } else {
      const activity = match[1];
      const distance = match[2] || '-';
      const distanceUnit = match[3] || '';
      const time = match[4];
      const timeUnit = match[5];
      const { error } = await supabase
        .from('activity_logs')
        .insert([
          {
            user_id: event.source.userId,
            activity,
            distance,
            distance_unit: distanceUnit,
            duration: time,
            duration_unit: timeUnit
          }
        ]);

        if (error) {
          console.error(error);
        }

      replyText = `Save Success ✅ Activity : ${activity} Distance : ${distance} ${distanceUnit} Time : ${time} ${timeUnit}`;
    }
    await client.replyMessage({
      replyToken: event.replyToken,
      messages: [{
        type: 'text',
        text: replyText
      }]
    });
    return res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.sendStatus(200);
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
require('dotenv').config();

const express = require('express');
const line = require('@line/bot-sdk');
const OpenAI = require('openai');

const app = express();

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post(
  '/webhook',
  line.middleware(config),
  async (req, res) => {

    const event = req.body.events[0];

    if(event.type !== 'message'){
      return res.sendStatus(200);
    }

    const userText = event.message.text;

    const completion =
      await openai.chat.completions.create({

        model: "gpt-4.1-mini",

        messages: [
          {
            role: "system",
            content: `
Extract workout data.

Return JSON only.

{
 "activity":"",
 "distance":"",
 "distance_unit":"",
 "time":"",
 "time_unit":""
}

Examples:

running 20 km 1 hr

{
 "activity":"running",
 "distance":20,
 "distance_unit":"km",
 "time":1,
 "time_unit":"hr"
}
`
          },
          {
            role:"user",
            content:userText
          }
        ]
      });

    const data =
      JSON.parse(
        completion.choices[0].message.content
      );

    let replyText = '';

    if(!data.time){
      replyText =
        'กรุณาระบุเวลาที่ใช้ในการออกกำลังกายด้วยค่ะ';
    }
    else{
      replyText =
`บันทึกเรียบร้อย

Activity : ${data.activity}
Distance : ${data.distance || '-'} ${data.distance_unit || ''}
Time : ${data.time} ${data.time_unit}

ต้องการดูข้อมูลเดือนนี้หรือไม่?
พิมพ์ ใช่ หรือ ไม่`;
    }

    await client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type:'text',
          text: replyText
        }
      ]
    });

    res.sendStatus(200);

  }
);

app.listen(3000);
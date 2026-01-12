const SLACK_TOKEN = "xoxb-XXXXXXXXXXXXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXX"; // 「Bot User Oath Token」を設定
const TARGET_USER_ID = "XXXXXXXXXXX"; // 自分の Mention IDを設定

function doPost(e) {
  const json = JSON.parse(e.postData.contents);

  // URL Verification for Slack connection
  if (json.type === "url_verification") {
    return ContentService.createTextOutput(json.challenge);
  }

  const event = json.event;

  // Auto reply 
  const isMessageEvent = event && event.type === "message" && !event.bot_id 
  const isTargetUserIncluded = event.text && event.text.includes(`<@${TARGET_USER_ID}>`)
  const shouldShareSituation = isMessageEvent && isTargetUserIncluded
  if (shouldShareSituation) {
    shareSituation(event)
  }
}

function shareSituation(event){
    // Get current time
    const now = new Date();
    const calendar = CalendarApp.getDefaultCalendar();
    // Search if I have any schedule in a minute
    const allEvents = calendar.getEvents(now, new Date(now.getTime() + 60000));

    const busyEvents = allEvents.filter(e => {
      return !e.isAllDayEvent(); // filter out all day events
    });

    // Reply if I have on any schedule now
    if (busyEvents.length > 0) {
      const eventTitle = busyEvents[0].getTitle(); // Retrieve event title

      const messageText = `メンションありがとう！
でも、彼は今 *「${eventTitle}」* という予定で手一杯なんだ。少し返事が遅れると思う。
戻ったらすぐ返信させます！`;

      const googleCalenderMessage = `いつ戻りそう?: <https://calendar.google.com/calendar/u/0/r/week|Google Calendarで詳しい予定をチェックしよう！>`;

      const message = `*【Auto Reply|自動応答】Now Busy *

${messageText}


${googleCalenderMessage}`;
      
      sendSlackReply(event.channel, message, event.ts);
    }
}

// Reply to Slack thread
function sendSlackReply(channel, text, thread_ts) {
  const url = "https://slack.com/api/chat.postMessage";
  const options = {
    method: "post",
    headers: { "Authorization": "Bearer " + SLACK_TOKEN },
    contentType: "application/json",
    payload: JSON.stringify({
      channel: channel,
      text: text,
      thread_ts: thread_ts // Reply to the thread of original post
    })
  };
  UrlFetchApp.fetch(url, options);
}
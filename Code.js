function autoMarkDeadlines() {
  
  const SEARCH_QUERY = '("showing" OR "review" OR "showcase" OR "copy" OR "quiz" OR "midterm" OR "endsem" OR "endterm" OR "announcement" OR "assignment" OR "lab" OR "viva") newer_than:1d is:unread -label:Calendar-Logged';
  const LOG_LABEL = "Calendar-Logged";
  const EVENT_PREFIX = "📝 ";
  const SEND_CONFIRMATION_EMAIL = true; 

  var label = GmailApp.getUserLabelByName(LOG_LABEL);
  if (!label) { label = GmailApp.createLabel(LOG_LABEL); }

  var threads = GmailApp.search(SEARCH_QUERY);

  if (threads.length === 0) {
    return;
  }

  var cal = CalendarApp.getDefaultCalendar();
  var userEmail = Session.getActiveUser().getEmail(); 

  for (var i = 0; i < threads.length; i++) {
    var msg = threads[i].getMessages()[0];
    var subject = msg.getSubject();
    var body = msg.getPlainBody();
    var sentDate = msg.getDate(); 
    var link = "https://mail.google.com/mail/u/0/#inbox/" + threads[i].getId();
    
    var cleanBody = body.replace(/\r\n|\r|\n/g, "  "); 
    var combinedText = (subject + " " + cleanBody).replace(/\s+/g, " ");

    
    var courseName = "ACADEMIC"; 
    var courseCodeRegex = /\b([A-Z]{2,4}[- ]?[0-9]{3,5})\b/;
    var acronymRegex = /\b(S&S|DSA|COA|COM|ECE|CSE|MTH|DES|ELD|CO)\b/i; 
    
    var codeMatch = combinedText.match(courseCodeRegex);
    var acronymMatch = combinedText.match(acronymRegex);

    if (codeMatch) { courseName = codeMatch[1].toUpperCase(); } 
    else if (acronymMatch) { courseName = acronymMatch[1].toUpperCase(); } 
    else if (combinedText.toLowerCase().includes("quiz")) {
      var quizRegex = /Quiz\s?[-]?\s?(\d+)/i;
      var quizMatch = combinedText.match(quizRegex);
      if (quizMatch) courseName = "QUIZ " + quizMatch[1];
    }
    
    else if (combinedText.match(/\b(endterm|endsem|midterm)\b/i)) {
      var examMatch = combinedText.match(/\b(endterm|endsem|midterm)\b/i);
      courseName = examMatch[0].toUpperCase();
    }

    
    var eventDate = new Date();
    var dateFound = false;
    var isUrgentTime = false; 

    var numericDateRegex = /(\d{1,2})[\/\-\.](\d{1,2}|[A-Za-z]{3})[\/\-\.](\d{2,4})/;
    var spokenDateRegex = /(\d{1,2})(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{4})?/i;
    var urgencyRegex = /\b(today|tonight|now|immediately|urgent|asap|right now|come to|come for|starting|started|waiting|arrived)\b/i;

    if (cleanBody.toLowerCase().includes("tomorrow")) {
      eventDate = new Date(sentDate.getTime());
      eventDate.setDate(eventDate.getDate() + 1); 
      dateFound = true;
    } 
    else if (cleanBody.match(numericDateRegex)) {
      var numMatch = cleanBody.match(numericDateRegex);
      var d = parseInt(numMatch[1]);
      var mStr = numMatch[2];
      var y = parseInt(numMatch[3]);
      if (y < 100) y += 2000; 
      var m = isNaN(mStr) ? parseMonth(mStr) : parseInt(mStr) - 1;
      eventDate.setFullYear(y, m, d);
      dateFound = true;
    } 
    else if (cleanBody.match(spokenDateRegex)) {
      var spokenMatch = cleanBody.match(spokenDateRegex);
      var d = parseInt(spokenMatch[1]);
      var m = parseMonth(spokenMatch[2]);
      var y = spokenMatch[3] ? parseInt(spokenMatch[3]) : new Date().getFullYear();
      eventDate.setFullYear(y, m, d);
      dateFound = true;
    }
    else {
      var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      var dayFound = false;
      for (var d = 0; d < 7; d++) {
        var dayRegex = new RegExp("\\b" + days[d] + "\\b", "i");
        if (dayRegex.test(cleanBody)) {
           eventDate = getNextDayOfWeek(sentDate, d);
           dateFound = true;
           dayFound = true;
           break;
        }
      }
      
      if (!dayFound && cleanBody.match(urgencyRegex)) {
         eventDate = new Date(sentDate.getTime()); 
         dateFound = true;
         isUrgentTime = true; 
      }
    }
    
    if (!dateFound) { 
      eventDate = new Date(sentDate.getTime());
      eventDate.setDate(eventDate.getDate() + 1); 
    }

    
    var timeRegex = /(\d{1,2})(?::(\d{2}))?\s?(AM|PM|am|pm)/i;
    var timeMatch = cleanBody.match(timeRegex);
    var hours = 9; var minutes = 0; 
    
    if (timeMatch) {
      hours = parseInt(timeMatch[1]);
      minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      var meridiem = timeMatch[3].toLowerCase();
      if (meridiem === "pm" && hours < 12) hours += 12;
      if (meridiem === "am" && hours === 12) hours = 0;
    } 
    else if (isUrgentTime) {
      hours = sentDate.getHours();
      minutes = sentDate.getMinutes();
    }
    eventDate.setHours(hours, minutes, 0);

    
    var venueRegex = /\b(Venue|Room|Hall|LHC|Classroom|at|in|to|RnD|Old academic)\b\s*[:\-]?\s*([A-Za-z0-9\s\-\(\)\.]+?)(?=\.|,|–|-|\n|$| time | date | on )/i;
    var venueMatch = cleanBody.match(venueRegex);
    var location = "Check Email";
    
    if (venueMatch && venueMatch[2].length < 50) { 
       location = venueMatch[2].replace(/\b(the|is|are|will|be)\b/gi, "").trim(); 
    }

    
    var endTime = new Date(eventDate);
    endTime.setHours(eventDate.getHours() + 1); 

    var finalTitle = EVENT_PREFIX + "[" + courseName + "] " + subject;

    var event = cal.createEvent(finalTitle, eventDate, endTime, {
      description: "📍 Location: " + location + "\n\n🔗 Email: " + link + "\n\n📄 Snippet:\n" + body.substring(0, 500),
      location: location
    });

    event.addPopupReminder(30); 
    event.addEmailReminder(60); 

    if (SEND_CONFIRMATION_EMAIL) {
      var emailSubject = "✅ Added to Calendar: " + finalTitle;
      var emailBody = "📅 Event: " + finalTitle + "\n" +
                      "🕒 Time: " + eventDate.toLocaleString() + "\n" +
                      "📍 Location: " + location + "\n\n" +
                      "Original Email: " + subject;
      
      GmailApp.sendEmail(userEmail, emailSubject, emailBody);
    }

    threads[i].addLabel(label);
  }
}

function parseMonth(monStr) {
  var months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  var m = monStr.toLowerCase().substring(0,3);
  return months.indexOf(m);
}

function getNextDayOfWeek(date, dayOfWeek) {
  var resultDate = new Date(date.getTime());
  resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);
  return resultDate;
}

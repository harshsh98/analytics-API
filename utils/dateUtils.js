function formatDateToLocalString(date) {
  return date.toISOString().slice(0, 16);
}

function formatDateForVoiceflow(date) {
  return new Date(date).toISOString();
}

function enumerateDaysBetweenDates(startTime, endTime) {
  const dates = [];
  let currDate = new Date(startTime);

  while (currDate <= new Date(endTime)) {
    const nextDate = new Date(currDate);
    nextDate.setDate(nextDate.getDate() + 1);
    dates.push({ start: new Date(currDate), end: nextDate });
    currDate = nextDate;
  }

  return dates;
}

module.exports = {
  formatDateToLocalString,
  formatDateForVoiceflow,
  enumerateDaysBetweenDates
};
const daysOfWeekShortNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let dayIndexOfTopLeftSunday = 0;

const cellToDateMap = {};
let centeredDateToVisibleCellMap = {};

let datesOfPastPeriods = [];
// TODO if available, load datesOfPastPeriods from storage

// TODO only when the period record changes, then recompute nextYearOfPeriodProbabilties in a 
// way such that results become available before the entire year is computed. If a probability
// is computed for a date that is visible, then update the displayed probability. This way,
// scrolling to different months should trigger no probability calculations, only changes to the 
// record of periods.

const currentDate = new Date();
// Find the Sunday before the first of the current month, or use the first of the current month if it is a Sunday
// Pass in the date object of the Sunday found in the previous step to populateMonthTables
populateMonthTables(currentDate.getMonth(), currentDate.getFullYear());

back.addEventListener("click", () => {
    changeMonth(false);
});

forward.addEventListener("click", () => {
    changeMonth(true);
});

function changeMonth(goForward) {
    const upperLeftCornerDate = cellToDateMap["cell-1-0"];
    const dayInMiddleOfNewMonth = new Date(upperLeftCornerDate.getTime() + (goForward ? 6 : -2) * 168 * 3600000);
    const firstOfTheMonth = new Date(dayInMiddleOfNewMonth.getTime() - 24 * 3600000 * (dayInMiddleOfNewMonth.getDate() - 1));
    populateMonthTables(firstOfTheMonth.getMonth(), firstOfTheMonth.getFullYear());
}

function populateMonthTables(month, year) {
    // The date object passed in is the Sunday before the first of this month, or possible the first of this month if it is a Sunday
    // Create a rolling date object as you make cells below. Increment by one day and parse to get the 
    // number of the day.
    centeredDateToVisibleCellMap = {};
    const firstOfTheMonth = new Date(`${year}-${(month + 1) < 10 ? "0" : ""}${(month + 1)}-01T00:00:00`);
    const sundayDate = new Date(firstOfTheMonth.getTime() - 24 * 3600000 * firstOfTheMonth.getDay());
    monthLabel.innerHTML = `${months[month]} ${year}`;
    for (let i = shownMonthTable.rows.length - 1; i >= 0; i--) shownMonthTable.deleteRow(i);
    let workingDate = centerTimeOfThisDate(new Date(sundayDate));
    for (let i = 0; i < 7; i++) {
        const row = shownMonthTable.insertRow(shownMonthTable.rows.length);
        for (let j = 0; j < 7; j++) {
            const cell = row.insertCell(row.cells.length);
            cell.id = `cell-${i}-${j}`;
            if (i === 0) {
                cell.innerHTML = daysOfWeekShortNames[j];
                cell.classList.add("dayHeading");
            } else {
                const centeredDate = centerTimeOfThisDate(workingDate);
                cellToDateMap[cell.id] = centeredDate;
                cell.classList.add("daySquareTd");
                const daySquare = daySquareTemplate.content.cloneNode(true).querySelector(".daySquareTemplateContents");
                centeredDateToVisibleCellMap[centeredDate] = daySquare;
                const workingDateCopy = new Date(workingDate);
                // Mark saved periods if they are visible in the calendar
                for (let pastPeriod of datesOfPastPeriods) {
                    if (centerTimeOfThisDate(pastPeriod).getTime() === centeredDate.getTime()) {
                        daySquare.querySelector("circle").setAttribute("fill", "#666");
                    }
                }
                cell.addEventListener("click", () => {
                    const isNowMarkedForPeriodStart = daySquare.querySelector("circle").getAttribute("fill") === "none";
                    if (isNowMarkedForPeriodStart) {
                        daySquare.querySelector("circle").setAttribute("fill", "#666");
                        if (!datesOfPastPeriods.includes(workingDateCopy)) {
                            datesOfPastPeriods.push(workingDateCopy);
                            datesOfPastPeriods.sort((a, b) => a.getTime() - b.getTime());
                        }
                    } else {
                        daySquare.querySelector("circle").setAttribute("fill", "none");
                        if (datesOfPastPeriods.includes(workingDateCopy)) {
                            datesOfPastPeriods.splice(datesOfPastPeriods.indexOf(workingDateCopy), 1);
                        }
                    }
                    updatePeriodProbabilities();
                });
                cell.appendChild(daySquare);
                daySquare.querySelector(".dayNumber").innerHTML = `${workingDate.getDate()}`;
                if (workingDate.getMonth() !== month) {
                    cell.classList.add("outOfFocusMonth");
                    cell.classList.remove("inOfFocusMonth");
                }
                // If there is a cached probability for this square, annotate it
                if (datesOfPastPeriods.length > 0) {
                    const daysSinceLastPeriod = daysFromCenteredDayAToB(centerTimeOfThisDate(datesOfPastPeriods[datesOfPastPeriods.length - 1]), centeredDate);
                    if (nextYearOfPeriodProbabilities.length > daysSinceLastPeriod) {
                        applyProbabilityToDaySquare(daySquare, nextYearOfPeriodProbabilities[daysSinceLastPeriod]);
                    }
                }
                // Update the date cursor
                workingDate = new Date(workingDate.getTime() + 24 * 3600000);
            }
        }
    }
}

function centerTimeOfThisDate(date) {
    return new Date(date.getTime() - 3600 * 1000 * date.getHours() - 60 * 1000 * date.getMinutes() - 1000 * date.getSeconds() + 12 * 3600 * 1000);
}

function daysFromCenteredDayAToB(b, a) {
    return Math.round((centerTimeOfThisDate(a).getTime() - centerTimeOfThisDate(b).getTime()) / (24 * 3600 * 1000));
}

// https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid
function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
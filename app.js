const daysOfWeekShortNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let dayIndexOfTopLeftSunday = 0;

const cellToDateMap = {};

const datesOfPastPeriods = [];

const nextYearOfPeriodProbabilities = {};

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
    updatePeriodProbabilities();
}

function populateMonthTables(month, year) {
    // The date object passed in is the Sunday before the first of this month, or possible the first of this month if it is a Sunday
    // Create a rolling date object as you make cells below. Increment by one day and parse to get the 
    // number of the day.
    const firstOfTheMonth = new Date(`${year}-${(month + 1) < 10 ? "0" : ""}${(month + 1)}-01T00:00:00`);
    console.log(`${year}-${(month + 1) < 10 ? "0" : ""}${month + 1}-01T00:00:00`);
    console.log(`${month}, ${year}, ${firstOfTheMonth}`);
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
                cellToDateMap[cell.id] = centerTimeOfThisDate(workingDate);
                cell.classList.add("daySquareTd");
                const daySquare = daySquareTemplate.content.cloneNode(true).querySelector(".daySquareTemplateContents");
                const workingDateCopy = new Date(workingDate);
                cell.addEventListener("click", () => {
                    const isNowMarkedForPeriodStart = daySquare.querySelector("circle").getAttribute("fill") === "none";
                    if (isNowMarkedForPeriodStart) {
                        daySquare.querySelector("circle").setAttribute("fill", "#666");
                        if (!datesOfPastPeriods.includes(workingDateCopy)) {
                            datesOfPastPeriods.push(workingDateCopy);
                            datesOfPastPeriods.sort((a, b) => a.getTime() > b.getTime());
                            // TODO trigger recalculation of period probabilities for the year
                        } else {
                        }
                    } else {
                        daySquare.querySelector("circle").setAttribute("fill", "none");
                        if (datesOfPastPeriods.includes(workingDateCopy)) {
                            datesOfPastPeriods.splice(datesOfPastPeriods.indexOf(workingDateCopy), 1);
                            // TODO trigger recalculation of period probabilities for the year
                        }
                    }
                    console.log(datesOfPastPeriods);
                    updatePeriodProbabilities();
                });
                cell.appendChild(daySquare);
                daySquare.querySelector(".dayNumber").innerHTML = `${workingDate.getDate()}`;
                if (workingDate.getMonth() !== month) {
                    cell.classList.add("outOfFocusMonth");
                    cell.classList.remove("inOfFocusMonth");
                }
                workingDate = new Date(workingDate.getTime() + 24 * 3600000);
            }
        }
    }
}

function recalculatePeriodProbabilitiesForTheYear() {
    // If there is an ongoing calculation, stop it
    // Start animation to indicate calculation is underway
    // Trigger asynchronously the new probabilities (consider starting with ones for visible days)
    // End the animation indicating calculation
}

function updatePeriodProbabilities() {
    // TODO loop through all shown day cells and compute the probability of a period
        // if the date is before today, don't show the probability at all
    if (datesOfPastPeriods.length === 0) {
        for (let i = 1; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                document.getElementById(`cell-${i}-${j}`).querySelector(".periodProbability").style.display = "none";
            }
        }
        return;
    }
    
    const dateOfLastPeriod = centerTimeOfThisDate(datesOfPastPeriods[datesOfPastPeriods.length - 1]);

    console.log(`Last period started ${Math.round((centerTimeOfThisDate(new Date(Date.now())).getTime() - dateOfLastPeriod.getTime()) / (24 * 3600 * 1000))} days ago`);
    
    const epsilon = 2;
    let mu = (31 + 34) / 2;
    let sigma = 1.5;
    // TODO if there are enough periods, update mu and sigma

    for (let i = 1; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
            const thisDate = cellToDateMap[`cell-${i}-${j}`];
            const daySquare = document.getElementById(`cell-${i}-${j}`);
            const daysSinceLastPeriod = daysFromCenteredDayAToB(dateOfLastPeriod, thisDate);
            if (daysSinceLastPeriod < 0) {
                daySquare.querySelector(".periodProbability").style.display = "none";
                continue;
            } else {
                daySquare.querySelector(".periodProbability").style.display = "block";
                let probability = 0;
                if (daysSinceLastPeriod < 8 * mu) probability = getProbabilityOfPeriodStartingOnDayN(daysSinceLastPeriod, mu, sigma, epsilon);
                const percentProbability = probability > 0.01 ? parseInt(probability * 100) : 0;
                const periodProbabilityDiv = daySquare.querySelector(".periodProbability");
                periodProbabilityDiv.classList.remove("likely");
                periodProbabilityDiv.classList.remove("somewhatLikely");
                periodProbabilityDiv.classList.remove("unlikely");
                if (percentProbability > 0) {
                    periodProbabilityDiv.innerHTML = `${percentProbability}%`;
                    if (percentProbability > 10) {
                        periodProbabilityDiv.classList.add("veryLikely");
                    } else if (percentProbability > 7) {
                        periodProbabilityDiv.classList.add("likely");
                    } else if (percentProbability > 4) {
                        periodProbabilityDiv.classList.add("somewhatLikely");
                    } else {
                        periodProbabilityDiv.classList.add("unlikely");
                    }
                }
            }
        }
    }
}

function getProbabilityOfPeriodStartingOnDayN(N, mu, sigma, epsilon) {
    const zt = Math.ceil(1.5 * N / mu);
    let totalProbability = 0;
    for (let z = 1; z <= zt; z++) {
        const contribution = getProbabilityOfPeriodStartingOnDayNKernel(N, mu, sigma, z, 1);
        totalProbability += contribution;
    }
    return totalProbability;
}

function getProbabilityOfPeriodStartingOnDayNKernel(N, mu, sigma, z, prior) {
    let probabilityContributionWithoutPrior = 0;
    // z === 1 implies that the next period occurs on day N
    if (z === 1) { 
        probabilityContributionWithoutPrior += getProbabilityOfKthPeriodStartingOnDayN(N, 1, mu, sigma);
    } else {
        for (let n = 1; n < N - z + 1; n++) {
            let newPrior = getProbabilityOfKthPeriodStartingOnDayN(n, 1, mu, sigma);
            if (newPrior < 0.01) continue; // Helps avoid delays on log future predictions
            const contribution = getProbabilityOfPeriodStartingOnDayNKernel(N - n, mu, sigma, z - 1, newPrior);
            probabilityContributionWithoutPrior += contribution;
        }
    }
    return probabilityContributionWithoutPrior * prior;
}

function getProbabilityOfKthPeriodStartingOnDayN(N, k, mu, sigma) {
    const localMean = k * mu;
    const localStdDev = Math.sqrt(k) * sigma;
    return 1 / Math.sqrt(2 * Math.PI) / localStdDev * Math.exp(-Math.pow(N - localMean, 2) / 2 / Math.pow(localStdDev, 2));
}

function centerTimeOfThisDate(date) {
    return new Date(date.getTime() - 3600 * 1000 * date.getHours() - 60 * 1000 * date.getMinutes() - 1000 * date.getSeconds() + 12 * 3600 * 1000);
}

function daysFromCenteredDayAToB(b, a) {
    return Math.round((centerTimeOfThisDate(a).getTime() - centerTimeOfThisDate(b).getTime()) / (24 * 3600 * 1000));
}
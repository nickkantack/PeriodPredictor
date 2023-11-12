
const nextYearOfPeriodProbabilities = {};
let probabilityCalculationProgressInterval = null;
let lastestUpdateId = null;
let millisOfLastBreak = 0;
const MAX_MILLIS_BEFORE_BREAK = 30;

async function updatePeriodProbabilities() {
    // If there is an ongoing calculation, stop it
    // Start animation to indicate calculation is underway
    // Trigger asynchronously the new probabilities (consider starting with ones for visible days)
    // End the animation indicating calculation

    debug.innerHTML = "0%";

    const thisUpdateId = uuidv4();
    lastestUpdateId = thisUpdateId;

    if (datesOfPastPeriods.length === 0) {
        for (let i = 1; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                document.getElementById(`cell-${i}-${j}`).querySelector(".periodProbability").style.display = "none";
            }
        }
        return;
    }
    
    const dateOfLastPeriod = centerTimeOfThisDate(datesOfPastPeriods[datesOfPastPeriods.length - 1]);

    const epsilon = 1.5;
    let mu = (31 + 34) / 2;
    let sigma = 1.5;
    // TODO if there are enough periods, update mu and sigma

    // TODO first, perform the calculation for all shown days (do non-shown days later)
    for (let i = 1; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
            const thisDate = cellToDateMap[`cell-${i}-${j}`];
            const daySquare = document.getElementById(`cell-${i}-${j}`);
            const daysSinceLastPeriod = daysFromCenteredDayAToB(dateOfLastPeriod, thisDate);
            if (daysSinceLastPeriod < 0) {
                daySquare.querySelector(".periodProbability").style.display = "none";
                continue;
            } else {
                let probability = 0;
                if (daysSinceLastPeriod < 365) probability = await getProbabilityOfPeriodStartingOnDayN(daysSinceLastPeriod, mu, sigma, epsilon, lastestUpdateId);
                applyProbabilityToDaySquare(daySquare, probability);
            }
            debug.innerHTML = `${100 * (i * 6 + j) / 42}%`;
        }
    }
    
    // TODO Update the cache for all days not currently shown that are within a year after the last period
}

function applyProbabilityToDaySquare(daySquare, probability) {
    if (probability < 0.01) {
        daySquare.querySelector(".periodProbability").style.display = "none";
        return;
    } else {
        daySquare.querySelector(".periodProbability").style.display = "block";
        const percentProbability = parseInt(probability * 100); // Note that this doesn't work if probability is less than 0.01 due to potential scientific notation chicanary
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

async function getProbabilityOfPeriodStartingOnDayN(N, mu, sigma, epsilon, thisUpdateId) {
    const zt = Math.ceil(epsilon * N / mu);
    let totalProbability = 0;
    for (let z = 1; z <= zt; z++) {
        if (thisUpdateId !== lastestUpdateId) return;
        const contribution = await getProbabilityOfPeriodStartingOnDayNKernel(N, mu, sigma, z, 1, thisUpdateId);
        totalProbability += contribution;
    }
    return totalProbability;
}

async function getProbabilityOfPeriodStartingOnDayNKernel(N, mu, sigma, z, prior, thisUpdateId) {
    let probabilityContributionWithoutPrior = 0;
    // z === 1 implies that the next period occurs on day N
    if (thisUpdateId !== lastestUpdateId) return;
    if (z === 1) { 
        probabilityContributionWithoutPrior += getProbabilityOfKthPeriodStartingOnDayN(N, 1, mu, sigma);
    } else {
        for (let n = 1; n < N - z + 1; n++) {
            if (thisUpdateId !== lastestUpdateId) return;
            let newPrior = getProbabilityOfKthPeriodStartingOnDayN(n, 1, mu, sigma);
            if (newPrior < 0.01) continue; // Helps avoid delays on log future predictions
            const contribution = await getProbabilityOfPeriodStartingOnDayNKernel(N - n, mu, sigma, z - 1, newPrior, thisUpdateId);
            probabilityContributionWithoutPrior += contribution;
            // TODO If we are overdue for a UI refresh, perform one now
            const currentMillis = Date.now();
            if (currentMillis - millisOfLastBreak > MAX_MILLIS_BEFORE_BREAK) {
                await waitMs(0);
                millisOfLastBreak = Date.now();
            }
        }
    }
    return probabilityContributionWithoutPrior * prior;
}

function getProbabilityOfKthPeriodStartingOnDayN(N, k, mu, sigma) {
    const localMean = k * mu;
    const localStdDev = Math.sqrt(k) * sigma;
    return 1 / Math.sqrt(2 * Math.PI) / localStdDev * Math.exp(-Math.pow(N - localMean, 2) / 2 / Math.pow(localStdDev, 2));
}

async function waitMs(milliseconds) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve("");
        }, milliseconds);
    });
}
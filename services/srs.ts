export interface ReviewResult {
    interval: number;
    repetitions: number;
    easeFactor: number;
    nextReview: number;
}

// Simplified SM-2 algorithm
export const calculateReview = (
    rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY',
    previousInterval: number,
    previousRepetitions: number,
    previousEaseFactor: number
): ReviewResult => {
    let interval = previousInterval;
    let repetitions = previousRepetitions;
    let easeFactor = previousEaseFactor;

    if (rating === 'AGAIN') {
        repetitions = 0;
        interval = 1; // 1 day? Or 0 for same-day
        // For MVP phase 1, let's treat AGAIN as reset
    } else {
        // Rating mapping: AGAIN=0, HARD=3, GOOD=4, EASY=5 (SM-2 standard uses 0-5)
        // We simplify: HARD -> slightly reduce ease, GOOD -> standard, EASY -> boost
        let grade = 3;
        if (rating === 'HARD') grade = 3;
        if (rating === 'GOOD') grade = 4;
        if (rating === 'EASY') grade = 5;

        // Standard SM-2 formula for EF
        easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
        if (easeFactor < 1.3) easeFactor = 1.3;

        repetitions++;

        if (repetitions === 1) {
            interval = 1;
        } else if (repetitions === 2) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
    }

    // Calculate next review date (interval in days)
    const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

    return { interval, repetitions, easeFactor, nextReview };
};

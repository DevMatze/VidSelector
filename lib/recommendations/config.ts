export const RECOMMENDATION_WEIGHTS = {
  likedGenre: 9,
  dislikedGenre: -12,
  neutralRating: 0,
  likedLanguage: 3,
  dislikedLanguage: -4,
  likedDecade: 3,
  dislikedDecade: -4,
  similarToLike: 15,
  similarToDislike: -18,
  likedPerson: 5,
  dislikedPerson: -7,
  publicRating: 2.2,
  lowPublicRating: -7,
  popularityMax: 8,
  diversityPenalty: 4,
  minimumHistoryWeight: 0.35,
} as const;

export const MIN_RATINGS_FOR_PROFILE = 5;
export const STRONG_PROFILE_RATINGS = 10;

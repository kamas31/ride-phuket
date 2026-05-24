// Photo performance types — future-ready architecture.
// Tracking is not yet wired up; defines the data shape for when it is.

export interface ImageClickEvent {
  sessionId:  string
  scooterId:  string
  imageUrl:   string
  position:   number   // 0 = cover, 1+ = gallery
  timestamp:  string   // ISO
}

export interface ThumbnailCTR {
  imageUrl:    string
  impressions: number
  clicks:      number
  ctr:         number  // clicks / impressions
}

export interface CarouselInteraction {
  scooterId:    string
  sessionId:    string
  imagesViewed: number  // how many slides the user swiped through
  maxPosition:  number  // furthest slide viewed
}

export interface CoverImagePerformance {
  scooterId:              string
  coverUrl:               string
  viewsWithThisCover:     number
  waClicksWithThisCover:  number
  conversionRate:         number  // 0-100
}

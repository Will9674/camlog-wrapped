// Share-card geometry, shared by ShareCard (render) and ShareModal (preview scaling).
export const CARD_SIZE = 600
export const CARD_HEIGHT_STORY = Math.round(CARD_SIZE * 16 / 9)  // 1067 — 9:16 story
export const CARD_HEIGHT_FEED  = Math.round(CARD_SIZE * 5 / 4)   //  750 — 4:5 feed post

// Per-format canvas geometry:
//  - height / topPad: Story clears the IG avatar/handle overlay; feed & square have none.
//  - tall: use the portrait content layout (big hero) vs. the compact square layout.
//  - listRows / camRows: how many bar rows the list/camera views show.
//  - scale: multiplier on the portrait layout's vertical sizing (hero, title, gaps,
//    rows). The tall layout is tuned for Story's 1067px; Feed is only 750px, so its
//    content is scaled down to fit — a 2-line project title + big hero + list would
//    otherwise overflow into the footer. Story renders at full size (1.0).
export const FORMAT_GEOMETRY = {
  square: { height: CARD_SIZE,         topPad: 40,  tall: false, listRows: 5, camRows: 8,  scale: 1    },
  feed:   { height: CARD_HEIGHT_FEED,  topPad: 40,  tall: true,  listRows: 6, camRows: 5,  scale: 0.85 },
  story:  { height: CARD_HEIGHT_STORY, topPad: 140, tall: true,  listRows: 9, camRows: 12, scale: 1    },
}

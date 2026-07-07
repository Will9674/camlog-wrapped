// Share-card geometry, shared by ShareCard (render) and ShareModal (preview scaling).
export const CARD_SIZE = 600
export const CARD_HEIGHT_STORY = Math.round(CARD_SIZE * 16 / 9)  // 1067 — 9:16 story
export const CARD_HEIGHT_FEED  = Math.round(CARD_SIZE * 5 / 4)   //  750 — 4:5 feed post

// Per-format canvas geometry:
//  - height / topPad: Story clears the IG avatar/handle overlay; feed & square have none.
//  - tall: use the portrait content layout (big hero) vs. the compact square layout.
//  - listRows / camRows: how many bar rows the list/camera views show. These are
//    height-driven, not just tall-vs-square: feed (750px) can't fit story's (1067px)
//    9 rows under the big hero without overflowing into the footer, so it shows fewer.
export const FORMAT_GEOMETRY = {
  square: { height: CARD_SIZE,         topPad: 40,  tall: false, listRows: 5, camRows: 8  },
  feed:   { height: CARD_HEIGHT_FEED,  topPad: 40,  tall: true,  listRows: 5, camRows: 8  },
  story:  { height: CARD_HEIGHT_STORY, topPad: 140, tall: true,  listRows: 9, camRows: 12 },
}

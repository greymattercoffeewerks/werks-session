import type { Offering } from '../types';

export const offerings: Offering[] = [
  {
    id: 'cupping',
    eyebrow: 'Community tasting',
    title: 'Public Cupping',
    description:
      'A relaxed blind tasting table for curious coffee drinkers. Taste four coffees side by side, notice what changes, and use the words that already make sense to you.',
    format: '90 minutes · Noice after hours',
    price: 'BND 20, redeemable against beans',
    capacity: '8–12 people',
    outcomes: [
      'Taste and compare four coffees with more confidence',
      'Find useful words for what you like',
      'Take home the coffee you choose',
    ],
    teaser: {
      summary: 'How the evening runs',
      lead: 'Start with what you like. This isn’t a test or a professional score sheet, and your preference is valid before you know a single coffee word.',
      beats: [
        'Arrive and settle in over a familiar kopi-o. No lecture.',
        'Taste four numbered coffees, blind, and rank them privately.',
        'Meet the coffees and compare how the room ranked them.',
        'Take home a small sample of your favourite.',
      ],
      note: 'No experience or equipment needed, and nothing to bring. Confirmed guests receive the full table guide before they come.',
    },
  },
  {
    id: 'brew101',
    eyebrow: 'Hands-on foundations',
    title: 'Brew 101',
    description:
      'A practical manual-brew session for people who want to make better coffee at home—without chasing a perfect recipe. Compare cups, understand what changed, and leave with a method you can repeat.',
    format: '3.5 hours · Noice after hours',
    price: 'BND 165 group · BND 320 private',
    capacity: 'Group minimum 2 · maximum 3',
    outcomes: [
      'Tell strength and extraction apart in the cup',
      'Make one deliberate adjustment and taste its effect',
      'Leave with a repeatable recipe and a 30-day practice plan',
    ],
  },
  {
    id: 'barista101',
    eyebrow: 'Hands-on espresso',
    title: 'Barista 101',
    description:
      'A four-hour, taste-led introduction to espresso, milk, and a clean bar. Pull, taste, correct, and serve one drink, and reset the station for the next person. A Grey Matter original, not an SCA-certified course, and not a promise of job readiness.',
    format: '4 hours · venue confirmed on booking',
    price: 'Ask for the pilot price',
    capacity: 'Group minimum 2 · maximum 3',
    outcomes: [
      'Follow a recipe, taste the shot, and make one sensible correction',
      'Texture milk safely and serve one clean drink',
      'Leave with a written recipe and a practice plan',
    ],
  },
];

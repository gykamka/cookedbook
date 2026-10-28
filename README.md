# 灶记

灶记 is a personal cookbook of dishes you have actually cooked. The English name is CookedBook: not a pile of saved tutorials, but the book of recipes that already worked in your kitchen.

The point is not to collect every tutorial on the internet. When you want to make a dish again, you should not have to search again, dig through a messy save list, or hope the original post is still there. If you made it, it turned out well, and you want to make it again, it belongs in 灶记.

## Why it exists

Saved posts and screenshots are a bad cookbook:

- Your save list is mixed with things that are not recipes
- The author may delete the tutorial later
- Next time you cook, you have to hunt for the same post all over again

灶记 keeps **your working version** of the dish: what you used, how you cooked it, and any changes you made. That version stays even if the original post disappears.

## What you can do

- Save a dish you cooked, with photos, ingredients, steps, and notes
- Type the recipe yourself
- Or screenshot a recipe from social media, a website, or chat, and let AI pull out the words so you do not have to type everything
- Review and edit anything AI extracted before it is saved
- Keep a personal menu of dishes you can actually make
- Share that menu with people close to you (a friend coming over, a partner still at work)
- Let them tell you in advance what they want to eat — a message, not an order, and nobody pays

## Recipe capture

A dish can be added in two ways, and they can be mixed:

1. **Type it** — fill in the name, ingredients, amounts, steps, and notes by hand.
2. **Screenshot it** — upload one or more screenshots (for example one photo of ingredients and one of steps). AI extracts a draft: dish name, category, ingredients and amounts, steps, time, difficulty, tags, and notes.

AI is only a typing shortcut. The saved recipe is always the version you confirmed. A photo of the finished plate may help guess the dish, but exact amounts should come from a screenshot, pasted text, or what you type yourself.

Each saved homemade recipe may include:

- Dish name and photo
- Category and tags
- Ingredients and amounts
- Cooking steps
- Cooking time and difficulty
- Rating and personal notes
- Original screenshots (so the source is not lost)
- The final recipe after you edited the AI draft

Example flow:

1. You cook a dish and it turns out well.
2. You save a photo of what you made.
3. You upload a social-media screenshot, or you type the recipe.
4. If AI ran, you check and fix the extracted text.
5. 灶记 stores the recipe on your menu so you can make it again without finding the original post.

## Sharing and “I want this”

Sharing is not a restaurant and it is not checkout.

You share a menu of dishes you can make and are willing to cook for people you know. They might not be in the same place as you:

- A friend is coming to your house and wants to say what she would like to eat
- Your husband is still at the office and picks what he wants for dinner

They browse your menu and send a message about which dishes they want. You receive that request. There is no payment.

Private notes (for example “I always under-salt this”) should not be shown on the shared menu.

## What this is not (for now)

灶记 is not a takeout diary, a restaurant collection, or a food journal. Those can wait. The first product is: **dishes you made, recipes you can repeat, and people you cook for telling you what they want.**

## MVP

The first version should make the cook’s loop usable, then add the family/friend request loop.

### Must have

- Mobile-first web interface
- User accounts and a personal workspace
- Home menu of your dishes
- Add a dish by typing
- Add a dish with photos
- Add a dish from recipe screenshots, with AI extraction
- Review and edit AI results before saving
- Dish detail pages
- Category filtering and basic search
- Save everything per user in the database

### Next after the cookbook works

- Shareable menu for friends and family
- They can send “I want this” messages for dishes on that menu
- You can see those requests in the app

### Later

- Food journal (a meal with several dishes)
- Recipe card layouts
- PWA
- Custom menu themes
- Shopping list / scaling servings
- Export menu as PDF or image

## Tech stack

- Framework: Next.js
- Language: TypeScript
- Styling: Tailwind CSS
- Database: Supabase Postgres
- Image storage: Supabase Storage
- Authentication: Supabase Auth
- Deployment: Vercel
- AI: Vision model on a server-side API route (currently Gemini; the product should not depend on one vendor)

## Project structure

```text
cookedbook/
├── README.md
├── .gitignore
├── .env.example
├── package.json
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── types/
│   └── data/
└── docs/
    ├── product.md
    ├── roadmap.md
    ├── database-schema.md
    └── feature-specs/
```

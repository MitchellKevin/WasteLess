# WasteLess

**WasteLess helps households waste less food.** It tracks what's in your pantry, fridge and freezer, reminds you before things expire, and suggests recipes that use up what you already have.

It runs as a web app and as a native iOS/Android app (Capacitor), backed by a Node.js/Express API and MongoDB. The interface is available in English and Dutch.

---

## About the app

About a third of the food people buy ends up in the bin. Usually that's not a deliberate choice: something gets pushed to the back of the fridge, a date slips by unnoticed, or people buy more of something they already had. WasteLess tackles each of these. It keeps track of what you have and when it expires, nudges you at the right moment, and turns "this needs using up" into a meal or a shopping decision.

A typical week goes like this:

1. **Add your groceries.** Scan barcodes, scan the whole receipt, or type items in. WasteLess fills in the product details and suggests an expiry date.
2. **Check Today.** It shows what needs eating first and what expires later this week.
3. **Cook with what's expiring.** Recipe suggestions are built around the items that turn first.
4. **Mark what happened.** For each item, record that you used it, froze it or threw it away. This feeds your impact stats, goals and shopping list.

### Today

This is the home screen and answers one question: *what should I use up today?* It lists the items that expire today, with buttons to mark an item as used or to find a recipe for it. Below that is a day-by-day overview of the coming week and a shortcut to the shopping list.

### Pantry

This is the full inventory. Items are grouped by urgency (**Expired**, **Use now**, **This week**, **Later**) and can be filtered by where they're stored: fridge, freezer or cupboard. You can also search, sort and filter the list.

Each item has a detail page with:

- A **freshness bar**, so you can see at a glance how much of the item's life is left.
- **Quick actions**: *Used it*, *Freeze* or *Threw away*. Each action is logged and feeds into Impact.
- **Mark as opened**: shortens the expiry date to how long the product keeps once opened.
- **Batches**: if you buy something you already have, it's added as a separate batch with its own date, so older stock is used first.
- **Nutrition per 100 g** (calories, protein, carbs, fat, fiber, salt) for scanned products.
- **Recipes that use this item**.

### Adding food

There are three ways to add food, each suited to a different situation:

- **Single item.** Scan a barcode with the camera (native ML Kit on mobile, html5-qrcode in the browser) or type the item in. Name, brand, category, image and nutrition are looked up in [Open Food Facts](https://world.openfoodfacts.org). Results are cached on the server, so every user benefits from earlier lookups.
- **Bulk add** *(Plus)*. Scan item after item into a queue, adjust the quantities, and save them all at once. This is useful right after unpacking groceries.
- **Receipt scanner** *(Plus)*. Take a photo of your receipt, or upload an image or PDF. The app cleans up the image (scaling, grayscale and Otsu thresholding), then reads the text with Tesseract.js. It recognises common Dutch supermarket layouts: Albert Heijn, Jumbo, Lidl, Plus, Aldi, Dirk, Coop and Spar, including quantity columns, multi-buy lines and products sold by weight. Discounts, deposits, bags, totals and payment lines are filtered out. Before anything is saved, you review the list, deselect what you don't want, and correct names or dates. **The photo never leaves your device.**

### Smart expiry dates *(Plus)*

Typing in expiry dates is the step people skip most often, so WasteLess suggests one for you. A suggestion comes from one of two sources:

1. **Your own history.** If you've added the same product before, the suggestion is based on the dates you used then. Over time it learns how your kitchen works.
2. **A shelf-life guide.** For new products, the server has a guide of typical shelf lives. Each product type (Dutch and English names) has its own values for fridge, freezer and cupboard, plus how long it keeps once opened. For example, "melkchocolade" is matched as chocolate, not milk.

Every suggestion tells you why it was chosen, and you can always change it. Free users can see the date Plus would suggest and choose to use it.

### Reminders

You choose how early you want to be warned (same day, or one or more days before). The same setting controls what Today and Pantry flag as urgent.

- **iOS/Android:** reminders are scheduled as local notifications at 6 pm, so they arrive even when the app is closed.
- **Web:** browsers can't schedule notifications, so you get a notification when you open the app.

### Recipes: "Use it up"

The recipe screen starts from what's about to expire, not from a recipe book. It takes the items that expire within the next 7 days, searches [TheMealDB](https://www.themealdb.com), and ranks recipes by how many of those items they use. Each recipe shows which of your items it uses.

Diet preferences (vegetarian, vegan, gluten-free, dairy-free, nut-free) filter out recipes that don't fit. If you're not cooking tonight, the app suggests freezing an item instead to make it last longer.

### Shopping list

The shopping list has two parts:

- **Needs restocking:** filled in automatically with items that ran out or expired.
- **My list:** your own items.

Because the list is built from what you actually have, it helps you avoid buying something that's already at home.

### Impact and goals

Every *used*, *frozen* or *thrown away* action is logged, and that history becomes feedback:

- **Impact** shows how much food you rescued this month, by estimated weight. It also shows what percentage of the food you finished was eaten, compared with last month, and a weekly chart of eaten versus thrown away. Your **most wasted** products come with a tip to buy a little less of them.
- **Goals** lets you set a monthly target (for example, "eat 90% of what you buy"). It shows your progress and how many points and days are left, and tracks your streak of days with nothing wasted.
- **Badges** reward milestones such as *First week*, *Zero-waste week*, *Freezer hero*, *10 kg rescued*, *25 kg rescued* and a *30-day streak*.
- **Plus** adds reports of the money and CO₂ you've saved.

### Households

Food in a home belongs to everyone, so WasteLess lets you share one pantry. One person creates a household and shares an invite code, and the others join with it. Everyone then sees and updates the same inventory, and each item shows who added it. If you leave a household, your items stay with you but become private again. A Plus subscription from any member unlocks Plus for the whole household.

### WasteLess Plus

The free plan covers the essentials for up to **30 products** and **2 household members**. Plus is a monthly or yearly subscription through the App Store or Google Play (handled by RevenueCat) and unlocks:

- Receipt scanning
- Bulk add
- Unlimited products and household members
- Smart expiry dates that learn from your kitchen
- Money and CO₂ saved reports

### Everything else

- **Onboarding**: a three-step introduction for new users.
- **Languages**: English and Dutch.
- **Appearance**: light, dark or automatic theme.
- **Units**: metric or imperial.
- **Accounts**: email and password, password reset by email, profile editing, and full account deletion that removes your pantry, history and settings.
- **Install**: the web app can be installed as a PWA (manifest and service worker).

## Tech stack

| Layer    | Technology |
|----------|------------|
| Client   | React 18, Vite, React Router, i18next |
| Mobile   | Capacitor 8 (iOS & Android), ML Kit barcode scanning, local notifications |
| Server   | Node.js 22, Express, Mongoose, JWT authentication, bcrypt |
| Database | MongoDB (local for development, MongoDB Atlas in production) |
| Payments | RevenueCat |
| Email    | Brevo API or any SMTP provider (Nodemailer) |
| Hosting  | Render (see `render.yaml`) |

## Privacy

Receipt images are processed on the device and are never uploaded. Expiry dates suggested by the app are estimates and are not food safety advice.

## License

All rights reserved. © WasteLess.

-- Categories used emoji as icons; the client now draws its own SVG icon set
-- (client/src/lib/icons.js), so store the icon's name instead.
UPDATE categories SET icon = 'chat' WHERE name = 'Greetings';
UPDATE categories SET icon = 'utensils' WHERE name = 'Food';
UPDATE categories SET icon = 'paw' WHERE name = 'Animals';
UPDATE categories SET icon = 'shirt' WHERE name = 'Clothes';

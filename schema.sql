-- ==============================================================================
-- BHARATVARSH LEATHERCRAFTS LLP - OFFICIAL DATABASE SCHEMA (MYSQL 8.0+)
-- Database: Name
-- Host: localhost:3306
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `Name` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `Name`;

-- ------------------------------------------------------------------------------
-- Table structure for table `categories`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `product_types` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table structure for table `products`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `product_type` VARCHAR(100) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `original_price` DECIMAL(10,2) NULL,
  `short_description` TEXT,
  `description` TEXT,
  `leather_type` VARCHAR(255) DEFAULT 'Full-Grain Vegetable-Tanned Cowhide',
  `hardware` VARCHAR(255) DEFAULT 'Solid Cast Antique Brass',
  `dimensions` VARCHAR(255) DEFAULT '',
  `care_instructions` TEXT,
  `badge` VARCHAR(100) DEFAULT '',
  `in_stock` TINYINT(1) DEFAULT 1,
  `is_featured` TINYINT(1) DEFAULT 0,
  `monogram_available` TINYINT(1) DEFAULT 1,
  `colors` JSON,
  `images` JSON,
  `features` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_category` (`category`),
  INDEX `idx_product_type` (`product_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table structure for table `orders`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` VARCHAR(50) NOT NULL,
  `order_number` VARCHAR(50) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_email` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(50),
  `shipping_address` JSON,
  `items` JSON,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `discount` DECIMAL(10,2) DEFAULT 0.00,
  `shipping` DECIMAL(10,2) DEFAULT 0.00,
  `tax` DECIMAL(10,2) DEFAULT 0.00,
  `total` DECIMAL(10,2) NOT NULL,
  `payment_method` VARCHAR(50) DEFAULT 'mock',
  `payment_status` VARCHAR(50) DEFAULT 'pending',
  `payment_id` VARCHAR(100) DEFAULT '',
  `status` VARCHAR(50) DEFAULT 'Processing',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_number` (`order_number`),
  INDEX `idx_customer_email` (`customer_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table structure for table `inquiries`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `inquiries`;
CREATE TABLE `inquiries` (
  `id` VARCHAR(50) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT '',
  `subject` VARCHAR(255) DEFAULT '',
  `message` TEXT,
  `details` JSON,
  `status` VARCHAR(50) DEFAULT 'New',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Dumping seed data for table `categories`
-- ------------------------------------------------------------------------------
INSERT INTO `categories` (`id`, `name`, `description`, `product_types`) VALUES
('men', 'Men', 'Bespoke hand-stitched leather belts and slim artisanal bifold & card wallets designed for distinguished everyday carry.', '["Leather Belts", "Wallets"]'),
('women', 'Women', 'Refined full-grain leather waist belts, structured wallets, and artisanal clutches and day purses with solid brass accents.', '["Belts", "Wallets", "Purses"]'),
('unisex', 'Unisex', 'Heirloom travel backpacks and executive briefcases engineered for longevity, modern utility, and timeless patina.', '["Backpacks", "Briefcases"]');

-- ------------------------------------------------------------------------------
-- Dumping seed data for table `products`
-- ------------------------------------------------------------------------------
INSERT INTO `products` 
(`id`, `name`, `category`, `product_type`, `price`, `original_price`, `short_description`, `description`, `leather_type`, `hardware`, `dimensions`, `care_instructions`, `badge`, `in_stock`, `is_featured`, `monogram_available`, `colors`, `images`, `features`) 
VALUES
(
  'blc-m-belt-01',
  'The Viceroy Full-Grain Bridle Belt',
  'Men',
  'Leather Belts',
  3850.00,
  4500.00,
  '38mm English bridle cut with hand-burnished edges and solid antiqued brass buckle.',
  'Hand-cut from 9–10 oz vegetable-tanned full-grain cowhide, The Viceroy is built to endure decades of wear. Every edge is beveled, sealed with organic beeswax, and burnished by hand on wooden wheels. Paired with a solid cast brass roller buckle secured by dual Chicago screws for effortless buckle swapping.',
  'Full-Grain Vegetable-Tanned English Bridle Cowhide (4.0mm thickness)',
  'Solid Cast Antique Brass with Heavy Roller',
  '38mm (1.5") width, Custom cut 30" - 46" waist sizes',
  'Condition annually with natural beeswax and neatsfoot leather balm. Keep away from prolonged direct water immersion.',
  'Artisan Signature',
  1,
  1,
  1,
  '[{"name": "Saddle Cognac", "hex": "#8B4513"}, {"name": "Espresso Black", "hex": "#24140D"}, {"name": "Havana Chestnut", "hex": "#5C2C16"}]',
  '["https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80"]',
  '["Solid forged brass roller buckle", "Hand-beveled and beeswax-burnished edges", "Dual Chicago screw construction for hardware replacement", "Saddle-stitched keeper loop with 0.6mm waxed linen thread", "Ages naturally into a rich, lustrous patina"]'
),
(
  'blc-m-wallet-01',
  'The Oudh Heritage Bifold Wallet',
  'Men',
  'Wallets',
  3250.00,
  3800.00,
  'Ultra-slim vegetable-tanned leather bifold holding 8 cards plus cash without pocket bulk.',
  'Engineered for the modern gentleman, The Oudh Heritage Bifold utilizes hand-split 1.2mm vegetable-tanned leather to maintain a slim, pocketable profile without sacrificing structural integrity.',
  'Italian Buttero Vegetable-Tanned Calfskin (1.2mm split)',
  'None (Pure saddle-stitched leather architecture)',
  '11.0 cm x 8.8 cm (folded), 0.9 cm slim profile',
  'Nourish every 6 months with light leather cream. Natural patina deepens with friction and palm oils.',
  'Best Seller',
  1,
  1,
  1,
  '[{"name": "Rich Tan", "hex": "#A0522D"}, {"name": "Midnight Noir", "hex": "#1A1A1A"}, {"name": "British Racing Green", "hex": "#1B4D3E"}]',
  '["https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80"]',
  '["6 dedicated card slots + 2 hidden receipt pockets", "Full-length currency compartment tailored for INR 500 notes", "Hand saddle-stitched with bonded Japanese poly thread", "Turned and creased pocket lips prevent card friction", "Subtle debossed blind maker\'s mark inside"]'
),
(
  'blc-w-belt-01',
  'The Rani Cinch Waist Belt',
  'Women',
  'Belts',
  3600.00,
  4200.00,
  'Sculptural curved waist belt designed to cinch dresses, sarees, and tailored trench coats.',
  'The Rani Cinch is architected with an anatomical ergonomic curve that rests naturally against the feminine waistline without pinching or bowing.',
  'Full-Grain Vegetable-Tanned Cowhide with Nubuck Backing',
  'Hand-hammered Archival Brass Teardrop Buckle',
  '50mm (2.0") width tapering to 35mm at closure',
  'Wipe with a soft dry cloth. Store coiled in the unbleached cotton dustbag.',
  'Artisan Signature',
  1,
  1,
  1,
  '[{"name": "Cognac Gold", "hex": "#9E4717"}, {"name": "Obsidian Black", "hex": "#1E1E1E"}, {"name": "Deep Plum", "hex": "#4A154B"}]',
  '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80"]',
  '["Curved anatomical silhouette cinches natural waistline", "Solid brass architectural teardrop buckle", "Dual leather keeper loops for graceful strap tail", "Double saddle-stitched border reinforcement"]'
),
(
  'blc-w-purse-01',
  'The Chandragiri Saddle Crossbody Purse',
  'Women',
  'Purses',
  7950.00,
  9500.00,
  'Heritage equestrian curved flap bag with custom brass turn-lock clasp and suede interior.',
  'Inspired by classical Indian equestrian tack, The Chandragiri Saddle Bag features a hand-formed curved silhouette, unlined full-grain leather outer, and a velvety goat suede interior.',
  'Full-Grain Waxed Pull-Up Leather with Goat Suede Interior',
  'Custom Machined Brass Turn-Lock Clasp & D-Rings',
  '24 cm (W) x 19 cm (H) x 7.5 cm (D)',
  'Light scratches can be rubbed out with thumb friction due to rich pull-up waxes.',
  'Limited Edition',
  1,
  1,
  1,
  '[{"name": "Bourbon Amber", "hex": "#A25528"}, {"name": "Matte Raven", "hex": "#181818"}, {"name": "Forest Green", "hex": "#1E3F20"}]',
  '["https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80"]',
  '["Reinforced gusset construction maintains shapely curve", "Custom solid brass equestrian turn-lock", "Interior zippered pocket + brass key lanyard hook", "Adjustable 7-hole strap with solid brass buckle"]'
),
(
  'blc-u-pack-01',
  'The Himalaya Heritage Rucksack',
  'Unisex',
  'Backpacks',
  12850.00,
  15000.00,
  'Rugged yet refined leather rolltop & buckle rucksack tailored for alpine journeys or urban commutes.',
  'Forged from heavy 2.2mm pull-up oil-tanned leather, The Himalaya Rucksack combines utilitarian mountaineering ethos with bespoke leathercraft. Padded shoulder straps lined with natural wool felt prevent collarbone strain.',
  'Oil-Tanned Pull-Up Full-Grain Cowhide with Waterproof Waxed Canvas Side Paneling',
  'Solid Sand-Cast Brass Roller Buckles and Heavy-Duty YKK Brass Zippers',
  '32 cm (W) x 46 cm (H) x 16 cm (D) — 24L Volume',
  'Treat high-wear canvas with beeswax refinishing paste; condition leather with oil-rich balm.',
  'Masterpiece',
  1,
  1,
  1,
  '[{"name": "Vintage Chestnut", "hex": "#5A2A18"}, {"name": "Charcoal Black", "hex": "#2B2B2B"}]',
  '["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80"]',
  '["Padded sleeve accommodates up to 16-inch MacBook Pro", "Quick-access side zip into main cavern", "Ergonomic wool-felt cushioned leather shoulder straps", "Luggage pass-through strap for rolling suitcase handle"]'
),
(
  'blc-u-case-01',
  'The Sovereign English Bridle Briefcase',
  'Unisex',
  'Briefcases',
  16500.00,
  19500.00,
  'Triple-gusset executive briefcase with solid brass combination lock and rigid frame handle.',
  'The pinnacle of Bharatvarsh leatherworking devotion. Hand-shaped around a solid timber and aircraft aluminum sub-frame, The Sovereign is crafted from 3.5mm English bridle leather.',
  'Grade-A English Bridle Leather with Pigskin Lining',
  'Solid Antiqued English Brass Dual Combination Tuck-Locks',
  '42 cm (W) x 31 cm (H) x 13 cm (D)',
  'Store with enclosed cedar sachet to preserve interior aroma. Condition with bridle wax annually.',
  'Heirloom Reserve',
  1,
  1,
  1,
  '[{"name": "London Tan", "hex": "#C67D38"}, {"name": "Imperial Espresso", "hex": "#2B1A12"}, {"name": "Regal Oxblood", "hex": "#4A1521"}]',
  '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80"]',
  '["Triple expandable gusset with accordion dividers", "Solid brass dual combination lock clasps", "Hand-molded 7-layer leather handle for ergonomic carry", "Saddle-stitched by two craftsmen simultaneously over 38 hours"]'
);

-- System-wide settings table + initial pricing config
-- Run this once on the backend database.

CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL,
  `value` JSON NOT NULL,
  updated_by INT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_system_settings_key (`key`),
  CONSTRAINT fk_system_settings_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id)
    ON DELETE SET NULL
);

-- Seed default pricing config if missing
INSERT IGNORE INTO system_settings (`key`, `value`)
VALUES (
  'pricing_config',
  '{"currency":"KES","termly":{"label":"Termly Pass","price_kes":350,"duration_label":"/term"},"yearly":{"label":"Yearly Saver","price_kes":1000,"duration_label":"/year"}}'
);

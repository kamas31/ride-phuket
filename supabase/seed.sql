-- ============================================================
-- Koh Ride — Seed Data (Dev/Staging)
-- ============================================================

-- Insert demo shops
insert into public.shops (id, name, slug, description, location, address, lat, lng, phone, whatsapp, verified) values
  ('11111111-0000-0000-0000-000000000001', 'Patong Riders', 'patong-riders', 'The most trusted scooter rental in Patong since 2015.', 'Patong', '123 Bangla Rd, Patong, Phuket 83150', 7.8956, 98.2966, '+66 76 000 001', '+66 80 000 001', true),
  ('11111111-0000-0000-0000-000000000002', 'Kata Beach Rentals', 'kata-beach-rentals', 'Premium scooters for the Kata & Karon area.', 'Kata', '45 Kata Road, Kata, Phuket 83100', 7.8203, 98.2986, '+66 76 000 002', '+66 80 000 002', true),
  ('11111111-0000-0000-0000-000000000003', 'Rawai Scooter Co.', 'rawai-scooter-co', 'The south end specialists. Big fleet, best prices.', 'Rawai', '88 Rawai Beach Rd, Rawai, Phuket 83130', 7.7781, 98.3281, '+66 76 000 003', null, true);

-- Insert demo scooters
insert into public.scooters (shop_id, name, brand, model, year, category, images, price_per_day, price_per_week, price_per_month, location, lat, lng, specs, features, delivery_available, delivery_fee, helmet_included, insurance_included, min_rental_days, available) values
  (
    '11111111-0000-0000-0000-000000000001',
    'Honda Click 125i', 'Honda', 'Click 125i', 2023, 'automatic',
    ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
    250, 1500, 5000, 'Patong', 7.8956, 98.2966,
    '{"engine":"125cc","power":"9 hp","fuelCapacity":"5.5L","consumption":"45 km/L","weight":"98 kg","storage":"18L under seat"}',
    ARRAY['Helmet included','USB charging','Under-seat storage'],
    true, 150, true, true, 1, true
  ),
  (
    '11111111-0000-0000-0000-000000000001',
    'Yamaha NMAX 155', 'Yamaha', 'NMAX 155', 2024, 'automatic',
    ARRAY['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80'],
    390, 2400, 8500, 'Patong', 7.8960, 98.2972,
    '{"engine":"155cc","power":"15 hp","fuelCapacity":"7.1L","consumption":"40 km/L","weight":"127 kg","storage":"25L under seat"}',
    ARRAY['Helmet included','ABS brakes','Traction control','Smart key'],
    true, 150, true, true, 1, true
  ),
  (
    '11111111-0000-0000-0000-000000000002',
    'Honda PCX 160', 'Honda', 'PCX 160', 2023, 'automatic',
    ARRAY['https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&q=80'],
    450, 2800, 10000, 'Kata', 7.8203, 98.2986,
    '{"engine":"160cc","power":"15.8 hp","fuelCapacity":"8.1L","consumption":"38 km/L","weight":"130 kg","storage":"30L under seat"}',
    ARRAY['Helmet included','ABS','Keyless start','Large storage'],
    true, 200, true, true, 1, true
  ),
  (
    '11111111-0000-0000-0000-000000000002',
    'Vespa Primavera 125', 'Vespa', 'Primavera 125', 2023, 'automatic',
    ARRAY['https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80'],
    650, 4000, 14000, 'Kata', 7.8210, 98.2990,
    '{"engine":"125cc","power":"9.9 hp","fuelCapacity":"7L","consumption":"42 km/L","weight":"118 kg","storage":"Front glove box"}',
    ARRAY['Helmet included','Metal body','Vintage style'],
    true, 250, true, true, 2, true
  );

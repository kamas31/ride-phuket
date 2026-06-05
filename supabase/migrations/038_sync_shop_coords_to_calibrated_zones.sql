-- Migration 038: Sync shop lat/lng to manually calibrated zone centres
--
-- PHUKET_ZONES were updated with precise visual calibration. Existing shops
-- have stale coordinates from creation time. This migration re-derives
-- lat/lng for every shop from its location field using the same substring
-- logic as getZoneForLocation() in lib/zones.ts.
--
-- Order matters: 'kata noi' must be checked before 'kata' (substring collision).

UPDATE shops
SET
  lat = CASE
    WHEN LOWER(location) LIKE '%kata noi%'     THEN 7.8106
    WHEN LOWER(location) LIKE '%kata%'         THEN 7.8232
    WHEN LOWER(location) LIKE '%patong%'       THEN 7.8976
    WHEN LOWER(location) LIKE '%karon%'        THEN 7.8505
    WHEN LOWER(location) LIKE '%rawai%'        THEN 7.7777
    WHEN LOWER(location) LIKE '%bang tao%'     THEN 7.9818
    WHEN LOWER(location) LIKE '%phuket town%'  THEN 7.8883
    WHEN LOWER(location) LIKE '%kamala%'       THEN 7.9518
    WHEN LOWER(location) LIKE '%surin%'        THEN 7.9778
    WHEN LOWER(location) LIKE '%chalong%'      THEN 7.8503
    WHEN LOWER(location) LIKE '%nai harn%'     THEN 7.7787
    WHEN LOWER(location) LIKE '%cherng talay%' THEN 7.9922
    WHEN LOWER(location) LIKE '%mai khao%'     THEN 8.1283
    WHEN LOWER(location) LIKE '%thalang%'      THEN 8.0316
    WHEN LOWER(location) LIKE '%cape panwa%'   THEN 7.8070
    WHEN LOWER(location) LIKE '%ko sirey%'     THEN 7.8870
    ELSE lat
  END,
  lng = CASE
    WHEN LOWER(location) LIKE '%kata noi%'     THEN 98.3004
    WHEN LOWER(location) LIKE '%kata%'         THEN 98.2982
    WHEN LOWER(location) LIKE '%patong%'       THEN 98.2991
    WHEN LOWER(location) LIKE '%karon%'        THEN 98.2982
    WHEN LOWER(location) LIKE '%rawai%'        THEN 98.3280
    WHEN LOWER(location) LIKE '%bang tao%'     THEN 98.2947
    WHEN LOWER(location) LIKE '%phuket town%'  THEN 98.3886
    WHEN LOWER(location) LIKE '%kamala%'       THEN 98.2829
    WHEN LOWER(location) LIKE '%surin%'        THEN 98.2801
    WHEN LOWER(location) LIKE '%chalong%'      THEN 98.3344
    WHEN LOWER(location) LIKE '%nai harn%'     THEN 98.3056
    WHEN LOWER(location) LIKE '%cherng talay%' THEN 98.3066
    WHEN LOWER(location) LIKE '%mai khao%'     THEN 98.3080
    WHEN LOWER(location) LIKE '%thalang%'      THEN 98.3335
    WHEN LOWER(location) LIKE '%cape panwa%'   THEN 98.4052
    WHEN LOWER(location) LIKE '%ko sirey%'     THEN 98.4270
    ELSE lng
  END
WHERE location IS NOT NULL;

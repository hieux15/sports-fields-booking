CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  ADD CONSTRAINT "booking_no_overlap"
  EXCLUDE USING gist (
    "courtId" WITH =,
    tsrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE ("status" <> 'CANCELLED');

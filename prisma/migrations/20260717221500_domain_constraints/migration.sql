CREATE TRIGGER "MediaItem_type_insert_check"
BEFORE INSERT ON "MediaItem"
WHEN NEW."type" NOT IN ('movie', 'tv')
BEGIN
  SELECT RAISE(ABORT, 'invalid media type');
END;

CREATE TRIGGER "MediaItem_type_update_check"
BEFORE UPDATE OF "type" ON "MediaItem"
WHEN NEW."type" NOT IN ('movie', 'tv')
BEGIN
  SELECT RAISE(ABORT, 'invalid media type');
END;

CREATE TRIGGER "Rating_value_insert_check"
BEFORE INSERT ON "Rating"
WHEN NEW."value" NOT IN ('like', 'dislike', 'neutral')
BEGIN
  SELECT RAISE(ABORT, 'invalid rating value');
END;

CREATE TRIGGER "Rating_value_update_check"
BEFORE UPDATE OF "value" ON "Rating"
WHEN NEW."value" NOT IN ('like', 'dislike', 'neutral')
BEGIN
  SELECT RAISE(ABORT, 'invalid rating value');
END;

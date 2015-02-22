CREATE TABLE hashtags
(
  id serial NOT NULL,
  text character varying,
  is_active boolean,
  CONSTRAINT hashtags_id_key UNIQUE (id),
  CONSTRAINT hashtags_text_key UNIQUE (text)
);

CREATE TABLE hashtag_counts
(
  hashtag_id integer NOT NULL,
  count integer NOT NULL,
  window_size integer NOT NULL,
  "timestamp" bigint NOT NULL,
  CONSTRAINT hashtag_counts_hashtag_id_fkey FOREIGN KEY (hashtag_id)
      REFERENCES hashtags (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);


CREATE INDEX idx_hashtag_counts_timestamp
  ON hashtag_counts
  USING btree
  ("timestamp" DESC);

ALTER TABLE hashtag_counts CLUSTER ON idx_hashtag_counts_timestamp;
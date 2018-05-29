#!/usr/bin/python3

import sqlite3
import sys

# Get the file path
if len(sys.argv) < 2:
    print("Usage: ./makedb.py <databasefile>")
    sys.exit(0)


# Creates a database in "energymonitor.db"
print("Creating database %s" %(sys.argv[1]))
with sqlite3.connect(sys.argv[1]) as conn:
  c = conn.cursor()

  envoytable = """
  CREATE TABLE envoy (timestamp INTEGER,
                      Date TEXT,
                      Time TEXT,
                      ProdWnow INTEGER,
                      ConsWnow INTEGER,
                      ProdWhToday INTEGER,
                      ConsWhToday INTEGER,
                      ProdWh7day INTEGER,
                      ConsWh7day INTEGER,
                      ProdWhLife INTEGER,
                      ConsWhLife INTEGER);
  """


  wxtable = """
  CREATE TABLE wx (timestamp INTEGER,
                   Date TEXT,
                   Time TEXT,
                   Temp REAL,
                   dewpt REAL,
                   windspd REAL,
                   winddir INTEGER,
                   slp REAL,
                   skycover INTEGER,
                   skcnd TEXT)
  """


  c.execute(envoytable)
  c.execute(wxtable)
               

  conn.commit()
  conn.close()

#!/usr/bin/python3

import sqlite3

# Creates a database in "energymonitor.db"
conn = sqlite3.connect("energymonitor.db") or die("Can't open DB")
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

#!/usr/bin/python3

import sqlite3
import sys
import csv
from datetime import datetime, timezone

if len(sys.argv) < 4:
    print("Usage: ./import.py <csvfile> <databasefile> <table>")
    sys.exit(0)

conn = sqlite3.connect(sys.argv[2])
c = conn.cursor()

print("Connecting to db %s" %(sys.argv[2]))
# Now open the CSV file
try:
    with open(sys.argv[1], 'r') as csvfile:
        print("importing file %s into table %s" % (sys.argv[1], sys.argv[3]))
        cr = csv.DictReader(csvfile)

        if sys.argv[3] == "envoy":
            for row in cr:
                # Get the timestamp, date and time (time here is localtime)
                dt = datetime.strptime(row['Time'], "%a %b %d %H:%M:%S %Y")
                # import it
                c.execute('INSERT INTO envoy VALUES (?,?,?,?,?,?,?,?,?,?,?)',
                          (dt.timestamp(),
                           dt.strftime("%d-%m-%Y"),
                           dt.strftime("%H:%M:%S"),
                           row['ProdWnow'],
                           row['ConsWnow'],
                           row['ProdWhToday'],
                           row['ConsWhToday'],
                           row['ProdWh7day'],
                           row['ConsWh7day'],
                           row['ProdWhLife'],
                           row['ConsWhLife'])
                          )
        elif sys.argv[3] == "wx":
            for row in cr:
                # Get the timestamp, date and time
                tmstr = "%s %s" %(row['Date'], row['Time'])
                dt = datetime.strptime(tmstr, "%Y%m%d %H%M")

                # WARNING: time as fetched is UTC, need to convert to localtime
                dt = dt.replace(tzinfo=timezone.utc).astimezone(None)

                # import it
                c.execute('INSERT INTO wx VALUES (?,?,?,?,?,?,?,?,?,?)',
                          (dt.timestamp(),
                           dt.strftime("%d-%m-%Y"),
                           dt.strftime("%H:%M:%S"),
                           row['Temp'],
                           row['dewpt'],
                           row['windspd'],
                           row['winddir'],
                           row['slp'],
                           row['skycover'],
                           row['skcnd'])
                          )
        else:
            print("ERROR: invalid table %s", sys.argv[2])
except FileNotFoundError as e:
    print("Error: File not found %s" % sys.argv[2])
    sys.exit(-1)

conn.commit()
conn.close()
print("Closed %s" %(sys.argv[2]))

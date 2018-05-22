#!/usr/bin/python3

import sqlite3
import sys
import csv
import time


conn = sqlite3.connect(sys.argv[2]) or die("Can't open DB")
c = conn.cursor()

print("Connecting to db %s" %(sys.argv[2]))
# Now open the CSV file
with open(sys.argv[1], 'r') as csvfile:
    print("importing file %s", sys.argv[1])
    cr = csv.DictReader(csvfile)
    for row in cr:
        # Get the timestamp, date and time
        tm_struct = time.strptime(row['Time'], "%a %b %d %H:%M:%S %Y")
        # import it
        c.execute('INSERT INTO envoy VALUES (?,?,?,?,?,?,?,?,?,?,?)',
                  (time.mktime(tm_struct),
                   time.strftime("%d-%m-%Y",tm_struct),
                   time.strftime("%H:%M:%S",tm_struct),
                   row['ProdWnow'],
                   row['ConsWnow'],
                   row['ProdWhToday'],
                   row['ConsWhToday'],
                   row['ProdWh7day'],
                   row['ConsWh7day'],
                   row['ProdWhLife'],
                   row['ConsWhLife'])
                  )

conn.commit()
conn.close()
print("Closed %s" %(sys.argv[2]))

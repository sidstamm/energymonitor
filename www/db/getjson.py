#!/usr/bin/python3
## This provides database access as JSON blobs.
## Queries come in and ask for data, this gathers the data from the DB and 
## returns it as json.

## TODO:
# ?data=envoy&start=STS&end=DTS
## This provides data between STS and DTS (timestamps) from the envoy table.

import sqlite3
import json
import cgi
from datetime import datetime, timedelta

import cgitb
cgitb.enable()

print("Content-Type: application/json")
print()

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d


query = cgi.FieldStorage()


def queryDB(table, sts, dts):
    if table not in ('envoy', 'wx'):
        print("ERROR: %s not valid data value." % (table))
        return

    with sqlite3.connect("energymonitor.db") as conn:
        conn.row_factory = dict_factory
        c = conn.cursor()

        c.execute('SELECT * FROM envoy WHERE timestamp BETWEEN :sts AND :dts',
                  {'table': table, 'sts': sts.timestamp(), 'dts': dts.timestamp()})
        data = c.fetchall()
        print(json.dumps(data))



# Default DB table is "envoy"
try:
    table = query['data'].value
except:
    table = "envoy"

# Default range is 24 hours prior to now
try:
    dts = datetime.fromtimestamp(int(query['end'].value))
except:
    dts = datetime.now()

try:
    sts = datetime.fromtimestamp(int(query['start'].value))
except:
    sts = dts - timedelta(days=1)

# Do the query
queryDB(table, sts, dts)


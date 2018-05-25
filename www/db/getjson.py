#!/usr/bin/python3
## This provides database access as JSON blobs.
## Queries come in and ask for data, this gathers the data from the DB and 
## returns it as json.

## TODO:
# ?data=envoy&start=STS&end=DTS
## This provides data between STS and DTS (timestamps) from the envoy table.

import sqlite3
import json

import cgitb
cgitb.enable()

print("Content-Type: application/json")
print()

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

with sqlite3.connect("energymonitor.db") as conn:
    conn.row_factory = dict_factory
    c = conn.cursor()

    c.execute('SELECT * FROM envoy')
    data = c.fetchall()
    print(json.dumps(data))

